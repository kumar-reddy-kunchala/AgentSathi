import React from 'react';
import { Invoice } from '../types';
import {
  X,
  Printer,
  CheckCircle,
  ShieldCheck,
  QrCode,
  IndianRupee,
  Calendar,
  Building,
  User,
  Phone,
  Receipt,
} from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  isOpen?: boolean;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose, isOpen = true }) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="invoice-details-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-white text-stone-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base flex items-center gap-2">
                <span>Tax Invoice / Service Receipt</span>
                <span className="text-[11px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                  PAID
                </span>
              </div>
              <div className="text-xs text-stone-400">Official Settlement Receipt & Breakdown</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="print-invoice-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 transition"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              id="close-invoice-modal-btn"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-6 space-y-6 text-sm">
          {/* Top Brand & Invoice Metadata */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-stone-200">
            <div>
              <div className="text-xl font-black tracking-tight text-teal-800 flex items-center gap-1.5">
                <span>ServiceAgent</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Verified Platform
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Autonomous Assisted Care & Regional Dispatch Engine
              </p>
              <p className="text-xs text-stone-500">GSTIN / Reg: 37AAACS1289P1Z3</p>
            </div>
            <div className="sm:text-right space-y-1">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Invoice Number</div>
              <div className="font-mono font-bold text-lg text-stone-900">{invoice.id}</div>
              <div className="text-xs text-stone-500 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(invoice.issuedAt).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Party Details: Billed To & Service Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div>
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Billed To (Customer)</span>
              </div>
              <div className="font-bold text-stone-800">{invoice.userName}</div>
              {invoice.userPhone && <div className="text-xs text-stone-600">{invoice.userPhone}</div>}
              {invoice.userAddress && (
                <div className="text-xs text-stone-500 mt-1 line-clamp-2">{invoice.userAddress}</div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Service Provider (Regional Executor)</span>
              </div>
              <div className="font-bold text-stone-800 flex items-center gap-1.5">
                <span>{invoice.executorName}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                  KYC Verified
                </span>
              </div>
              {invoice.executorPhone && (
                <div className="text-xs text-stone-600">{invoice.executorPhone}</div>
              )}
              <div className="text-xs text-stone-500 mt-1">ID: {invoice.executorId}</div>
            </div>
          </div>

          {/* Service Line Items */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-700 font-semibold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4">Service Description</th>
                  <th className="py-2.5 px-4 text-center">Type</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-stone-900">{invoice.taskTitle}</div>
                    <div className="text-[11px] text-stone-500">Ref: {invoice.taskId}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700">
                      {invoice.serviceType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-stone-900">
                    ₹{invoice.amount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Settlement Breakdown & Platform Fee (10%) */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Gross Service Value</span>
              <span className="font-medium text-stone-800">₹{invoice.amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs text-stone-600 items-center">
              <span className="flex items-center gap-1">
                <span>Platform Facilitation Fee (10% platform cut)</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-semibold">
                  Admin Revenue
                </span>
              </span>
              <span className="font-medium text-teal-800 font-mono">
                ₹{invoice.platformFee.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-xs text-stone-600 items-center">
              <span>Provider Payout (90% net earnings to {invoice.executorName})</span>
              <span className="font-medium text-emerald-800 font-mono">
                ₹{invoice.executorPayout.toFixed(2)}
              </span>
            </div>

            <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm font-bold text-stone-900">
              <div className="flex items-center gap-2">
                <span>Total Amount Paid</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                  Via {invoice.paymentMode === 'UPI' ? 'UPI / QR Code' : 'Cash'}
                </span>
              </div>
              <span className="text-base text-teal-900 font-mono">₹{invoice.amount.toFixed(2)}</span>
            </div>
            {invoice.upiTransactionRef && (
              <div className="text-[11px] text-stone-500 font-mono pt-1">
                UPI Reference ID: {invoice.upiTransactionRef}
              </div>
            )}
          </div>

          {/* Footer & Compliance Notice */}
          <div className="text-[11px] text-stone-500 border-t border-stone-200 pt-3 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verified Computer-Generated Invoice. No signature required.</span>
            </div>
            <div className="text-stone-400">ServiceAgent Autonomous Coordinator</div>
          </div>

          {/* Action Close Button */}
          <div className="pt-2 flex items-center justify-end border-t border-stone-100">
            <button
              type="button"
              id="invoice-bottom-close-btn"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
