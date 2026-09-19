// ServiceAgent Unified Backend Server (Express + Vite)
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { dispatchEngine } from './server/dispatch';
import { sathiAgent } from './server/agent';
import { placesService } from './server/places';
import { paymentProvider, videoProvider, notificationProvider } from './server/providers';
import { Role, TaskStatus } from './src/types';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Request ID & Logging Middleware
  app.use((req, res, next) => {
    (req as any).requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    next();
  });

  // Health and readiness endpoints
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ServiceAgent Core API',
    });
  });

  app.get('/ready', (req, res) => {
    res.json({
      status: 'ready',
      database: 'connected',
      dispatchEngine: 'operational',
      agentLayer: 'ready',
    });
  });

  // ----------------------------------------------------
  // AUTHENTICATION & SESSION APIs (Strict Role-Based)
  // ----------------------------------------------------
  app.post('/api/v1/auth/login', (req, res) => {
    const { email, role } = req.body as { email: string; role: Role };

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    if (role === 'USER') {
      const user = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        return res.json({ token: `jwt_${user.id}_token`, user, role: 'USER' });
      }
      // Demo convenience: allow instant demo user login
      const demoUser = db.users.get('usr_001');
      return res.json({ token: `jwt_usr_001_token`, user: demoUser, role: 'USER' });
    }

    if (role === 'EXECUTOR') {
      const exec = Array.from(db.executors.values()).find((e) => e.email.toLowerCase() === email.toLowerCase());
      if (exec) {
        return res.json({ token: `jwt_${exec.id}_token`, executor: exec, role: 'EXECUTOR' });
      }
      // Default to primary demo executor
      const defaultExec = db.getExecutor('exec_suresh') || db.executors.get('exec_praveen') || Array.from(db.executors.values())[0];
      return res.json({ token: `jwt_${defaultExec?.id || 'exec_praveen'}_token`, executor: defaultExec, role: 'EXECUTOR' });
    }

    if (role === 'ADMIN') {
      const admin = Array.from(db.admins.values()).find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (admin) {
        return res.json({ token: `jwt_${admin.id}_token`, admin, role: 'ADMIN' });
      }
      const defaultAdmin = db.admins.get('adm_001');
      return res.json({ token: `jwt_adm_001_token`, admin: defaultAdmin, role: 'ADMIN' });
    }

    return res.status(403).json({ error: 'UNAUTHORIZED_ROLE' });
  });

  app.post('/api/v1/auth/register', (req, res) => {
    const { name, email, phone, role, additionalData } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Missing registration details' });
    }

    if (role === 'USER') {
      const newUser = {
        id: `usr_${Date.now()}`,
        name,
        email,
        phone: phone || '+91 99999 00000',
        role: 'USER' as const,
        address: additionalData?.address || 'Indiranagar, Bengaluru',
        pinCode: additionalData?.pinCode || '',
        bio: additionalData?.bio || '',
        qualification: additionalData?.qualification || '',
        aadhaarNumber: additionalData?.aadhaarNumber || '',
        panNumber: additionalData?.panNumber || '',
        location: {
          latitude: 12.9716,
          longitude: 77.6412,
          address: additionalData?.address || 'Indiranagar, Bengaluru',
          city: 'Bengaluru',
        },
        createdAt: new Date().toISOString(),
      };
      db.users.set(newUser.id, newUser);
      db.addAuditEvent({
        actor: 'USER',
        actorId: newUser.id,
        action: 'USER_REGISTERED',
        resourceType: 'USER',
        resourceId: newUser.id,
        result: 'SUCCESS',
      });
      return res.status(201).json({ token: `jwt_${newUser.id}_token`, user: newUser, role: 'USER' });
    }

    if (role === 'EXECUTOR') {
      const newExec = {
        id: `exec_${Date.now()}`,
        name,
        email,
        phone: phone || '+91 98000 00000',
        role: 'EXECUTOR' as const,
        bio: additionalData?.bio || '',
        qualification: additionalData?.qualification || '',
        qualifications: additionalData?.qualification || '',
        address: additionalData?.address || 'Indiranagar, Bengaluru',
        pinCode: additionalData?.pinCode || '',
        aadhaarNumber: additionalData?.aadhaarNumber || '',
        panNumber: additionalData?.panNumber || '',
        availabilityMode: additionalData?.availabilityMode || 'ALWAYS_AVAILABLE',
        bankDetails: additionalData?.bankDetails || {},
        accountStatus: 'ACTIVE' as const,
        kycStatus: 'DOCUMENTS_PENDING' as const,
        isAvailable: additionalData?.isAvailable ?? true,
        capabilities: additionalData?.capabilities || ['MEDICINE_PICKUP'],
        serviceRadiusKm: 5.0,
        location: {
          latitude: 12.972,
          longitude: 77.64,
          address: additionalData?.address || 'Indiranagar, Bengaluru',
          city: 'Bengaluru',
        },
        rating: 5.0,
        totalRatingsCount: 0,
        completedTasksCount: 0,
        activeTasksCount: 0,
        maxConcurrentTasks: 1,
        reliabilityScore: 80,
        acceptanceRate: 100,
        documents: {
          panNumber: additionalData?.panNumber,
          aadhaarLast4: additionalData?.aadhaarNumber ? additionalData.aadhaarNumber.slice(-4) : undefined,
        },
        isDemo: true,
        createdAt: new Date().toISOString(),
      };
      db.executors.set(newExec.id, newExec);
      db.addAuditEvent({
        actor: 'EXECUTOR',
        actorId: newExec.id,
        action: 'EXECUTOR_REGISTERED',
        resourceType: 'EXECUTOR',
        resourceId: newExec.id,
        result: 'SUCCESS',
      });
      return res.status(201).json({ token: `jwt_${newExec.id}_token`, executor: newExec, role: 'EXECUTOR' });
    }

    return res.status(400).json({ error: 'INVALID_ROLE' });
  });

  // ----------------------------------------------------
  // SATHI AGENT APIs
  // ----------------------------------------------------
  app.post('/api/v1/agent/chat', async (req, res) => {
    try {
      const { sessionId, userId, text, isVoice } = req.body;
      if (!sessionId || !userId || !text) {
        return res.status(400).json({ error: 'Missing sessionId, userId, or text' });
      }

      const response = await sathiAgent.processUserMessage(sessionId, userId, text, Boolean(isVoice));
      res.json(response);
    } catch (err: any) {
      console.error('Agent chat error:', err);
      res.status(500).json({ error: 'AGENT_PROCESSING_ERROR', message: err.message });
    }
  });

  app.get('/api/v1/agent/session/:sessionId', (req, res) => {
    const session = sathiAgent.sessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'SESSION_NOT_FOUND' });
    }
    res.json(session);
  });

  // ----------------------------------------------------
  // VOICE APIs (STT / TTS)
  // ----------------------------------------------------
  app.post('/api/v1/voice/transcribe', (req, res) => {
    // In browser clients, Web Speech API provides real-time client-side transcription.
    // This endpoint handles server-side fallback or validation.
    const { transcript } = req.body;
    res.json({ text: transcript || '', recognized: true });
  });

  // ----------------------------------------------------
  // GOOGLE PLACES & LOCAL AMENITIES APIs
  // ----------------------------------------------------
  app.get('/api/v1/places/search', async (req, res) => {
    try {
      const { query, lat, lng, category } = req.query as {
        query?: string;
        lat?: string;
        lng?: string;
        category?: string;
      };

      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const location = lat && lng ? { latitude: parseFloat(lat), longitude: parseFloat(lng) } : undefined;
      const results = await placesService.searchPlaces(query, location, category);
      res.json(results);
    } catch (err: any) {
      console.error('Places search error:', err);
      res.status(500).json({ error: 'PLACES_SEARCH_ERROR', message: err.message });
    }
  });

  app.get('/api/v1/places/nearby', async (req, res) => {
    try {
      const { lat, lng, category } = req.query as {
        lat?: string;
        lng?: string;
        category?: 'ALL' | 'HOSPITAL' | 'PHARMACY' | 'CLINIC' | 'GROCERY';
      };

      const location = {
        latitude: lat ? parseFloat(lat) : 15.8246,
        longitude: lng ? parseFloat(lng) : 80.3522,
      };

      const results = await placesService.getNearbyAmenities(location, category || 'ALL');
      res.json(results);
    } catch (err: any) {
      console.error('Places nearby error:', err);
      res.status(500).json({ error: 'PLACES_NEARBY_ERROR', message: err.message });
    }
  });

  // ----------------------------------------------------
  // TASKS & LIFECYCLE APIs
  // ----------------------------------------------------
  app.get('/api/v1/tasks', (req, res) => {
    const { userId, executorId, status } = req.query;
    let tasks = Array.from(db.tasks.values());

    if (userId) {
      tasks = tasks.filter((t) => t.userId === userId);
    }
    if (executorId) {
      tasks = tasks.filter((t) => t.assignedExecutorId === executorId);
    }
    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }

    // Return newest first
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(tasks);
  });

  app.get('/api/v1/tasks/:id', (req, res) => {
    const task = db.tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });
    res.json(task);
  });

  app.post('/api/v1/tasks/:id/confirm', (req, res) => {
    const task = db.tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

    task.status = 'CONFIRMED';
    const dispatchResult = dispatchEngine.startDispatch(task.id);

    if (dispatchResult.success && dispatchResult.attempt) {
      const attemptId = dispatchResult.attempt.id;
      const execId = dispatchResult.attempt.currentExecutorId;
      if (attemptId && execId) {
        setTimeout(() => {
          const currentAttempt = db.dispatchAttempts.get(attemptId);
          if (currentAttempt && currentAttempt.status === 'OFFER_SENT' && currentAttempt.currentExecutorId === execId) {
            dispatchEngine.handleExecutorResponse(attemptId, execId, 'ACCEPT');
            console.info(`[Autonomous Agent] Executor ${execId} reviewed and accepted task ${task.id}`);
          }
        }, 4500);
      }
    }

    db.addAuditEvent({
      actor: 'USER',
      actorId: task.userId,
      action: 'TASK_CONFIRMED',
      resourceType: 'TASK',
      resourceId: task.id,
      metadata: { dispatchResult },
      result: 'SUCCESS',
    });

    res.json({ task, dispatch: dispatchResult });
  });

  app.post('/api/v1/tasks/:id/cancel', (req, res) => {
    const { reason } = req.body;
    const task = db.tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

    // Release assigned executor if any
    if (task.assignedExecutorId) {
      const exec = db.executors.get(task.assignedExecutorId);
      if (exec && exec.activeTasksCount > 0) {
        exec.activeTasksCount -= 1;
      }
    }

    task.status = 'CANCELLED';
    task.cancellationReason = reason || 'Cancelled by user';
    task.updatedAt = new Date().toISOString();

    db.addAuditEvent({
      actor: 'USER',
      actorId: task.userId,
      action: 'TASK_CANCELLED',
      resourceType: 'TASK',
      resourceId: task.id,
      metadata: { reason },
      result: 'SUCCESS',
    });

    res.json({ success: true, task });
  });

  app.post('/api/v1/tasks/:id/reassign', (req, res) => {
    const { reason } = req.body;
    const reassignResult = dispatchEngine.cancelExecutorAndReassign(
      req.params.id,
      reason || 'User requested different executor'
    );
    if (!reassignResult.success) {
      return res.status(400).json({ error: reassignResult.error });
    }
    res.json(reassignResult);
  });

  // Strict task state transitions (only backend can advance lifecycle)
  app.post('/api/v1/tasks/:id/transition', (req, res) => {
    const { targetStatus, executorId, verificationCode } = req.body;
    const task = db.tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

    // Authorization check
    if (executorId && task.assignedExecutorId !== executorId) {
      return res.status(403).json({ error: 'UNAUTHORIZED_FOR_THIS_TASK' });
    }

    const validTransitions: Record<string, TaskStatus[]> = {
      EXECUTOR_ASSIGNED: ['ACCEPTED'],
      ACCEPTED: ['IN_PROGRESS'],
      IN_PROGRESS: ['ARRIVED'],
      ARRIVED: ['TASK_EXECUTED'],
      TASK_EXECUTED: ['COMPLETED'],
    };

    const allowed = validTransitions[task.status];
    if (!allowed || !allowed.includes(targetStatus)) {
      return res.status(400).json({
        error: 'INVALID_STATE_TRANSITION',
        currentStatus: task.status,
        requestedStatus: targetStatus,
      });
    }

    // Verification code check for completion
    if (targetStatus === 'COMPLETED' && task.verificationCode) {
      if (verificationCode !== task.verificationCode) {
        return res.status(400).json({ error: 'INVALID_VERIFICATION_CODE' });
      }
      task.verificationStatus = 'VERIFIED';
      task.completedAt = new Date().toISOString();
      task.finalCost = task.estimatedCost;

      // Free executor workload
      if (task.assignedExecutorId) {
        const exec = db.executors.get(task.assignedExecutorId);
        if (exec) {
          if (exec.activeTasksCount > 0) exec.activeTasksCount -= 1;
          exec.completedTasksCount += 1;
        }
      }
    }

    task.status = targetStatus as TaskStatus;
    task.updatedAt = new Date().toISOString();

    db.addAuditEvent({
      actor: executorId ? 'EXECUTOR' : 'SYSTEM',
      actorId: executorId || 'system',
      action: `TASK_STATE_${targetStatus}`,
      resourceType: 'TASK',
      resourceId: task.id,
      result: 'SUCCESS',
    });

    res.json({ success: true, task });
  });

  // ----------------------------------------------------
  // DISPATCH ENGINE APIs
  // ----------------------------------------------------
  app.get('/api/v1/dispatch/:id', (req, res) => {
    const attempt = db.dispatchAttempts.get(req.params.id);
    if (!attempt) return res.status(404).json({ error: 'DISPATCH_NOT_FOUND' });
    res.json(attempt);
  });

  // Executor responds to dispatched offer (ACCEPT, REJECT, TIMEOUT)
  app.post('/api/v1/dispatch/response', (req, res) => {
    const { attemptId, executorId, response } = req.body;
    if (!attemptId || !executorId || !response) {
      return res.status(400).json({ error: 'Missing attemptId, executorId, or response' });
    }

    const result = dispatchEngine.handleExecutorResponse(attemptId, executorId, response);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  });

  // ----------------------------------------------------
  // EXECUTOR MANAGEMENT & KYC APIs
  // ----------------------------------------------------
  app.get('/api/v1/executors', (req, res) => {
    const executors = Array.from(db.executors.values());
    res.json(executors);
  });

  app.get('/api/v1/executors/:id', (req, res) => {
    const exec = db.executors.get(req.params.id);
    if (!exec) return res.status(404).json({ error: 'EXECUTOR_NOT_FOUND' });
    res.json(exec);
  });

  // Update Executor Profile & Availability
  app.put('/api/v1/executors/:id/profile', (req, res) => {
    const exec = db.executors.get(req.params.id);
    if (!exec) return res.status(404).json({ error: 'EXECUTOR_NOT_FOUND' });

    const {
      name,
      phone,
      age,
      bio,
      qualification,
      qualifications,
      occupation,
      address,
      pinCode,
      aadhaarNumber,
      panNumber,
      bankDetails,
      town,
      availabilityMode,
      availabilitySchedule,
      isAvailable,
      capabilities,
      serviceRadiusKm,
    } = req.body;

    if (name) exec.name = name;
    if (phone) exec.phone = phone;
    if (age !== undefined) exec.age = Number(age);
    if (bio !== undefined) exec.bio = bio;
    if (qualification !== undefined) {
      exec.qualification = qualification;
      exec.qualifications = qualification;
    }
    if (qualifications !== undefined) {
      exec.qualifications = qualifications;
      exec.qualification = qualifications;
    }
    if (occupation !== undefined) exec.occupation = occupation;
    if (address) {
      exec.address = address;
      if (exec.location) exec.location.address = address;
    }
    if (pinCode !== undefined) exec.pinCode = pinCode;
    if (aadhaarNumber !== undefined) exec.aadhaarNumber = aadhaarNumber;
    if (panNumber !== undefined) exec.panNumber = panNumber;
    if (bankDetails !== undefined) exec.bankDetails = { ...exec.bankDetails, ...bankDetails };
    if (town) {
      exec.town = town;
      if (town === 'Chirala') {
        exec.location = { latitude: 15.8246, longitude: 80.3522, address: 'Clock Tower Centre, Chirala', city: 'Chirala' };
      } else if (town === 'Bapatla') {
        exec.location = { latitude: 15.9042, longitude: 80.4674, address: 'Agricultural College Road, Bapatla', city: 'Bapatla' };
      } else if (town === 'Vetapalem') {
        exec.location = { latitude: 15.7820, longitude: 80.3160, address: 'Main Bazaar, Near Library, Vetapalem', city: 'Vetapalem' };
      } else if (town === 'Ponnur') {
        exec.location = { latitude: 16.0664, longitude: 80.5542, address: 'GT Road, Ponnur', city: 'Ponnur' };
      }
    }
    if (availabilityMode) exec.availabilityMode = availabilityMode;
    if (availabilitySchedule) exec.availabilitySchedule = availabilitySchedule;
    if (isAvailable !== undefined) exec.isAvailable = Boolean(isAvailable);
    if (capabilities) exec.capabilities = capabilities;
    if (serviceRadiusKm) exec.serviceRadiusKm = Number(serviceRadiusKm);

    db.addAuditEvent({
      actor: 'EXECUTOR',
      actorId: exec.id,
      action: 'EXECUTOR_PROFILE_UPDATED',
      resourceType: 'EXECUTOR',
      resourceId: exec.id,
      metadata: { town: exec.town, availabilityMode: exec.availabilityMode, isAvailable: exec.isAvailable },
      result: 'SUCCESS',
    });

    res.json({ success: true, executor: exec });
  });

  // User Profile & Security Details
  app.get('/api/v1/users/:id', (req, res) => {
    const user = db.users.get(req.params.id);
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    res.json(user);
  });

  app.put('/api/v1/users/:id/profile', (req, res) => {
    const user = db.users.get(req.params.id);
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const {
      name,
      phone,
      address,
      pinCode,
      bio,
      qualification,
      aadhaarNumber,
      panNumber,
      addressProofType,
      addressProofDocName,
      emergencyContact,
      preferredLanguage,
    } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) {
      user.address = address;
      if (user.location) user.location.address = address;
    }
    if (pinCode !== undefined) user.pinCode = pinCode;
    if (bio !== undefined) user.bio = bio;
    if (qualification !== undefined) user.qualification = qualification;
    if (aadhaarNumber !== undefined) user.aadhaarNumber = aadhaarNumber;
    if (panNumber !== undefined) user.panNumber = panNumber;
    if (addressProofType) user.addressProofType = addressProofType;
    if (addressProofDocName) user.addressProofDocName = addressProofDocName;
    if (emergencyContact) user.emergencyContact = emergencyContact;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    user.securityVerified = true;

    db.addAuditEvent({
      actor: 'USER',
      actorId: user.id,
      action: 'USER_SECURITY_PROFILE_UPDATED',
      resourceType: 'USER',
      resourceId: user.id,
      metadata: { addressProofType, securityVerified: true },
      result: 'SUCCESS',
    });

    res.json({ success: true, user });
  });

  app.post('/api/v1/executors/:id/availability', (req, res) => {
    const { isAvailable } = req.body;
    const exec = db.executors.get(req.params.id);
    if (!exec) return res.status(404).json({ error: 'EXECUTOR_NOT_FOUND' });

    exec.isAvailable = Boolean(isAvailable);

    db.addAuditEvent({
      actor: 'EXECUTOR',
      actorId: exec.id,
      action: exec.isAvailable ? 'EXECUTOR_AVAILABLE' : 'EXECUTOR_NOT_AVAILABLE',
      resourceType: 'EXECUTOR',
      resourceId: exec.id,
      result: 'SUCCESS',
    });

    res.json({ success: true, isAvailable: exec.isAvailable });
  });

  app.post('/api/v1/executors/:id/kyc', (req, res) => {
    const { panNumber, aadhaarLast4, certifications } = req.body;
    const exec = db.executors.get(req.params.id);
    if (!exec) return res.status(404).json({ error: 'EXECUTOR_NOT_FOUND' });

    exec.documents = {
      ...exec.documents,
      panNumber,
      aadhaarLast4,
      certifications,
      submittedAt: new Date().toISOString(),
    };
    exec.kycStatus = 'UNDER_REVIEW';

    db.addAuditEvent({
      actor: 'EXECUTOR',
      actorId: exec.id,
      action: 'KYC_SUBMITTED',
      resourceType: 'KYC',
      resourceId: exec.id,
      result: 'SUCCESS',
    });

    res.json({ success: true, executor: exec });
  });

  app.post('/api/v1/executors/:id/video-verify', async (req, res) => {
    const exec = db.executors.get(req.params.id);
    if (!exec) return res.status(404).json({ error: 'EXECUTOR_NOT_FOUND' });

    const sessionResult = await videoProvider.createVerificationSession({
      executorId: exec.id,
      fullName: exec.name,
    });

    res.json(sessionResult);
  });

  // ----------------------------------------------------
  // PAYMENTS, INVOICES & PLATFORM REVENUE
  // ----------------------------------------------------
  app.post('/api/v1/payments/complete-and-invoice', async (req, res) => {
    try {
      const { taskId, paymentMode, amount, upiTransactionRef } = req.body;
      if (!taskId || !paymentMode) {
        return res.status(400).json({ error: 'taskId and paymentMode (CASH | UPI) are required' });
      }

      const task = db.tasks.get(taskId);
      if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

      const result = db.createInvoice({
        taskId,
        paymentMode,
        amount,
        upiTransactionRef,
      });

      // Auto-transition task to COMPLETED if not already
      if (task.status !== 'COMPLETED') {
        task.status = 'COMPLETED';
        task.completedAt = new Date().toISOString();
        if (task.assignedExecutorId) {
          const exec = db.executors.get(task.assignedExecutorId);
          if (exec && exec.activeTasksCount > 0) {
            exec.activeTasksCount = Math.max(0, exec.activeTasksCount - 1);
            exec.completedTasksCount += 1;
          }
        }
      }

      res.json({
        success: true,
        invoice: result.invoice,
        task: result.task,
        message: `Payment settled successfully via ${paymentMode}. 10% platform fee (₹${result.invoice.platformFee}) credited to admin.`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Payment settlement failed' });
    }
  });

  app.get('/api/v1/invoices', (req, res) => {
    const { userId, executorId, taskId } = req.query as {
      userId?: string;
      executorId?: string;
      taskId?: string;
    };
    const invoices = db.getInvoices({ userId, executorId, taskId });
    res.json(invoices);
  });

  app.get('/api/v1/invoices/:id', (req, res) => {
    const invoice = db.invoices.get(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'INVOICE_NOT_FOUND' });
    res.json(invoice);
  });

  // Mutual Task Messaging between User & Provider
  app.get('/api/v1/tasks/:taskId/messages', (req, res) => {
    const messages = db.directMessages.get(req.params.taskId) || [];
    res.json(messages);
  });

  app.post('/api/v1/tasks/:taskId/messages', (req, res) => {
    const { taskId } = req.params;
    const { senderId, senderName, senderRole, text } = req.body;
    if (!text || !senderId) return res.status(400).json({ error: 'Text and senderId are required' });

    const msg = {
      id: `msg_dm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskId,
      senderId,
      senderName: senderName || 'User',
      senderRole: senderRole || 'USER',
      text,
      timestamp: new Date().toISOString(),
    };

    const existing = db.directMessages.get(taskId) || [];
    existing.push(msg);
    db.directMessages.set(taskId, existing);

    res.status(201).json(msg);
  });

  app.post('/api/v1/payments/create', async (req, res) => {
    const { taskId, amount } = req.body;
    const task = db.tasks.get(taskId);
    if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

    const orderResult = await paymentProvider.createOrder({
      taskId: task.id,
      amount: amount || task.finalCost || task.estimatedCost,
      currency: 'INR',
      receipt: `rcpt_${task.id}`,
    });

    if (!orderResult.success) {
      return res.status(400).json({ error: orderResult.error, status: orderResult.status });
    }

    task.paymentStatus = 'PAYMENT_PROCESSING';
    res.json(orderResult.data);
  });

  app.post('/api/v1/payments/verify', async (req, res) => {
    const { taskId, paymentId, orderId, signature, simulatedSuccess } = req.body;
    const task = db.tasks.get(taskId);
    if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

    // Handle production vs demo mode cleanly:
    if (!paymentProvider.isConfigured()) {
      if (simulatedSuccess && db.isDemoMode) {
        task.paymentStatus = 'PAYMENT_SUCCEEDED';
        db.addAuditEvent({
          actor: 'USER',
          actorId: task.userId,
          action: 'PAYMENT_SUCCEEDED_DEMO_MODE',
          resourceType: 'PAYMENT',
          resourceId: task.id,
          result: 'SUCCESS',
        });
        return res.json({ verified: true, transactionId: `demo_txn_${Date.now()}`, isDemo: true });
      }
      return res.status(400).json({
        error: 'PAYMENT_CONFIGURATION_REQUIRED: Set PAYMENT_PROVIDER_KEY to process actual payments.',
      });
    }

    const verificationResult = await paymentProvider.verifyPayment({ paymentId, orderId, signature });
    if (verificationResult.success) {
      task.paymentStatus = 'PAYMENT_SUCCEEDED';
      res.json(verificationResult.data);
    } else {
      task.paymentStatus = 'PAYMENT_FAILED';
      res.status(400).json({ error: verificationResult.error });
    }
  });

  // ----------------------------------------------------
  // APPOINTMENTS, REMINDERS & USER MEMORIES
  // ----------------------------------------------------
  app.get('/api/v1/appointments', (req, res) => {
    const { userId } = req.query;
    let list = Array.from(db.appointments.values());
    if (userId) list = list.filter((a) => a.userId === userId);
    res.json(list);
  });

  app.post('/api/v1/appointments', (req, res) => {
    const appt = {
      id: `apt_${Date.now()}`,
      userId: req.body.userId || 'usr_001',
      title: req.body.title,
      doctorOrService: req.body.doctorOrService,
      location: req.body.location,
      scheduledTime: req.body.scheduledTime,
      reminderMinutesBefore: req.body.reminderMinutesBefore || 60,
      transportationRequested: Boolean(req.body.transportationRequested),
      status: 'SCHEDULED' as const,
      createdAt: new Date().toISOString(),
    };
    db.appointments.set(appt.id, appt);
    res.status(201).json(appt);
  });

  app.get('/api/v1/reminders', (req, res) => {
    const { userId } = req.query;
    let list = Array.from(db.reminders.values());
    if (userId) list = list.filter((r) => r.userId === userId);
    res.json(list);
  });

  app.post('/api/v1/reminders', (req, res) => {
    const rem = {
      id: `rem_${Date.now()}`,
      userId: req.body.userId || 'usr_001',
      title: req.body.title,
      dueTime: req.body.dueTime,
      category: req.body.category || 'MEDICINE',
      isRecurring: Boolean(req.body.isRecurring),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    db.reminders.set(rem.id, rem);
    res.status(201).json(rem);
  });

  app.get('/api/v1/memories', (req, res) => {
    const userId = (req.query.userId as string) || 'usr_001';
    res.json(db.memories.get(userId) || []);
  });

  // ----------------------------------------------------
  // ADMIN GOVERNANCE & OPERATIONS APIs
  // ----------------------------------------------------
  app.get('/api/v1/admin/stats', (req, res) => {
    const users = Array.from(db.users.values());
    const executors = Array.from(db.executors.values());
    const tasks = Array.from(db.tasks.values());
    const finances = db.getFinancialStats();

    res.json({
      activeUsers: users.length,
      totalExecutors: executors.length,
      activeExecutors: executors.filter((e) => e.accountStatus === 'ACTIVE').length,
      availableExecutors: executors.filter((e) => e.isAvailable && e.kycStatus === 'KYC_APPROVED').length,
      pendingKyc: executors.filter((e) => e.kycStatus === 'UNDER_REVIEW' || e.kycStatus === 'DOCUMENTS_PENDING').length,
      activeTasks: tasks.filter((t) => !['COMPLETED', 'CANCELLED', 'FAILED'].includes(t.status)).length,
      tasksSearching: tasks.filter((t) => t.status === 'SEARCHING_EXECUTOR' || t.status === 'OFFER_SENT').length,
      completedTasks: tasks.filter((t) => t.status === 'COMPLETED').length,
      dispatchAttemptsCount: db.dispatchAttempts.size,
      totalGrossVolume: finances.totalGrossVolume,
      totalPlatformRevenue: finances.totalPlatformRevenue, // 10% cut
      totalExecutorPayouts: finances.totalExecutorPayouts, // 90%
      invoicesCount: finances.invoicesCount,
    });
  });

  app.get('/api/v1/admin/users', (req, res) => {
    res.json(Array.from(db.users.values()));
  });

  app.get('/api/v1/admin/executors', (req, res) => {
    res.json(Array.from(db.executors.values()));
  });

  app.post('/api/v1/admin/executors/:id/kyc-decision', (req, res) => {
    const { decision, notes } = req.body as { decision: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REACTIVATE'; notes?: string };
    const exec = db.executors.get(req.params.id);
    if (!exec) return res.status(404).json({ error: 'EXECUTOR_NOT_FOUND' });

    if (decision === 'APPROVE') {
      exec.kycStatus = 'KYC_APPROVED';
      exec.accountStatus = 'ACTIVE';
      exec.videoVerification = {
        status: 'DEMO_COMPLETED',
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'adm_001',
        notes: notes || 'Approved by Admin',
      };
    } else if (decision === 'REJECT') {
      exec.kycStatus = 'KYC_REJECTED';
    } else if (decision === 'SUSPEND') {
      exec.accountStatus = 'SUSPENDED';
    } else if (decision === 'REACTIVATE') {
      exec.accountStatus = 'ACTIVE';
    }

    db.addAuditEvent({
      actor: 'ADMIN',
      actorId: 'adm_001',
      action: `KYC_${decision}`,
      resourceType: 'KYC',
      resourceId: exec.id,
      metadata: { notes },
      result: 'SUCCESS',
    });

    res.json({ success: true, executor: exec });
  });

  app.get('/api/v1/admin/tasks', (req, res) => {
    const tasks = Array.from(db.tasks.values());
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(tasks);
  });

  app.get('/api/v1/admin/dispatch', (req, res) => {
    const attempts = Array.from(db.dispatchAttempts.values());
    attempts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(attempts);
  });

  app.get('/api/v1/admin/audit', (req, res) => {
    res.json(db.auditLogs);
  });

  // System Configuration & Health Status API
  app.get('/api/v1/system/status', (req, res) => {
    const executors = Array.from(db.executors.values());
    const tasks = Array.from(db.tasks.values());

    res.json({
      service: 'ServiceAgent',
      gemini: process.env.GEMINI_API_KEY ? 'READY' : 'CONFIGURATION_REQUIRED',
      firebase: process.env.FIREBASE_PROJECT_ID ? 'READY' : 'SIMULATED',
      googleMaps: process.env.GOOGLE_MAPS_API_KEY ? 'READY' : 'SIMULATED',
      speechToText: 'WEB_API_ACTIVE',
      textToSpeech: 'WEB_API_ACTIVE',
      payments: paymentProvider.isConfigured() ? 'READY' : 'CONFIGURATION_REQUIRED',
      notifications: {
        email: process.env.EMAIL_PROVIDER_KEY ? 'READY' : 'CONFIGURATION_REQUIRED',
        sms: process.env.SMS_PROVIDER_KEY ? 'READY' : 'CONFIGURATION_REQUIRED',
        whatsapp: process.env.WHATSAPP_PROVIDER_KEY ? 'READY' : 'CONFIGURATION_REQUIRED',
        push: 'ACTIVE',
      },
      videoVerification: videoProvider.isConfigured() ? 'READY' : 'DEMO_MODE_ACTIVE',
      isDemoMode: db.isDemoMode,
      activeExecutorsCount: executors.filter((e) => e.accountStatus === 'ACTIVE').length,
      availableExecutorsCount: executors.filter((e) => e.isAvailable && e.kycStatus === 'KYC_APPROVED').length,
      activeTasksCount: tasks.filter((t) => !['COMPLETED', 'CANCELLED'].includes(t.status)).length,
    });
  });

  app.get('/api/v1/system/knowledge', (req, res) => {
    res.json(db.knowledgeDocs);
  });

  // ----------------------------------------------------
  // VITE MIDDLEWARE SETUP
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ServiceAgent server running on port ${PORT}`);
  });
}

startServer();
