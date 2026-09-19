// Deterministic Dispatch Engine for ServiceAgent
import { db } from './db';
import {
  Task,
  ExecutorProfile,
  DispatchAttempt,
  DispatchCandidate,
  LocationCoordinates,
  ServiceType,
} from '../src/types';

export interface DispatchWeights {
  capability: number;
  availability: number;
  proximity: number;
  reliability: number;
  workload: number;
  rating: number;
}

export const DEFAULT_DISPATCH_WEIGHTS: DispatchWeights = {
  capability: 0.25,
  availability: 0.20,
  proximity: 0.25,
  reliability: 0.15,
  workload: 0.05,
  rating: 0.10,
};

// Haversine formula to calculate distance between two coordinates in kilometers
export function calculateDistanceKm(
  loc1: { latitude: number; longitude: number },
  loc2: { latitude: number; longitude: number }
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.latitude * Math.PI) / 180) *
      Math.cos((loc2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}

export class DispatchEngine {
  weights: DispatchWeights = { ...DEFAULT_DISPATCH_WEIGHTS };

  /**
   * Evaluates all executors against strict eligibility criteria
   */
  getEligibleExecutors(
    serviceType: ServiceType,
    taskLocation: LocationCoordinates,
    excludedExecutorIds: Set<string>
  ): { executor: ExecutorProfile; distanceKm: number }[] {
    const eligible: { executor: ExecutorProfile; distanceKm: number }[] = [];
    const seenIds = new Set<string>();

    for (const executor of db.executors.values()) {
      if (seenIds.has(executor.id)) continue;
      seenIds.add(executor.id);

      // 1. Must be KYC approved
      if (executor.kycStatus !== 'KYC_APPROVED') continue;

      // 2. Account must be active and not suspended
      if (executor.accountStatus !== 'ACTIVE') continue;

      // 3. Must be currently available
      if (!executor.isAvailable) continue;

      // 4. Must possess requested capability
      if (!executor.capabilities.includes(serviceType)) continue;

      // 5. Workload limit
      if (executor.activeTasksCount >= executor.maxConcurrentTasks) continue;

      // 6. Must not be in exclusion list for this attempt
      if (excludedExecutorIds.has(executor.id)) continue;

      // 7. Distance & Service Radius check
      const distance = calculateDistanceKm(executor.location, taskLocation);
      if (distance > executor.serviceRadiusKm) continue;

      eligible.push({ executor, distanceKm: distance });
    }

    return eligible;
  }

  /**
   * Deterministic scoring function
   */
  scoreCandidate(
    executor: ExecutorProfile,
    distanceKm: number,
    serviceType: ServiceType
  ): DispatchCandidate {
    // 1. Capability score (100 if primary capability match)
    const capabilityScore = executor.capabilities.includes(serviceType) ? 100 : 0;

    // 2. Availability score (100 if currently toggled online and available)
    const availabilityScore = executor.isAvailable ? 100 : 0;

    // 3. Proximity score (100 within 1km, degrades linearly up to service radius)
    const maxRadius = Math.max(executor.serviceRadiusKm, 10);
    const proximityScore = Math.max(0, Math.round(100 * (1 - distanceKm / maxRadius)));

    // 4. Reliability score (based on completed tasks, acceptance rate, cancellation track record)
    const reliabilityScore = executor.reliabilityScore;

    // 5. Workload score (100 if 0 active tasks, 50 if 1, 0 if at max)
    const workloadRatio = executor.activeTasksCount / executor.maxConcurrentTasks;
    const workloadScore = Math.max(0, Math.round(100 * (1 - workloadRatio)));

    // 6. Rating score (Rating out of 5 scaled to 100)
    const ratingScore = Math.round((executor.rating / 5) * 100);

    // Calculate total weighted score
    const totalScore = Math.round(
      capabilityScore * this.weights.capability +
      availabilityScore * this.weights.availability +
      proximityScore * this.weights.proximity +
      reliabilityScore * this.weights.reliability +
      workloadScore * this.weights.workload +
      ratingScore * this.weights.rating
    );

    // Rough ETA: 5 mins preparation + 3 mins per km
    const etaMinutes = Math.max(8, Math.round(5 + distanceKm * 3.2));

    return {
      executorId: executor.id,
      executorName: executor.name,
      distanceKm,
      etaMinutes,
      rating: executor.rating,
      completedTasks: executor.completedTasksCount,
      reliabilityScore: executor.reliabilityScore,
      totalScore,
      scoreBreakdown: {
        capabilityScore,
        availabilityScore,
        proximityScore,
        reliabilityScore,
        workloadScore,
        ratingScore,
      },
    };
  }

  /**
   * Search and rank eligible candidates deterministically
   */
  rankCandidates(
    serviceType: ServiceType,
    taskLocation: LocationCoordinates,
    excludedIds: Set<string>
  ): DispatchCandidate[] {
    const eligible = this.getEligibleExecutors(serviceType, taskLocation, excludedIds);

    const candidates = eligible.map(({ executor, distanceKm }) =>
      this.scoreCandidate(executor, distanceKm, serviceType)
    );

    // Deterministic sort: higher totalScore first. Tie-break with distance (closer first), then reliability
    candidates.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return b.reliabilityScore - a.reliabilityScore;
    });

    return candidates;
  }

  /**
   * Initiate dispatch for a confirmed task
   */
  startDispatch(taskId: string): { success: boolean; attempt?: DispatchAttempt; error?: string } {
    const task = db.tasks.get(taskId);
    if (!task) return { success: false, error: 'TASK_NOT_FOUND' };

    if (task.status !== 'CONFIRMED' && task.status !== 'SEARCHING_EXECUTOR') {
      return { success: false, error: 'INVALID_TASK_STATE_FOR_DISPATCH' };
    }

    task.status = 'SEARCHING_EXECUTOR';
    task.updatedAt = new Date().toISOString();

    const excludedSet = new Set<string>();

    const rankedCandidates = this.rankCandidates(task.serviceType, task.pickupLocation, excludedSet);

    if (rankedCandidates.length === 0) {
      task.status = 'NO_EXECUTOR_AVAILABLE';
      db.addAuditEvent({
        actor: 'DISPATCH_ENGINE',
        actorId: 'engine',
        action: 'NO_EXECUTOR_AVAILABLE',
        resourceType: 'TASK',
        resourceId: task.id,
        metadata: { serviceType: task.serviceType, location: task.pickupLocation },
        result: 'FAILURE',
      });
      return { success: false, error: 'NO_EXECUTOR_AVAILABLE' };
    }

    // Create Dispatch Attempt
    const attemptId = `disp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const firstCandidate = rankedCandidates[0];

    const attempt: DispatchAttempt = {
      id: attemptId,
      taskId: task.id,
      attemptNumber: 1,
      status: 'OFFER_SENT',
      candidateExecutorIds: rankedCandidates.map((c) => c.executorId),
      rankedCandidates,
      excludedExecutorIds: [],
      currentExecutorId: firstCandidate.executorId,
      offerSentAt: new Date().toISOString(),
      responseDeadline: new Date(Date.now() + 60000).toISOString(), // 60s timeout
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.dispatchAttempts.set(attempt.id, attempt);
    task.dispatchAttemptId = attempt.id;
    task.status = 'OFFER_SENT';

    db.addAuditEvent({
      actor: 'DISPATCH_ENGINE',
      actorId: 'engine',
      action: 'DISPATCH_ATTEMPT_CREATED',
      resourceType: 'DISPATCH',
      resourceId: attempt.id,
      metadata: {
        taskId: task.id,
        selectedExecutorId: firstCandidate.executorId,
        score: firstCandidate.totalScore,
        candidatesCount: rankedCandidates.length,
      },
      result: 'SUCCESS',
    });

    return { success: true, attempt };
  }

  /**
   * Handle executor response: ACCEPT, REJECT, or TIMEOUT
   */
  handleExecutorResponse(
    attemptId: string,
    executorId: string,
    response: 'ACCEPT' | 'REJECT' | 'TIMEOUT'
  ): { success: boolean; task?: Task; nextAttempt?: DispatchAttempt; error?: string } {
    const attempt = db.dispatchAttempts.get(attemptId);
    if (!attempt) return { success: false, error: 'DISPATCH_ATTEMPT_NOT_FOUND' };

    const task = db.tasks.get(attempt.taskId);
    if (!task) return { success: false, error: 'TASK_NOT_FOUND' };

    if (attempt.currentExecutorId !== executorId) {
      return { success: false, error: 'EXECUTOR_NOT_CURRENT_CANDIDATE' };
    }

    if (response === 'ACCEPT') {
      // Concurrency check before final assignment:
      const executor = db.executors.get(executorId);
      if (!executor || executor.kycStatus !== 'KYC_APPROVED' || !executor.isAvailable) {
        return { success: false, error: 'EXECUTOR_NO_LONGER_ELIGIBLE' };
      }
      if (executor.activeTasksCount >= executor.maxConcurrentTasks) {
        return { success: false, error: 'EXECUTOR_BUSY_CONFLICT' };
      }

      // Assign Executor
      executor.activeTasksCount += 1;
      attempt.status = 'ACCEPTED';
      attempt.response = 'ACCEPT';
      attempt.updatedAt = new Date().toISOString();

      task.status = 'EXECUTOR_ASSIGNED';
      task.assignedExecutorId = executor.id;
      task.assignedExecutorName = executor.name;
      task.assignedExecutorPhone = executor.phone;
      task.updatedAt = new Date().toISOString();

      // Generate 4-digit verification code for completion if not already set
      if (!task.verificationCode) {
        task.verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
      }

      db.addAuditEvent({
        actor: 'EXECUTOR',
        actorId: executor.id,
        action: 'EXECUTOR_ACCEPTED',
        resourceType: 'TASK',
        resourceId: task.id,
        metadata: { attemptId: attempt.id, executorName: executor.name },
        result: 'SUCCESS',
      });

      return { success: true, task };
    }

    // If REJECT or TIMEOUT:
    // 1. Exclude this executor from this attempt permanently
    attempt.excludedExecutorIds.push(executorId);
    attempt.response = response;

    db.addAuditEvent({
      actor: 'EXECUTOR',
      actorId: executorId,
      action: response === 'REJECT' ? 'EXECUTOR_REJECTED' : 'EXECUTOR_TIMEOUT',
      resourceType: 'DISPATCH',
      resourceId: attempt.id,
      metadata: { taskId: task.id, excludedExecutorId: executorId },
      result: 'SUCCESS',
    });

    // 2. Search remaining eligible executors excluding already excluded
    const excludedSet = new Set(attempt.excludedExecutorIds);
    const nextCandidates = this.rankCandidates(task.serviceType, task.pickupLocation, excludedSet);

    if (nextCandidates.length === 0) {
      attempt.status = 'NO_CANDIDATES';
      attempt.failureReason = 'ALL_CANDIDATES_EXHAUSTED';
      task.status = 'NO_EXECUTOR_AVAILABLE';
      task.updatedAt = new Date().toISOString();

      db.addAuditEvent({
        actor: 'DISPATCH_ENGINE',
        actorId: 'engine',
        action: 'NO_EXECUTOR_AVAILABLE',
        resourceType: 'TASK',
        resourceId: task.id,
        metadata: { attemptId: attempt.id, exhaustedCount: attempt.excludedExecutorIds.length },
        result: 'FAILURE',
      });

      return { success: true, task };
    }

    // 3. Next candidate gets offer
    const nextCandidate = nextCandidates[0];
    attempt.attemptNumber += 1;
    attempt.currentExecutorId = nextCandidate.executorId;
    attempt.offerSentAt = new Date().toISOString();
    attempt.responseDeadline = new Date(Date.now() + 60000).toISOString();
    attempt.status = 'OFFER_SENT';
    attempt.rankedCandidates = nextCandidates;
    attempt.updatedAt = new Date().toISOString();

    task.status = 'OFFER_SENT';
    task.updatedAt = new Date().toISOString();

    db.addAuditEvent({
      actor: 'DISPATCH_ENGINE',
      actorId: 'engine',
      action: 'OFFER_SENT_NEXT_CANDIDATE',
      resourceType: 'DISPATCH',
      resourceId: attempt.id,
      metadata: {
        taskId: task.id,
        nextExecutorId: nextCandidate.executorId,
        score: nextCandidate.totalScore,
      },
      result: 'SUCCESS',
    });

    return { success: true, task, nextAttempt: attempt };
  }

  /**
   * User cancels current executor assignment before task completion
   * Reassigns to next eligible candidate
   */
  cancelExecutorAndReassign(
    taskId: string,
    reason: string
  ): { success: boolean; task?: Task; nextAttempt?: DispatchAttempt; error?: string } {
    const task = db.tasks.get(taskId);
    if (!task) return { success: false, error: 'TASK_NOT_FOUND' };

    if (!task.assignedExecutorId) {
      return { success: false, error: 'NO_ASSIGNED_EXECUTOR_TO_CANCEL' };
    }

    const previousExecutorId = task.assignedExecutorId;
    const prevExecutor = db.executors.get(previousExecutorId);
    if (prevExecutor && prevExecutor.activeTasksCount > 0) {
      prevExecutor.activeTasksCount -= 1;
    }

    task.cancellationReason = reason;

    // Get current attempt or create one
    let attempt = task.dispatchAttemptId ? db.dispatchAttempts.get(task.dispatchAttemptId) : null;
    const excludedIds = attempt ? new Set(attempt.excludedExecutorIds) : new Set<string>();
    excludedIds.add(previousExecutorId);

    db.addAuditEvent({
      actor: 'USER',
      actorId: task.userId,
      action: 'USER_CANCELLED_EXECUTOR_ASSIGNMENT',
      resourceType: 'TASK',
      resourceId: task.id,
      metadata: { previousExecutorId, reason },
      result: 'SUCCESS',
    });

    // Search next eligible executor
    const nextCandidates = this.rankCandidates(task.serviceType, task.pickupLocation, excludedIds);

    if (nextCandidates.length === 0) {
      task.status = 'NO_EXECUTOR_AVAILABLE';
      task.assignedExecutorId = undefined;
      task.assignedExecutorName = undefined;
      task.assignedExecutorPhone = undefined;
      task.updatedAt = new Date().toISOString();

      return { success: true, task };
    }

    // Create a new or advanced dispatch attempt
    const newAttemptId = `disp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nextCandidate = nextCandidates[0];

    const newAttempt: DispatchAttempt = {
      id: newAttemptId,
      taskId: task.id,
      attemptNumber: (attempt ? attempt.attemptNumber : 0) + 1,
      status: 'OFFER_SENT',
      candidateExecutorIds: nextCandidates.map((c) => c.executorId),
      rankedCandidates: nextCandidates,
      excludedExecutorIds: Array.from(excludedIds),
      currentExecutorId: nextCandidate.executorId,
      offerSentAt: new Date().toISOString(),
      responseDeadline: new Date(Date.now() + 60000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.dispatchAttempts.set(newAttempt.id, newAttempt);
    task.dispatchAttemptId = newAttempt.id;
    task.assignedExecutorId = undefined;
    task.assignedExecutorName = undefined;
    task.assignedExecutorPhone = undefined;
    task.status = 'OFFER_SENT';
    task.updatedAt = new Date().toISOString();

    db.addAuditEvent({
      actor: 'DISPATCH_ENGINE',
      actorId: 'engine',
      action: 'DISPATCH_REASSIGNMENT_STARTED',
      resourceType: 'DISPATCH',
      resourceId: newAttempt.id,
      metadata: {
        taskId: task.id,
        nextExecutorId: nextCandidate.executorId,
        excluded: Array.from(excludedIds),
      },
      result: 'SUCCESS',
    });

    return { success: true, task, nextAttempt: newAttempt };
  }
}

export const dispatchEngine = new DispatchEngine();
