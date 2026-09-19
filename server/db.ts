// In-Memory Database & State Repository for ServiceAgent
import {
  UserProfile,
  ExecutorProfile,
  AdminProfile,
  Task,
  DispatchAttempt,
  Appointment,
  Reminder,
  UserMemory,
  AuditEvent,
  KnowledgeDocument,
  SystemHealthStatus,
  Invoice,
  DirectMessage,
} from '../src/types';

class ServiceAgentDatabase {
  users: Map<string, UserProfile> = new Map();
  executors: Map<string, ExecutorProfile> = new Map();
  admins: Map<string, AdminProfile> = new Map();
  tasks: Map<string, Task> = new Map();
  dispatchAttempts: Map<string, DispatchAttempt> = new Map();
  appointments: Map<string, Appointment> = new Map();
  reminders: Map<string, Reminder> = new Map();
  memories: Map<string, UserMemory[]> = new Map(); // userId -> memories
  invoices: Map<string, Invoice> = new Map();
  directMessages: Map<string, DirectMessage[]> = new Map(); // taskId -> messages
  auditLogs: AuditEvent[] = [];
  knowledgeDocs: KnowledgeDocument[] = [];
  isDemoMode: boolean = true;

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    // 1. Seed Demo User with Full Security & Address Verification Details
    const demoUser: UserProfile = {
      id: 'usr_001',
      name: 'Kumar Reddy',
      email: 'kumar.reddy@example.com',
      phone: '+91 98765 43210',
      role: 'USER',
      address: 'Flat 201, Srinivasa Nilayam, Near Clock Tower, Chirala, Andhra Pradesh 523155',
      location: {
        latitude: 15.8246,
        longitude: 80.3522,
        address: 'Clock Tower Centre, Chirala, Andhra Pradesh 523155',
        landmark: 'Near Clock Tower & Railway Station Road',
        city: 'Chirala',
      },
      emergencyContact: {
        name: 'Priya Sharma (Daughter)',
        phone: '+91 98765 11223',
        relationship: 'Daughter',
      },
      aadhaarNumber: '4521 8892 8821',
      addressProofType: 'ELECTRICITY_BILL',
      addressProofDocName: 'APSPDCL_Electricity_Bill_Chirala.pdf',
      securityVerified: true,
      preferredLanguage: 'English',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    };
    this.users.set(demoUser.id, demoUser);

    // 2. Seed Demo Admin
    const demoAdmin: AdminProfile = {
      id: 'adm_001',
      name: 'Dr. Anand Varma',
      email: 'admin@serviceagent.org',
      role: 'ADMIN',
      permissions: ['ALL_ACCESS', 'KYC_APPROVE', 'DISPATCH_OVERRIDE', 'AUDIT_VIEW'],
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    };
    this.admins.set(demoAdmin.id, demoAdmin);

    // 3. Seed Four Default Verified Executors from Chirala, Bapatla, Vetapalem, and Ponnur
    // Executor 1: Praveen - From Chirala
    const executorPraveen: ExecutorProfile = {
      id: 'exec_praveen',
      name: 'Praveen',
      email: 'praveen@executors.net',
      phone: '+91 98480 12345',
      role: 'EXECUTOR',
      town: 'Chirala',
      age: 26,
      occupation: 'Emergency First Responder & Senior Escort',
      qualifications: 'B.Sc Nursing, Certified First Aid & Senior Care Escort',
      bio: 'Experienced healthcare escort and service specialist based in Chirala with 4+ years helping seniors and families with medicine pickups, groceries, and safe clinic accompaniment.',
      accountStatus: 'ACTIVE',
      kycStatus: 'KYC_APPROVED',
      isAvailable: true,
      availabilityMode: 'ALWAYS_AVAILABLE',
      availabilitySchedule: {
        startHour: 6,
        endHour: 23,
        label: "I'm Available Whenever (All Day Active)",
      },
      capabilities: ['MEDICINE_PICKUP', 'GROCERY_ASSISTANCE', 'TRANSPORTATION', 'HOSPITAL_ASSISTANCE', 'COMPANION', 'OTHER_SERVICE'],
      serviceRadiusKm: 25.0,
      location: {
        latitude: 15.8246,
        longitude: 80.3522,
        address: 'Clock Tower Centre, Chirala, Andhra Pradesh 523155',
        city: 'Chirala',
      },
      rating: 4.92,
      totalRatingsCount: 142,
      completedTasksCount: 156,
      activeTasksCount: 0,
      maxConcurrentTasks: 1,
      reliabilityScore: 98,
      acceptanceRate: 95,
      documents: {
        panNumber: 'ABCDE1234F',
        aadhaarLast4: '8892',
        idProofUrl: '/mock/docs/praveen_id.pdf',
        addressProofUrl: '/mock/docs/praveen_addr.pdf',
        certifications: ['Elder Care First-Aid Certified', 'Commercial Light Vehicle License'],
        submittedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
      videoVerification: {
        status: 'DEMO_COMPLETED',
        verifiedAt: new Date(Date.now() - 19 * 86400000).toISOString(),
        verifiedBy: 'adm_001',
        notes: 'Identity confirmed via live video session with biometric cross-check.',
      },
      isDemo: true,
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    };
    this.executors.set(executorPraveen.id, executorPraveen);

    // Executor 2: Kumar - From Bapatla
    const executorKumar: ExecutorProfile = {
      id: 'exec_kumar',
      name: 'Kumar',
      email: 'kumar@executors.net',
      phone: '+91 98481 23456',
      role: 'EXECUTOR',
      town: 'Bapatla',
      age: 29,
      occupation: 'Community Logistics Coordinator & Paratransit Driver',
      qualifications: 'Diploma in Automobile Tech, Defensive Driving Certified',
      bio: 'Punctual and reliable transit provider in Bapatla. Specializes in comfortable rides for clinic visits, grocery sourcing, and inter-town travel between Bapatla and Chirala.',
      accountStatus: 'ACTIVE',
      kycStatus: 'KYC_APPROVED',
      isAvailable: true,
      availabilityMode: 'SCHEDULED_HOURS',
      availabilitySchedule: {
        startHour: 16,
        endHour: 22,
        label: 'Evening 4:00 PM – 10:00 PM',
      },
      capabilities: ['TRANSPORTATION', 'GROCERY_ASSISTANCE', 'MEDICINE_PICKUP', 'COMPANION', 'OTHER_SERVICE'],
      serviceRadiusKm: 30.0,
      location: {
        latitude: 15.9042,
        longitude: 80.4674,
        address: 'Agricultural College Road, Bapatla, Andhra Pradesh 522101',
        city: 'Bapatla',
      },
      rating: 4.85,
      totalRatingsCount: 98,
      completedTasksCount: 104,
      activeTasksCount: 0,
      maxConcurrentTasks: 1,
      reliabilityScore: 96,
      acceptanceRate: 91,
      documents: {
        panNumber: 'FGHIJ5678K',
        aadhaarLast4: '4521',
        idProofUrl: '/mock/docs/kumar_id.pdf',
        addressProofUrl: '/mock/docs/kumar_addr.pdf',
        certifications: ['Defensive Driving Certified', 'Senior Companion Transit Certificate'],
        submittedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      videoVerification: {
        status: 'DEMO_COMPLETED',
        verifiedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        verifiedBy: 'adm_001',
        notes: 'Full verification approved.',
      },
      isDemo: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    };
    this.executors.set(executorKumar.id, executorKumar);

    // Executor 3: Vinay - From Vetapalem
    const executorVinay: ExecutorProfile = {
      id: 'exec_vinay',
      name: 'Vinay',
      email: 'vinay@executors.net',
      phone: '+91 98482 34567',
      role: 'EXECUTOR',
      town: 'Vetapalem',
      age: 24,
      occupation: 'Pharmacy Technician & Community Health Aide',
      qualifications: 'B.Pharmacy Graduate, First-Aid & Senior Care Aide',
      bio: 'Compassionate pharmacy technician from Vetapalem specializing in prescription verification, grocery assistance, and patient support for elders living independently.',
      accountStatus: 'ACTIVE',
      kycStatus: 'KYC_APPROVED',
      isAvailable: true,
      availabilityMode: 'ALWAYS_AVAILABLE',
      availabilitySchedule: {
        startHour: 7,
        endHour: 22,
        label: "I'm Available Whenever (All Day Active)",
      },
      capabilities: ['MEDICINE_PICKUP', 'GROCERY_ASSISTANCE', 'COMPANION', 'HOSPITAL_ASSISTANCE', 'OTHER_SERVICE'],
      serviceRadiusKm: 25.0,
      location: {
        latitude: 15.7820,
        longitude: 80.3160,
        address: 'Main Bazaar, Near Library, Vetapalem, Andhra Pradesh 523187',
        city: 'Vetapalem',
      },
      rating: 4.88,
      totalRatingsCount: 88,
      completedTasksCount: 88,
      activeTasksCount: 0,
      maxConcurrentTasks: 1,
      reliabilityScore: 95,
      acceptanceRate: 93,
      documents: {
        panNumber: 'KLMNO9012P',
        aadhaarLast4: '7731',
        certifications: ['Pharmacy Dispensing Certified', 'Basic Life Support (BLS)'],
        submittedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      videoVerification: {
        status: 'DEMO_COMPLETED',
        verifiedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      },
      isDemo: true,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    };
    this.executors.set(executorVinay.id, executorVinay);

    // Executor 4: Sai - From Ponnur
    const executorSai: ExecutorProfile = {
      id: 'exec_sai',
      name: 'Sai',
      email: 'sai@executors.net',
      phone: '+91 98483 45678',
      role: 'EXECUTOR',
      town: 'Ponnur',
      age: 27,
      occupation: 'Social Care Worker & Certified Mobility Assistant',
      qualifications: 'Master of Social Work (MSW), Certified Mobility Assistant',
      bio: 'Professional social care assistant in Ponnur with deep commitment to dignified elder support, clinic visits, and scheduled evening shopping or errands.',
      accountStatus: 'ACTIVE',
      kycStatus: 'KYC_APPROVED',
      isAvailable: true,
      availabilityMode: 'SCHEDULED_HOURS',
      availabilitySchedule: {
        startHour: 16,
        endHour: 22,
        label: 'Evening 4:00 PM – 10:00 PM',
      },
      capabilities: ['TRANSPORTATION', 'HOSPITAL_ASSISTANCE', 'COMPANION', 'MEDICINE_PICKUP', 'OTHER_SERVICE'],
      serviceRadiusKm: 40.0,
      location: {
        latitude: 16.0664,
        longitude: 80.5542,
        address: 'GT Road, Near Sakshi Ganapathi Temple, Ponnur, Andhra Pradesh 522124',
        city: 'Ponnur',
      },
      rating: 4.80,
      totalRatingsCount: 72,
      completedTasksCount: 72,
      activeTasksCount: 0,
      maxConcurrentTasks: 1,
      reliabilityScore: 92,
      acceptanceRate: 89,
      documents: {
        panNumber: 'PQRST3456U',
        aadhaarLast4: '3341',
        submittedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
      videoVerification: {
        status: 'DEMO_COMPLETED',
        verifiedAt: new Date(Date.now() - 11 * 86400000).toISOString(),
      },
      isDemo: true,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    };
    this.executors.set(executorSai.id, executorSai);

    // Executor D: Vikas Patel - Pending KYC (Cannot be dispatched)
    const executorD: ExecutorProfile = {
      id: 'exec_vikas',
      name: 'Vikas Patel',
      email: 'vikas.p@executors.net',
      phone: '+91 98444 55667',
      role: 'EXECUTOR',
      accountStatus: 'ACTIVE',
      kycStatus: 'UNDER_REVIEW',
      isAvailable: true,
      capabilities: ['MEDICINE_PICKUP', 'GROCERY_ASSISTANCE'],
      serviceRadiusKm: 5.0,
      location: {
        latitude: 12.973,
        longitude: 77.644,
        address: 'Defence Colony, Indiranagar',
        city: 'Bengaluru',
      },
      rating: 0,
      totalRatingsCount: 0,
      completedTasksCount: 0,
      activeTasksCount: 0,
      maxConcurrentTasks: 1,
      reliabilityScore: 50,
      acceptanceRate: 100,
      documents: {
        panNumber: 'PQRST3456U',
        aadhaarLast4: '9912',
        submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      videoVerification: {
        status: 'PENDING',
      },
      isDemo: true,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    };
    this.executors.set(executorD.id, executorD);

    // Executor E: Deepa Nair - Unavailable toggle
    const executorE: ExecutorProfile = {
      id: 'exec_deepa',
      name: 'Deepa Nair',
      email: 'deepa.n@executors.net',
      phone: '+91 98555 66778',
      role: 'EXECUTOR',
      accountStatus: 'ACTIVE',
      kycStatus: 'KYC_APPROVED',
      isAvailable: false, // NOT AVAILABLE
      capabilities: ['COMPANION', 'APPOINTMENT', 'MEDICINE_PICKUP'],
      serviceRadiusKm: 5.0,
      location: {
        latitude: 12.972,
        longitude: 77.64,
        address: 'HAL 2nd Stage, Indiranagar',
        city: 'Bengaluru',
      },
      rating: 4.95,
      totalRatingsCount: 110,
      completedTasksCount: 124,
      activeTasksCount: 0,
      maxConcurrentTasks: 1,
      reliabilityScore: 99,
      acceptanceRate: 98,
      documents: {
        panNumber: 'VWXYZ7890A',
        aadhaarLast4: '6624',
      },
      videoVerification: {
        status: 'DEMO_COMPLETED',
      },
      isDemo: true,
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    };
    this.executors.set(executorE.id, executorE);

    // 4. Initial User Memories
    this.memories.set(demoUser.id, [
      {
        id: 'mem_1',
        userId: demoUser.id,
        category: 'PREFERENCE',
        key: 'preferred_pharmacy',
        value: 'Apollo Pharmacy, 12th Main Indiranagar',
        confidence: 0.95,
        source: 'USER_STATED',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mem_2',
        userId: demoUser.id,
        category: 'PERSONAL',
        key: 'dietary_preference',
        value: 'Vegetarian, strictly low sodium',
        confidence: 0.9,
        source: 'USER_STATED',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mem_3',
        userId: demoUser.id,
        category: 'TASK',
        key: 'regular_doctor',
        value: 'Dr. Meenakshi, City Care Cardiology Clinic',
        confidence: 0.92,
        source: 'USER_STATED',
        updatedAt: new Date().toISOString(),
      },
    ]);

    // 5. Initial Appointments & Reminders (Empty by default)
    // Appointments and reminders are created on-demand through Sathi voice/chat coordination.

    // 6. Seed Knowledge Base Documents for RAG
    this.knowledgeDocs = [
      {
        id: 'kb_001',
        title: 'Medicine Pickup & Delivery Service Guidelines',
        category: 'SERVICE_GUIDE',
        content: `ServiceAgent enables verified service providers to pick up prescribed medicines from authorized pharmacies and deliver them to users' doorsteps.
Rules:
1. The executor must collect the printed pharmacy bill/receipt.
2. For prescription-only drugs, the user must provide a copy or photo of the prescription.
3. The executor must keep medicines in clean, tamper-evident packaging.
4. User must verify package integrity and provide verification code upon delivery.
5. Standard fee is ₹80 within 3km, ₹15 per additional km.`,
        version: '1.2',
        updatedAt: '2026-08-15T10:00:00Z',
      },
      {
        id: 'kb_002',
        title: 'Safety, Verification & Dispute Protocol',
        category: 'SAFETY',
        content: `Safety is our foundational tenet for independent living support:
- 100% of executors undergo identity verification, government ID check (Aadhaar/PAN), and live video verification.
- Two-way verification code (OTP/QR) is required for task completion.
- Emergency SOS button available to user and executor during active tasks.
- If an executor cannot complete a task or behaves unprofessionally, the user can cancel the assignment immediately; Sathi will dispatch a backup candidate according to policy.`,
        version: '2.0',
        updatedAt: '2026-09-01T12:00:00Z',
      },
      {
        id: 'kb_003',
        title: 'Deterministic Dispatch & Reassignment Policy',
        category: 'POLICY',
        content: `ServiceAgent uses a strict multi-factor deterministic scoring engine:
- Never assign unapproved, suspended, or unavailable executors.
- If an executor rejects or times out (60 seconds), they are permanently excluded from that dispatch attempt.
- The next highest-scoring candidate is offered the task.
- If a user cancels an executor before task execution, the system releases the executor, marks the cancellation reason, and offers user confirmation before dispatching the next available candidate.`,
        version: '1.5',
        updatedAt: '2026-09-10T08:00:00Z',
      },
    ];

    // 7. Seed Sample Historical Completed Task & Settled Invoice
    const seedTask: Task = {
      id: 'task_demo_completed_01',
      userId: demoUser.id,
      userName: demoUser.name,
      userPhone: demoUser.phone,
      serviceType: 'MEDICINE_PICKUP',
      title: 'Prescription Medicine Pickup from Apollo Pharmacy',
      description: 'Senior blood pressure and cardiac maintenance tablets delivery',
      pickupLocation: {
        latitude: 15.8246,
        longitude: 80.3522,
        address: 'Apollo Pharmacy, Clock Tower Centre, Chirala',
        city: 'Chirala',
      },
      destinationLocation: demoUser.location,
      scheduledAt: 'Yesterday, 4:30 PM',
      requirements: { urgency: 'NORMAL', prescriptionRequired: true },
      estimatedCost: 150,
      finalCost: 150,
      status: 'COMPLETED',
      assignedExecutorId: 'exec_praveen',
      assignedExecutorName: 'Praveen',
      assignedExecutorPhone: '+91 98480 12345',
      paymentStatus: 'PAYMENT_SUCCEEDED',
      paymentMode: 'UPI',
      platformFee: 15,
      executorPayout: 135,
      invoiceId: 'INV-2026-8201',
      verificationStatus: 'VERIFIED',
      verificationCode: '8241',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 23 * 3600000).toISOString(),
      completedAt: new Date(Date.now() - 23 * 3600000).toISOString(),
    };
    this.tasks.set(seedTask.id, seedTask);

    const seedInvoice: Invoice = {
      id: 'INV-2026-8201',
      taskId: seedTask.id,
      taskTitle: seedTask.title,
      serviceType: seedTask.serviceType,
      userId: demoUser.id,
      userName: demoUser.name,
      userPhone: demoUser.phone,
      userAddress: demoUser.address,
      executorId: 'exec_praveen',
      executorName: 'Praveen',
      executorPhone: '+91 98480 12345',
      amount: 150,
      platformFeeRate: 0.10,
      platformFee: 15,
      executorPayout: 135,
      paymentMode: 'UPI',
      upiTransactionRef: 'UPI_AXIS_CHIRALA_88291',
      paymentStatus: 'PAID',
      issuedAt: new Date(Date.now() - 23 * 3600000).toISOString(),
    };
    this.invoices.set(seedInvoice.id, seedInvoice);

    // 8. Log initial audit event
    this.addAuditEvent({
      actor: 'SYSTEM',
      actorId: 'system_bootstrap',
      action: 'PLATFORM_INITIALIZED',
      resourceType: 'SYSTEM',
      resourceId: 'serviceagent_core',
      result: 'SUCCESS',
      metadata: {
        demoMode: true,
        seededExecutors: this.executors.size,
        seededUsers: this.users.size,
        seededInvoices: this.invoices.size,
      },
    });
  }

  addAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const fullEvent: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.auditLogs.unshift(fullEvent);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return fullEvent;
  }

  createInvoice(params: {
    taskId: string;
    paymentMode: 'CASH' | 'UPI';
    amount?: number;
    upiTransactionRef?: string;
  }): { invoice: Invoice; task: Task } {
    const task = this.tasks.get(params.taskId);
    if (!task) throw new Error('TASK_NOT_FOUND');

    const totalAmount = Number(params.amount || task.finalCost || task.estimatedCost || 120);
    // Platform fee cuts 10% from the payment
    const platformFee = Math.round(totalAmount * 0.10);
    const executorPayout = totalAmount - platformFee;

    const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice: Invoice = {
      id: invoiceId,
      taskId: task.id,
      taskTitle: task.title,
      serviceType: task.serviceType,
      userId: task.userId,
      userName: task.userName,
      userPhone: task.userPhone,
      userAddress: task.destinationLocation?.address || task.pickupLocation.address,
      executorId: task.assignedExecutorId || 'exec_praveen',
      executorName: task.assignedExecutorName || 'Verified Regional Provider',
      executorPhone: task.assignedExecutorPhone || '+91 98480 12345',
      amount: totalAmount,
      platformFeeRate: 0.10,
      platformFee,
      executorPayout,
      paymentMode: params.paymentMode,
      upiTransactionRef: params.upiTransactionRef || (params.paymentMode === 'UPI' ? `UPI_${Date.now()}` : undefined),
      paymentStatus: 'PAID',
      issuedAt: new Date().toISOString(),
    };

    this.invoices.set(invoice.id, invoice);

    // Update task
    task.invoiceId = invoice.id;
    task.paymentMode = params.paymentMode;
    task.platformFee = platformFee;
    task.executorPayout = executorPayout;
    task.finalCost = totalAmount;
    task.paymentStatus = 'PAYMENT_SUCCEEDED';
    task.updatedAt = new Date().toISOString();

    this.addAuditEvent({
      actor: 'SYSTEM',
      actorId: 'payment_engine',
      action: 'PAYMENT_SETTLED_WITH_PLATFORM_FEE',
      resourceType: 'PAYMENT',
      resourceId: task.id,
      metadata: {
        invoiceId: invoice.id,
        totalAmount,
        platformFee10Percent: platformFee,
        executorPayout90Percent: executorPayout,
        paymentMode: params.paymentMode,
      },
      result: 'SUCCESS',
    });

    return { invoice, task };
  }

  getInvoices(filter?: { userId?: string; executorId?: string; taskId?: string }): Invoice[] {
    let list = Array.from(this.invoices.values());
    if (filter?.userId) list = list.filter((i) => i.userId === filter.userId);
    if (filter?.executorId) list = list.filter((i) => i.executorId === filter.executorId);
    if (filter?.taskId) list = list.filter((i) => i.taskId === filter.taskId);
    return list.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  getExecutor(id?: string): ExecutorProfile | undefined {
    if (!id) return undefined;
    const legacyAliases: Record<string, string> = {
      exec_suresh: 'exec_praveen',
      exec_anita: 'exec_vinay',
      exec_rajesh: 'exec_kumar',
    };
    const targetId = legacyAliases[id] || id;
    return this.executors.get(targetId);
  }

  getExecutors(): ExecutorProfile[] {
    return Array.from(this.executors.values());
  }

  getFinancialStats() {
    let totalGrossVolume = 0;
    let totalPlatformRevenue = 0;
    let totalExecutorPayouts = 0;

    for (const inv of this.invoices.values()) {
      totalGrossVolume += inv.amount;
      totalPlatformRevenue += inv.platformFee;
      totalExecutorPayouts += inv.executorPayout;
    }

    return {
      totalGrossVolume,
      totalPlatformRevenue,
      totalExecutorPayouts,
      invoicesCount: this.invoices.size,
    };
  }
}

export const db = new ServiceAgentDatabase();
