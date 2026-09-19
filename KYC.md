# KYC & Verification Workflow

ServiceAgent implements a multi-step verification pipeline to vet all in-person service providers before granting task eligibility.

## Verification Lifecycle

```
[REGISTERED]
     |
     v
[DOCUMENTS_PENDING]  --> (Provider uploads PAN & Aadhaar details)
     |
     v
[UNDER_REVIEW]       --> (Automated biometric check & Admin queue)
     |
     v
[VIDEO_VERIFICATION] --> (Live face & ID video session via provider abstraction)
     |
     +------------> [KYC_APPROVED]  (Unlocked for dispatch matching)
     |
     +------------> [KYC_REJECTED]  (Blocked from receiving tasks)
```

## 1. Document Submission
- **Permanent Account Number (PAN)**: Checked for format authenticity (`[A-Z]{5}[0-9]{4}[A-Z]{1}`).
- **Aadhaar Last 4 Digits**: Checked for identity alignment.
- **Certifications**: Emergency care, senior assistance, and first aid credentials recorded.

## 2. Video Verification Provider Abstraction
- In development/hackathon mode: A dedicated **Demo Video Verification Session** (clearly labeled `DEMO VIDEO VERIFICATION`) simulates the live biometric match against government records and allows 1-click verification approval.
- In production: Integrated with HyperVerge / Digilocker / IDfy video KYC services.

## 3. Administrative Governance
- Admins inspect document submissions in the Admin Console (`/admin` ➔ KYC Approvals).
- Admins retain unilateral authority to **Approve**, **Reject**, **Suspend**, or **Reactivate** executor accounts.
- Suspended executors immediately drop out of live dispatch calculations.
