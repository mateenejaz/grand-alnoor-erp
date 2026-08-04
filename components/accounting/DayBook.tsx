'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Printer,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Receipt,
  Building2,
} from 'lucide-react';
import { getDayBookEntries, DayBookEntry, DayBookSummary } from '@/lib/accounting/daybook';
import { formatPKR } from '@/lib/accounting/accounts';

export default function DayBook() {
  // Helper dates for standard current month initialization
  const getFirstDayOfCurrentMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [fromDate, setFromDate] = useState<string>(getFirstDayOfCurrentMonth());
  const [toDate, setToDate] = useState<string>(getTodayDate());
  const [activeFilter, setActiveFilter] = useState<string>('month');

  const [entries, setEntries] = useState<DayBookEntry[]>([]);
  const [summary, setSummary] = useState<DayBookSummary>({
    totalCashIn: 0,
    totalCashOut: 0,
    netForPeriod: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Mounted state to handle client-side time rendering without hydration mismatch
  const [generatedAt, setGeneratedAt] = useState<string>('');

  useEffect(() => {
    setGeneratedAt(new Date().toLocaleString());
  }, []);

  const loadDayBookData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDayBookEntries('', fromDate, toDate);
      setEntries(data.entries);
      setSummary(data.summary);
      setGeneratedAt(new Date().toLocaleString());
    } catch (err) {
      console.error('Failed to load day book data:', err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadDayBookData();
  }, [loadDayBookData]);

  // Filter Button Date Handlers
  const applyPresetFilter = (type: 'today' | 'week' | 'month' | 'lastMonth') => {
    setActiveFilter(type);
    const now = new Date();

    if (type === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (type === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday offset
      const startOfWeek = new Date(now.setDate(diff));
      setFromDate(startOfWeek.toISOString().split('T')[0]);
      setToDate(new Date().toISOString().split('T')[0]);
    } else if (type === 'month') {
      setFromDate(getFirstDayOfCurrentMonth());
      setToDate(getTodayDate());
    } else if (type === 'lastMonth') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setFromDate(firstDayLastMonth.toISOString().split('T')[0]);
      setToDate(lastDayLastMonth.toISOString().split('T')[0]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Group entries by Date for day header display
  const groupedEntries = entries.reduce<Record<string, DayBookEntry[]>>((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const formatDateHeader = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateStr).toLocaleDateString('en-GB', options);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 print:p-0 print:max-w-none">
      {/* PRINT ONLY HEADER */}
      <div className="hidden print:block mb-8 border-b-2 border-[#1F3864] pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black font-serif text-[#1F3864] uppercase">
              Grand Alnoor
            </h1>
            <p className="text-xs font-bold text-[#B8860B] tracking-widest uppercase">
              RSM Hall & JTS Hall — ERP Accounting
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">DAY BOOK REPORT</h2>
            <p className="text-xs text-gray-600 mt-1">
              Period: <span className="font-semibold">{fromDate}</span> to{' '}
              <span className="font-semibold">{toDate}</span>
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5" suppressHydrationWarning>
              Generated on: {generatedAt}
            </p>
          </div>
        </div>
      </div>

      {/* PAGE HEADER & CONTROLS (HIDDEN IN PRINT) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2">
            <Receipt className="w-7 h-7 text-[#B8860B]" />
            Day Book
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time chronological log of Cash In and Cash Out transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDayBookData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#1F3864] text-white rounded-lg hover:bg-[#162846] shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* FILTERS SECTION (HIDDEN IN PRINT) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>
            <button
              onClick={() => applyPresetFilter('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'today'
                  ? 'bg-[#1F3864] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => applyPresetFilter('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'week'
                  ? 'bg-[#1F3864] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => applyPresetFilter('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'month'
                  ? 'bg-[#1F3864] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => applyPresetFilter('lastMonth')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'lastMonth'
                  ? 'bg-[#1F3864] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Last Month
            </button>
          </div>

          {/* Date Picker Range Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setActiveFilter('custom');
                }}
                className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none"
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">to</span>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setActiveFilter('custom');
                }}
                className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY STAT CARDS (HIDDEN IN PRINT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Cash In</p>
            <p className="text-xl font-black text-emerald-600 mt-1">
              {formatPKR(summary.totalCashIn)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-rose-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Cash Out</p>
            <p className="text-xl font-black text-rose-600 mt-1">
              {formatPKR(summary.totalCashOut)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Net Period Balance</p>
            <p
              className={`text-xl font-black mt-1 ${
                summary.netForPeriod >= 0 ? 'text-[#1F3864]' : 'text-rose-600'
              }`}
            >
              {formatPKR(summary.netForPeriod)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1F3864]">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* DAY BOOK TRANSACTIONS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Loading Day Book records...
          </div>
        ) : Object.keys(groupedEntries).length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No Day Book transactions found for the selected date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1F3864] text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Description / Account</th>
                  <th className="py-3 px-4 text-right">Cash In (PKR)</th>
                  <th className="py-3 px-4 text-right">Cash Out (PKR)</th>
                  <th className="py-3 px-4 text-right">Balance (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(groupedEntries).map(([dateStr, dayItems]) => {
                  const dayCashIn = dayItems.reduce((sum, item) => sum + item.cashIn, 0);
                  const dayCashOut = dayItems.reduce((sum, item) => sum + item.cashOut, 0);

                  return (
                    <React.Fragment key={dateStr}>
                      {/* Date Group Header */}
                      <tr className="bg-gray-100/80 font-bold text-gray-700 border-t-2 border-gray-200">
                        <td colSpan={3} className="py-2.5 px-4 text-[#1F3864]">
                          {formatDateHeader(dateStr)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 font-extrabold">
                          + {formatPKR(dayCashIn)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-rose-700 font-extrabold">
                          - {formatPKR(dayCashOut)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-gray-500 font-semibold text-[10px]">
                          Day Subtotal
                        </td>
                      </tr>

                      {/* Day Transactions List */}
                      {dayItems.map((entry, idx) => (
                        <tr
                          key={entry.id}
                          className={`hover:bg-blue-50/40 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="py-2.5 px-4 text-gray-500 whitespace-nowrap">
                            {entry.date}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-800 whitespace-nowrap">
                            {entry.reference}
                          </td>
                          <td className="py-2.5 px-4">
                            <p className="text-gray-900 font-medium">{entry.description}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{entry.account}</p>
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                            {entry.cashIn > 0 ? formatPKR(entry.cashIn) : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-rose-600 whitespace-nowrap">
                            {entry.cashOut > 0 ? formatPKR(entry.cashOut) : '—'}
                          </td>
                          <td
                            className={`py-2.5 px-4 text-right font-black whitespace-nowrap ${
                              entry.runningBalance >= 0 ? 'text-[#1F3864]' : 'text-rose-600'
                            }`}
                          >
                            {formatPKR(entry.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>

              {/* Summary Row Bottom Footer */}
              <tfoot>
                <tr className="bg-[#1F3864] text-white font-bold text-xs border-t-2 border-[#1F3864]">
                  <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider">
                    Total Period Summary:
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-300 font-black text-sm">
                    {formatPKR(summary.totalCashIn)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-300 font-black text-sm">
                    {formatPKR(summary.totalCashOut)}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-sm text-[#B8860B]">
                    {formatPKR(summary.netForPeriod)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}