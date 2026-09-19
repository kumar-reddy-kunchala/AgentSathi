import React, { useState, useEffect, useRef } from 'react';
import { DirectMessage, Task } from '../types';
import { api } from '../lib/api';
import {
  X,
  Send,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  User,
  Clock,
  PhoneCall,
} from 'lucide-react';

interface DirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  currentUserRole: 'USER' | 'EXECUTOR';
  currentUserId: string;
  currentUserName: string;
  targetName: string;
  targetPhone?: string;
}

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  isOpen,
  onClose,
  task,
  currentUserRole,
  currentUserId,
  currentUserName,
  targetName,
  targetPhone,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const list = await api.getTaskMessages(task.id);
      setMessages(list);
    } catch (e) {
      console.error('Failed to load task messages:', e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, task.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let timer: any;
    if (isCalling) {
      timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCalling]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const newMsg = await api.sendTaskMessage(task.id, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        text: text.trim(),
      });
      setMessages((prev) => [...prev, newMsg]);
      if (!textToSend) setInputText('');
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPresets =
    currentUserRole === 'USER'
      ? [
          'I am waiting near the front entrance.',
          'Please take care of fragile items.',
          'My landmark is near the pharmacy.',
          'Thank you, see you soon!',
        ]
      : [
          'I am on my way to your location.',
          'I have arrived at the spot.',
          'Please share the 4-digit verification code when ready.',
          'Task completed! You can pay via Cash or UPI QR.',
        ];

  return (
    <div
      id="direct-chat-modal"
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-white text-stone-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-stone-200 flex flex-col h-[560px]">
        {/* Header */}
        <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600/30 text-teal-300 flex items-center justify-center border border-teal-500/30 font-bold">
              {targetName.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>{targetName}</span>
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  {currentUserRole === 'USER' ? 'Verified Provider' : 'Client'}
                </span>
              </div>
              <div className="text-xs text-stone-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Task: {task.title.substring(0, 30)}...</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Phone Call Button */}
            {targetPhone && (
              <button
                type="button"
                id="call-contact-btn"
                onClick={() => setIsCalling(!isCalling)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition border ${
                  isCalling
                    ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                    : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isCalling ? `End (${callDuration}s)` : 'Call'}</span>
              </button>
            )}

            <button
              type="button"
              id="close-direct-chat-btn"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* In-Call Active Banner */}
        {isCalling && (
          <div className="bg-emerald-950 text-emerald-300 px-4 py-2 text-xs flex items-center justify-between border-b border-emerald-800/80">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 animate-bounce text-emerald-400" />
              <span>
                Connected voice call with <strong>{targetName}</strong> ({targetPhone})
              </span>
            </div>
            <span className="font-mono font-bold bg-emerald-900 px-2 py-0.5 rounded">
              00:{callDuration.toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Chat Message List */}
        <div className="flex-1 p-4 overflow-y-auto bg-stone-50 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto text-stone-300 mb-2 opacity-70" />
              <p className="font-medium text-stone-600">No messages yet</p>
              <p className="text-[11px] mt-0.5">Send a quick message or call directly to coordinate.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderRole === currentUserRole;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-stone-400 mb-1 px-1">
                    {isMine ? 'You' : m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div
                    className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                      isMine
                        ? 'bg-teal-700 text-white rounded-br-none'
                        : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick presets */}
        <div className="px-3 py-2 bg-white border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap no-scrollbar">
          <span className="text-stone-400 font-semibold text-[10px] uppercase mr-1">Quick:</span>
          {quickPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(preset)}
              className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Message Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-stone-200 flex items-center gap-2"
        >
          <input
            type="text"
            id="direct-chat-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${targetName}...`}
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          />
          <button
            type="submit"
            id="send-direct-chat-btn"
            disabled={!inputText.trim() || isLoading}
            className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white transition flex items-center gap-1 text-xs font-semibold"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
