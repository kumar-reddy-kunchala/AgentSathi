# Database & Schema Architecture

ServiceAgent uses a clean repository abstraction layer backed by an in-memory transactional datastore in development and testing, with straightforward mapping to relational (PostgreSQL) or document (Firestore) databases in production.

## Collections & Schemas

### 1. `users`
- `id`: Unique user ID (e.g. `usr_001`)
- `name`: Full name
- `email`: Verified contact email
- `phone`: Contact telephone
- `role`: Role (`USER` | `EXECUTOR` | `ADMIN`)
- `address`: Home delivery address
- `city`: Operating city
- `emergencyContact`: Relative / caregiver contact details
- `preferredLanguage`: Language preference (e.g. `en-IN`, `hi-IN`)

### 2. `executors`
- `id`: Unique executor ID (e.g. `exec_suresh`)
- `name`: Full name
- `email`, `phone`: Verified contacts
- `location`: Current coordinates (`latitude`, `longitude`, `city`)
- `capabilities`: Array of supported services (`MEDICINE_PICKUP`, `GROCERY_ASSISTANCE`, `TRANSPORTATION`, `COMPANION`)
- `serviceRadiusKm`: Max travel radius (e.g. `6.0` km)
- `kycStatus`: `REGISTERED` | `UNDER_REVIEW` | `KYC_APPROVED` | `KYC_REJECTED` | `SUSPENDED`
- `accountStatus`: `ACTIVE` | `INACTIVE` | `SUSPENDED`
- `isAvailable`: Live availability boolean toggle
- `rating`: Average customer rating (1.0 to 5.0)
- `reliabilityScore`: Completion percentage (0 to 100)
- `activeTasksCount`: Current in-progress workload

### 3. `tasks`
- `id`: Unique task ID
- `userId`, `userName`, `userPhone`
- `serviceType`: Type of service requested
- `title`, `description`
- `pickupLocation`, `destinationLocation`
- `scheduledAt`: Scheduled execution time
- `estimatedCost`, `finalCost`
- `status`: Lifecycle status (`DRAFT`, `CONFIRMED`, `OFFER_SENT`, `EXECUTOR_ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `ARRIVED`, `TASK_EXECUTED`, `COMPLETED`, `CANCELLED`, `NO_EXECUTOR_AVAILABLE`)
- `assignedExecutorId`, `assignedExecutorName`
- `verificationCode`: 4-digit completion code
- `paymentStatus`: `PAYMENT_PENDING` | `PAID` | `FAILED`

### 4. `dispatchAttempts`
- `id`: Unique attempt ID
- `taskId`: Associated task
- `attemptNumber`: Incremental attempt counter
- `candidateExecutorIds`: Array of eligible IDs
- `rankedCandidates`: Detailed candidate scores
- `excludedExecutorIds`: Blacklisted IDs for this attempt
- `currentExecutorId`: Targeted provider
- `offerSentAt`, `responseDeadline`
- `status`: `OFFER_SENT` | `ACCEPTED` | `REJECTED` | `EXPIRED` | `CANCELLED`

### 5. `auditLogs`
- `id`: Immutable event ID
- `timestamp`: ISO-8601 timestamp
- `actor`: System actor (`USER`, `EXECUTOR`, `ADMIN`, `DISPATCH_ENGINE`, `SATHI_AGENT`)
- `actorId`: ID of the initiating entity
- `action`: Specific state change (e.g. `EXECUTOR_REJECTED_OFFER`, `TASK_COMPLETED_WITH_VERIFICATION`)
- `resourceType`, `resourceId`
- `metadata`: Key-value payload
- `result`: `SUCCESS` | `FAILED` | `BLOCKED`
