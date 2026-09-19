import React from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Volume2,
  CheckCircle,
  Clock,
  MapPin,
  ShieldCheck,
  RotateCcw,
  Zap,
  Radio,
} from 'lucide-react';
import { Task } from '../types';

export type VoiceConversationState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface LiveVoiceConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceState: VoiceConversationState;
  userTranscript: string;
  assistantSpeech: string;
  activeTaskPlan?: Task | null;
  isContinuous: boolean;
  onToggleContinuous: () => void;
  onInterrupt: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onConfirmTask?: (taskId: string) => void;
  onSendPresetPhrase: (phrase: string) => void;
}

export const LiveVoiceConversationModal: React.FC<LiveVoiceConversationModalProps> = ({
  isOpen,
  onClose,
  voiceState,
  userTranscript,
  assistantSpeech,
  activeTaskPlan,
  isContinuous,
  onToggleContinuous,
  onInterrupt,
  onStartListening,
  onStopListening,
  onConfirmTask,
  onSendPresetPhrase,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="live-voice-conversation-modal"
      className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex flex-col text-white animate-fadeIn select-none"
    >
      {/* Top Bar */}
      <div className="max-w-4xl w-full mx-auto px-4 py-4 sm:px-6 flex items-center justify-between border-b border-stone-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-stone-950 font-black flex items-center justify-center text-sm shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide flex items-center gap-2 text-stone-100">
              <span>SATHI LIVE VOICE</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                Young Indian Female Voice
              </span>
            </div>
            <div className="text-[11px] text-stone-400">Continuous Hands-Free Assistant</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Hands-free mode toggle pill */}
          <button
            type="button"
            id="toggle-hands-free-voice-btn"
            onClick={onToggleContinuous}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
              isContinuous
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-xs'
                : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isContinuous ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>Hands-free Loop: {isContinuous ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Exit Voice Mode"
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800/80 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Conversation Centerpiece */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col items-center justify-between overflow-y-auto">
        {/* Dynamic Voice State Badge */}
        <div className="pt-2">
          {voiceState === 'listening' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold tracking-wide animate-pulse shadow-lg shadow-rose-900/20">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <span>Listening to your voice... (Speak naturally)</span>
            </div>
          )}
          {voiceState === 'thinking' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/50 text-teal-300 text-xs font-bold tracking-wide shadow-lg shadow-teal-900/20">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
              <span>Sathi is processing & checking regional executors...</span>
            </div>
          )}
          {voiceState === 'speaking' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold tracking-wide shadow-lg shadow-emerald-900/20">
              <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Sathi is speaking...</span>
            </div>
          )}
          {voiceState === 'idle' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 text-xs font-medium">
              <span>Tap the Orb or Mic to begin speaking</span>
            </div>
          )}
        </div>

        {/* The Animated ChatGPT Voice Orb */}
        <div className="relative my-auto flex items-center justify-center p-8">
          {/* Ambient Outer Glow Rings */}
          <div
            className={`absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
              voiceState === 'listening'
                ? 'bg-rose-500/15 scale-110'
                : voiceState === 'thinking'
                ? 'bg-teal-500/20 scale-105 animate-pulse'
                : voiceState === 'speaking'
                ? 'bg-emerald-500/25 scale-125'
                : 'bg-teal-600/10 scale-95'
            }`}
          />

          {/* Animated Wave Ripples */}
          {(voiceState === 'speaking' || voiceState === 'listening') && (
            <>
              <div
                className={`absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-emerald-500/25 animate-ping [animation-duration:3s] pointer-events-none`}
              />
              <div
                className={`absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-teal-500/20 animate-ping [animation-duration:4s] pointer-events-none`}
              />
            </>
          )}

          {/* Interactive Core Orb Button */}
          <button
            type="button"
            id="chatgpt-voice-orb-btn"
            onClick={() => {
              if (voiceState === 'speaking') {
                onInterrupt();
              } else if (voiceState === 'listening') {
                onStopListening();
              } else {
                onStartListening();
              }
            }}
            title={
              voiceState === 'speaking'
                ? 'Tap to Interrupt'
                : voiceState === 'listening'
                ? 'Tap to Pause'
                : 'Tap to Speak'
            }
            className={`relative z-10 w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center p-6 transition-all duration-500 transform active:scale-95 cursor-pointer shadow-2xl focus:outline-none ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-rose-900 via-rose-700 to-amber-600 shadow-rose-600/40 ring-4 ring-rose-400/50'
                : voiceState === 'thinking'
                ? 'bg-gradient-to-tr from-teal-900 via-cyan-800 to-emerald-700 shadow-teal-500/40 ring-4 ring-cyan-400/50 animate-pulse'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-emerald-800 via-teal-600 to-cyan-500 shadow-emerald-500/50 ring-4 ring-emerald-400/60'
                : 'bg-gradient-to-tr from-stone-900 via-stone-800 to-teal-900 shadow-stone-800/60 ring-2 ring-stone-700 hover:ring-teal-500/50'
            }`}
          >
            {/* Center Core Visual */}
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              {voiceState === 'listening' ? (
                <>
                  <Mic className="w-10 h-10 text-white animate-bounce" />
                  <span className="text-xs font-bold text-rose-100 tracking-wider uppercase">Listening</span>
                </>
              ) : voiceState === 'thinking' ? (
                <>
                  <Sparkles className="w-10 h-10 text-cyan-200 animate-spin" />
                  <span className="text-xs font-bold text-cyan-100 tracking-wider uppercase">Thinking</span>
                </>
              ) : voiceState === 'speaking' ? (
                <>
                  <div className="flex items-center gap-1.5 h-10">
                    <span className="w-1.5 bg-white rounded-full animate-bounce [animation-delay:0ms] h-6" />
                    <span className="w-1.5 bg-white rounded-full animate-bounce [animation-delay:150ms] h-10" />
                    <span className="w-1.5 bg-white rounded-full animate-bounce [animation-delay:300ms] h-8" />
                    <span className="w-1.5 bg-white rounded-full animate-bounce [animation-delay:75ms] h-10" />
                    <span className="w-1.5 bg-white rounded-full animate-bounce [animation-delay:225ms] h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-100 tracking-wider uppercase">
                    Tap to Interrupt
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-10 h-10 text-teal-300" />
                  <span className="text-xs font-bold text-stone-200 tracking-wider uppercase">Tap to Speak</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Live Subtitles & Assistant Speech Display */}
        <div className="w-full max-w-xl space-y-3 text-center px-4">
          {/* User's recent spoken transcript */}
          {userTranscript && (
            <div className="text-xs font-medium text-stone-400 bg-stone-900/60 border border-stone-800 rounded-xl px-4 py-2 inline-block max-w-full truncate">
              <span className="text-stone-500 font-semibold mr-1.5">You said:</span>
              <span className="text-stone-200 font-medium italic">"{userTranscript}"</span>
            </div>
          )}

          {/* Sathi's Dynamic Spoken Message */}
          <div className="text-base sm:text-lg font-medium text-stone-100 leading-relaxed min-h-[56px] flex items-center justify-center">
            {assistantSpeech || (
              <span className="text-stone-500 text-sm italic">
                "Hello! Tell me what service you need—like shopping assistance, hospital visits, or medicine pickup."
              </span>
            )}
          </div>
        </div>

        {/* Interactive Task Plan / Service Confirmation Card */}
        {activeTaskPlan && activeTaskPlan.status === 'WAITING_FOR_USER_CONFIRMATION' && (
          <div className="w-full max-w-md mt-4 p-4 bg-stone-900/90 border border-emerald-500/40 rounded-2xl shadow-xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                Service Plan Ready
              </span>
              <span className="font-extrabold text-sm text-emerald-400">
                ₹{activeTaskPlan.estimatedCost}
              </span>
            </div>

            <div className="font-bold text-sm text-stone-100 text-left">
              {activeTaskPlan.title}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-stone-300 text-left">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                <span className="truncate">{activeTaskPlan.pickupLocation?.address || 'Chirala'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                <span>{activeTaskPlan.scheduledAt}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
              <div className="text-[11px] text-stone-400 text-left">
                Say <span className="font-bold text-emerald-300">"Yes, confirm and dispatch"</span>
              </div>
              <button
                type="button"
                id="voice-confirm-task-now-btn"
                onClick={() => onConfirmTask && onConfirmTask(activeTaskPlan.id)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Confirm & Dispatch</span>
              </button>
            </div>
          </div>
        )}

        {/* Assigned Provider Status Notification */}
        {activeTaskPlan && activeTaskPlan.status === 'CONFIRMED' && (
          <div className="w-full max-w-md mt-4 p-4 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl shadow-xl space-y-2 animate-fadeIn text-left">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Service Dispatched Successfully</span>
            </div>
            <p className="text-xs text-stone-300">
              Provider offer sent to verified regional executor. You can continue speaking to Sathi or close this window to view live tracking.
            </p>
          </div>
        )}

        {/* Quick Voice Prompt Shortcuts */}
        <div className="w-full max-w-xl mt-6 pt-4 border-t border-stone-800/70">
          <div className="text-[11px] font-semibold text-stone-400 mb-2">
            Try speaking or tap any service prompt:
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => onSendPresetPhrase('today I need to go for shopping')}
              className="px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:border-teal-500/50 hover:text-white transition"
            >
              "Today I need to go for shopping"
            </button>
            <button
              type="button"
              onClick={() => onSendPresetPhrase('I want to go to the hospital')}
              className="px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:border-teal-500/50 hover:text-white transition"
            >
              "I want to go to the hospital"
            </button>
            <button
              type="button"
              onClick={() => onSendPresetPhrase('Pick up medicines from Apollo Pharmacy')}
              className="px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:border-teal-500/50 hover:text-white transition"
            >
              "Pick up medicines from Apollo"
            </button>
            <button
              type="button"
              onClick={() => onSendPresetPhrase('Yes, confirm and dispatch')}
              className="px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 hover:bg-emerald-900 transition font-bold"
            >
              "Yes, confirm and dispatch"
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="max-w-md w-full mx-auto px-6 py-4 flex items-center justify-between border-t border-stone-800/80 bg-stone-950/90">
        <button
          type="button"
          onClick={() => {
            if (voiceState === 'speaking') {
              onInterrupt();
            } else {
              onSendPresetPhrase('Repeat what you said');
            }
          }}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{voiceState === 'speaking' ? 'Interrupt' : 'Repeat'}</span>
        </button>

        {/* Central mic action button */}
        <button
          type="button"
          id="voice-modal-mic-toggle"
          onClick={() => {
            if (voiceState === 'listening') {
              onStopListening();
            } else {
              onStartListening();
            }
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${
            voiceState === 'listening'
              ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/40'
              : 'bg-teal-600 hover:bg-teal-500 text-white ring-2 ring-teal-400/40'
          }`}
        >
          {voiceState === 'listening' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-stone-400 hover:text-stone-200 transition font-medium"
        >
          Close Voice
        </button>
      </div>
    </div>
  );
};
