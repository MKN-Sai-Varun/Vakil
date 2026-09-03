# Vakil - Bounded AI-to-AI Negotiation Commerce

> Autonomous negotiation agents with provable constraints and complete audit trails

Vakil is a proof-of-concept platform for AI-to-AI commerce where autonomous buyer and merchant agents negotiate deals within verifiable boundaries. Every transaction is gated by deterministic policy checks and logged in an immutable audit trail.

**Live Demo:** https://frontend-xi-olive-aayy0wfm3b.vercel.app  
**API:** https://vakil-v2w7.onrender.com

> **Note:** The backend runs on Render's free tier and spins down after inactivity. First request may take 30-60 seconds to wake up.

---

## Overview

Vakil demonstrates a trust architecture for autonomous commerce by separating **decision-making** (LLM agents) from **enforcement** (deterministic gates):

- **Buyer Vakil**: Negotiates within a delegated budget (mandate)
- **Merchant Vakil**: Negotiates within pricing corridors (floor + ceiling)
- **Policy Gates**: Verify every move against constraints before execution
- **Audit Ledger**: Records every turn with rationale and verification results
- **Settlement**: Creates Razorpay orders on convergence, confirms via webhooks

## Why This Matters

As commerce shifts toward agent-to-agent transactions (NPCI UAP, ACP protocols), the core challenge is **trust at scale**. Vakil addresses this by:

- **Provable Boundedness**: Constraints enforced by code, not prompts
- **Complete Auditability**: Every decision traceable and explainable  
- **Graceful Failure Handling**: Gate violations trigger adjustments, not silent errors
- **Real Settlement**: Integrates with production payment infrastructure (Razorpay)

This architecture enables merchants to safely delegate negotiation authority to AI agents while maintaining control over margins, and allows buyers to authorize AI agents with spending limits they can't exceed.

## Architecture

### Core Principle: Propose → Verify → Execute

The system separates agent decisions from constraint enforcement:

**LLM proposes move → Gate verifies → Adjust if needed → Execute**

- **LLM Role**: Decides *which* legal move to make (counter, accept, bundle offer)
- **Gate Role**: Determines *what* moves are legal (enforces floor price, mandate caps)
- **Orchestrator Role**: Coordinates turn-by-turn negotiation until convergence

### Negotiation Flow

```
Buyer Vakil (LLM → mandateGate)
        ⇄
  Orchestrator (10-turn max)
        ⇄
Merchant Vakil (LLM → policyGate)
        │
  Convergence detected
        │
  Dual Final Re-check
        │
  Deal Executor → Razorpay Order
        │
  Webhook confirmation
        │
  Audit Ledger
```

### System Workflow

<!-- Placeholder for workflow diagram -->
![alt text](image.png)

For detailed architecture including API flows, database schema, and gate logic, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Key Features

### Buyer Experience
- **Mandate-based delegation:** Set max spend, max unit price, desired quantity
- **Autonomous negotiation:** Agent negotiates within bounds, auto-adjusting to fit budget
- **Constraint enforcement:** Mandate gate prevents any deal exceeding limits
- **Full transparency:** View agent reasoning and gate verification for every turn

### Merchant Experience
- **Pricing corridors:** Define list price (ceiling) and floor price (minimum)
- **Discount budgets:** Daily limits prevent over-discounting
- **Smart bundles:** Automatic volume bundle offers when conditions met
- **Dashboard:** Real-time view of inventory, active negotiations, and revenue
- **Floor protection:** Policy gate blocks any deal below floor price

### Trust & Auditability
- **Proof of Fair Deal:** Verification that both agents' constraints were satisfied
- **Immutable ledger:** Every turn logged with rationale, gate result, verification status
- **Payment integration:** Razorpay order creation with webhook confirmation
- **Graceful failures:** Gate violations logged and handled transparently

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React + Vite + Tailwind CSS v4 | Real-time negotiation theater, role-based dashboards |
| Backend | Node.js + Express + TypeScript | RESTful API, orchestrator, gate verification |
| Database | PostgreSQL (Neon) | Relational data model, append-only audit ledger |
| AI/LLM | Groq (Llama 3.3 70B) | Agent decision-making with structured output |
| Payments | Razorpay | Order creation, webhook-based settlement confirmation |
| Auth | JWT (jsonwebtoken + bcryptjs) | Role-based access control (buyer/merchant) |
| Hosting | Vercel + Render + Neon | Frontend, backend, database (free tiers) |

## Design Decisions

### Safety & Reliability
- **Gates over prompts:** Constraints enforced by deterministic code, not LLM instructions
- **Idempotent operations:** Retried operations (settlement, webhooks) never create duplicates
- **Dual verification:** Convergence re-validated against both buyer and merchant constraints
- **Constraint-aware fallbacks:** LLM failures trigger safe default moves within bounds

### Agent Behavior  
- **Structured output:** LLM responses parsed as JSON, validated against schemas
- **Deterministic bundles:** Volume bundle triggers computed in code, not left to LLM
- **Currency enforcement:** All prompts explicitly declare INR (₹), validated in output
- **Turn limits:** 10-turn ceiling prevents infinite negotiation loops

### Integration & Security
- **Webhook signature verification:** HMAC-SHA256 validation before processing payments
- **Session-based idempotency:** Prevents duplicate Razorpay orders via session_id uniqueness
- **Append-only audit log:** Immutable record of all decisions and gate results

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

## Getting Started

### Prerequisites
- Node.js 20+
- Docker (for local PostgreSQL)
- [Groq API key](https://console.groq.com) (free tier available)
- [Razorpay test-mode keys](https://dashboard.razorpay.com/signup)

### Installation

1. **Clone and setup database**
   ```bash
   git clone https://github.com/MKN-Sai-Varun/Vakil.git
   cd Vakil

   # Start PostgreSQL
   docker run --name vakil-pg \
     -e POSTGRES_PASSWORD=vakil \
     -e POSTGRES_DB=vakil \
     -p 5432:5432 -d postgres:16

   # Run migrations
   psql postgresql://postgres:vakil@localhost:5432/vakil \
     -f database/migrations/0001_init.sql
   psql postgresql://postgres:vakil@localhost:5432/vakil \
     -f database/migrations/0002_auth.sql
   ```

2. **Configure backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your keys:
   #   GROQ_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
   #   RAZORPAY_WEBHOOK_SECRET, JWT_SECRET, DATABASE_URL
   npm run dev  # Starts on http://localhost:3000
   ```

3. **Start frontend**
   ```bash
   cd frontend
   npm install
   npm run dev  # Starts on http://localhost:5173
   ```

### Quick Start

1. **Merchant**: Sign up → List item with pricing corridor (floor, list price, stock)
2. **Buyer**: Sign up with different email → Create mandate → Browse catalog → Start negotiation
3. Watch the agents negotiate autonomously for up to 10 turns

### Testing Webhooks

Simulate payment confirmation after a deal converges:

```bash
cd backend
npx ts-node scripts/test-webhook.ts <razorpay_order_id>
# Execute the printed curl command
```

Deal status updates from `pending` to `settled` in the ledger.

### Running Simulations

Compare agent-based negotiation vs fixed pricing:

```bash
cd backend
npm run simulate
```

---

## Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - System design, API flows, database schema, gate logic
- **[Reliability](docs/RELIABILITY.md)** - Failure scenarios, testing, security measures  
- **[API Workflow](docs/API_WORKFLOW.md)** - Complete endpoint reference with examples
- **[Razorpay Integration](docs/RAZORPAY_CAPABILITY_MATRIX.md)** - Payment API capabilities

---

## Project Status

**Current State:** Functional proof-of-concept demonstrating core bounded negotiation architecture

**Built For:** Razorpay Buildathon Track 01 (AI Growth & Agentic Commerce)

### Known Limitations
- Single-item negotiations only (no multi-item baskets)
- No cryptographic mandate signing (delegated authority is trust-based)
- Test mode only (no production payment processing)
- English language only in agent prompts/rationales
- In-memory webhook deduplication (resets on server restart)

### Future Directions
- Multi-item basket negotiations
- Cryptographic mandate signing with PKI
- Support for UAP/ACP protocol standards
- Multi-currency support
- Voice interface for mandate creation
- Advanced analytics dashboard
