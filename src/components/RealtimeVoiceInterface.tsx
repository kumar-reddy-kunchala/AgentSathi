// Sathi Real-Time Voice Interface Component with Microphone API (Web Audio + Speech Recognition)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Radio,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
  Send,
  Zap,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  Sliders,
  Maximize2,
  Minimize2,
  Info,
} from 'lucide-react';
import { api } from '../lib/api';
import { AgentMessage, Task } from '../types';

export type VoiceState = 'IDLE' | 'LISTENING' | 'ANALYZING' | 'SPEAKING' | 'ERROR';

export interface RealtimeVoiceInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  sessionId: string;
  onTaskCreated?: (task: Task) => void;
  initialPrompt?: string;
}

export const RealtimeVoiceInterface: React.FC<RealtimeVoiceInterfaceProps> = ({
  isOpen,
  onClose,
  userId,
  userName = 'User',
  sessionId,
  onTaskCreated,
  initialPrompt,
}) => {
  // Voice State Machine
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isMuted, setIsMuted] = useState(false);
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [language, setLanguage] = useState<string>('en-IN');
  const [isExpanded, setIsExpanded] = useState(false);

  // Supported Languages
  const languagesList = [
    { code: 'en-IN', label: 'English (India)' },
    { code: 'te-IN', label: 'తెలుగు (Telugu)' },
    { code: 'hi-IN', label: 'हिंदी (Hindi)' },
    { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
    { code: 'kn-IN', label: 'కన్నడ (Kannada)' },
    { code: 'ml-IN', label: 'മലയാളം (Malayalam)' },
    { code: 'bn-IN', label: 'বাংলা (Bengali)' },
    { code: 'mr-IN', label: 'मराठी (Marathi)' },
    { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)' },
    { code: 'es-ES', label: 'Español' },
    { code: 'fr-FR', label: 'Français' },
    { code: 'de-DE', label: 'Deutsch' },
  ];

  // Audio & Speech Metrics
  const [volumeLevel, setVolumeLevel] = useState(0); // 0 - 100 normalized
  const [decibels, setDecibels] = useState(-60); // dBFS
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  // Transcripts & Assistant Dialogue
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [sathiReply, setSathiReply] = useState<string>(
    `Hello ${userName}! I'm Sathi, your personal service coordinator. Tell me what service you need—like hospital assistance, medicine pickup, or groceries.`
  );
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ sender: 'user' | 'sathi'; text: string; timestamp: string }>
  >([]);

  // Task Plan & Orchestration Details
  const [proposedTask, setProposedTask] = useState<Task | null>(null);
  const [orchestrationStep, setOrchestrationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Web Audio API & MediaStream Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Speech Recognition & Speech Synthesis Refs
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isComponentMountedRef = useRef(true);
  const lastSpokenTextRef = useRef('');

  // Auto-chime generator using Web Audio API
  const playChime = useCallback((type: 'start' | 'success' | 'alert') => {
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'start') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (e) {
      // AudioContext unavailable or blocked
    }
  }, []);

  // ----------------------------------------------------
  // 1. HARDWARE MICROPHONE API INITIALIZATION
  // ----------------------------------------------------
  const initializeMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Microphone API is not supported in this browser environment.');
      setVoiceState('ERROR');
      return false;
    }

    try {
      setErrorMessage('');
      // Request physical microphone stream with noise suppression & echo cancellation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setMicPermission('granted');

      // Create Web Audio Context and Analyser Node
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start real-time audio visualization and volume calculation
      startAudioMeterLoop();
      return true;
    } catch (err: any) {
      console.warn('Microphone access denied or failed:', err);
      setMicPermission('denied');
      setErrorMessage(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser.'
          : `Microphone error: ${err.message || 'Unable to access input device'}`
      );
      setVoiceState('ERROR');
      return false;
    }
  }, []);

  // ----------------------------------------------------
  // 2. REAL-TIME AUDIO METER & CANVAS WAVEFORM LOOP
  // ----------------------------------------------------
  const startAudioMeterLoop = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Uint8Array(analyser.fftSize);

    const render = () => {
      if (!isComponentMountedRef.current) return;

      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(timeDomainArray);

      // Calculate Root Mean Square (RMS) for precise decibel volume
      let sumSquares = 0;
      for (let i = 0; i < timeDomainArray.length; i++) {
        const normalized = (timeDomainArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / timeDomainArray.length);
      const calculatedDb = Math.round(20 * Math.log10(Math.max(rms, 0.0001)));
      const normalizedVolume = Math.min(100, Math.max(0, Math.round(rms * 280)));

      setDecibels(calculatedDb);
      setVolumeLevel(normalizedVolume);

      // Voice Activity Detection (VAD) threshold
      const speaking = normalizedVolume > 14 && !isMuted;
      setIsUserSpeaking(speaking);

      // Canvas Rendering
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          // Draw frequency spectrum bars
          const barCount = 32;
          const barWidth = (width / barCount) - 3;
          const centerY = height / 2;

          for (let i = 0; i < barCount; i++) {
            const index = Math.floor((i / barCount) * bufferLength * 0.7);
            const value = dataArray[index] || 0;
            const barHeight = Math.max(4, (value / 255) * (height * 0.85));

            const x = i * (barWidth + 3) + 2;
            const y = centerY - barHeight / 2;

            // Dynamic gradient based on voice state and intensity
            const gradient = ctx.createLinearGradient(x, centerY - barHeight / 2, x, centerY + barHeight / 2);
            if (speaking) {
              gradient.addColorStop(0, '#10b981'); // emerald-500
              gradient.addColorStop(0.5, '#14b8a6'); // teal-500
              gradient.addColorStop(1, '#06b6d4'); // cyan-500
            } else {
              gradient.addColorStop(0, '#334155');
              gradient.addColorStop(0.5, '#475569');
              gradient.addColorStop(1, '#1e293b');
            }

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 4);
            ctx.fill();
          }

          // Center waveform line
          ctx.lineWidth = speaking ? 2.5 : 1.5;
          ctx.strokeStyle = speaking ? 'rgba(52, 211, 153, 0.8)' : 'rgba(148, 163, 184, 0.3)';
          ctx.beginPath();
          const sliceWidth = width / timeDomainArray.length;
          let lx = 0;
          for (let i = 0; i < timeDomainArray.length; i++) {
            const v = timeDomainArray[i] / 128.0;
            const ly = (v * height) / 2;
            if (i === 0) {
              ctx.moveTo(lx, ly);
            } else {
              ctx.lineTo(lx, ly);
            }
            lx += sliceWidth;
          }
          ctx.stroke();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  }, [isMuted]);

  // ----------------------------------------------------
  // 3. SPEECH RECOGNITION (STT) WITH STREAMING INTERIM RESULTS
  // ----------------------------------------------------
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech Recognition not supported in this browser.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState('LISTENING');
        setErrorMessage('');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentFinal += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (currentFinal) {
          const trimmedFinal = currentFinal.trim();
          setFinalTranscript(trimmedFinal);
          setInterimTranscript('');

          // Auto-send to Sathi after brief pause on speech completion
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          silenceTimerRef.current = setTimeout(() => {
            if (trimmedFinal && trimmedFinal !== lastSpokenTextRef.current) {
              lastSpokenTextRef.current = trimmedFinal;
              dispatchUserRequestToSathi(trimmedFinal);
            }
          }, 1200);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech Recognition event:', e);
        if (e.error === 'no-speech') {
          // Normal silence, keep waiting
        } else if (e.error === 'audio-capture' || e.error === 'not-allowed') {
          setMicPermission('denied');
          setErrorMessage('Microphone access is not permitted.');
          setVoiceState('ERROR');
        }
      };

      recognition.onend = () => {
        // Auto-restart recognition if in hands-free mode and modal is open
        if (isComponentMountedRef.current && isHandsFree && voiceState === 'LISTENING') {
          try {
            recognition.start();
          } catch (err: any) {
            if (err?.name !== 'InvalidStateError') {
              console.warn('Auto-restart speech recognition error:', err);
            }
          }
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err: any) {
        if (err?.name === 'InvalidStateError' || err?.message?.includes('already started')) {
          console.warn('Speech recognition already started');
        } else {
          console.error('Failed to start speech recognition:', err);
        }
      }
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
    }
  }, [language, isHandsFree, voiceState]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = newLang;
      } catch (err) { }
    }
  };

  // ----------------------------------------------------
  // 4. SEND USER REQUEST TO SATHI AI ORCHESTRATION ENGINE
  // ----------------------------------------------------
  const dispatchUserRequestToSathi = async (userInput: string) => {
    if (!userInput.trim()) return;

    // Auto-switch voice UI language to English if user input is English
    const isEnglishInput = !/[\u0C00-\u0C7F\u0900-\u097F]/.test(userInput) && /[a-zA-Z]{2,}/.test(userInput);
    if (isEnglishInput && !language.startsWith('en')) {
      handleLanguageChange('en-IN');
    }

    // Stop listening while Sathi orchestrates
    setVoiceState('ANALYZING');
    setOrchestrationStep('Sathi AI analyzing request & checking regional service requirements...');
    playChime('start');

    // Add user message to local voice conversation history
    setConversationHistory((prev) => [
      ...prev,
      { sender: 'user', text: userInput, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);

    try {
      // Direct call to Sathi Agentic Orchestration Backend API
      const response: AgentMessage = await api.sendChatMessage(sessionId, userId, userInput, true);

      const replyText = response.text || "I've understood your service request.";
      setSathiReply(replyText);

      // Record Sathi message in conversation history
      setConversationHistory((prev) => [
        ...prev,
        { sender: 'sathi', text: replyText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);

      // Check if a Task Plan was formulated by Sathi
      if (response.structuredData?.taskPlan) {
        const plan = response.structuredData.taskPlan as Task;
        setProposedTask(plan);
        if (onTaskCreated) {
          onTaskCreated(plan);
        }
        setOrchestrationStep('Service Plan formulated with verified regional executors.');
      } else {
        setOrchestrationStep('');
      }

      playChime('success');

      // Speak Sathi's response naturally with Web Speech API
      speakSathiResponse(replyText);
    } catch (err: any) {
      console.error('Sathi orchestration error:', err);
      const fallback = "I had a moment of interference connecting to our service coordinators. Could you please repeat that?";
      setSathiReply(fallback);
      speakSathiResponse(fallback);
    }
  };

  // ----------------------------------------------------
  // 5. NATURAL TEXT-TO-SPEECH (TTS) FOR SATHI
  // ----------------------------------------------------
  const speakSathiResponse = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setVoiceState(isHandsFree ? 'LISTENING' : 'IDLE');
      return;
    }

    window.speechSynthesis.cancel();
    setVoiceState('SPEAKING');

    const cleanText = text
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/₹(\d+)/g, '$1 rupees')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Multilingual Voice Support across all languages
    const voices = window.speechSynthesis.getVoices();
    const langCode = language.split('-')[0].toLowerCase();

    // Script checks on response text: English text must be spoken with English TTS
    const hasTeluguScript = /[\u0C00-\u0C7F]/.test(cleanText);
    const hasDevanagariScript = /[\u0900-\u097F]/.test(cleanText);
    const isEnglishText = !hasTeluguScript && !hasDevanagariScript && /[a-zA-Z]{3,}/.test(cleanText);

    const isTelugu = hasTeluguScript || (langCode === 'te' && !isEnglishText);
    const isHindi = (hasDevanagariScript && !/आहे|करा|घरी/.test(cleanText)) || (langCode === 'hi' && !isEnglishText);
    const isTamil = /[\u0B80-\u0BFF]/.test(cleanText) || langCode === 'ta';
    const isKannada = /[\u0C80-\u0CFF]/.test(cleanText) || langCode === 'kn';
    const isMalayalam = /[\u0D00-\u0D7F]/.test(cleanText) || langCode === 'ml';
    const isBengali = /[\u0980-\u09FF]/.test(cleanText) || langCode === 'bn';
    const isMarathi = (/[\u0900-\u097F]/.test(cleanText) && /आहे|करा|घरी/.test(cleanText)) || langCode === 'mr';
    const isGujarati = /[\u0A80-\u0AFF]/.test(cleanText) || langCode === 'gu';
    const isSpanish = langCode === 'es';
    const isFrench = langCode === 'fr';
    const isGerman = langCode === 'de';

    let selectedVoice: SpeechSynthesisVoice | undefined;
    let targetLang = language;

    if (isTelugu) {
      selectedVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith('te') || v.name.toLowerCase().includes('telugu')) ||
        voices.find(
          (v) =>
            (v.lang === 'en-IN' || v.lang === 'hi-IN') &&
            (v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('heera') ||
              v.name.toLowerCase().includes('google') ||
              v.name.toLowerCase().includes('natural'))
        ) ||
        voices.find((v) => v.lang === 'en-IN' || v.lang === 'hi-IN') ||
        voices[0];
      targetLang = selectedVoice?.lang || 'te-IN';
    } else if (isHindi) {
      targetLang = 'hi-IN';
      selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi'));
    } else if (isTamil) {
      targetLang = 'ta-IN';
      selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ta') || v.name.toLowerCase().includes('tamil'));
    } else if (isKannada) {
      targetLang = 'kn-IN';
      selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('kn') || v.name.toLowerCase().includes('kannada'));
    } else if (isMalayalam) {
      targetLang = 'ml-IN';
      selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ml') || v.name.toLowerCase().includes('malayalam'));
    } else if (isBengali) {
      targetLang = 'bn-IN';
      selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('bn') || v.name.toLowerCase().includes('bengali'));
    } else if (isMarathi) {
      targetLang = 'mr-IN';
      selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('mr') || v.name.toLowerCase().includes('marathi'));
    } else if (isGujarati) {
      targetLang = 'gu-IN';
      selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('gu') || v.name.toLowerCase().includes('gujarati'));
    } else if (isSpanish) {
      targetLang = 'es-ES';
      selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('es'));
    } else if (isFrench) {
      targetLang = 'fr-FR';
      selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('fr'));
    } else if (isGerman) {
      targetLang = 'de-DE';
      selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('de'));
    } else {
      targetLang = 'en-IN';
      selectedVoice =
        voices.find((v) => v.lang === 'en-IN' && (v.name.includes('India') || v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Heera') || v.name.includes('Neerja'))) ||
        voices.find((v) => v.lang.startsWith('en-IN')) ||
        voices.find((v) => v.lang.startsWith('en'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = targetLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.1;

    utterance.onend = () => {
      if (!isComponentMountedRef.current) return;
      // Return to listening mode smoothly if hands-free is on
      if (isHandsFree) {
        setVoiceState('LISTENING');
        setInterimTranscript('');
        try {
          recognitionRef.current?.start();
        } catch (e) { }
      } else {
        setVoiceState('IDLE');
      }
    };

    utterance.onerror = () => {
      if (isComponentMountedRef.current) {
        setVoiceState('IDLE');
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Barge-in / Interrupt Sathi Speech
  const handleInterrupt = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('LISTENING');
    try {
      recognitionRef.current?.start();
    } catch (e) { }
  };

  // Confirm Task Plan Directly via Voice Interface
  const handleConfirmTask = async () => {
    if (!proposedTask) return;
    try {
      setOrchestrationStep('Dispatching task to highest-ranked regional provider...');
      await api.confirmTask(proposedTask.id);
      playChime('success');
      const confirmSpeech = `Wonderful! Your task "${proposedTask.title}" is confirmed. Sathi has dispatched it to our verified regional providers in Chirala. You will receive an audio chime the moment a provider accepts.`;
      setSathiReply(confirmSpeech);
      setProposedTask(null);
      speakSathiResponse(confirmSpeech);
    } catch (err) {
      console.error('Task confirmation error:', err);
    }
  };

  // Toggle Mute on Hardware Microphone Stream
  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      const newMuted = !isMuted;
      audioTracks.forEach((track) => {
        track.enabled = !newMuted;
      });
      setIsMuted(newMuted);
    }
  };

  // Manual Trigger to start speaking
  const handleManualStart = async () => {
    if (voiceState === 'SPEAKING') {
      handleInterrupt();
      return;
    }
    if (micPermission !== 'granted') {
      const ok = await initializeMicrophone();
      if (!ok) return;
    }
    startSpeechRecognition();
  };

  // Initialize on modal open
  useEffect(() => {
    isComponentMountedRef.current = true;

    if (isOpen) {
      initializeMicrophone().then((ok) => {
        if (ok) {
          startSpeechRecognition();
          if (initialPrompt) {
            dispatchUserRequestToSathi(initialPrompt);
          }
        }
      });
    }

    return () => {
      isComponentMountedRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) { }
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) { }
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="sathi-realtime-voice-interface"
      className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-xl flex flex-col text-white animate-fadeIn select-none"
    >
      {/* Top Header Bar */}
      <div className="max-w-5xl w-full mx-auto px-4 py-4 sm:px-6 flex items-center justify-between border-b border-stone-800/90">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-stone-950 font-black flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">
                SATHI REAL-TIME VOICE
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Mic API Active
              </span>
            </div>
            <div className="text-xs text-stone-400">
              Autonomous Indian Service Orchestration • Hands-Free
            </div>
          </div>
        </div>

        {/* Top Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Language Toggle Buttons */}
          <div className="hidden md:flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => handleLanguageChange('en-IN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${language.startsWith('en')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
                }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('te-IN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${language.startsWith('te')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
                }`}
            >
              తెలుగు
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('hi-IN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${language.startsWith('hi')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
                }`}
            >
              हिंदी
            </button>
          </div>

          {/* Multi-Language Selector Dropdown */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            title="Select Spoken Language"
          >
            {languagesList.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-stone-900 text-white">
                {lang.label}
              </option>
            ))}
          </select>

          {/* Hands-Free Loop Toggle */}
          <button
            type="button"
            onClick={() => setIsHandsFree(!isHandsFree)}
            title="Toggle Continuous Hands-free Conversation"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${isHandsFree
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isHandsFree ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>Hands-Free: {isHandsFree ? 'ON' : 'OFF'}</span>
          </button>

          {/* Mute Mic Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            className={`p-2 rounded-xl border transition ${isMuted
                ? 'bg-rose-950 border-rose-600 text-rose-300'
                : 'bg-stone-900 border-stone-700 text-stone-300 hover:text-white'
              }`}
          >
            {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Close Interface */}
          <button
            type="button"
            onClick={onClose}
            title="Exit Voice Mode"
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Core Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 flex flex-col items-center justify-between overflow-y-auto">
        {/* Status Pills & Audio Level Indicator */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Voice State Badge */}
          <div>
            {voiceState === 'LISTENING' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold tracking-wide shadow-lg shadow-emerald-950/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Microphone Active • Listening to your request...</span>
              </div>
            )}
            {voiceState === 'ANALYZING' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/90 border border-teal-500/60 text-teal-300 text-xs font-bold tracking-wide shadow-lg shadow-teal-950/40">
                <RefreshCw className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                <span>Sathi Orchestrating Service Requirements...</span>
              </div>
            )}
            {voiceState === 'SPEAKING' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 text-xs font-bold tracking-wide shadow-lg shadow-cyan-950/40">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                <span>Sathi Speaking (Tap Orb to Interrupt)</span>
              </div>
            )}
            {voiceState === 'IDLE' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 text-xs font-medium">
                <span>Tap the Orb or Mic to begin speaking</span>
              </div>
            )}
            {voiceState === 'ERROR' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-950 border border-rose-700 text-rose-300 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMessage || 'Microphone error'}</span>
              </div>
            )}
          </div>

          {/* Decibel & VU Level Meter from Real Audio Stream */}
          <div className="flex items-center gap-2.5 bg-stone-900/90 px-3 py-1.5 rounded-xl border border-stone-800">
            <span className="text-[11px] font-mono text-stone-400">INPUT:</span>
            <div className="w-24 h-2 bg-stone-800 rounded-full overflow-hidden flex items-center">
              <div
                className={`h-full transition-all duration-75 rounded-full ${isUserSpeaking
                    ? 'bg-gradient-to-r from-teal-400 to-emerald-400 shadow-xs'
                    : 'bg-stone-600'
                  }`}
                style={{ width: `${volumeLevel}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-stone-300 font-bold min-w-[36px] text-right">
              {decibels > -60 ? `${decibels} dB` : 'SILENT'}
            </span>
          </div>
        </div>

        {/* Real-time Web Audio Canvas Visualizer */}
        <div className="w-full max-w-lg my-2 flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={480}
            height={70}
            className="w-full h-16 rounded-xl bg-stone-900/50 border border-stone-800/80 shadow-inner"
          />
        </div>

        {/* The Animated Sathi Voice Core Orb */}
        <div className="relative my-2 flex items-center justify-center p-6">
          {/* Ambient Outer Glow Rings */}
          <div
            className={`absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${voiceState === 'LISTENING'
                ? 'bg-emerald-500/20 scale-110'
                : voiceState === 'ANALYZING'
                  ? 'bg-teal-500/25 scale-105 animate-pulse'
                  : voiceState === 'SPEAKING'
                    ? 'bg-cyan-500/25 scale-120'
                    : 'bg-stone-700/10 scale-95'
              }`}
          />

          {/* Interactive Core Orb Button */}
          <button
            type="button"
            id="sathi-voice-core-orb"
            onClick={handleManualStart}
            title={
              voiceState === 'SPEAKING'
                ? 'Tap to Interrupt'
                : voiceState === 'LISTENING'
                  ? 'Listening... tap to pause'
                  : 'Tap to Speak'
            }
            className={`relative z-10 w-40 h-40 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center p-6 transition-all duration-500 transform active:scale-95 cursor-pointer shadow-2xl focus:outline-none ${voiceState === 'LISTENING'
                ? 'bg-gradient-to-tr from-teal-900 via-emerald-700 to-teal-500 shadow-emerald-500/40 ring-4 ring-emerald-400/50'
                : voiceState === 'ANALYZING'
                  ? 'bg-gradient-to-tr from-teal-950 via-cyan-900 to-teal-800 shadow-teal-500/40 ring-4 ring-cyan-400/50 animate-pulse'
                  : voiceState === 'SPEAKING'
                    ? 'bg-gradient-to-tr from-emerald-800 via-teal-600 to-cyan-500 shadow-cyan-500/40 ring-4 ring-cyan-400/60'
                    : 'bg-gradient-to-tr from-stone-900 via-stone-850 to-teal-950 shadow-stone-850/60 ring-2 ring-stone-700 hover:ring-teal-500/50'
              }`}
          >
            <div className="flex flex-col items-center justify-center text-center space-y-1.5">
              {voiceState === 'LISTENING' ? (
                <>
                  <Mic className="w-9 h-9 text-white animate-bounce" />
                  <span className="text-[11px] font-extrabold text-emerald-100 tracking-wider uppercase">
                    Listening
                  </span>
                </>
              ) : voiceState === 'ANALYZING' ? (
                <>
                  <Sparkles className="w-9 h-9 text-cyan-200 animate-spin" />
                  <span className="text-[11px] font-extrabold text-cyan-100 tracking-wider uppercase">
                    Orchestrating
                  </span>
                </>
              ) : voiceState === 'SPEAKING' ? (
                <>
                  <div className="flex items-center gap-1.5 h-8">
                    <span className="w-1.5 bg-white rounded-full animate-bounce [animation-delay:0ms] h-5" />
                    <span className="w-1.5 bg-white rounded-full animate-bounce [animation-delay:150ms] h-8" />
                    <span className="w-1.5 bg-white rounded-full animate-bounce [animation-delay:300ms] h-6" />
                    <span className="w-1.5 bg-white rounded-full animate-bounce [animation-delay:75ms] h-8" />
                    <span className="w-1.5 bg-white rounded-full animate-bounce [animation-delay:225ms] h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold text-cyan-100 tracking-wider uppercase">
                    Interrupt
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-9 h-9 text-teal-300" />
                  <span className="text-[11px] font-extrabold text-stone-200 tracking-wider uppercase">
                    Tap to Speak
                  </span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Live Subtitles, Streaming Transcript & Sathi Voice Response */}
        <div className="w-full max-w-2xl space-y-3 text-center px-4">
          {/* Live Streaming Speech Transcript (Interim & Final) */}
          {(interimTranscript || finalTranscript) && (
            <div className="text-xs font-medium text-stone-300 bg-stone-900/80 border border-stone-700/80 rounded-xl px-4 py-2 inline-block max-w-full">
              <span className="text-teal-400 font-bold mr-1.5">You:</span>
              <span className="text-stone-100">
                "{finalTranscript}
                <span className="text-teal-300 font-semibold italic">{interimTranscript}</span>"
              </span>
            </div>
          )}

          {/* Sathi's Dynamic Spoken Message */}
          <div className="text-base sm:text-lg font-medium text-stone-100 leading-relaxed min-h-[50px] flex items-center justify-center">
            <span>{sathiReply}</span>
          </div>

          {/* Orchestration status ticker */}
          {orchestrationStep && (
            <div className="text-xs text-teal-400 font-medium flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-teal-300 animate-pulse" />
              <span>{orchestrationStep}</span>
            </div>
          )}
        </div>

        {/* Formulated Service Task Plan Card (if Sathi prepared one) */}
        {proposedTask && (
          <div className="w-full max-w-md my-3 p-4 bg-stone-900/95 border border-emerald-500/50 rounded-2xl shadow-2xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Sathi Service Proposal Formulated
              </span>
              <span className="font-extrabold text-sm text-emerald-400 font-mono">
                ₹{proposedTask.estimatedCost}
              </span>
            </div>

            <div className="font-bold text-sm text-stone-100 text-left">
              {proposedTask.title}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-stone-300 text-left">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="truncate">{proposedTask.pickupLocation?.city || 'Chirala'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{new Date(proposedTask.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmTask}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm & Dispatch Provider</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Indian Senior Service Voice Presets */}
        <div className="w-full max-w-2xl mt-4 pt-3 border-t border-stone-800/80">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center justify-between">
            <span>Instant Voice Prompts</span>
            <span className="text-[10px] text-stone-500 font-normal">Tap to simulate voice request</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                label: 'Hospital Escort',
                text: 'Sathi, I need someone to accompany me to Apollo Hospital tomorrow at 10 AM.',
              },
              {
                label: 'Medicine Pickup',
                text: 'Please arrange medicine pickup from Apollo Pharmacy on Chirala Road.',
              },
              {
                label: 'Grocery Assistance',
                text: 'I need assistance buying fresh vegetables and groceries from the market.',
              },
              {
                label: 'Bank Life Certificate',
                text: 'Can someone help me visit the SBI Bank branch to submit my life certificate?',
              },
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setFinalTranscript(preset.text);
                  dispatchUserRequestToSathi(preset.text);
                }}
                className="p-2.5 text-left bg-stone-900/70 hover:bg-stone-850 border border-stone-800 hover:border-emerald-500/40 rounded-xl text-xs text-stone-300 hover:text-white transition flex items-center justify-between group"
              >
                <div className="truncate mr-2">
                  <div className="font-bold text-emerald-400 text-[11px]">{preset.label}</div>
                  <div className="truncate text-stone-400 text-[11px]">{preset.text}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-emerald-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
