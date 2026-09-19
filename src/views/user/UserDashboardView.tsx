// Main User Experience & Sathi AI Dashboard: /user
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Header } from '../../components/Header';
import {
  Task,
  Appointment,
  Reminder,
  UserMemory,
  AgentMessage,
  Invoice,
  PlaceResult,
} from '../../types';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  Shield,
  CreditCard,
  Phone,
  Volume2,
  ChevronRight,
  Pill,
  ShoppingBag,
  Car,
  HeartHandshake,
  MoreHorizontal,
  PhoneCall,
  MessageSquare,
  Receipt,
  FileText,
  X,
  Compass,
  Star,
  Building2,
  Stethoscope,
} from 'lucide-react';
import { InvoiceModal } from '../../components/InvoiceModal';
import { DirectChatModal } from '../../components/DirectChatModal';
import { PaymentModal } from '../../components/PaymentModal';
import { RealtimeVoiceInterface } from '../../components/RealtimeVoiceInterface';

export const UserDashboardView: React.FC = () => {
  const { user, logout, navigate } = useAuth();

  // Navigation tabs matching Screenshots: Dashboard, My Requests, Appointments, Reminders
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'appointments' | 'reminders'>('dashboard');

  // Sathi Chat & Voice States
  const [sessionId] = useState<string>(() => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'sathi',
      text: "Hello Kumar! I'm Sathi, your personal voice service coordinator. What can I take care of for you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoiceLang, setSelectedVoiceLang] = useState<'en-IN' | 'te-IN' | 'hi-IN'>('en-IN');
  const [discoveredPlaces, setDiscoveredPlaces] = useState<PlaceResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isRealtimeVoiceOpen, setIsRealtimeVoiceOpen] = useState(false);

  // Core Data States
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDirectChatOpen, setIsDirectChatOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Recognition and Speech Synthesis
  const recognitionRef = useRef<any>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleSendMessage(transcript, true);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition status:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition && !speechSupported) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }

        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        // Speech Recognition language using selectedVoiceLang (defaults to en-IN for English)
        recognition.lang = selectedVoiceLang;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsListening(false);
          handleSendMessage(transcript, true);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition status:', e);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } catch (e: any) {
        if (e?.name === 'InvalidStateError' || e?.message?.includes('already started')) {
          console.warn('Speech recognition was already active');
          setIsListening(true);
        } else {
          console.error('Speech recognition start failed:', e);
          setIsListening(false);
        }
      }
    }
  };

  const speakText = (text: string, isVoiceConversation = false) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Check script
    const isTeluguText = /[\u0C00-\u0C7F]/.test(text);
    const isHindiText = /[\u0900-\u097F]/.test(text);

    // Format 4-digit verification codes with spaces so TTS pronounces every digit accurately (e.g. "8 2 4 1")
    const formattedText = text.replace(/\b(\d{4})\b/g, (match) => match.split('').join(' '));

    const cleanText = formattedText
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/₹(\d+)/g, '$1 rupees')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

    // Select young, soft female Indian voice matching language strictly (NEVER use Hindi voice for English)
    let softYoungFemaleIndianVoice: SpeechSynthesisVoice | undefined;

    if (isTeluguText) {
      softYoungFemaleIndianVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith('te') || v.name.toLowerCase().includes('telugu')) ||
        voices.find(
          (v) =>
            (v.lang === 'en-IN' || v.lang === 'hi-IN') &&
            (v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('heera') ||
              v.name.toLowerCase().includes('swara') ||
              v.name.toLowerCase().includes('neerja') ||
              v.name.toLowerCase().includes('google') ||
              v.name.toLowerCase().includes('natural'))
        ) ||
        voices.find((v) => v.lang === 'en-IN' || v.lang === 'hi-IN') ||
        voices[0];
    } else if (isHindiText) {
      softYoungFemaleIndianVoice = voices.find((v) => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
    } else {
      // English text -> ONLY select English voices
      softYoungFemaleIndianVoice =
        voices.find(
          (v) =>
            v.lang === 'en-IN' &&
            (v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('heera') ||
              v.name.toLowerCase().includes('ananya') ||
              v.name.toLowerCase().includes('neerja') ||
              v.name.toLowerCase().includes('google') ||
              v.name.toLowerCase().includes('natural'))
        ) ||
        voices.find((v) => v.lang === 'en-IN') ||
        voices.find((v) => v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira')));
    }

    if (softYoungFemaleIndianVoice) {
      utterance.voice = softYoungFemaleIndianVoice;
      utterance.lang = softYoungFemaleIndianVoice.lang || (isTeluguText ? 'te-IN' : isHindiText ? 'hi-IN' : 'en-IN');
    } else {
      utterance.lang = isTeluguText ? 'te-IN' : isHindiText ? 'hi-IN' : 'en-IN';
    }
    utterance.rate = 0.95; // Soft, gentle, natural pacing
    utterance.pitch = 1.18; // Young, soft female tone

    utterance.onend = () => {
      // If triggered in voice mode, seamlessly re-enable microphone listening after speaking
      if (isVoiceConversation) {
        setTimeout(() => {
          toggleListening();
        }, 300);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Poll tasks & data
  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const [tasksRes, apptsRes, remsRes, memsRes, invoicesRes] = await Promise.allSettled([
        api.getTasks({ userId: user.id }),
        api.getAppointments(user.id),
        api.getReminders(user.id),
        api.getMemories(user.id),
        api.getInvoices({ userId: user.id }),
      ]);

      if (tasksRes.status === 'fulfilled') {
        const allTasks = tasksRes.value || [];
        const CONFIRMED_ACTIVE_STATUSES = [
          'CONFIRMED',
          'OFFER_SENT',
          'SEARCHING_EXECUTOR',
          'EXECUTOR_ASSIGNED',
          'ACCEPTED',
          'IN_PROGRESS',
          'ARRIVED',
          'TASK_EXECUTED',
        ];
        const active = allTasks.find((t) => CONFIRMED_ACTIVE_STATUSES.includes(t.status)) || null;
        setActiveTask(active);
        setRecentTasks(allTasks);
      }
      if (apptsRes.status === 'fulfilled') setAppointments(apptsRes.value || []);
      if (remsRes.status === 'fulfilled') setReminders(remsRes.value || []);
      if (memsRes.status === 'fulfilled') setMemories(memsRes.value || []);
      if (invoicesRes.status === 'fulfilled') setInvoices(invoicesRes.value || []);
    } catch (err) {
      console.warn('Dashboard poll status:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3500);
    return () => clearInterval(interval);
  }, [user]);

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleViewInvoice = (task?: Task | null) => {
    const targetTask = task || activeTask;
    if (!targetTask) return;

    const existingInv = invoices.find((i) => i.taskId === targetTask.id);
    if (existingInv) {
      setSelectedInvoice(existingInv);
    } else {
      const generatedInvoice: Invoice = {
        id: `inv_${targetTask.id}`,
        taskId: targetTask.id,
        taskTitle: targetTask.title,
        serviceType: targetTask.serviceType || 'OTHER',
        userId: targetTask.userId,
        userName: user?.name || 'Kumar Reddy',
        userPhone: user?.phone || '+91 98765 43210',
        executorId: targetTask.assignedExecutorId || 'exec_suresh',
        executorName: targetTask.assignedExecutorName || 'Suresh Kumar',
        executorPhone: targetTask.assignedExecutorPhone || '+91 94401 23456',
        amount: targetTask.estimatedCost || 90,
        platformFeeRate: 0.1,
        platformFee: Math.round((targetTask.estimatedCost || 90) * 0.1),
        executorPayout: Math.round((targetTask.estimatedCost || 90) * 0.9),
        paymentMode: 'UPI',
        upiTransactionRef: `UPI${Date.now()}SATHI`,
        paymentStatus: 'PAID',
        issuedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setSelectedInvoice(generatedInvoice);
    }
  };

  // Send message to Sathi Agent
  const handleSendMessage = async (text: string, isVoice = false) => {
    if (!text.trim() || !user || isProcessing) return;

    const userText = text.trim();
    setInputText('');
    setIsProcessing(true);

    const userMsg: AgentMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
      voiceTranscript: isVoice,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await api.sendChatMessage(sessionId, user.id, userText, isVoice);
      setMessages((prev) => [...prev, response]);

      if (response.structuredData?.taskPlan && response.structuredData.taskPlan.id) {
        const plan = response.structuredData.taskPlan as Task;
        if (['CONFIRMED', 'OFFER_SENT', 'SEARCHING_EXECUTOR', 'EXECUTOR_ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ARRIVED', 'TASK_EXECUTED'].includes(plan.status)) {
          setActiveTask(plan);
        }
      }

      if (response.structuredData?.places && Array.isArray(response.structuredData.places)) {
        setDiscoveredPlaces(response.structuredData.places);
      }

      if (!isMuted) {
        speakText(response.text, isVoice);
      }

      await fetchDashboardData();
    } catch (err: any) {
      const errorReply = "I encountered a brief connection issue. Could you please repeat that?";
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'sathi',
          text: errorReply,
          timestamp: new Date().toISOString(),
        },
      ]);
      if (!isMuted) speakText(errorReply, isVoice);
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Action Buttons
  const handleQuickServiceClick = (serviceType: string, defaultPrompt: string) => {
    handleSendMessage(defaultPrompt);
  };

  // Step Calculation for Active Service Progress Bar
  const getProgressStep = (status?: string) => {
    if (!status) return 1;
    switch (status) {
      case 'DRAFT':
      case 'WAITING_FOR_USER_CONFIRMATION':
        return 1;
      case 'CONFIRMED':
      case 'OFFER_SENT':
      case 'SEARCHING_EXECUTOR':
        return 2;
      case 'EXECUTOR_ASSIGNED':
        return 3;
      case 'ACCEPTED':
        return 4;
      case 'IN_PROGRESS':
        return 5;
      case 'ARRIVED':
      case 'TASK_EXECUTED':
        return 6;
      case 'COMPLETED':
        return 7;
      default:
        return 2;
    }
  };

  const currentStep = getProgressStep(activeTask?.status);

  const PROGRESS_STEPS = [
    { number: 1, label: 'Confirmed' },
    { number: 2, label: 'Searching Provider' },
    { number: 3, label: 'Provider Assigned' },
    { number: 4, label: 'Accepted' },
    { number: 5, label: 'In Progress' },
    { number: 6, label: 'Arrived' },
    { number: 7, label: 'Completed' },
  ];

  const userFirstName = user?.name ? user.name.split(' ')[0] : 'Kumar';

  return (
    <div className="min-h-screen bg-stone-50/60 flex flex-col">
      {/* Top Header Navbar */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'requests', label: 'My Requests' },
          { id: 'appointments', label: 'Appointments' },
          { id: 'reminders', label: 'Reminders' },
        ]}
        accentColor="teal"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Main Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Hero Welcome Header */}
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                {getGreeting()}, {userFirstName}
              </h1>
              <p className="text-sm sm:text-base text-stone-500 mt-1.5 font-normal">
                What can Sathi take care of for you today?
              </p>
            </div>

            {/* Active Service Card Banner if exists */}
            {activeTask && (
              <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
                {/* Dark Teal Header */}
                <div className="bg-teal-700 px-6 py-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-200 block">
                        ACTIVE SERVICE
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                        {activeTask.title}
                      </h2>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200 block">
                      ESTIMATED FEE
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white">
                      ₹{activeTask.estimatedCost || 90}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-6">
                  {/* 4-Digit Service Verification Code Banner */}
                  <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                          4-Digit Service Verification Code
                        </div>
                        <div className="text-xs text-amber-800 mt-0.5">
                          Share this code with your verified provider upon service completion.
                        </div>
                      </div>
                    </div>

                    <div className="bg-white px-4 py-2 rounded-xl border border-amber-300/90 shadow-xs flex items-center gap-2">
                      <span className="text-xl sm:text-2xl font-black tracking-widest text-stone-900 font-mono">
                        {activeTask.verificationCode || '8241'}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Provider Box */}
                  <div className="p-4 bg-teal-50/50 border border-teal-100/90 rounded-2xl flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-teal-200/60 text-teal-900 font-black text-base flex items-center justify-center shrink-0">
                        {activeTask.assignedExecutorName ? activeTask.assignedExecutorName[0] : 'P'}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-stone-500">
                          Assigned Verified Provider
                        </div>
                        <div className="text-sm font-bold text-stone-900 flex items-center gap-2 mt-0.5">
                          {activeTask.assignedExecutorName ? (
                            <>
                              <span>{activeTask.assignedExecutorName}</span>
                              <span className="text-xs text-stone-400 font-normal">
                                ({activeTask.assignedExecutorPhone || '+91 94401 23456'})
                              </span>
                            </>
                          ) : (
                            <span className="text-amber-700 flex items-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Dispatching to candidate...</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Service Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="view-invoice-btn"
                        onClick={() => handleViewInvoice(activeTask)}
                        className="px-3.5 py-2 bg-white hover:bg-stone-50 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-teal-700" />
                        <span>View Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Tracker Title */}
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-6">
                      Service Coordination Progress
                    </h3>

                    {/* 7-Step Horizontal Progress Bar */}
                    <div className="relative flex items-center justify-between max-w-4xl mx-auto px-2">
                      {/* Connecting Background Line */}
                      <div className="absolute top-4 left-6 right-6 h-0.5 bg-stone-200 -z-0" />
                      {/* Active Progress Fill Line */}
                      <div
                        className="absolute top-4 left-6 h-0.5 bg-emerald-500 -z-0 transition-all duration-500"
                        style={{
                          width: `${((currentStep - 1) / (PROGRESS_STEPS.length - 1)) * 95}%`,
                        }}
                      />

                      {PROGRESS_STEPS.map((step) => {
                        const isDone = step.number < currentStep;
                        const isCurrent = step.number === currentStep;

                        return (
                          <div key={step.number} className="flex flex-col items-center relative z-10">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isDone
                                  ? 'bg-emerald-600 text-white'
                                  : isCurrent
                                  ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                                  : 'bg-stone-200 text-stone-500'
                              }`}
                            >
                              {isDone ? <CheckCircle className="w-4 h-4" /> : step.number}
                            </div>
                            <span
                              className={`text-[11px] font-semibold text-center mt-2 max-w-[70px] leading-tight ${
                                isCurrent
                                  ? 'text-teal-900 font-bold'
                                  : isDone
                                  ? 'text-stone-700'
                                  : 'text-stone-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Badge Center */}
                  <div className="text-center pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Status: {activeTask.status}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Central Sathi Voice Card (Idle / Listening States) */}
            <div className="bg-white rounded-[28px] border border-stone-200/90 shadow-xs p-8 sm:p-10 flex flex-col items-center justify-center relative">

              {/* Voice Language Selector Pills */}
              <div className="flex items-center gap-1.5 mb-4 bg-stone-100/90 p-1 rounded-full border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => setSelectedVoiceLang('en-IN')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedVoiceLang === 'en-IN'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVoiceLang('te-IN')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedVoiceLang === 'te-IN'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  తెలుగు
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVoiceLang('hi-IN')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedVoiceLang === 'hi-IN'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  हिंदी
                </button>
              </div>

              {/* Central Voice Button */}
              <div className="flex flex-col items-center my-3">
                <button
                  type="button"
                  id="sathi-main-voice-mic-btn"
                  onClick={toggleListening}
                  className={`w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 transform active:scale-95 shadow-md relative ${
                    isListening
                      ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white ring-8 ring-rose-100 animate-pulse'
                      : isProcessing
                      ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white ring-8 ring-teal-100 animate-pulse'
                      : 'bg-gradient-to-br from-[#0090FF] to-[#4F46E5] text-white hover:scale-105 hover:shadow-lg'
                  }`}
                  title={isListening ? 'Tap to stop listening' : 'Tap to start real-time voice conversation'}
                >
                  {isListening ? (
                    <MicOff className="w-9 h-9 text-white" />
                  ) : isProcessing ? (
                    <RefreshCw className="w-9 h-9 text-white animate-spin" />
                  ) : (
                    <Mic className="w-9 h-9 text-white stroke-[2.2]" />
                  )}
                </button>

                {/* Animated Waveform Visualizer on Active Listening */}
                {isListening && (
                  <div className="flex items-center gap-1.5 mt-4 h-6">
                    <span className="w-1 bg-rose-500 rounded-full animate-[bounce_1s_infinite_100ms] h-4"></span>
                    <span className="w-1 bg-rose-500 rounded-full animate-[bounce_1s_infinite_300ms] h-6"></span>
                    <span className="w-1 bg-amber-500 rounded-full animate-[bounce_1s_infinite_200ms] h-3"></span>
                    <span className="w-1 bg-orange-500 rounded-full animate-[bounce_1s_infinite_400ms] h-5"></span>
                    <span className="w-1 bg-rose-500 rounded-full animate-[bounce_1s_infinite_150ms] h-4"></span>
                  </div>
                )}

                <div className="text-sm font-bold text-stone-800 text-center mt-3">
                  {isListening
                    ? 'Listening... Speak your request naturally'
                    : isProcessing
                    ? 'Sathi is understanding your request...'
                    : "Tap to turn on voice conversation"}
                </div>
              </div>

              {/* Latest Assistant Message Bubble if any */}
              {messages.length > 1 && (
                <div className="w-full max-w-2xl bg-stone-50 border border-stone-200/80 rounded-2xl p-4 my-4 text-xs text-stone-700 leading-relaxed text-center">
                  {messages[messages.length - 1].text}
                </div>
              )}

              {/* Text Input Bar */}
              <div className="w-full max-w-2xl mt-4 flex items-center gap-2">
                <input
                  type="text"
                  id="user-dashboard-chat-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                  placeholder="Type your request to Sathi and press Enter..."
                  className="flex-1 bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition shadow-2xs"
                />
              </div>
            </div>

            {/* Quick Service Actions Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                  QUICK SERVICE ACTIONS
                </h3>
                <span className="text-xs text-stone-400 font-medium">
                  Tap to coordinate with Sathi
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* 1. Medicine Pickup */}
                <button
                  type="button"
                  onClick={() => handleQuickServiceClick('MEDICINE_PICKUP', 'I need medicine pickup from Apollo Pharmacy')}
                  className="p-4 bg-white border border-stone-200/90 rounded-2xl hover:border-teal-400 hover:shadow-sm transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition">
                    <Pill className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-900">Medicine Pickup</div>
                    <div className="text-xs text-stone-500 mt-0.5">Prescription pickup from pharmacy</div>
                  </div>
                </button>

                {/* 2. Grocery Assistance */}
                <button
                  type="button"
                  onClick={() => handleQuickServiceClick('GROCERY', 'I need grocery assistance at local supermarket')}
                  className="p-4 bg-white border border-stone-200/90 rounded-2xl hover:border-amber-400 hover:shadow-sm transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition">
                    <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-900">Grocery Assistance</div>
                    <div className="text-xs text-stone-500 mt-0.5">Supermarket shopping support</div>
                  </div>
                </button>

                {/* 3. Transportation */}
                <button
                  type="button"
                  onClick={() => handleQuickServiceClick('TRANSPORTATION', 'I need transportation door-to-door transit to clinic')}
                  className="p-4 bg-white border border-stone-200/90 rounded-2xl hover:border-indigo-400 hover:shadow-sm transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition">
                    <Car className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-900">Transportation</div>
                    <div className="text-xs text-stone-500 mt-0.5">Door-to-door transit to clinic</div>
                  </div>
                </button>

                {/* 4. Companion Care */}
                <button
                  type="button"
                  onClick={() => handleQuickServiceClick('COMPANION_CARE', 'I need companion care friendly walking or reading escort')}
                  className="p-4 bg-white border border-stone-200/90 rounded-2xl hover:border-rose-400 hover:shadow-sm transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition">
                    <HeartHandshake className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-900">Companion Care</div>
                    <div className="text-xs text-stone-500 mt-0.5">Friendly walking or reading escort</div>
                  </div>
                </button>

                {/* 5. Appointment */}
                <button
                  type="button"
                  onClick={() => handleQuickServiceClick('APPOINTMENT', 'Schedule doctor clinic appointment visit')}
                  className="p-4 bg-white border border-stone-200/90 rounded-2xl hover:border-blue-400 hover:shadow-sm transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Calendar className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-900">Appointment</div>
                    <div className="text-xs text-stone-500 mt-0.5">Schedule clinic or doctor visit</div>
                  </div>
                </button>

                {/* 6. Other Service */}
                <button
                  type="button"
                  onClick={() => handleQuickServiceClick('OTHER', 'I need custom assistance')}
                  className="p-4 bg-white border border-stone-200/90 rounded-2xl hover:border-stone-400 hover:shadow-sm transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center shrink-0 border border-stone-200 group-hover:bg-stone-700 group-hover:text-white transition">
                    <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-900">Other Service</div>
                    <div className="text-xs text-stone-500 mt-0.5">Custom coordinated assistance</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Two Summary Cards: Upcoming Appointments & Today's Reminders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming Appointments */}
              <div className="p-6 bg-white border border-stone-200/90 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-stone-900">Upcoming Appointments</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="text-xs font-bold text-teal-700 hover:underline"
                  >
                    View All
                  </button>
                </div>

                {appointments.length > 0 ? (
                  <div className="space-y-2">
                    {appointments.slice(0, 2).map((apt) => (
                      <div key={apt.id} className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                        <div className="font-semibold text-xs text-stone-900">{apt.title || apt.doctorOrService}</div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{apt.scheduledTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-stone-400">
                    No appointments scheduled. Tell Sathi: "Doctor visit tomorrow at 10 AM".
                  </div>
                )}
              </div>

              {/* Today's Reminders */}
              <div className="p-6 bg-white border border-stone-200/90 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-stone-900">Today's Reminders</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('reminders')}
                    className="text-xs font-bold text-teal-700 hover:underline"
                  >
                    View All
                  </button>
                </div>

                {reminders.length > 0 ? (
                  <div className="space-y-2">
                    {reminders.slice(0, 2).map((rem) => (
                      <div key={rem.id} className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                        <div className="font-semibold text-xs text-stone-900">{rem.title}</div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{rem.dueTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-stone-400">
                    No reminders due today. Tell Sathi: "Remind me to take blood pressure pill at 9 AM".
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Requests Subtab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-900">My Service Requests</h2>
                <p className="text-xs text-stone-500">Track and review all services coordinated by Sathi</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-3.5 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold hover:bg-teal-100 transition"
              >
                + New Request
              </button>
            </div>

            <div className="space-y-3">
              {recentTasks.length === 0 ? (
                <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl">
                  <p className="text-xs text-stone-500">No previous requests found.</p>
                </div>
              ) : (
                recentTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 bg-white border border-stone-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">{t.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                          {t.status}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mt-1">
                        Fee: ₹{t.estimatedCost} • Assigned: {t.assignedExecutorName || 'Searching provider...'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewInvoice(t)}
                        className="px-3 py-1.5 bg-white hover:bg-stone-50 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-700" />
                        <span>View Invoice</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Appointments Subtab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Upcoming Appointments</h2>
                <p className="text-xs text-stone-500">Medical checkups and hospital appointments</p>
              </div>
            </div>

            <div className="space-y-3">
              {appointments.length === 0 ? (
                <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl">
                  <p className="text-xs text-stone-500">No appointments scheduled.</p>
                </div>
              ) : (
                appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-5 bg-white border border-stone-200 rounded-2xl flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-sm text-stone-900">{apt.title || apt.doctorOrService}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{apt.scheduledTime} • {apt.location || 'Clinic'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Reminders Subtab */}
        {activeTab === 'reminders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Daily Reminders</h2>
                <p className="text-xs text-stone-500">Medications and scheduled daily tasks</p>
              </div>
            </div>

            <div className="space-y-3">
              {reminders.length === 0 ? (
                <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl">
                  <p className="text-xs text-stone-500">No reminders registered today.</p>
                </div>
              ) : (
                reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-5 bg-white border border-stone-200 rounded-2xl flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-sm text-stone-900">{rem.title}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{rem.dueTime} • {rem.recurrenceRule || 'Daily'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Direct Chat & Payment Modals */}
      {isDirectChatOpen && activeTask && (
        <DirectChatModal
          isOpen={isDirectChatOpen}
          onClose={() => setIsDirectChatOpen(false)}
          task={activeTask}
          currentUserRole="USER"
          currentUserId={user?.id || 'usr_demo'}
          currentUserName={user?.name || 'Kumar Reddy'}
          targetName={activeTask.assignedExecutorName || 'Suresh Kumar'}
          targetPhone={activeTask.assignedExecutorPhone || '+91 94401 23456'}
        />
      )}

      {isPaymentModalOpen && activeTask && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          task={activeTask}
          role="USER"
          onPaymentComplete={() => {
            setIsPaymentModalOpen(false);
            fetchDashboardData();
          }}
        />
      )}

      {selectedInvoice && (
        <InvoiceModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
        />
      )}

      {/* Real-Time Interactive Voice Modal */}
      <RealtimeVoiceInterface
        isOpen={isRealtimeVoiceOpen}
        onClose={() => setIsRealtimeVoiceOpen(false)}
        userId={user?.id || 'usr_demo'}
        userName={user?.name || 'Kumar Reddy'}
        sessionId={sessionId}
        onTaskCreated={(task) => {
          setActiveTask(task);
          fetchDashboardData();
        }}
      />
    </div>
  );
};
