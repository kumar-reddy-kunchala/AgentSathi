# System Architecture: ServiceAgent

ServiceAgent implements a hybrid architecture combining a high-fidelity **Conversational AI Agent (Sathi)** with an authoritative, **Deterministic Dispatch & Lifecycle State Machine**.

```
                           +-------------------------------------+
                           |            USER PORTAL              |
                           | Voice (Hey Sathi), Web Speech, UI   |
                           +------------------+------------------+
                                              |
                                              v
+------------------+       +-------------------------------------+       +--------------------+
|  ADMIN CONSOLE   |<----->|          EXPRESS API LAYER          |<----->|  EXECUTOR PORTAL   |
| Live Monitor,    |       |  Session Mgmt, RBAC, Validation     |       | Offers, Lifecyle,  |
| KYC, Audit Logs  |       +------------------+------------------+       | Verification Code  |
+------------------+                          |                          +--------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
   +------------------------------------+            +------------------------------------+
   |          SATHI AI ORCHESTRATOR     |            |    DETERMINISTIC DISPATCH ENGINE   |
   | Gemini 3.8 Flash + Knowledge Base  |            | Haversine distance, scoring math,  |
   | Intent classification, plan cards  |            | hard KYC filters, auto reassignment|
   +------------------------------------+            +------------------------------------+
                     |                                                 |
                     +------------------------+------------------------+
                                              |
                                              v
                           +-------------------------------------+
                           |       IN-MEMORY CORE DATABASE       |
                           |  Users, Executors, Tasks, Attempts, |
                           |  Appointments, Reminders, Audits    |
                           +-------------------------------------+
```

## Architectural Boundaries

1. **AI Agent Boundary**:
   - Sathi NEVER directly modifies database records without user validation.
   - Sathi proposes structured task plans (`WAITING_FOR_USER_CONFIRMATION`).
   - The user must explicitly approve before the deterministic engine takes control.

2. **Dispatch Boundary**:
   - The AI Agent does NOT select the executor.
   - Candidate ranking is 100% mathematical, auditable, and deterministic.
   - The engine guarantees that unverified or offline providers can never receive offers.

3. **Lifecycle Integrity**:
   - Tasks follow strict forward progression rules:
     `DRAFT` ➔ `WAITING_FOR_USER_CONFIRMATION` ➔ `CONFIRMED` ➔ `OFFER_SENT` ➔ `EXECUTOR_ASSIGNED` ➔ `ACCEPTED` ➔ `IN_PROGRESS` ➔ `ARRIVED` ➔ `TASK_EXECUTED` ➔ `COMPLETED`.
   - Completion requires two-way validation using a random 4-digit code generated only on the user's client.
