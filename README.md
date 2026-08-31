# Vakil - Bounded AI-to-AI Negotiation Commerce

**Razorpay Buildathon · Track 01: AI Growth & Agentic Commerce**

Vakil lets a merchant safely negotiate and transact with autonomous AI
buyer agents - bounded by a policy it can never break, proven by an audit
trail it can never fake.

**Live demo:** https://frontend-xi-olive-aayy0wfm3b.vercel.app
**Backend API:** https://vakil-v2w7.onrender.com

> Note: the backend is hosted on Render's free tier and spins down after
> 15 minutes of inactivity. The first request after idle may take 30-60
> seconds to respond while it wakes up.

## What it is

Two autonomous AI agents - a **Buyer Vakil** and a **Merchant Vakil** -
negotiate price, quantity, and bundles across multiple turns, entirely on
their own. Every proposed move is independently checked against a
deterministic policy gate before it's ever emitted or acted on. Only a
deal that clears both gates is sent to Razorpay for settlement. Every
turn is logged to an append-only ledger that produces a **Proof of Fair
Deal** - a structured explanation of what was rejected, what was
accepted, and why.

## Why it's different

Most AI-commerce demos are a chatbot in front of a payment API. Vakil
builds the AI buyer as a genuine, autonomous counterpart with its own
incentives - not a proxy for a human clicking through a form. The core
architectural principle, applied on both sides:

**Propose (LLM) → Constrain (clamp to legal moves) → Verify (deterministic gate) → Emit**

The LLM never decides what's legal. It only decides *which* legal move to
make. A merchant can never sell below floor. A buyer can never exceed its
mandate. These are structural guarantees, provable via the gate code and
its tests - not assertions based on careful prompting.

## Architecture
Buyer Vakil (LLM → clamp → mandateGate) ⇄ Orchestrator ⇄ Merchant Vakil (LLM → clamp → policyGate)
│
Convergence detected
│
Dual Final Re-check
(fresh inventory + fresh mandate)
│
Deal Executor → Razorpay Order
(idempotent on session_id)
│
Webhook → Signature Verification
│
Audit Ledger (append-only) → Proof of Fair Deal


Full detail in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (Neon) |
| AI | Groq (`openai/gpt-oss-120b`) - chosen for zero-cost inference and low latency |
| Payments | Razorpay (test mode) - Orders API + Webhooks |
| Hosting | Vercel (frontend) · Render (backend) · Neon (database) |

## Running locally

### Prerequisites
- Node.js 20+
- Docker (for local Postgres)
- A Groq API key ([console.groq.com](https://console.groq.com))
- Razorpay test-mode API keys ([dashboard.razorpay.com](https://dashboard.razorpay.com))

### Setup

```bash
git clone https://github.com/MKN-Sai-Varun/Vakil.git
cd Vakil

# Start local Postgres
docker run --name vakil-pg -e POSTGRES_PASSWORD=vakil -e POSTGRES_DB=vakil -p 5432:5432 -d postgres:16

# Run the schema migration
psql postgresql://postgres:vakil@localhost:5432/vakil -f database/migrations/0001_init.sql

# Seed sample data
psql postgresql://postgres:vakil@localhost:5432/vakil -c "INSERT INTO merchants (id, name) VALUES ('11111111-1111-1111-1111-111111111111', 'Demo Merchant');"
psql postgresql://postgres:vakil@localhost:5432/vakil -c "INSERT INTO catalog_items (id, merchant_id, name, base_price, floor_price, inventory_qty, daily_discount_budget) VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Sample Widget', 1000, 750, 20, 5000);"
psql postgresql://postgres:vakil@localhost:5432/vakil -c "INSERT INTO mandates (id, principal_name, max_total_spend, max_unit_price, expires_at) VALUES ('33333333-3333-3333-3333-333333333333', 'Test Buyer', 20000, 1000, now() + interval '7 days');"
```

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in GROQ_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
npm run dev
```

Backend runs on `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

Open it in a browser, create a Mandate, create a Catalog Item, and click
**Start Negotiation** to watch two real AI agents negotiate live.

## Running the baseline simulation

Compares fixed-price selling against Vakil negotiation across N synthetic
buyer mandates:

```bash
cd backend
npm run simulate
```

Produces a close-rate and margin comparison table. See
[`docs/RELIABILITY.md`](docs/RELIABILITY.md) for documented results and
methodology notes.

## Key design decisions

- **LLM never sees illegal moves as options.** Prompts include the
  agent's actual bounds (floor price, mandate cap); the gate independently
  re-verifies regardless of what the LLM outputs.
- **Fallback moves are constraint-aware.** If a Groq call fails or
  returns invalid JSON, the fallback logic clamps to the agent's own
  limits rather than blindly echoing the other side's last offer - a real
  bug found and fixed during testing (see `docs/RELIABILITY.md`).
- **Settlement is idempotent on `session_id`**, since Razorpay's Orders
  API has no native idempotency key. A retried execution never creates a
  duplicate order - verified via deliberate retest and confirmed across
  all sessions run during development.
- **Convergence is re-validated against the buyer's mandate** even after
  a merchant-side gate adjustment, closing a subtle bug where a
  gate-modified price could otherwise bypass the buyer's own cap.
- **Bundle offers are deterministic**, not LLM-discretionary - the LLM
  proposed bundles unreliably across multiple prompt-tuning attempts, so
  the trigger condition and terms are computed in code, with the LLM only
  narrating the rationale.

## What's not built (explicit non-goals)

Full AP2/ACP protocol compliance, real cryptographic mandate signing/PKI,
multi-currency support, voice interfaces, a general-purpose chat
assistant layered on top for its own sake.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - full system design
- [`docs/RELIABILITY.md`](docs/RELIABILITY.md) - documented failure
  scenarios, real bugs found and fixed, security checks
- [`docs/RAZORPAY_CAPABILITY_MATRIX.md`](docs/RAZORPAY_CAPABILITY_MATRIX.md)
  - Razorpay API capabilities verified against live docs