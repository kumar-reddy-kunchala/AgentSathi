import React, { useState } from 'react';
import { Task, Invoice } from '../types';
import { api } from '../lib/api';
import {
  X,
  CheckCircle,
  QrCode,
  IndianRupee,
  ShieldCheck,
  Receipt,
  Sparkles,
  Banknote,
  Smartphone,
  Copy,
  ExternalLink,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  role: 'USER' | 'EXECUTOR';
  onPaymentComplete: (invoice: Invoice) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  task,
  role,
  onPaymentComplete,
}) => {
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedVpa, setCopiedVpa] = useState(false);

  if (!isOpen) return null;

  const totalAmount = task.finalCost || task.estimatedCost || 120;
  const platformFee = Math.round(totalAmount * 0.10);
  const executorPayout = totalAmount - platformFee;
  const vpa = 'serviceagent.pay@okhdfcbank';
  const upiDeepLink = `upi://pay?pa=${vpa}&pn=ServiceAgent&am=${totalAmount}&cu=INR&tn=Task_${task.id}`;

  const handleSettlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await api.completePaymentAndInvoice({
        taskId: task.id,
        paymentMode,
        amount: totalAmount,
        upiTransactionRef: paymentMode === 'UPI' ? `UPI_REF_${Date.now()}` : undefined,
      });

      if (res.success && res.invoice) {
        onPaymentComplete(res.invoice);
      } else {
        setError('Settlement failed. Please try again.');
      }
    } catch (e: any) {
      setError(e.message || 'Payment processing error');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  return (
    <div
      id="service-payment-modal"
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-white text-stone-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>Service Settlement & Payment</span>
                <span className="text-[10px] bg-teal-900 text-teal-300 px-2 py-0.5 rounded-full font-semibold border border-teal-500/30">
                  {role === 'EXECUTOR' ? 'Provider Portal' : 'User Checkout'}
                </span>
              </div>
              <div className="text-xs text-stone-400">10% Platform Fee & Direct Payout Calculation</div>
            </div>
          </div>
          <button
            type="button"
            id="close-payment-modal-btn"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-stone-700">
          {/* Service Title & Amount Badge */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Service Task</span>
              <div className="font-bold text-sm text-stone-900 mt-0.5">{task.title}</div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Provider: <strong>{task.assignedExecutorName || 'Assigned Provider'}</strong>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Total Due</span>
              <div className="text-xl font-black text-teal-900 font-mono">₹{totalAmount}</div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* UPI Option */}
              <button
                type="button"
                id="select-payment-upi-btn"
                onClick={() => setPaymentMode('UPI')}
                className={`flex flex-col items-start p-3.5 rounded-xl border-2 transition text-left ${
                  paymentMode === 'UPI'
                    ? 'border-teal-600 bg-teal-50/50 text-teal-900 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Smartphone className="w-4 h-4 text-teal-600" />
                    <span>UPI / Scan QR</span>
                  </div>
                  {paymentMode === 'UPI' && (
                    <span className="w-2 h-2 rounded-full bg-teal-600" />
                  )}
                </div>
                <p className="text-[11px] text-stone-500">GPay, PhonePe, Paytm, BHIM</p>
              </button>

              {/* Cash Option */}
              <button
                type="button"
                id="select-payment-cash-btn"
                onClick={() => setPaymentMode('CASH')}
                className={`flex flex-col items-start p-3.5 rounded-xl border-2 transition text-left ${
                  paymentMode === 'CASH'
                    ? 'border-teal-600 bg-teal-50/50 text-teal-900 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Cash on Service</span>
                  </div>
                  {paymentMode === 'CASH' && (
                    <span className="w-2 h-2 rounded-full bg-teal-600" />
                  )}
                </div>
                <p className="text-[11px] text-stone-500">Pay directly in cash to provider</p>
              </button>
            </div>
          </div>

          {/* UPI QR Display if UPI selected */}
          {paymentMode === 'UPI' && (
            <div className="border border-teal-200 bg-teal-50/40 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
              <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs">
                <QrCode className="w-4 h-4" />
                <span>Scan to Pay ₹{totalAmount}</span>
              </div>

              {/* Dynamic QR Code Canvas Visual */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
                <svg
                  viewBox="0 0 160 160"
                  className="w-36 h-36 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="160" height="160" fill="#ffffff" />
                  {/* Outer corner markers */}
                  <rect x="10" y="10" width="40" height="40" fill="#0f766e" rx="4" />
                  <rect x="18" y="18" width="24" height="24" fill="#ffffff" />
                  <rect x="24" y="24" width="12" height="12" fill="#0f766e" />

                  <rect x="110" y="10" width="40" height="40" fill="#0f766e" rx="4" />
                  <rect x="118" y="18" width="24" height="24" fill="#ffffff" />
                  <rect x="124" y="24" width="12" height="12" fill="#0f766e" />

                  <rect x="10" y="110" width="40" height="40" fill="#0f766e" rx="4" />
                  <rect x="18" y="118" width="24" height="24" fill="#ffffff" />
                  <rect x="24" y="124" width="12" height="12" fill="#0f766e" />

                  {/* QR Matrix Bits */}
                  <rect x="60" y="15" width="10" height="10" fill="#1e293b" />
                  <rect x="75" y="25" width="10" height="10" fill="#1e293b" />
                  <rect x="90" y="15" width="10" height="10" fill="#1e293b" />
                  <rect x="60" y="35" width="15" height="10" fill="#1e293b" />
                  <rect x="85" y="35" width="15" height="10" fill="#1e293b" />

                  <rect x="20" y="60" width="15" height="10" fill="#1e293b" />
                  <rect x="45" y="60" width="25" height="10" fill="#1e293b" />
                  <rect x="80" y="60" width="20" height="10" fill="#1e293b" />
                  <rect x="115" y="60" width="25" height="10" fill="#1e293b" />

                  <rect x="15" y="80" width="20" height="10" fill="#1e293b" />
                  <rect x="45" y="75" width="30" height="15" fill="#0f766e" rx="2" />
                  <rect x="85" y="80" width="25" height="10" fill="#1e293b" />
                  <rect x="125" y="80" width="20" height="10" fill="#1e293b" />

                  <rect x="60" y="105" width="15" height="10" fill="#1e293b" />
                  <rect x="85" y="105" width="15" height="10" fill="#1e293b" />
                  <rect x="60" y="125" width="35" height="15" fill="#1e293b" />
                  <rect x="110" y="115" width="20" height="20" fill="#1e293b" />
                  <rect x="135" y="125" width="15" height="15" fill="#1e293b" />

                  {/* Center Rupee Badge */}
                  <circle cx="80" cy="80" r="14" fill="#0f766e" />
                  <text
                    x="80"
                    y="86"
                    fontSize="16"
                    fontWeight="bold"
                    fill="#ffffff"
                    textAnchor="middle"
                  >
                    ₹
                  </text>
                </svg>
              </div>

              {/* UPI ID / Deep Link Copy */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-teal-200">
                <span className="font-mono text-stone-700 text-[11px]">{vpa}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(vpa)}
                  className="text-teal-700 hover:text-teal-900 transition flex items-center gap-1 font-semibold"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedVpa ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <a
                href={upiDeepLink}
                className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 underline underline-offset-2"
              >
                <span>Tap to open installed UPI App</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Platform Fee (10%) Itemized Split */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex justify-between text-stone-600">
              <span>Gross Service Cost:</span>
              <span className="font-bold text-stone-900">₹{totalAmount}</span>
            </div>
            <div className="flex justify-between text-stone-600 items-center">
              <span className="flex items-center gap-1">
                <span>Platform Commission (10% platform fee):</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-semibold">
                  Admin Cut
                </span>
              </span>
              <span className="font-bold text-teal-800 font-mono">₹{platformFee}</span>
            </div>
            <div className="flex justify-between text-stone-600 items-center">
              <span>Provider Payout (90% to {task.assignedExecutorName || 'Provider'}):</span>
              <span className="font-bold text-emerald-800 font-mono">₹{executorPayout}</span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              id="confirm-payment-settlement-btn"
              disabled={isProcessing}
              onClick={handleSettlePayment}
              className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <span>Generating Official Invoice & Settling...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {paymentMode === 'UPI'
                      ? `Confirm UPI Payment Received (₹${totalAmount})`
                      : `Mark Cash Payment Collected (₹${totalAmount})`}
                  </span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-stone-500 mt-2">
              Invoice will be instantly generated for the user and 10% platform fee credited to admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
