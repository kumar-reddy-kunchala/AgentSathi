// Executor Service Portal Dashboard: /executor
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Header } from '../../components/Header';
import {
  Task,
  DispatchAttempt,
  KycStatus,
  Invoice,
} from '../../types';
import {
  Briefcase,
  Power,
  CheckCircle,
  Clock,
  MapPin,
  AlertTriangle,
  FileText,
  Video,
  DollarSign,
  Star,
  RefreshCw,
  Navigation,
  ShieldCheck,
  Phone,
  User,
  XCircle,
  Save,
  Award,
  PhoneCall,
  MessageSquare,
  Receipt,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { DirectChatModal } from '../../components/DirectChatModal';
import { PaymentModal } from '../../components/PaymentModal';
import { InvoiceModal } from '../../components/InvoiceModal';

export const ExecutorDashboardView: React.FC = () => {
  const { executor, logout, refreshExecutor } = useAuth();

  const [activeTab, setActiveTab] = useState<'tasks' | 'kyc' | 'earnings' | 'profile'>('tasks');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [incomingOffer, setIncomingOffer] = useState<{ task: Task; attempt: DispatchAttempt } | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [executorInvoices, setExecutorInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDirectChatOpen, setIsDirectChatOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationInput, setVerificationInput] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // KYC Form State
  const [panNumber, setPanNumber] = useState(executor?.documents?.panNumber || '');
  const [aadhaarLast4, setAadhaarLast4] = useState(executor?.documents?.aadhaarLast4 || '');
  const [kycSubmittedMessage, setKycSubmittedMessage] = useState('');

  // Profile & Availability Form State
  const [profileName, setProfileName] = useState(executor?.name || '');
  const [profileAge, setProfileAge] = useState(executor?.age?.toString() || '25');
  const [profileTown, setProfileTown] = useState(executor?.town || 'Chirala');
  const [profileOccupation, setProfileOccupation] = useState(executor?.occupation || '');
  const [profileQualifications, setProfileQualifications] = useState(executor?.qualifications || '');
  const [profileBio, setProfileBio] = useState(executor?.bio || '');
  const [profileRadius, setProfileRadius] = useState(executor?.serviceRadiusKm?.toString() || '25');
  const [availabilityMode, setAvailabilityMode] = useState<'ALWAYS_AVAILABLE' | 'SCHEDULED_HOURS' | 'UNAVAILABLE'>(
    executor?.availabilityMode || 'ALWAYS_AVAILABLE'
  );
  const [schedulePreset, setSchedulePreset] = useState<'EVENING' | 'MORNING' | 'FULL_DAY'>(
    executor?.availabilitySchedule?.startHour === 16 ? 'EVENING' : 'FULL_DAY'
  );
  const [customStartHour, setCustomStartHour] = useState(executor?.availabilitySchedule?.startHour || 16);
  const [customEndHour, setCustomEndHour] = useState(executor?.availabilitySchedule?.endHour || 22);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Video verification modal
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Sync profile state when executor changes
  useEffect(() => {
    if (executor) {
      setProfileName(executor.name || '');
      setProfileAge(executor.age?.toString() || '25');
      setProfileTown(executor.town || 'Chirala');
      setProfileOccupation(executor.occupation || '');
      setProfileQualifications(executor.qualifications || '');
      setProfileBio(executor.bio || '');
      setProfileRadius(executor.serviceRadiusKm?.toString() || '25');
      setAvailabilityMode(executor.availabilityMode || 'ALWAYS_AVAILABLE');
      if (executor.availabilitySchedule) {
        setCustomStartHour(executor.availabilitySchedule.startHour);
        setCustomEndHour(executor.availabilitySchedule.endHour);
        if (executor.availabilitySchedule.startHour === 16 && executor.availabilitySchedule.endHour === 22) {
          setSchedulePreset('EVENING');
        } else if (executor.availabilitySchedule.startHour === 8 && executor.availabilitySchedule.endHour === 14) {
          setSchedulePreset('MORNING');
        } else {
          setSchedulePreset('FULL_DAY');
        }
      }
    }
  }, [executor?.id]);

  // Poll executor tasks and incoming dispatch offers
  const fetchExecutorData = async () => {
    if (!executor) return;
    try {
      const [tasksRes, attemptsRes, invoicesRes] = await Promise.allSettled([
        api.getTasks(),
        api.getAdminDispatchAttempts(),
        api.getInvoices({ executorId: executor.id }),
      ]);

      const allTasks = tasksRes.status === 'fulfilled' ? tasksRes.value || [] : [];
      const adminAttempts = attemptsRes.status === 'fulfilled' ? attemptsRes.value || [] : [];
      const invoicesList = invoicesRes.status === 'fulfilled' ? invoicesRes.value || [] : [];

      if (tasksRes.status === 'fulfilled' && attemptsRes.status === 'fulfilled') {
        // Check for incoming offer dispatched specifically to this executor
        const currentAttempt = adminAttempts.find(
          (a) => a.status === 'OFFER_SENT' && a.currentExecutorId === executor.id
        );

        if (currentAttempt) {
          const matchingTask = allTasks.find((t) => t.id === currentAttempt.taskId);
          if (matchingTask && matchingTask.status === 'OFFER_SENT') {
            setIncomingOffer({ task: matchingTask, attempt: currentAttempt });
          } else {
            setIncomingOffer(null);
          }
        } else {
          setIncomingOffer(null);
        }

        // Check for assigned active task
        const assigned = allTasks.find(
          (t) => t.assignedExecutorId === executor.id && !['COMPLETED', 'CANCELLED', 'FAILED'].includes(t.status)
        );
        setActiveTask(assigned || null);

        // Completed tasks
        const completed = allTasks.filter(
          (t) => t.assignedExecutorId === executor.id && t.status === 'COMPLETED'
        );
        setCompletedTasks(completed);
      }

      if (invoicesRes.status === 'fulfilled') {
        setExecutorInvoices(invoicesList);
      }
    } catch (e) {
      console.warn('Executor poll status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutorData();
    const interval = setInterval(fetchExecutorData, 3000);
    return () => clearInterval(interval);
  }, [executor]);

  // Toggle Live Availability
  const handleToggleAvailability = async () => {
    if (!executor) return;
    try {
      await api.setExecutorAvailability(executor.id, !executor.isAvailable);
      await refreshExecutor();
    } catch (e) {
      console.error('Toggle availability error:', e);
    }
  };

  // Accept incoming task offer
  const handleAcceptOffer = async () => {
    if (!incomingOffer || !executor) return;
    try {
      await api.respondToOffer(incomingOffer.attempt.id, executor.id, 'ACCEPT');
      setIncomingOffer(null);
      await fetchExecutorData();
      await refreshExecutor();
    } catch (e: any) {
      alert(`Accept failed: ${e.message}`);
    }
  };

  // Reject incoming task offer
  const handleRejectOffer = async () => {
    if (!incomingOffer || !executor) return;
    try {
      await api.respondToOffer(incomingOffer.attempt.id, executor.id, 'REJECT');
      setIncomingOffer(null);
      await fetchExecutorData();
    } catch (e: any) {
      alert(`Reject failed: ${e.message}`);
    }
  };

  // Transition Task Lifecycle
  const handleTaskTransition = async (targetStatus: string, code?: string) => {
    if (!activeTask || !executor) return;
    setVerificationError('');
    try {
      await api.transitionTask(activeTask.id, targetStatus, executor.id, code);
      setVerificationInput('');
      await fetchExecutorData();
      await refreshExecutor();
    } catch (e: any) {
      setVerificationError(e.message || 'Transition failed');
    }
  };

  // Submit KYC form
  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executor) return;
    try {
      await api.submitKyc(executor.id, {
        panNumber,
        aadhaarLast4,
        certifications: ['Government Identity Verified', 'Emergency Care Certified'],
      });
      setKycSubmittedMessage('Documents successfully submitted for Admin Review.');
      await refreshExecutor();
    } catch (e: any) {
      alert(`KYC submission error: ${e.message}`);
    }
  };

  // Video Verification
  const handleStartDemoVerification = async () => {
    if (!executor) return;
    try {
      await api.startVideoVerification(executor.id);
      setShowVideoModal(true);
    } catch (e) {
      console.error('Video verify error:', e);
    }
  };

  const handleCompleteDemoVerification = async () => {
    if (!executor) return;
    try {
      await api.decideKyc(executor.id, 'APPROVE', 'Demo Video Verification Completed');
      setShowVideoModal(false);
      await refreshExecutor();
    } catch (e) {
      console.error('Complete verify error:', e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executor) return;
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);

    try {
      const schedule =
        availabilityMode === 'SCHEDULED_HOURS'
          ? schedulePreset === 'EVENING'
            ? { startHour: 16, endHour: 22, label: 'Evening 4:00 PM – 10:00 PM' }
            : schedulePreset === 'MORNING'
            ? { startHour: 8, endHour: 14, label: 'Morning 8:00 AM – 2:00 PM' }
            : { startHour: customStartHour, endHour: customEndHour, label: `${customStartHour}:00 – ${customEndHour}:00` }
          : undefined;

      await api.updateExecutorProfile(executor.id, {
        name: profileName,
        age: parseInt(profileAge) || 25,
        town: profileTown,
        occupation: profileOccupation,
        qualifications: profileQualifications,
        bio: profileBio,
        serviceRadiusKm: parseFloat(profileRadius) || 25,
        availabilityMode,
        availabilitySchedule: schedule,
      });

      await refreshExecutor();
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3500);
    } catch (err: any) {
      alert(`Failed to save profile: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const todayEarnings = completedTasks.reduce((sum, t) => sum + (t.finalCost || t.estimatedCost || 80), 0);

  return (
    <div className="min-h-screen bg-stone-50/60 flex flex-col">
      {/* Top Header Navbar */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'tasks', label: 'Incoming Tasks' },
          { id: 'kyc', label: 'Profile & KYC' },
          { id: 'earnings', label: 'Earnings & History' },
          { id: 'profile', label: 'Availability Shift' },
        ]}
        accentColor="amber"
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Shift Status & Online Toggle Bar */}
        <div className="p-4 sm:p-5 bg-white border border-stone-200/90 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${executor?.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
            <div>
              <div className="text-sm font-bold text-stone-900">
                Active Executor Shift Status: {executor?.isAvailable ? 'ONLINE & RECEIVING DISPATCHES' : 'OFFLINE'}
              </div>
              <div className="text-xs text-stone-500">
                {executor?.isAvailable
                  ? 'Your location & profile are broadcast to Sathi algorithm for instant coordination.'
                  : 'Toggle switch to go online and receive automated tasks.'}
              </div>
            </div>
          </div>

          <button
            type="button"
            id="executor-availability-toggle-btn"
            onClick={handleToggleAvailability}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
              executor?.isAvailable
                ? 'bg-stone-900 text-white hover:bg-black'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{executor?.isAvailable ? 'Go Offline' : 'Go Online Now'}</span>
          </button>
        </div>

        {/* Verification Status Warning if not approved */}
        {executor?.kycStatus !== 'KYC_APPROVED' && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <div className="font-bold text-sm text-amber-900">
                  Account Status: {executor?.kycStatus}
                </div>
                <div className="text-xs text-amber-800">
                  Your account must be KYC approved before tasks can be dispatched to you.
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('kyc')}
              className="px-3.5 py-1.5 bg-amber-700 text-white text-xs font-bold rounded-xl hover:bg-amber-800 transition"
            >
              Complete Verification
            </button>
          </div>
        )}

        {/* TAB 1: TASKS & DISPATCHES */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Incoming Offer & Active Task (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* INCOMING TASK OFFER BANNER */}
              {incomingOffer && (
                <div className="bg-amber-500 text-stone-950 p-6 rounded-3xl shadow-lg border border-amber-600 animate-pulse-subtle space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-stone-950 text-white px-2.5 py-1 rounded-md">
                      ⚡ NEW SERVICE OFFER DETECTED
                    </span>
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Timeout in 45s
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-stone-950">{incomingOffer.task.title}</h3>
                    <div className="text-sm font-semibold text-stone-900 mt-1">
                      Estimated Fee: <span className="font-extrabold text-lg">₹{incomingOffer.task.estimatedCost || 90}</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white/95 rounded-2xl text-xs space-y-1.5 text-stone-800 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-600" />
                      <span><strong>Pickup:</strong> {incomingOffer.task.pickupLocation?.address || 'Apollo Pharmacy, Main Road'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 text-stone-600" />
                      <span><strong>Client:</strong> {incomingOffer.task.userName || 'Kumar Reddy'} ({incomingOffer.task.destinationLocation?.address || 'Chirala'})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      id="executor-reject-offer-btn"
                      onClick={handleRejectOffer}
                      className="py-2.5 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-black transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      Decline Offer
                    </button>
                    <button
                      id="executor-accept-offer-btn"
                      onClick={handleAcceptOffer}
                      className="py-2.5 bg-emerald-700 text-white font-black text-xs rounded-xl hover:bg-emerald-800 transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept Task Offer
                    </button>
                  </div>
                </div>
              )}

              {/* CURRENT ACTIVE TASK */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/90 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    <span>Active Coordinated Task</span>
                  </h2>
                  {activeTask && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                      {activeTask.status.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                {activeTask ? (
                  <div className="space-y-4 pt-1">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">{activeTask.title}</h3>
                      <div className="text-xs text-stone-500 mt-0.5">
                        Client: <strong className="text-stone-800">{activeTask.userName}</strong> ({activeTask.userPhone || '+91 98480 22338'})
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          id="executor-call-client-btn"
                          onClick={() => setIsDirectChatOpen(true)}
                          className="flex-1 py-1.5 px-3 bg-white border border-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-stone-50 transition shadow-2xs"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Call Client</span>
                        </button>
                        <button
                          type="button"
                          id="executor-msg-client-btn"
                          onClick={() => setIsDirectChatOpen(true)}
                          className="flex-1 py-1.5 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Message Client</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl text-xs space-y-2.5">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-stone-800">Pickup Location</div>
                          <div className="text-stone-600">{activeTask.pickupLocation?.address || 'Apollo Pharmacy'}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 pt-2 border-t border-stone-200">
                        <Navigation className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-stone-800">Delivery Destination</div>
                          <div className="text-stone-600">{activeTask.destinationLocation?.address || 'Home Residence, Chirala'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Stepper Progression Buttons */}
                    <div className="p-4 bg-teal-50/40 border border-teal-200/70 rounded-2xl space-y-3">
                      <div className="text-xs font-bold text-teal-900 uppercase">
                        Progress Lifecycle Action
                      </div>

                      {activeTask.status === 'EXECUTOR_ASSIGNED' && (
                        <button
                          onClick={() => handleTaskTransition('ACCEPTED')}
                          className="w-full py-2.5 bg-teal-700 text-white text-xs font-bold rounded-xl hover:bg-teal-800 transition"
                        >
                          Confirm Acceptance
                        </button>
                      )}

                      {activeTask.status === 'ACCEPTED' && (
                        <button
                          id="executor-start-task-btn"
                          onClick={() => handleTaskTransition('IN_PROGRESS')}
                          className="w-full py-2.5 bg-teal-700 text-white text-xs font-bold rounded-xl hover:bg-teal-800 transition shadow-xs"
                        >
                          Start Task (Begin Transit to Location)
                        </button>
                      )}

                      {activeTask.status === 'IN_PROGRESS' && (
                        <button
                          id="executor-arrive-btn"
                          onClick={() => handleTaskTransition('ARRIVED')}
                          className="w-full py-2.5 bg-sky-700 text-white text-xs font-bold rounded-xl hover:bg-sky-800 transition shadow-xs"
                        >
                          Mark Arrived at Location
                        </button>
                      )}

                      {activeTask.status === 'ARRIVED' && (
                        <button
                          id="executor-execute-btn"
                          onClick={() => handleTaskTransition('TASK_EXECUTED')}
                          className="w-full py-2.5 bg-indigo-700 text-white text-xs font-bold rounded-xl hover:bg-indigo-800 transition shadow-xs"
                        >
                          Complete Execution (Service Delivered)
                        </button>
                      )}

                      {activeTask.status === 'TASK_EXECUTED' && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-stone-700">
                            Enter Client 4-Digit Verification Code:
                          </div>
                          {verificationError && (
                            <div className="text-xs text-rose-600 font-bold">{verificationError}</div>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="e.g. 8241"
                              value={verificationInput}
                              onChange={(e) => setVerificationInput(e.target.value)}
                              className="w-32 px-3 py-2 border border-stone-300 rounded-xl text-center font-bold text-sm tracking-widest bg-white"
                            />
                            <button
                              id="executor-complete-task-btn"
                              onClick={() => handleTaskTransition('COMPLETED', verificationInput)}
                              className="flex-1 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition shadow-xs"
                            >
                              Verify & Finish Task
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Payment Collection */}
                      {['TASK_EXECUTED', 'COMPLETED'].includes(activeTask.status) && (
                        <div className="pt-2 border-t border-teal-200/80 space-y-2">
                          {!activeTask.invoiceId ? (
                            <button
                              type="button"
                              id="executor-collect-payment-btn"
                              onClick={() => setIsPaymentModalOpen(true)}
                              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>Settle Payment • ₹{activeTask.finalCost || activeTask.estimatedCost}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              id="executor-view-invoice-btn"
                              onClick={() => setSelectedInvoice(executorInvoices.find((i) => i.id === activeTask.invoiceId) || null)}
                              className="w-full py-2 bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition shadow-2xs"
                            >
                              <Receipt className="w-4 h-4 text-emerald-700" />
                              <span>Paid via {activeTask.paymentMode || 'UPI'} • View Receipt</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-stone-500">
                    <Briefcase className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="text-sm font-semibold text-stone-800">No active task in progress.</p>
                    <p className="text-xs text-stone-400 mt-1">Keep your status toggle set to ONLINE to receive dispatches.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Daily Stats & Performance (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Daily Stats */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Today's Performance
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="text-[11px] text-stone-500 font-semibold">Completed Tasks</div>
                    <div className="text-2xl font-extrabold text-stone-900 mt-1">{completedTasks.length}</div>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="text-[11px] text-stone-500 font-semibold">Today's Earnings</div>
                    <div className="text-2xl font-extrabold text-emerald-700 mt-1">₹{todayEarnings}</div>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="text-[11px] text-stone-500 font-semibold">Customer Rating</div>
                    <div className="text-2xl font-extrabold text-amber-700 mt-1 flex items-center gap-1">
                      ★ {executor?.rating || 4.9}
                    </div>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="text-[11px] text-stone-500 font-semibold">Reliability Score</div>
                    <div className="text-2xl font-extrabold text-teal-700 mt-1">{executor?.reliabilityScore || 98}%</div>
                  </div>
                </div>
              </div>

              {/* Service Profile Summary */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3 text-xs">
                <div className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                  Service Capabilities
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {executor?.capabilities.map((c) => (
                    <span key={c} className="px-2.5 py-1 bg-stone-100 rounded-lg text-stone-700 font-medium">
                      {c.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-600">
                  <span>Service Radius:</span>
                  <span className="font-bold text-stone-800">{executor?.serviceRadiusKm || 8.0} km</span>
                </div>

                <div className="flex items-center justify-between text-stone-600">
                  <span>Base Location:</span>
                  <span className="font-bold text-stone-800">{executor?.location.city || 'Chirala'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KYC & VERIFICATION */}
        {activeTab === 'kyc' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Identity & KYC Verification</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                All providers undergo verified trust checks before receiving tasks.
              </p>
            </div>

            {kycSubmittedMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                {kycSubmittedMessage}
              </div>
            )}

            <form onSubmit={handleSubmitKyc} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase">
                    PAN Number {executor?.kycStatus === 'KYC_APPROVED' && <span className="text-emerald-700 font-semibold normal-case">(Verified)</span>}
                  </label>
                  <input
                    type="text"
                    disabled={executor?.kycStatus === 'KYC_APPROVED'}
                    required
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    placeholder="ABCDE1234F"
                    className="mt-1 block w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase">
                    Aadhaar (Last 4 Digits) {executor?.kycStatus === 'KYC_APPROVED' && <span className="text-emerald-700 font-semibold normal-case">(Verified)</span>}
                  </label>
                  <input
                    type="text"
                    disabled={executor?.kycStatus === 'KYC_APPROVED'}
                    required
                    maxLength={4}
                    value={aadhaarLast4}
                    onChange={(e) => setAadhaarLast4(e.target.value)}
                    placeholder="8892"
                    className="mt-1 block w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              {executor?.kycStatus !== 'KYC_APPROVED' && (
                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 transition"
                  >
                    Save & Submit Documents
                  </button>
                </div>
              )}
            </form>

            <div className="pt-6 border-t border-stone-200">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm text-emerald-950">
                      KYC Approved & Verified
                    </div>
                    <div className="text-xs text-emerald-700">
                      Identity and verification checks are completed.
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded-full">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EARNINGS & HISTORY */}
        {activeTab === 'earnings' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Earnings & Financial Settlements</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Direct provider payouts with transparent 10% platform commission and instant digital invoices.
                </p>
              </div>

              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold">
                {completedTasks.length} Completed Tasks
              </span>
            </div>

            {/* Financial Summary */}
            {(() => {
              const totalGross = completedTasks.reduce((sum, t) => sum + (t.finalCost || t.estimatedCost || 80), 0);
              const platformDeductions = Math.round(totalGross * 0.1);
              const netPayouts = totalGross - platformDeductions;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                    <div className="text-xs font-semibold text-stone-500">Gross Service Volume</div>
                    <div className="text-2xl font-extrabold text-stone-900 mt-1 font-mono">₹{totalGross}</div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <div className="text-xs font-semibold text-amber-800">Platform Commission (10%)</div>
                    <div className="text-2xl font-extrabold text-amber-900 mt-1 font-mono">₹{platformDeductions}</div>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <div className="text-xs font-semibold text-emerald-800">Net Provider Payout (90%)</div>
                    <div className="text-2xl font-extrabold text-emerald-900 mt-1 font-mono">₹{netPayouts}</div>
                  </div>
                </div>
              );
            })()}

            {/* Task Item list */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Settled Task Records
              </h3>

              {completedTasks.length > 0 ? (
                completedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-stone-900">{t.title}</div>
                      <div className="text-xs text-stone-500 mt-0.5">Client: {t.userName} • ₹{t.finalCost || t.estimatedCost}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
                  No completed tasks yet. Keep your availability active to receive dispatches.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AVAILABILITY SHIFT & PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-stone-900">Shift Availability & Location</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase">Base Town</label>
                  <input
                    type="text"
                    value={profileTown}
                    onChange={(e) => setProfileTown(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition"
                >
                  Save Profile Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Direct Chat Modal */}
      {activeTask && isDirectChatOpen && (
        <DirectChatModal
          isOpen={isDirectChatOpen}
          onClose={() => setIsDirectChatOpen(false)}
          task={activeTask}
          currentUserRole="EXECUTOR"
          currentUserId={executor?.id || 'exec_demo'}
          currentUserName={executor?.name || 'Suresh Kumar'}
          targetName={activeTask.userName || 'Client'}
          targetPhone={activeTask.userPhone || '+91 98480 22338'}
        />
      )}

      {/* Payment Settlement Modal */}
      {activeTask && isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          task={activeTask}
          role="EXECUTOR"
          onPaymentComplete={(invoice) => {
            setIsPaymentModalOpen(false);
            setSelectedInvoice(invoice);
            fetchExecutorData();
          }}
        />
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
};
