// ServiceAgent Types & Domain Models

export type Role = 'USER' | 'EXECUTOR' | 'ADMIN';

export type TaskStatus =
  | 'DRAFT'
  | 'WAITING_FOR_INFORMATION'
  | 'PLANNED'
  | 'WAITING_FOR_USER_CONFIRMATION'
  | 'CONFIRMED'
  | 'SEARCHING_EXECUTOR'
  | 'DISPATCHING'
  | 'OFFER_SENT'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'OFFER_EXPIRED'
  | 'OFFER_CANCELLED'
  | 'EXECUTOR_ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'ARRIVED'
  | 'TASK_EXECUTED'
  | 'VERIFICATION_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'EXPIRED'
  | 'NO_EXECUTOR_AVAILABLE'
  | 'PAYMENT_FAILED';

export type PaymentStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED';

export type ServiceType =
  | 'MEDICINE_PICKUP'
  | 'GROCERY_ASSISTANCE'
  | 'TRANSPORTATION'
  | 'COMPANION'
  | 'APPOINTMENT'
  | 'HOSPITAL_ASSISTANCE'
  | 'OTHER_SERVICE';

export type KycStatus =
  | 'REGISTERED'
  | 'PROFILE_INCOMPLETE'
  | 'DOCUMENTS_PENDING'
  | 'UNDER_REVIEW'
  | 'VIDEO_VERIFICATION_PENDING'
  | 'VIDEO_VERIFICATION_COMPLETED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'SUSPENDED';

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  city?: string;
}

export interface UserSecurityDetails {
  aadhaarNumber: string;
  addressProofType: string;
  addressProofDocName?: string;
  addressProofVerified: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'DOCUMENTS_REQUIRED';
}

export interface BankDetails {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  upiId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'USER';
  address: string;
  pinCode?: string;
  bio?: string;
  qualification?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  location?: LocationCoordinates;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  addressProofType?: string;
  addressProofDocName?: string;
  securityVerified?: boolean;
  preferredLanguage?: string;
  createdAt: string;
}

export interface ExecutorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'EXECUTOR';
  photoUrl?: string;
  age?: number;
  bio?: string;
  qualification?: string;
  qualifications?: string;
  occupation?: string;
  address?: string;
  pinCode?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  bankDetails?: BankDetails;
  town?: 'Chirala' | 'Bapatla' | 'Vetapalem' | 'Ponnur' | string;
  availabilityMode?: 'ALWAYS_AVAILABLE' | 'SCHEDULED_HOURS' | 'UNAVAILABLE';
  availabilitySchedule?: {
    startHour: number;
    endHour: number;
    label: string;
  };
  accountStatus: AccountStatus;
  kycStatus: KycStatus;
  isAvailable: boolean;
  capabilities: ServiceType[];
  serviceRadiusKm: number;
  location: LocationCoordinates;
  rating: number;
  totalRatingsCount: number;
  completedTasksCount: number;
  activeTasksCount: number;
  maxConcurrentTasks: number;
  reliabilityScore: number; // 0 to 100
  acceptanceRate: number; // percentage
  documents: {
    panNumber?: string;
    aadhaarLast4?: string;
    idProofUrl?: string;
    addressProofUrl?: string;
    certifications?: string[];
    submittedAt?: string;
  };
  videoVerification?: {
    status: 'NOT_STARTED' | 'PENDING' | 'COMPLETED' | 'DEMO_COMPLETED';
    verifiedAt?: string;
    verifiedBy?: string;
    notes?: string;
  };
  isDemo?: boolean;
  createdAt: string;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN';
  permissions: string[];
  createdAt: string;
}

export interface TaskRequirements {
  itemsList?: string[];
  prescriptionRequired?: boolean;
  vehicleType?: 'TWO_WHEELER' | 'FOUR_WHEELER' | 'ACCESSIBLE_VAN' | 'NONE';
  companionSpecialty?: string;
  urgency?: 'NORMAL' | 'HIGH' | 'CRITICAL';
  estimatedDurationMinutes?: number;
  notes?: string;
  preferredLanguage?: string;
  detectedLanguage?: string;
}

export interface Task {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  pickupLocation: LocationCoordinates;
  destinationLocation?: LocationCoordinates;
  scheduledAt: string;
  requirements: TaskRequirements;
  preferredLanguage?: string;
  metadata?: Record<string, any>;
  estimatedCost: number;
  finalCost?: number;
  status: TaskStatus;
  assignedExecutorId?: string;
  assignedExecutorName?: string;
  assignedExecutorPhone?: string;
  dispatchAttemptId?: string;
  paymentStatus: PaymentStatus;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  verificationCode?: string;
  cancellationReason?: string;
  rating?: number;
  etaMinutes?: number;
  feedback?: string;
  invoiceId?: string;
  paymentMode?: 'CASH' | 'UPI';
  platformFee?: number;
  executorPayout?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Invoice {
  id: string; // e.g. "INV-2026-0042"
  taskId: string;
  taskTitle: string;
  serviceType: ServiceType;
  userId: string;
  userName: string;
  userPhone?: string;
  userAddress?: string;
  executorId: string;
  executorName: string;
  executorPhone?: string;
  amount: number;
  platformFeeRate: number; // 0.10 (10%)
  platformFee: number; // 10%
  executorPayout: number; // 90%
  paymentMode: 'CASH' | 'UPI';
  upiTransactionRef?: string;
  paymentStatus: 'PAID';
  issuedAt: string;
  createdAt?: string;
}

export interface DirectMessage {
  id: string;
  taskId: string;
  senderId: string;
  senderName: string;
  senderRole: 'USER' | 'EXECUTOR';
  text: string;
  timestamp: string;
}

export interface DispatchCandidate {
  executorId: string;
  executorName: string;
  distanceKm: number;
  etaMinutes: number;
  rating: number;
  completedTasks: number;
  reliabilityScore: number;
  totalScore: number;
  scoreBreakdown: {
    capabilityScore: number;
    availabilityScore: number;
    proximityScore: number;
    reliabilityScore: number;
    workloadScore: number;
    ratingScore: number;
  };
}

export interface DispatchAttempt {
  id: string;
  taskId: string;
  attemptNumber: number;
  status: 'PENDING' | 'ACTIVE' | 'OFFER_SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'NO_CANDIDATES';
  candidateExecutorIds: string[];
  rankedCandidates: DispatchCandidate[];
  excludedExecutorIds: string[];
  currentExecutorId?: string;
  offerSentAt?: string;
  responseDeadline?: string;
  response?: 'ACCEPT' | 'REJECT' | 'TIMEOUT' | 'CANCELLED_BY_USER';
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  userId: string;
  title: string;
  doctorOrService: string;
  location: string;
  scheduledTime: string;
  reminderMinutesBefore: number;
  transportationRequested: boolean;
  associatedTaskId?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  dueTime: string;
  category: 'MEDICINE' | 'APPOINTMENT' | 'GROCERY' | 'GENERAL';
  isRecurring: boolean;
  recurrenceRule?: string;
  completed: boolean;
  createdAt: string;
}

export type MemoryCategory = 'PERSONAL' | 'TASK' | 'PREFERENCE';

export interface UserMemory {
  id: string;
  userId: string;
  category: MemoryCategory;
  key: string;
  value: string;
  confidence: number;
  source: 'USER_STATED' | 'SATHI_INFERRED';
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: Role | 'SYSTEM' | 'DISPATCH_ENGINE';
  actorId: string;
  action: string;
  resourceType: 'TASK' | 'EXECUTOR' | 'USER' | 'DISPATCH' | 'PAYMENT' | 'KYC' | 'AGENT' | 'SYSTEM';
  resourceId: string;
  requestId?: string;
  metadata?: Record<string, any>;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
}

export interface AgentToolCall {
  toolName: string;
  arguments: Record<string, any>;
  authorized: boolean;
  result?: any;
  error?: string;
  latencyMs: number;
}

export interface AgentMessage {
  id: string;
  sender: 'user' | 'sathi' | 'system';
  text: string;
  timestamp: string;
  voiceTranscript?: boolean;
  toolCalls?: AgentToolCall[];
  structuredData?: {
    intent?: string;
    entities?: Record<string, any>;
    taskPlan?: Partial<Task>;
    suggestedExecutors?: DispatchCandidate[];
    requiresConfirmation?: boolean;
    confirmationType?: 'TASK_CREATE' | 'DISPATCH_START' | 'CANCEL_EXECUTOR' | 'PAYMENT_INITIATE';
    places?: PlaceResult[];
    toolCalls?: AgentToolCall[];
  };
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: 'POLICY' | 'SAFETY' | 'KYC' | 'PAYMENT' | 'SERVICE_GUIDE';
  content: string;
  version: string;
  updatedAt: string;
}

export interface PlaceResult {
  id: string;
  name: string;
  formattedAddress: string;
  category: 'HOSPITAL' | 'CLINIC' | 'PHARMACY' | 'DIAGNOSTIC' | 'GROCERY' | 'TRANSIT' | 'LANDMARK';
  location: LocationCoordinates;
  rating?: number;
  userRatingCount?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  phoneNumber?: string;
  distanceKm?: number;
  types?: string[];
  editorialSummary?: string;
}

export type VoiceState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'RECOVERY';

export interface SystemHealthStatus {
  service: string;
  gemini: 'READY' | 'CONFIGURATION_REQUIRED' | 'ERROR';
  firebase: 'READY' | 'CONFIGURATION_REQUIRED' | 'SIMULATED';
  googleMaps: 'READY' | 'CONFIGURATION_REQUIRED' | 'SIMULATED';
  speechToText: 'READY' | 'CONFIGURATION_REQUIRED' | 'WEB_API_ACTIVE';
  textToSpeech: 'READY' | 'CONFIGURATION_REQUIRED' | 'WEB_API_ACTIVE';
  payments: 'READY' | 'CONFIGURATION_REQUIRED';
  notifications: {
    email: 'READY' | 'CONFIGURATION_REQUIRED';
    sms: 'READY' | 'CONFIGURATION_REQUIRED';
    whatsapp: 'READY' | 'CONFIGURATION_REQUIRED';
    push: 'READY' | 'ACTIVE';
  };
  videoVerification: 'READY' | 'CONFIGURATION_REQUIRED' | 'DEMO_MODE_ACTIVE';
  isDemoMode: boolean;
  activeExecutorsCount: number;
  availableExecutorsCount: number;
  activeTasksCount: number;
}
