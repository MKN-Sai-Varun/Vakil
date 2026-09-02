# Vakil - Bounded AI-to-AI Negotiation Commerce

**Razorpay Buildathon · Track 01: AI Growth & Agentic Commerce**

Vakil enables merchants to transact with autonomous AI buyer agents through bounded negotiation. Two AI agents negotiate price, quantity, and bundles - each constrained by policy gates they can never break, with every decision logged in an auditable trail.

**Live demo:** https://frontend-xi-olive-aayy0wfm3b.vercel.app  
**Backend API:** https://vakil-v2w7.onrender.com

> The backend runs on Render's free tier and spins down after 15 minutes of inactivity. The first request after idle may take 30–60 seconds while it wakes up.

---

## What it is

Two autonomous AI agents - a **Buyer Vakil** and a **Merchant Vakil** - negotiate price, quantity, and bundles across multiple turns. Every proposed move is independently verified against a deterministic policy gate before execution. Only deals that clear both gates proceed to Razorpay settlement. Every turn is written to an append-only ledger that produces a **Proof of Fair Deal** - showing what was rejected, accepted, and why.

## Why it matters for Track 01

**Making merchants transactable by AI buyers end-to-end:**
- Merchant agents handle negotiations 24/7 without human intervention
- AI buyers can transact autonomously within delegated authority
- Policy gates ensure merchants never sell below floor or exceed discount budgets
- Full audit trail makes every transaction explainable and trustworthy
- Ready for NPCI's UAP and emerging agent-to-agent commerce protocols

**Growing merchant revenue:**
- Captures deals that would be lost without 24/7 availability
- Volume bundle logic automatically increases average order value
- Negotiation flexibility within pricing corridors maximizes conversion
- Daily discount budgets prevent over-discounting while enabling competitive pricing

## Architecture: Propose → Verify → Execute

The core principle applied on both buyer and merchant side:

**LLM proposes move → Gate verifies constraints → Adjust if needed → Execute**

The LLM never decides what's legal - only *which* legal move to make. Key constraints:
- Merchant: never sells below floor price, never exceeds daily discount budget
- Buyer: never exceeds mandate (max spend, max unit price)
- Both verified independently by deterministic gate code, not prompt engineering

## Full flow

```
Buyer Vakil (LLM → mandateGate)
        ⇄
  Orchestrator (10-turn limit)
        ⇄
Merchant Vakil (LLM → policyGate)
        │
  Convergence detected
        │
  Dual Final Re-check (fresh inventory + mandate)
        │
  Deal Executor → Razorpay Order (idempotent on session_id)
        │
  Webhook → HMAC-SHA256 verification
        │
  Audit Ledger → Proof of Fair Deal
```

Full design detail in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Features

### For Buyers
- **Set mandate constraints:** max total spend, max unit price, desired quantity
- **Agent negotiates autonomously** within bounds, auto-adjusting quantity to fit budget
- **Never overspends:** mandate gate blocks any deal exceeding constraints
- **Full transparency:** see agent's reasoning and gate verification results

### For Merchants
- **Define pricing corridor:** list price (ceiling) and floor price (absolute minimum)
- **Set daily discount budget:** agent can discount but never exceeds daily limit
- **Volume bundle logic:** automatically offers bundles when conditions met (e.g., 10+ units)
- **Dashboard:** view inventory, active negotiations, and performance metrics
- **Never below floor:** policy gate blocks any deal violating floor price

### Audit & Trust
- **Proof of Fair Deal card:** shows both agents' constraints were satisfied
- **Turn-by-turn ledger:** every move with rationale, gate result, and verification status
- **Razorpay order ID displayed** in UI for transaction tracking
- **Webhook confirmation:** payment.captured updates deal status to settled

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express + TypeScript |
| Auth | JWT (jsonwebtoken + bcryptjs) - buyer and merchant roles |
| Database | PostgreSQL (Neon) - append-only audit ledger |
| AI | Groq (Llama 3.3 70B) - zero-cost inference, low latency |
| Payments | Razorpay test mode - Orders API + Webhooks |
| Hosting | Vercel (frontend) · Render (backend) · Neon (database) |

## Key design decisions

- **LLM never sees illegal moves as options.** Prompts include actual bounds; gates independently verify regardless of LLM output.
- **Fallback moves are constraint-aware.** If LLM fails or returns invalid JSON, fallback respects agent's limits.
- **Settlement is idempotent on `session_id`** - prevents duplicate Razorpay orders on retry.
- **Convergence re-validated against buyer mandate** even after merchant gate adjustments.
- **Bundle offers are deterministic** - trigger conditions computed in code, not left to LLM discretion.
- **All prices in INR (₹)** - prompts explicitly declare currency; agents trained to never mention dollars.
- **Webhook HMAC-SHA256 verification** - only confirmed payments update ledger to `settled`.
- **Turn counter (Turn X/10)** - clear progress indicator, prevents infinite loops.

## User Experience Highlights

### Public Landing Page
- Explains AI-to-AI commerce concept and policy gate architecture
- Shows value props: Provably Bounded, Full Audit Trail, Real Settlement
- "Get Started" flow leads to role-based signup

### Role-Specific Dashboards
- **Buyer Home:** Quick actions to start negotiations or browse catalog
- **Merchant Home:** Quick actions to list items or view dashboard
- Both show step-by-step guides explaining how their agent works

### Negotiation Theater
- Real-time turn-by-turn display with agent avatars
- Each turn shows: move type, rationale, gate result
- "Change item" button available until negotiation starts
- Proof of Fair Deal card generated on convergence
- Razorpay order ID displayed prominently

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

# Run schema migrations (in order)
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

**Quick start flow:**
1. Sign up as merchant → List a catalog item (set list price, floor price, inventory)
2. Sign up as buyer (different email) → Create mandate → Pick item → Start negotiation
3. Watch two AI agents negotiate autonomously

### Simulating payment webhook

After negotiation converges, a Razorpay order is created with status `pending`. To simulate `payment.captured`:

```bash
cd backend
npx ts-node scripts/test-webhook.ts <razorpay_order_id>
# Copy the printed curl command and run it
```

The ledger updates deal status from `pending` to `settled`.

### Baseline simulation

Compare fixed-price selling vs Vakil negotiation across synthetic buyer mandates:

```bash
cd backend
npm run simulate
```

---

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - Full system design, data model, safety architecture, Razorpay integration
- [`docs/RELIABILITY.md`](docs/RELIABILITY.md) - Failure scenarios tested, bugs found and fixed, security measures
- [`docs/RAZORPAY_CAPABILITY_MATRIX.md`](docs/RAZORPAY_CAPABILITY_MATRIX.md) - Razorpay API capabilities verified

---

## Demo Strategy (5-Minute Video)

### Minute 1: Problem & Solution
- AI commerce (UAP, ACP) needs bounded agents
- Vakil: Two agents negotiate, both bounded by policy gates

### Minute 2: Buyer Flow
- Create mandate: ₹500 budget, ₹12 max unit, 50 qty
- Pick item, watch negotiation theater
- Show mandate gate blocking overspend

### Minute 3: Merchant Flow
- Dashboard with inventory and sessions
- Ledger detail showing audit trail
- Proof of Fair Deal card

### Minute 4: Razorpay Integration
- Show Razorpay order creation on convergence
- Order ID in UI
- Webhook handling

### Minute 5: Why It Matters
- Architecture diagram
- "Every decision explainable, every constraint enforced"
- Ready for UAP/ACP era of agent commerce

---

## What's not built (explicit non-goals)

Full AP2/ACP protocol compliance, cryptographic mandate signing/PKI, multi-currency support, multi-item baskets, voice interfaces.
