# Vakil - Bounded AI-to-AI Negotiation Commerce

**Razorpay Buildathon · Track 01: AI Growth & Agentic Commerce**

Vakil lets a merchant safely negotiate and transact with autonomous AI buyer agents - bounded by a policy it can never break, proven by an audit trail it can never fake.

**Live demo:** https://frontend-xi-olive-aayy0wfm3b.vercel.app
**Backend API:** https://vakil-v2w7.onrender.com

> The backend runs on Render's free tier and spins down after 15 minutes of inactivity. The first request after idle may take 30–60 seconds while it wakes up.

---

## What it is

Two autonomous AI agents - a **Buyer Vakil** and a **Merchant Vakil** - negotiate price, quantity, and bundles across multiple turns, entirely on their own. Every proposed move is independently checked against a deterministic policy gate before it is ever emitted or acted on. Only a deal that clears both gates is sent to Razorpay for settlement. Every turn is written to an append-only ledger that produces a **Proof of Fair Deal** - a structured explanation of what was rejected, what was accepted, and why.

## Why it's different

Most AI-commerce demos are a chatbot in front of a payment API. Vakil builds the AI buyer as a genuine, autonomous counterpart with its own incentives - not a proxy for a human clicking through a form. The core architectural principle, applied on both sides:

**Propose (LLM) → Constrain (clamp to legal moves) → Verify (deterministic gate) → Emit**

The LLM never decides what's legal. It only decides *which* legal move to make. A merchant can never sell below floor. A buyer can never exceed its mandate. These are structural guarantees, provable via the gate code - not assertions based on careful prompting.

## Full flow

```
Buyer Vakil (LLM → clamp → mandateGate)
        ⇄
  Orchestrator
        ⇄
Merchant Vakil (LLM → clamp → policyGate)
        │
  Convergence detected
        │
  Dual Final Re-check
  (fresh inventory + fresh mandate)
        │
  Deal Executor → Razorpay Order
  (idempotent on session_id)
        │
  Webhook → HMAC-SHA256 Signature Verification
        │
  Audit Ledger (append-only) → Proof of Fair Deal
```

Full design detail in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express + TypeScript |
| Auth | JWT (jsonwebtoken + bcryptjs) - buyer and merchant roles |
| Database | PostgreSQL (Neon) |
| AI | Groq (`openai/gpt-oss-120b`) - zero-cost inference, low latency |
| Payments | Razorpay test mode - Orders API + Webhooks |
| Hosting | Vercel (frontend) · Render (backend) · Neon (database) |

## Key design decisions

- **LLM never sees illegal moves as options.** Prompts include the agent's actual bounds (floor price, mandate cap); the gate independently re-verifies regardless of what the LLM outputs.
- **Fallback moves are constraint-aware.** If a Groq call fails or returns invalid JSON, the fallback clamps to the agent's own limits rather than echoing the other side's last offer - a real bug found and fixed during testing.
- **Settlement is idempotent on `session_id`**, since Razorpay's Orders API has no native idempotency key. A retried execution never creates a duplicate order.
- **Convergence is re-validated against the buyer's mandate** even after a merchant-side gate adjustment, closing a subtle path where a gate-clamped price could otherwise bypass the buyer's own cap.
- **Bundle offers are deterministic**, not LLM-discretionary - the trigger condition and terms are computed in code; the LLM only narrates the rationale.
- **All prices are INR (₹).** Prompts explicitly declare currency; agents cannot produce dollar-denominated output.
- **Webhook confirmation closes the loop.** `payment.captured` fires → HMAC-SHA256 verified → deal marked `settled` in the ledger with a `webhook_confirmed_at` timestamp. Delivery is idempotent via `X-Razorpay-Event-Id`.

## What's not built (explicit non-goals)

Full AP2/ACP protocol compliance, real cryptographic mandate signing/PKI, multi-currency support, voice interfaces, a general-purpose chat assistant layered on top for its own sake.

---

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

# Run schema migrations (both, in order)
psql postgresql://postgres:vakil@localhost:5432/vakil -f database/migrations/0001_init.sql
psql postgresql://postgres:vakil@localhost:5432/vakil -f database/migrations/0002_auth.sql
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in: GROQ_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, JWT_SECRET, DATABASE_URL
npm run dev
```

Runs on `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`.

Sign up as a merchant and create a catalog item. Sign up as a buyer, set a mandate, pick the item, and click **Start negotiation** to watch two real AI agents negotiate live.

### Simulating a payment webhook

After a negotiation converges, a Razorpay order is created with status `pending`. To simulate `payment.captured` and confirm settlement:

```bash
cd backend
npx ts-node scripts/test-webhook.ts <razorpay_order_id>
# Copy the printed curl command and run it
```

The deal status in the ledger updates from `pending` to `settled`.

### Baseline simulation

Compares fixed-price selling against Vakil negotiation across synthetic buyer mandates:

```bash
cd backend
npm run simulate
```

---

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - full system design, data model, safety model, Razorpay integration
- [`docs/RELIABILITY.md`](docs/RELIABILITY.md) - documented failure scenarios, real bugs found and fixed, security checks
- [`docs/RAZORPAY_CAPABILITY_MATRIX.md`](docs/RAZORPAY_CAPABILITY_MATRIX.md) - Razorpay API capabilities verified against live docs
