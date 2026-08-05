'use client';
import { supabase } from '@/lib/accounting/accounts';
import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  User,
  Phone,
  CreditCard,
  Building,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  getCustomerLedgerDetail,
  CustomerLedgerDetail as ICustomerLedgerDetail,
} from '@/lib/accounting/customerLedger';
import { formatPKR } from '@/lib/accounting/accounts';

interface CustomerLedgerDetailProps {
  customerId: string;
  businessId: string;
  onClose: () => void;
}

export default function CustomerLedgerDetailModal({
  customerId,
  businessId,
  onClose,
}: CustomerLedgerDetailProps) {
  const [detail, setDetail] = useState<ICustomerLedgerDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      const data = await getCustomerLedgerDetail(customerId, businessId);
      setDetail(data);
      setLoading(false);
    }
    fetchDetail();
  }, [customerId, businessId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-full md:h-[95vh] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-[#1F3864] text-white px-6 py-4 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B8860B]/20 border border-[#B8860B]/40 flex items-center justify-center text-[#B8860B] font-bold">
              CL
            </div>
            <div>
              <h2 className="text-lg font-bold">Customer Ledger Statement</h2>
              <p className="text-xs text-blue-200">Detailed account & payment history</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#B8860B] hover:bg-[#966d09] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Statement</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:overflow-visible">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <Loader2 className="w-8 h-8 text-[#1F3864] animate-spin" />
              <p className="text-xs text-gray-500 font-medium">
                Loading customer statement...
              </p>
            </div>
          ) : !detail ? (
            <div className="p-8 text-center text-gray-500">
              Customer record not found.
            </div>
          ) : (
            <>
              {/* Print Only Header */}
              <div className="hidden print:block mb-6 border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black text-[#1F3864] uppercase font-serif">
                      Grand Alnoor
                    </h1>
                    <p className="text-xs text-gray-600 font-bold">
                      CUSTOMER ACCOUNT STATEMENT
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="bg-gradient-to-r from-blue-50/50 to-amber-50/30 p-5 rounded-xl border border-blue-100/80 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#1F3864]" />
                    <h3 className="text-lg font-bold text-gray-900">
                      {detail.customerName}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pl-6">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {detail.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      CNIC: {detail.cnic}
                    </span>
                  </div>
                </div>

                <div className="text-right border-l border-gray-200 pl-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    Outstanding Debt
                  </span>
                  <span
                    className={`text-xl font-black ${
                      detail.outstandingBalance > 0
                        ? 'text-red-600'
                        : detail.outstandingBalance < 0
                        ? 'text-emerald-600'
                        : 'text-gray-800'
                    }`}
                  >
                    {formatPKR(detail.outstandingBalance)}
                  </span>
                </div>
              </div>

              {/* Financial Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    Total Invoiced
                  </span>
                  <p className="text-base font-extrabold text-gray-900 mt-0.5">
                    {formatPKR(detail.totalInvoiced)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    Total Paid
                  </span>
                  <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                    {formatPKR(detail.totalPaid)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    Total Refunds
                  </span>
                  <p className="text-base font-extrabold text-amber-600 mt-0.5">
                    {formatPKR(detail.totalRefunds)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    Net Received
                  </span>
                  <p className="text-base font-extrabold text-blue-700 mt-0.5">
                    {formatPKR(detail.netReceived)}
                  </p>
                </div>
              </div>

              {/* Contracts & Payments Sections */}
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                  <FileText className="w-4 h-4 text-[#1F3864]" />
                  Contract & Payment Breakdowns ({detail.contracts.length})
                </h4>

                {detail.contracts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs bg-gray-50 rounded-xl border">
                    No active contracts found for this customer.
                  </div>
                ) : (
                  detail.contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                    >
                      {/* Contract Header */}
                      <div className="bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between border-b border-gray-200 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-sm text-[#1F3864]">
                            {contract.contractNumber}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {contract.eventDate}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-gray-400" />
                            {contract.venueName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 uppercase text-[10px]">
                            {contract.status}
                          </span>
                          <span className="text-sm font-black text-gray-900">
                            {formatPKR(contract.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Payments Sub-table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-100/50 text-[10px] font-extrabold text-gray-500 uppercase border-b">
                              <th className="py-2 px-4">Date</th>
                              <th className="py-2 px-4">Receipt #</th>
                              <th className="py-2 px-4">Type</th>
                              <th className="py-2 px-4">Method</th>
                              <th className="py-2 px-4 text-right">Amount</th>
                              <th className="py-2 px-4 text-right">
                                Running Debt Balance
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs">
                            {contract.payments.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="py-4 text-center text-gray-400 italic"
                                >
                                  No payments recorded against this contract yet.
                                </td>
                              </tr>
                            ) : (
                              contract.payments.map((p) => (
                                <tr
                                  key={p.id}
                                  className={
                                    p.isRefund
                                      ? 'bg-amber-50/30'
                                      : 'hover:bg-gray-50/50'
                                  }
                                >
                                  <td className="py-2.5 px-4 font-medium text-gray-700">
                                    {p.paymentDate}
                                  </td>
                                  <td className="py-2.5 px-4 font-mono text-gray-600">
                                    {p.receiptNumber}
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <span
                                      className={`inline-flex items-center gap-1 font-bold ${
                                        p.isRefund
                                          ? 'text-amber-700'
                                          : 'text-emerald-700'
                                      }`}
                                    >
                                      {p.isRefund ? (
                                        <ArrowUpRight className="w-3 h-3" />
                                      ) : (
                                        <ArrowDownRight className="w-3 h-3" />
                                      )}
                                      {p.paymentType}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 capitalize text-gray-600">
                                    {p.paymentMethod}
                                  </td>
                                  <td
                                    className={`py-2.5 px-4 text-right font-extrabold ${
                                      p.isRefund
                                        ? 'text-amber-600'
                                        : 'text-emerald-600'
                                    }`}
                                  >
                                    {p.isRefund ? '-' : '+'} {formatPKR(p.amount)}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900">
                                    {formatPKR(p.runningBalance || 0)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}