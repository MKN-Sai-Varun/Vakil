# Vakil - Architecture

**Bounded AI-to-AI Negotiation Commerce**
Razorpay Buildathon · Track 01: AI Growth & Agentic Commerce

## 1. What Vakil Is

Vakil is a two-agent negotiation system: a **Buyer Vakil** representing a
human principal's delegated purchasing authority (a *Mandate*), and a
**Merchant Vakil** representing a seller's inventory and margin rules (a
*negotiation corridor*). The two agents negotiate price, quantity, and
bundles autonomously across multiple turns. Every proposed move is
independently checked against a deterministic policy gate before it is ever
emitted or acted on. Only a deal that clears both gates is sent to Razorpay
for settlement. Every turn is written to an append-only ledger that produces
a **Proof of Fair Deal** - a structured explanation of what was rejected,
what was accepted, and why.

Vakil is not a chatbot in front of a payment API. It is an attempt to answer
the track's harder framing directly: *make the merchant transactable by an
AI buyer end to end* - by building the AI buyer as a first-class, bounded
counterpart, not a proxy for a human typing into a chat window.

## 2. Core Design Principle: Propose → Constrain → Verify

This is the single idea the entire system is built around, and it exists
because of the track's judging bar: *"every money action explainable,
bounded and gated."* An LLM's output cannot, by itself, satisfy that bar -
you cannot prove a bound on what a language model will say. So responsibility
is split cleanly:

- **LLM does judgment** - interpreting an offer, deciding whether to
  concede, drafting a counter-proposal, choosing *which* legal move to make.
- **Deterministic code does enforcement** - what moves are legal at all
  (floor price, mandate cap, inventory, discount budget), and whether money
  actually moves.

Every LLM call returns a structured Move object. That object is never
trusted directly - it is validated against a schema, clamped to the legal
move set, then independently re-checked by a policy gate that has no
knowledge of the LLM's reasoning, only the final numbers. This means an
illegal deal (below floor, over mandate) is structurally impossible to
execute, regardless of what the LLM proposes - provable via unit tests on
the gates, not asserted via careful prompting.

**Merchant Vakil**
- Observes: buyer's latest offer, full turn history, current floor price,
  discount ladder, remaining inventory, remaining daily discount budget.
- Decides: accept, counter, offer a bundle, or walk away.
- Hard constraints: cannot go below floor price; cannot exceed today's
  discount budget; cannot promise stock it doesn't have.
- On invalid/unparseable LLM output: deterministic fallback - hold the
  current offer.
- On policy violation: auto-clamp to the nearest legal offer, logged as
  `adjusted`.

**Buyer Vakil**
- Observes: merchant's latest offer, turn history, remaining Mandate
  budget, category allow-list.
- Decides: accept, counter, reduce quantity, or walk away.
- Hard constraints: cannot commit above `max_total_spend` or
  `max_unit_price`; cannot buy outside allow-listed categories; cannot act
  after `expires_at`.
- On a proposed deal exceeding mandate: blocked by the gate → agent
  autonomously proposes a reduced quantity that fits, before escalating to
  a human.

The LLM is never shown an illegal move as an option - e.g. Merchant Vakil's
prompt never includes a price below floor as something it could offer.
This is deliberate: constraining the *option space* the LLM reasons over is
a second layer of safety on top of the post-hoc gate check.

## 5. Data Model

Seven tables, PostgreSQL, relational integrity enforced at the DB layer
(not just in application code) wherever a bound matters:

| Table | Purpose | Key constraints |
|---|---|---|
| `merchants` | Seller identity | - |
| `catalog_items` | Inventory + negotiation corridor | `floor_price <= base_price` |
| `mandates` | Buyer's delegated purchasing authority | `spend_used <= max_total_spend` |
| `negotiation_sessions` | One negotiation between one buyer mandate and one catalog item | `status IN (active, converged, failed, expired)` |
| `negotiation_turns` | Append-only turn log | `UNIQUE (session_id, turn_number)` |
| `deals` | Final converged terms + settlement reference | `UNIQUE (session_id)` - one deal per session |
| `audit_events` | Append-only event trail beyond turns (settlement, webhook, adjustments) | - |

`negotiation_turns` and `audit_events` are treated as append-only by
convention in application code, and this is additionally enforced at the
schema level via the `UNIQUE (session_id, turn_number)` constraint - a
retried write can't silently duplicate or overwrite a turn.

`discount_ladder`, `bundle_rules`, `proposed_move`, and `final_terms` are
stored as `JSONB` - these are the genuinely variable-shape parts of the
system (a bundle offer has a different structure than a plain price
counter) and don't need relational structure. Everything that must never be
exceeded (spend caps, floor prices, inventory counts) is a strongly-typed
relational column with a `CHECK` constraint, not buried in JSON.

## 6. Move Schema (Zod)

Every LLM call must return one of two schema-validated shapes. Invalid
output never reaches the gate - it's caught at parse time and replaced with
a deterministic fallback move.

```ts
BuyerMove = {
  type: 'accept' | 'counter' | 'reduce_quantity' | 'walk_away',
  unit_price: number | null,
  quantity: number,
  total: number,
  rationale: string
}

MerchantMove = {
  type: 'accept' | 'counter' | 'bundle' | 'reject',
  unit_price: number | null,
  bundle_items: { item_id: string, quantity: number }[] | null,
  quantity: number,
  rationale: string
}
```

This schema is the single source of truth reused for two jobs: validating
LLM output, and validating API request bodies - so there's no risk of the
two definitions drifting apart.

## 7. AI Layer

- **Provider: Groq** (chosen for zero-cost inference on the free tier and
  low latency, both of which matter more here than raw model sophistication
  - the task is narrow structured decision-making, not open-ended
  reasoning).
- **Model: `openai/gpt-oss-120b`** - Groq's current recommended
  replacement for `llama-3.3-70b-versatile`, which was deprecated by Groq
  on June 17, 2026. Verified against `console.groq.com/docs/models`
  directly before implementation, since Groq's model lineup changes
  frequently.
- **Structured output only** - every call uses `response_format: {type:
  "json_object"}` and the response is validated against the Move schema
  before use.
- **No RAG, no vector DB** - negotiation state is small (current offer,
  short turn history, remaining budget/inventory) and fits directly in the
  prompt context.
- **Known tradeoff:** open models on Groq's free tier are less reliable at
  strict JSON adherence than closed-model structured-output modes. This is
  treated as an expected, tested failure path (deterministic fallback move
  on parse failure) rather than an edge case - it will be exercised
  regularly, not rarely.

## 8. Money Safety Model

**Bounds**
- Merchant: floor price per SKU, max discount %, daily discount budget,
  inventory cap, INR only.
- Buyer: max total spend (Mandate), max unit price, category allow-list,
  Mandate expiry.
- System-wide: a hard demo ceiling regardless of Mandate (safety backstop).

**Gates**
- Automatic: any deal inside both corridors.
- Merchant human approval: single deal above a configurable threshold.
- Buyer human approval: single deal consuming >80% of remaining mandate in
  one session.

**Dual Final Re-check**
Immediately before the Razorpay call, both sides are re-verified against
*live* state (fresh inventory count, fresh mandate remaining) - not the
state from several turns ago. Negotiation and settlement are decoupled in
time, so this catches the case where inventory or mandate validity changed
during the negotiation itself.

**Explainability**
Every turn logs: proposed terms → which rule was checked → pass / blocked /
adjusted → reason. The closing ledger entry states the counterfactual -
e.g. *"Rejected: 1 offer below floor. Accepted: this offer clears 34%
margin and is ₹4,200 inside your mandate."*

## 9. Razorpay Integration

Verified against live Razorpay documentation on Aug 28, 2026 (see
`RAZORPAY_CAPABILITY_MATRIX.md` for full detail). Key facts that shape this
architecture:

- **Orders API** supports a dynamic `amount` at creation (in smallest
  currency subunit - paise for INR), but has **no native idempotency
  header** - deduplication is our responsibility, enforced via the
  `UNIQUE (session_id)` constraint on `deals`.
- **Payment Links API** is fixed-amount only - cannot be reused across
  differently-priced deals. A new order/link is created per negotiated
  session.
- **Webhooks** (`payment.captured`, `order.paid`) confirm settlement.
  Signature verification is HMAC-SHA256 over the **raw, unparsed** request
  body - the webhook route must bypass global JSON body-parsing.
- **Webhook delivery is at-least-once and can arrive out of order** - the
  receiver must be idempotent (via `X-Razorpay-Event-Id`) and must not
  assume `payment.authorized` implies settlement (only `payment.captured`
  does).
- **Test Mode keys** require no KYC and no website verification - usable
  immediately for the full development cycle.

**Idempotency in practice:** before calling Razorpay, the executor checks
whether a `deals` row already exists for `session_id`. If yes, return the
existing order/link rather than creating a new one. This makes a retried
execution (e.g. after a network timeout) provably safe rather than reliant
on hoping the retry logic behaved correctly.

## 10. Failure Handling (Demoed, Not Just Designed)

1. **Buyer exceeds its own mandate** (primary demo failure) - Buyer
   proposes above `max_total_spend` → mandate gate blocks it → agent
   autonomously proposes a reduced quantity that fits → renegotiates →
   deal closes. Chosen as the headline demo moment because it shows
   bounded autonomy *and* graceful recovery, not just a hard stop.
2. **Inventory race** - another session consumes the last units mid
   negotiation → caught by the dual final re-check before the Razorpay
   call → merchant offers a substitute/bundle instead of silently failing.
3. **Razorpay timeout** - executor retries with backoff; the deal stays
   `pending`, never `failed` outright; retry is idempotent on
   `session_id`, so no duplicate order is ever created.

## 11. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind | Negotiation Theater is the centerpiece; everything else stays minimal. |
| Backend | Node.js + Express + TypeScript | One deployable service for agents + orchestrator + executor keeps moving parts low for a 9-day build. TypeScript + Zod gives compile-time types inferred directly from runtime-validated schemas. |
| Database | PostgreSQL | Relational integrity matters - turns, sessions, deals, and audit events all reference each other and have real invariants (a turn belongs to exactly one session, a mandate can't overspend). |
| AI | Groq (`openai/gpt-oss-120b`) | Free tier, low latency, sufficient for narrow structured-output decisions; paired with strict schema validation and deterministic fallback. |
| Payments | Razorpay (test mode) | Orders API + Webhooks, verified against live docs before building against them. |
| Queue | None | Negotiation is synchronous turn-taking within a single session - no background job system needed. |

## 12. Explicit Non-Goals (Do Not Build)

Full AP2/ACP protocol compliance, real cryptographic mandate signing/PKI,
multi-currency support, voice interfaces, a general-purpose chat assistant
layered on top for its own sake.

## 13. Stretch (Only If Core Is Stable)

Multiple concurrent Buyer Vakils competing for limited inventory -
effectively a reverse-auction dynamic on top of the same policy-gate and
ledger infrastructure already built for bilateral negotiation. Explicitly
scoped as non-core and not a blocker to the primary submission.