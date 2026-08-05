'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Phone,
} from 'lucide-react';
import {
  getAllCustomerLedger,
  CustomerSummary,
} from '@/lib/accounting/customerLedger';
import { formatPKR } from '@/lib/accounting/accounts';
import CustomerLedgerDetailModal from './CustomerLedgerDetail';

type FilterTab = 'ALL' | 'OUTSTANDING' | 'PAID' | 'OVERPAID';

export default function CustomerLedger() {
  const [businessId] = useState<string>('00000000-0000-0000-0000-000000000000');
  const [summaries, setSummaries] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const loadLedger = async () => {
    setLoading(true);
    const data = await getAllCustomerLedger(businessId);
    setSummaries(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLedger();
  }, [businessId]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalReceivable = 0;
    let collectedThisMonth = 0;
    let customersWithBalance = 0;

    const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM

    summaries.forEach((s) => {
      if (s.outstandingBalance > 0) {
        totalReceivable += s.outstandingBalance;
        customersWithBalance++;
      }

      if (s.lastPaymentDate && s.lastPaymentDate.startsWith(currentMonthStr)) {
        collectedThisMonth += s.lastPaymentAmount;
      }
    });

    return {
      totalReceivable,
      collectedThisMonth,
      customersWithBalance,
      totalCustomers: summaries.length,
    };
  }, [summaries]);

  // Filtering Logic
  const filteredSummaries = useMemo(() => {
    return summaries.filter((item) => {
      // Search
      const matchesSearch =
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery);

      if (!matchesSearch) return false;

      // Filter Tab
      if (activeFilter === 'OUTSTANDING') return item.outstandingBalance > 0;
      if (activeFilter === 'PAID') return item.outstandingBalance === 0;
      if (activeFilter === 'OVERPAID') return item.outstandingBalance < 0;

      return true;
    });
  }, [summaries, searchQuery, activeFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F3864] tracking-tight">
            Customer Ledger
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Monitor customer account balances, receipts, and receivables
          </p>
        </div>

        <button
          onClick={loadLedger}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
              Total Receivable
            </span>
            <span className="text-lg font-black text-red-600 mt-1 block">
              {formatPKR(metrics.totalReceivable)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
              Collected This Month
            </span>
            <span className="text-lg font-black text-emerald-600 mt-1 block">
              {formatPKR(metrics.collectedThisMonth)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
              Customers With Balance
            </span>
            <span className="text-lg font-black text-gray-900 mt-1 block">
              {metrics.customersWithBalance}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
              Total Customers
            </span>
            <span className="text-lg font-black text-gray-900 mt-1 block">
              {metrics.totalCustomers}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1F3864]">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer or phone..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3864]/20 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {(
              [
                { key: 'ALL', label: 'All Customers' },
                { key: 'OUTSTANDING', label: 'With Balance' },
                { key: 'PAID', label: 'Fully Paid' },
                { key: 'OVERPAID', label: 'Overpaid' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === tab.key
                    ? 'bg-white text-[#1F3864] shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1F3864] text-white text-[10px] font-extrabold uppercase tracking-wider">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Contracts</th>
                <th className="py-3 px-4 text-right">Total Invoiced</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Refunds</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4 text-right">Last Payment</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    Loading customer ledger records...
                  </td>
                </tr>
              ) : filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    No customer records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((item) => (
                  <tr
                    key={item.customerId}
                    onClick={() => setSelectedCustomerId(item.customerId)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-all group"
                  >
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {item.customerName}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {item.phone}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                        {item.contractCount} ({item.activeContracts} active)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-700">
                      {formatPKR(item.totalInvoiced)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600">
                      {formatPKR(item.totalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-amber-600">
                      {item.totalRefunds > 0 ? formatPKR(item.totalRefunds) : '—'}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-black ${
                        item.outstandingBalance > 0
                          ? 'text-red-600'
                          : item.outstandingBalance < 0
                          ? 'text-emerald-600'
                          : 'text-gray-700'
                      }`}
                    >
                      {formatPKR(item.outstandingBalance)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500 font-medium">
                      {item.lastPaymentDate ? (
                        <div>
                          <div className="text-gray-800 font-bold">
                            {formatPKR(item.lastPaymentAmount)}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {item.lastPaymentDate}
                          </div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#1F3864] transition-all inline-block" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Slide-over / Modal */}
      {selectedCustomerId && (
        <CustomerLedgerDetailModal
          customerId={selectedCustomerId}
          businessId={businessId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
}