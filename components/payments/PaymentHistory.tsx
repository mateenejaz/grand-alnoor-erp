'use client';

import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import PaymentReceipt from './PaymentReceipt';
import { useState } from 'react';

interface PaymentHistoryProps {
  payments: any[];
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center p-6 text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl">
        No payments recorded yet.
      </div>
    );
  }

  let totalReceived = 0;
  let totalRefunded = 0;

  payments.forEach(p => {
    if (p.payment_type?.toLowerCase() === 'refund') {
      totalRefunded += Number(p.amount) || 0;
    } else {
      totalReceived += Number(p.amount) || 0;
    }
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 font-bold">Receipt No.</th>
              <th className="px-4 py-3 font-bold">Date</th>
              <th className="px-4 py-3 font-bold">Type & Method</th>
              <th className="px-4 py-3 font-bold">Received By</th>
              <th className="px-4 py-3 font-bold text-right">Amount (PKR)</th>
              <th className="px-4 py-3 font-bold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((p) => {
              const isRefund = p.payment_type?.toLowerCase() === 'refund';
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-700">{p.receipt_number || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600">{format(new Date(p.payment_date), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">{p.payment_type}</span>
                    <span className="text-gray-500 ml-2">via {p.payment_method}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.received_by || '-'}</td>
                  <td className={`px-4 py-3 text-right font-bold ${isRefund ? 'text-red-600' : 'text-green-600'}`}>
                    {isRefund ? '-' : '+'} {Number(p.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setSelectedReceipt(p)} className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors" title="View Receipt">
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 justify-end text-xs font-bold uppercase tracking-wider">
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
          Total Received: PKR {totalReceived.toLocaleString()}
        </div>
        {totalRefunded > 0 && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200">
            Total Refunded: PKR {totalRefunded.toLocaleString()}
          </div>
        )}
      </div>

      {selectedReceipt && (
        <PaymentReceipt receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  );
}