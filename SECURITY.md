# Security Architecture & Trust Model

ServiceAgent coordinates physical, in-person assistance for vulnerable seniors and independent living individuals. As such, security, privacy, and identity assurance are paramount.

## 1. Zero Trust Identity Verification

- **Two-Way Service Verification**:
  - Tasks can only transition from `TASK_EXECUTED` to `COMPLETED` when the executor enters the user's secret 4-digit code.
  - The verification code is generated strictly upon assignment and displayed only on the user's authenticated portal.
  - Executors cannot self-certify completion.

- **Mandatory KYC Gates**:
  - The dispatch engine strictly verifies that `kycStatus === 'KYC_APPROVED'` before an executor can receive any task offer.
  - Unverified executors (e.g. Vikas Patel in demo data) are filtered at the SQL/in-memory query stage.

## 2. Server-Side Role-Based Access Control (RBAC)

- Three mutually isolated roles: `USER`, `EXECUTOR`, `ADMIN`.
- Endpoints enforce role checks on the server:
  - Users cannot trigger executor state transitions or view other users' medical reminders.
  - Executors cannot inspect platform audit logs or approve KYC applications.
  - Admin operations (suspension, KYC approvals) are restricted to authenticated admin accounts.

## 3. Secret & Credential Isolation

- **Gemini API Key**:
  - Loaded strictly server-side via `process.env.GEMINI_API_KEY`.
  - Never exposed to the browser or bundled into the client build.
- **Payment & Verification Provider Secrets**:
  - Stored in backend environment variables (`RAZORPAY_KEY_SECRET`, `HYPERVERGE_API_KEY`).
  - Provider abstractions validate signatures and transactions server-side.

## 4. Immutable Audit Trail

- Every action is recorded into the system audit log with actor ID, timestamp, resource ID, and operational metadata.
- Dispatch rejections, cancellations, and state overrides cannot be deleted.
