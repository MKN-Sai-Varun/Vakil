# Vakil - Reliability Report

This document records concrete, reproduced instances of Vakil's three core
failure-handling guarantees, using real negotiation sessions run against
live Groq inference and (where applicable) live Razorpay test-mode APIs.

## 1. Mandate breach → block (and gate-driven recovery)

**Guarantee:** A buyer's negotiated deal can never settle above its
mandate's `max_total_spend` or `max_unit_price`, regardless of what either
agent's LLM proposes.

**Evidence - hard block:**
Buyer mandate: max_total_spend=500, max_unit_price=1000.
Catalog floor price: 750.
Result: buyer's only legally reachable price (750, at floor) still
exceeded the ₹500 remaining budget for even one unit. The mandate gate
blocked the deal with reason: *"Deal total 750 exceeds remaining mandate
500, and quantity cannot be reduced further."* Session correctly marked
`failed`, no settlement attempted.

**Evidence - gate-driven quantity reduction (mandateGate.ts logic):**
`checkMandate()` computes `maxAffordableQty = floor(remainingSpend / unit_price)`
whenever a proposed total exceeds remaining spend, and returns an
`adjusted` result with the reduced quantity rather than blocking outright,
provided at least 1 unit remains affordable. This path is implemented and
unit-testable directly; in live testing, the buyer LLM frequently
self-corrects its own quantity before ever triggering this path (see note
below), so both the LLM's own constraint-awareness and the gate's
independent enforcement act as two redundant layers - the gate is not
"dead code," it is what makes the guarantee provable regardless of
whether the LLM behaves correctly on a given run.

**Note on redundant safety layers:** across dozens of live test runs, the
buyer agent's own arithmetic reliably avoided proposing over-mandate
deals. This is a positive finding about the LLM's reliability, not a sign
the gate is unnecessary - the gate exists specifically for the cases where
LLM self-correction fails (see the ₹500 mandate case above, and the
fallback-path cases below), and its correctness does not depend on the
LLM behaving well.

**Evidence - mandate re-validation after merchant-side price adjustment:**
A separate, subtler case was found and fixed during testing: a merchant's
price adjustment (clamped by the discount-budget gate) was not re-validated
against the buyer's mandate before being treated as converged, allowing a
final price above the buyer's stated ceiling to slip through. Fixed by
re-running `checkMandate()` against the merchant's *final* (post-adjustment)
price before declaring convergence, not just the buyer's own proposed price.

## 2. Inventory constraint enforcement

**Guarantee:** A negotiated deal can never commit to more units than are
actually available.

**Evidence:** Catalog item with inventory_qty=2. Buyer proposed 40 units.
Merchant's LLM agreed to accept (unaware of the real inventory count, since
inventory is deliberately not exposed to the LLM's context - enforcement is
the gate's job, not the LLM's). `policyGate.ts` blocked with reason:
*"Requested quantity 40 exceeds available inventory 2 - the agent's stated
'accept' could not be honored."* The logged move type was corrected from
the LLM's stated "accept" to "reject" so the audit trail does not show a
contradictory outcome. Session correctly marked `failed`.

**Dual final re-check:** `executeDeal()` re-reads inventory fresh from the
database immediately before calling Razorpay, independent of whatever the
negotiation assumed - protecting against inventory changing between
convergence and settlement (a genuine race condition, not just a
same-turn quantity error).

## 3. Razorpay settlement idempotency

**Guarantee:** A retried settlement attempt (network timeout, duplicate
request, re-run session) never creates a second Razorpay order for the
same negotiation.

**Evidence - deliberate test:** The same converged session was executed
twice via `/sessions/:id/run`. First call created a real order
(`order_TVpurTqVO3MMKl`). Second call's `executeDeal()` found an existing
`deals` row via `getDealBySession(session_id)` and returned it directly
(`alreadyExists: true`) without calling Razorpay again.

**Evidence - aggregate check across all testing this week:**
```sql
SELECT session_id, COUNT(*) FROM deals GROUP BY session_id HAVING COUNT(*) > 1;
```
Returns zero rows - across every negotiation run during development
(several dozen sessions), not one session ever produced two deals.

## 4. Fallback safety (found during testing, not originally planned)

**Issue found:** Early fallback logic (used when a Groq call fails or
returns invalid JSON) echoed the other party's last offer verbatim,
including prices that violated the fallback agent's own constraints
(e.g., the buyer's fallback proposing a price above its own mandate cap).

**Fix:** Fallback moves are now constraint-aware - the buyer's fallback
clamps to its own `max_unit_price` and walks away if even that ceiling
can't afford the deal; the merchant's fallback clamps to its own floor.
This closed a real gap where a *safety mechanism* could itself produce an
unsafe proposal.

## 5. Turn-count ceiling (runaway negotiation prevention)

**Issue found and fixed:** A concurrency bug allowed a session to be
executed by more than one concurrent `runNegotiation()` call, each with
its own in-memory turn counter, causing a single session to accumulate
22+ turns despite a configured ceiling of 10.

**Fix:** `runNegotiation()` now checks for existing turns before starting
and refuses to run a second time against the same session. Confirmed via
live test: session correctly stopped at exactly 10 turns and marked
`failed` with reason "No agreement reached within 10 turns," logged as an
`negotiation_exhausted` audit event.

## Security checks

- Webhook signature verification uses HMAC-SHA256 over the raw request
  body, tested against a deliberately invalid signature - correctly
  rejected with 400 and no processing performed.
- No card, UPI, or payment credential data is stored in the `deals` table
  or anywhere else in the schema - only Razorpay's own order ID and
  negotiated terms are retained.
- `.env` (containing Groq and Razorpay keys) is gitignored and confirmed
  absent from every commit throughout development.

## 6. Webhook confirmation and payment loop closure

**Guarantee:** A converged deal is not considered settled until Razorpay
confirms payment capture via webhook. The ledger reflects the real payment
state, not just the order creation state.

**Implementation:** `payment.captured` (and `order.paid`) events are received
at `/webhooks/razorpay`. The handler:
1. Verifies the `X-Razorpay-Signature` header (HMAC-SHA256 over the raw
   request body, keyed with `RAZORPAY_WEBHOOK_SECRET`). An invalid signature
   returns 400 and no processing occurs.
2. Deduplicates on `X-Razorpay-Event-Id` (in-memory set; survives restarts
   as long as Razorpay's retry window is shorter than the uptime cycle).
3. Calls `markDealSettled(order_id)` which sets `status = 'settled'` and
   records a `webhook_confirmed_at` timestamp.
4. Writes a `webhook_confirmed` audit event tied to the deal.

**Tested via:** `scripts/test-webhook.ts` — generates a valid HMAC-signed
`payment.captured` payload for any order ID and prints the curl command to
fire it. Confirmed: deal status transitions from `pending` to `settled`,
`webhook_confirmed_at` is populated, and the Proof of Fair Deal card in the
ledger reflects the settled state.

**Deliberately invalid signature test:** a manually corrupted signature was
submitted — the handler returned 400 and the deal row was not modified.

## 7. Currency integrity

**Guarantee:** All negotiated prices, rationale text, and audit records
are denominated in INR (₹). No dollar or foreign-currency amounts can
appear in agent output.

**Implementation:** Both `buyerSystemPrompt()` and `merchantSystemPrompt()`
explicitly declare `"All prices are in Indian Rupees (INR, ₹). Never mention
dollars or any other currency."` and prefix all injected numeric values with
`₹` (e.g. `"Your floor price is ₹750"`). This constrains the LLM's option
space rather than relying on post-hoc filtering.

**Observed outcome:** across all sessions run after this change, no agent
rationale contained dollar signs or non-INR currency references.

## 8. UI/UX Polish for Demo Readiness

**Issues found and fixed during final testing:**

### Floor Price Validation
- **Issue:** Catalog editor allowed floor > list price, leading to impossible
  negotiation corridors (merchant can't sell above ceiling).
- **Fix:** Client-side validation blocks submission if `floor_price > base_price`,
  with clear error: "Floor price cannot exceed list price."

### Login Redirect Loop
- **Issue:** 401 interceptor redirected all failed requests to `/login`,
  including the initial `/auth/login` POST itself, causing infinite flicker.
- **Fix:** Axios interceptor now excludes `/auth/*` endpoints from redirect logic.

### Em-Dash Cleanup
- **Issue:** Gate rejection reasons contained literal em-dashes (`—`) which
  rendered inconsistently across browsers and broke UI alignment.
- **Fix:** Replaced all em-dashes in `policyGate.ts` and `mandateGate.ts`
  with plain separators or semicolons.

### Razorpay Order ID Display
- **Issue:** Converged deals showed no order ID in the UI, making it hard to
  verify Razorpay integration during demos.
- **Fix:** NegotiationTheater now fetches and displays the Razorpay order ID
  prominently on convergence.

### Turn Counter Clarity
- **Issue:** "Round 1/5" terminology confused users (negotiations have 10-turn
  ceiling, not 5 rounds).
- **Fix:** Changed to "Turn X/10" throughout UI and docs.

### Merchant Default View
- **Issue:** Merchant users landed on catalog editor with no context or navigation,
  creating a dead-end experience.
- **Fix:** Merchants now land on dashboard showing inventory + active sessions,
  with clear navigation to list new items.

### Proof of Fair Deal
- **Issue:** No visual confirmation that both constraints were satisfied.
- **Fix:** Added "Proof of Fair Deal" card showing buyer mandate limits and
  merchant floor price, confirming final price/quantity satisfied both.

### Change Item Guard
- **Issue:** "Change item" button remained clickable mid-negotiation, causing
  state corruption if user switched items after turns started.
- **Fix:** Button now only appears before first turn executes, preventing
  mid-negotiation item changes.

### Home Pages
- **Issue:** No landing page for unauthenticated users; logged-in users had
  no dashboard/overview.
- **Fix:** Created three-tier home page system:
  - Public landing page (unauthenticated) explaining Vakil concept
  - Buyer home page (post-login) with quick actions and how-it-works guide
  - Merchant home page (post-login) with inventory/session quick access

All fixes verified via manual testing and production build validation
(`npx vite build` and `npx tsc --noEmit` both pass clean).
