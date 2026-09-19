# Deterministic Dispatch Engine

The ServiceAgent Dispatch Engine is an authoritative, zero-hallucination routing system responsible for matching verified service providers with care tasks.

## 1. Hard Eligibility Filters (Non-Negotiable)

To qualify for consideration, a candidate must pass ALL hard filters:
1. **KYC Approval**: `kycStatus === 'KYC_APPROVED'` (Unapproved or under-review candidates are excluded).
2. **Account Status**: `accountStatus === 'ACTIVE'` (Suspended accounts excluded).
3. **Live Availability**: `isAvailable === true` (Offline executors excluded).
4. **Service Capability**: `executor.capabilities.includes(task.serviceType)`.
5. **Workload Limit**: `activeTasksCount < maxConcurrentTasks` (Default: maximum 2 concurrent tasks).
6. **Service Radius**: `haversineDistance(executorLocation, taskLocation) <= executor.serviceRadiusKm`.
7. **Exclusion List**: `!attempt.excludedExecutorIds.includes(executor.id)`.

## 2. Multi-Factor Scoring Formula

Eligible candidates are ranked by a deterministic weighted score (0 to 100):

$$\text{Total Score} = (S_{\text{cap}} \times W_{\text{cap}}) + (S_{\text{avail}} \times W_{\text{avail}}) + (S_{\text{prox}} \times W_{\text{prox}}) + (S_{\text{rel}} \times W_{\text{rel}}) + (S_{\text{work}} \times W_{\text{work}}) + (S_{\text{rate}} \times W_{\text{rate}})$$

### Weights Configuration
- **Proximity Weight ($W_{\text{prox}}$)**: 0.35 (Closer distance gets highest priority)
- **Reliability Weight ($W_{\text{rel}}$)**: 0.25 (Completion history and on-time rate)
- **Rating Weight ($W_{\text{rate}}$)**: 0.15 (Average user star rating)
- **Workload Weight ($W_{\text{work}}$)**: 0.10 (Fewer concurrent tasks favored)
- **Capability Weight ($W_{\text{cap}}$)**: 0.10 (Exact skill match)
- **Availability Weight ($W_{\text{avail}}$)**: 0.05

### Distance Calculation
Distance is computed using the Great-Circle Haversine Formula:

$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$

## 3. Rejection & Reassignment Protocol

1. **Offer Generation**: An offer is sent exclusively to the #1 ranked candidate with a 60-second response window (`OFFER_SENT`).
2. **Rejection**: If the executor clicks **REJECT** or the window expires:
   - The candidate is permanently appended to `excludedExecutorIds`.
   - An audit event `EXECUTOR_REJECTED_OFFER` is recorded.
   - The engine immediately scores remaining non-excluded candidates and dispatches to #2.
3. **User Cancellation**: If the user clicks **Cancel this executor & find someone else**:
   - The assigned executor's workload count is decremented.
   - The executor is added to `excludedExecutorIds`.
   - The next eligible candidate is assigned without restarting the task creation flow.
