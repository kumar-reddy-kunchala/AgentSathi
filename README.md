# ServiceAgent: Agentic AI Service Coordination Platform for Independent Living

An enterprise-grade, agentic AI platform designed for independent living (e.g., senior citizens, assisted living, personal errands). It pairs **Sathi AI**—a voice-first conversational agent powered by Gemini 3.8 Flash—with a **Strictly Deterministic Dispatch Engine** that enforces KYC compliance, proximity matching, live availability, two-way verification, and automatic candidate reassignment.

---

## 🚀 Key Highlights

1. **Sathi Voice-First Agent**:
   - Natural conversational interface supporting speech recognition (`Hey Sathi`), intelligent intent classification, entity extraction (medicine name, pharmacy, delivery time), and context-aware task drafting.
   - Grounded responses using platform knowledge documents (safety guidelines, emergency escalations).
   - Structured action cards for 1-tap confirmation and dispatch.

2. **Deterministic Dispatch Engine**:
   - Zero hallucinations in dispatch: Matching and executor assignment are handled by a strict mathematical scoring function (Capability, Availability, Proximity via Haversine, Reliability score, Workload, and Rating).
   - Hard filters: Unapproved KYC, inactive accounts, offline executors, and out-of-radius providers are **strictly excluded**.
   - Auto-reassignment: If an executor rejects or times out, or if the user requests reassignment, the rejected executor is permanently excluded from the attempt and the engine deterministically advances to the next candidate.

3. **Multi-Role Portals**:
   - **User Portal (`/user`)**: Voice & chat assistant, active task tracking, 4-digit verification code generation, appointment ride booking, and audited memory preferences.
   - **Executor Portal (`/executor`)**: Live availability switch, incoming task dispatch cards with real-time Accept/Reject actions, lifecycle progress buttons (Start Transit, Arrived, Executed), client verification code confirmation, and demo video verification.
   - **Admin Governance (`/admin`)**: Real-time dispatch monitor with score breakdowns and exclusion audit trails, KYC review (Approve, Reject, Suspend), user/executor management, and complete immutable audit logs.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Web Speech API (STT & TTS)
- **Backend**: Node.js, Express, `tsx`, `@google/genai` (Gemini 3.8 Flash with deterministic fallback parser)
- **Build System**: Vite 8 & `esbuild` for bundled CommonJS server distribution
- **Testing**: Deterministic test suite covering dispatch, state machine, KYC filtering, and Sathi intent extraction

---

## 🏁 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (28 automated tests)
npm test

# 3. Start development server
npm run dev
```

---

## 🧪 Interactive Walkthrough Scenarios

### Scenario A: Rejection & Automatic Reassignment
1. Open the **Executor Portal** (`/executor/login`) in a tab and select **Suresh Kumar** (Top-ranked match). Ensure status is **Available**.
2. Open the **User Portal** (`/user/login`) in another tab as **Ramesh Sharma**.
3. Tap the mic or type: `"Hey Sathi, I need someone to pick up my blood pressure medicine from Apollo Pharmacy at 5 PM"`.
4. Click **Confirm & Dispatch Task**.
5. Switch to Suresh's tab: An incoming task banner appears with **₹80 fee**, **Apollo Pharmacy pickup**, and two buttons: **Accept** and **Reject**.
6. Click **REJECT OFFER**.
7. Switch to the **Admin Portal** (`/admin`): Observe Suresh added to `excludedExecutorIds` and dispatch automatically advanced to **Anita Rao**!
8. Log in as **Anita Rao** on `/executor/login`: The offer is now waiting for her to accept!

### Scenario B: Complete Lifecycle & Verification
1. As the assigned executor, click **ACCEPT TASK**.
2. Click **Start Task (Transit)** ➔ **Mark Arrived** ➔ **Complete Execution**.
3. The executor dashboard prompts: *"Enter Client 4-Digit Verification Code"*.
4. Check the User Portal: The active task displays the secret 4-digit code (e.g., `4921`).
5. Enter the code in the Executor portal. The task completes, earnings are credited, and the user receives a payment confirmation card.
