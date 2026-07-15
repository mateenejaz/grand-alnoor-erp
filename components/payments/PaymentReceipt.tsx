'use client';

import { X, Printer } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentReceiptProps {
  receipt: any;
  onClose: () => void;
}

export default function PaymentReceipt({ receipt, onClose }: PaymentReceiptProps) {
  if (!receipt) return null;
  const isRefund = receipt.payment_type?.toLowerCase() === 'refund';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Screen Action Bar */}
        <div className="bg-gray-100 px-6 py-4 flex justify-between items-center shrink-0 print:hidden border-b border-gray-200">
          <h2 className="font-bold text-gray-700">Receipt Viewer</h2>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-lg flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5 text-gray-600" /></button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-10 md:p-14 bg-white print:p-8">
          <div className="text-center mb-8 border-b-2 border-gray-100 pb-8">
            <h1 className="text-3xl font-black text-[#1F3864] font-serif uppercase tracking-tight">Grand Alnoor</h1>
            <p className="text-gray-500 text-sm mt-1">Marquee & Banquet Hall • Sahiwal, Punjab</p>
            <div className="mt-6 inline-block bg-gray-50 px-6 py-2 rounded-lg border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest">
                {isRefund ? 'Refund Receipt' : 'Payment Receipt'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Receipt Number</p>
              <p className="font-mono font-bold text-lg text-gray-900">{receipt.receipt_number || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date</p>
              <p className="font-bold text-gray-900">{format(new Date(receipt.payment_date), 'MMMM do, yyyy')}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Transaction Amount</p>
              <p className={`text-4xl font-black font-serif ${isRefund ? 'text-red-600' : 'text-[#1F3864]'}`}>
                PKR {Number(receipt.amount).toLocaleString()}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-gray-600"><span className="font-bold">Type:</span> {receipt.payment_type}</p>
              <p className="text-xs text-gray-600"><span className="font-bold">Method:</span> {receipt.payment_method}</p>
              <p className="text-xs text-gray-600"><span className="font-bold">Staff:</span> {receipt.received_by || 'Not specified'}</p>
            </div>
          </div>

          {receipt.notes && (
            <div className="mb-10 text-sm text-gray-600">
              <span className="font-bold text-gray-900">Notes: </span>{receipt.notes}
            </div>
          )}

          <div className="border-t border-gray-200 pt-10 mt-16 flex justify-between">
            <div className="text-center w-48">
              <div className="border-t border-gray-400 pt-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Authorized Signature
              </div>
            </div>
            <div className="text-center text-[10px] text-gray-400 uppercase tracking-wider">
              System Generated Receipt
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}