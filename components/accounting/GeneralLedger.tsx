'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Calendar,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { getAccounts, Account, formatPKR, AccountType } from '@/lib/accounting/accounts';
import {
  getLedgerEntries,
  getAllAccountSummaries,
  LedgerEntry,
  AccountSummary,
} from '@/lib/accounting/general-ledger';

export default function GeneralLedger() {
  const getFirstDayOfCurrentMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // State Management
  const [activeTab, setActiveTab] = useState<'single' | 'summary'>('single');
  const [fromDate, setFromDate] = useState<string>(getFirstDayOfCurrentMonth());
  const [toDate, setToDate] = useState<string>(getTodayDate());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Single Account Ledger State
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [totalDebits, setTotalDebits] = useState<number>(0);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);

  // All Accounts Summary State
  const [summaries, setSummaries] = useState<AccountSummary[]>([]);
  const [grandTotalDebits, setGrandTotalDebits] = useState<number>(0);
  const [grandTotalCredits, setGrandTotalCredits] = useState<number>(0);
  const [isBalanced, setIsBalanced] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(true);
  const [generatedAt, setGeneratedAt] = useState<string>('');

  useEffect(() => {
    setGeneratedAt(new Date().toLocaleString());
  }, []);

  // Fetch initial account list
  useEffect(() => {
    async function initAccounts() {
      const accList = await getAccounts('');
      setAccounts(accList);
      if (accList.length > 0) {
        setSelectedAccountId(accList[0].id);
      }
    }
    initAccounts();
  }, []);

  // Load single account ledger data
  const loadSingleLedger = useCallback(async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      const data = await getLedgerEntries('', selectedAccountId, fromDate, toDate);
      setSelectedAccount(data.account);
      setOpeningBalance(data.openingBalance);
      setLedgerEntries(data.entries);
      setTotalDebits(data.totalDebits);
      setTotalCredits(data.totalCredits);
      setClosingBalance(data.closingBalance);
      setGeneratedAt(new Date().toLocaleString());
    } catch (err) {
      console.error('Error loading ledger entries:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, fromDate, toDate]);

  // Load all accounts trial balance summary
  const loadSummaryData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllAccountSummaries('', fromDate, toDate);
      setSummaries(data.summaries);
      setGrandTotalDebits(data.grandTotalDebits);
      setGrandTotalCredits(data.grandTotalCredits);
      setIsBalanced(data.isBalanced);
      setGeneratedAt(new Date().toLocaleString());
    } catch (err) {
      console.error('Error loading account summaries:', err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    if (activeTab === 'single') {
      loadSingleLedger();
    } else {
      loadSummaryData();
    }
  }, [activeTab, loadSingleLedger, loadSummaryData]);

  const handlePrint = () => {
    window.print();
  };

  // Group accounts for dropdown selector
  const groupedAccounts = accounts.reduce<Record<string, Account[]>>((acc, account) => {
    const typeKey = account.type.toUpperCase();
    if (!acc[typeKey]) acc[typeKey] = [];
    acc[typeKey].push(account);
    return acc;
  }, {});

  // Group summaries by Account Type for View 2
  const groupedSummaries = summaries.reduce<Record<string, AccountSummary[]>>((acc, item) => {
    const typeKey = item.type.toUpperCase();
    if (!acc[typeKey]) acc[typeKey] = [];
    acc[typeKey].push(item);
    return acc;
  }, {});

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
              RSM Hall & JTS Hall — General Ledger Report
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800 uppercase">
              {activeTab === 'single'
                ? `Ledger: ${selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : ''}`
                : 'All Accounts Summary (Trial Balance)'}
            </h2>
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
            <BookOpen className="w-7 h-7 text-[#B8860B]" />
            General Ledger
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Detailed account transaction statements & Trial Balance summaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={activeTab === 'single' ? loadSingleLedger : loadSummaryData}
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

      {/* VIEW TABS & FILTERS BAR (HIDDEN IN PRINT) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* View Mode Toggle Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-lg max-w-md">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-md transition-all ${
                activeTab === 'single'
                  ? 'bg-white text-[#1F3864] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#B8860B]" />
              Single Account Ledger
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-md transition-all ${
                activeTab === 'summary'
                  ? 'bg-white text-[#1F3864] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4 text-[#B8860B]" />
              Trial Balance / All Accounts
            </button>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Period:
            </span>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none"
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">to</span>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Account Selector Dropdown (Shown in Single Account View) */}
        {activeTab === 'single' && (
          <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-bold text-gray-700 whitespace-nowrap">
              Select Account:
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full sm:w-96 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F3864]"
            >
              {Object.entries(groupedAccounts).map(([typeGroup, accs]) => (
                <optgroup key={typeGroup} label={`--- ${typeGroup} ACCOUNTS ---`}>
                  {accs.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} — {acc.name} ({acc.sub_type})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: SINGLE ACCOUNT LEDGER                                        */}
      {/* ==================================================================== */}
      {activeTab === 'single' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none">
          {/* Account Title Banner */}
          {selectedAccount && (
            <div className="bg-gradient-to-r from-[#1F3864] to-[#162846] text-white p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <span className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded">
                  {selectedAccount.type} — {selectedAccount.sub_type}
                </span>
                <h2 className="text-lg font-black mt-1">
                  {selectedAccount.code} — {selectedAccount.name}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-300">Period Closing Balance</p>
                <p className="text-lg font-black text-[#B8860B]">
                  {formatPKR(closingBalance)}
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              Loading ledger statement...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right text-rose-700">Debit (PKR)</th>
                    <th className="py-3 px-4 text-right text-emerald-700">Credit (PKR)</th>
                    <th className="py-3 px-4 text-right text-[#1F3864]">Balance (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Opening Balance Row */}
                  <tr className="bg-blue-50/60 font-bold text-gray-800">
                    <td className="py-2.5 px-4 text-gray-500 whitespace-nowrap">{fromDate}</td>
                    <td className="py-2.5 px-4 font-mono text-gray-400">—</td>
                    <td className="py-2.5 px-4 text-[#1F3864]">
                      [OPENING BALANCE STATEMENT]
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-400">—</td>
                    <td className="py-2.5 px-4 text-right text-gray-400">—</td>
                    <td
                      className={`py-2.5 px-4 text-right font-black ${
                        openingBalance >= 0 ? 'text-[#1F3864]' : 'text-rose-600'
                      }`}
                    >
                      {formatPKR(openingBalance)}
                    </td>
                  </tr>

                  {/* Transaction Entries */}
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 italic">
                        No transactions recorded for this account in the selected period.
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className={`hover:bg-blue-50/30 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                        }`}
                      >
                        <td className="py-2.5 px-4 text-gray-500 whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-gray-800 whitespace-nowrap">
                          {entry.reference}
                        </td>
                        <td className="py-2.5 px-4 text-gray-800 font-medium">
                          {entry.description}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-rose-600 whitespace-nowrap">
                          {entry.debit > 0 ? formatPKR(entry.debit) : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                          {entry.credit > 0 ? formatPKR(entry.credit) : '—'}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-black whitespace-nowrap ${
                            entry.runningBalance >= 0 ? 'text-[#1F3864]' : 'text-rose-600'
                          }`}
                        >
                          {formatPKR(entry.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Closing Balance Row */}
                <tfoot>
                  <tr className="bg-[#1F3864] text-white font-bold text-xs border-t-2 border-[#1F3864]">
                    <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider">
                      Period Totals & Closing Balance:
                    </td>
                    <td className="py-3 px-4 text-right text-rose-300 font-black text-sm">
                      {formatPKR(totalDebits)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-300 font-black text-sm">
                      {formatPKR(totalCredits)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-sm text-[#B8860B]">
                      {formatPKR(closingBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: ALL ACCOUNTS SUMMARY (TRIAL BALANCE)                          */}
      {/* ==================================================================== */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                Generating Trial Balance summary...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#1F3864] text-white font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Account Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Opening Balance</th>
                      <th className="py-3 px-4 text-right">Total Debits (PKR)</th>
                      <th className="py-3 px-4 text-right">Total Credits (PKR)</th>
                      <th className="py-3 px-4 text-right">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(groupedSummaries).map(([typeKey, items]) => {
                      const typeOpening = items.reduce((s, i) => s + i.openingBalance, 0);
                      const typeDebits = items.reduce((s, i) => s + i.totalDebits, 0);
                      const typeCredits = items.reduce((s, i) => s + i.totalCredits, 0);
                      const typeClosing = items.reduce((s, i) => s + i.closingBalance, 0);

                      return (
                        <React.Fragment key={typeKey}>
                          {/* Account Group Header */}
                          <tr className="bg-gray-100 font-bold text-[#1F3864] border-t-2 border-gray-200">
                            <td colSpan={3} className="py-2.5 px-4 uppercase tracking-wider">
                              {typeKey} ACCOUNTS
                            </td>
                            <td className="py-2.5 px-4 text-right text-gray-700 font-extrabold">
                              {formatPKR(typeOpening)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-rose-700 font-extrabold">
                              {formatPKR(typeDebits)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-emerald-700 font-extrabold">
                              {formatPKR(typeCredits)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-[#1F3864] font-black">
                              {formatPKR(typeClosing)}
                            </td>
                          </tr>

                          {/* Individual Account Rows */}
                          {items.map((item, idx) => (
                            <tr
                              key={item.accountId}
                              className={`hover:bg-blue-50/30 transition-colors ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                              }`}
                            >
                              <td className="py-2.5 px-4 font-mono font-bold text-gray-800">
                                {item.code}
                              </td>
                              <td className="py-2.5 px-4 font-medium text-gray-900">
                                {item.name}
                              </td>
                              <td className="py-2.5 px-4 text-gray-400 text-[10px] uppercase">
                                {item.subType}
                              </td>
                              <td className="py-2.5 px-4 text-right font-medium text-gray-600 whitespace-nowrap">
                                {formatPKR(item.openingBalance)}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-rose-600 whitespace-nowrap">
                                {item.totalDebits > 0 ? formatPKR(item.totalDebits) : '—'}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                                {item.totalCredits > 0 ? formatPKR(item.totalCredits) : '—'}
                              </td>
                              <td
                                className={`py-2.5 px-4 text-right font-black whitespace-nowrap ${
                                  item.closingBalance >= 0 ? 'text-[#1F3864]' : 'text-rose-600'
                                }`}
                              >
                                {formatPKR(item.closingBalance)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>

                  {/* Summary Totals Row */}
                  <tfoot>
                    <tr className="bg-[#1F3864] text-white font-bold text-xs border-t-2 border-[#1F3864]">
                      <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider">
                        Grand Total (Trial Balance):
                      </td>
                      <td className="py-3 px-4 text-right text-rose-300 font-black text-sm whitespace-nowrap">
                        {formatPKR(grandTotalDebits)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-300 font-black text-sm whitespace-nowrap">
                        {formatPKR(grandTotalCredits)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-sm text-[#B8860B] whitespace-nowrap">
                        {formatPKR(grandTotalDebits - grandTotalCredits)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* BALANCED INDICATOR CARD */}
          {!loading && (
            <div
              className={`rounded-xl p-4 border flex items-center justify-between shadow-sm ${
                isBalanced
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {isBalanced ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                )}
                <div>
                  <h4 className="font-extrabold text-sm">
                    {isBalanced
                      ? 'Trial Balance is Balanced'
                      : 'Trial Balance Imbalance Detected!'}
                  </h4>
                  <p className="text-xs opacity-80 mt-0.5">
                    {isBalanced
                      ? 'Total period debits match total period credits perfectly across all accounting entries.'
                      : `Total Debits (${formatPKR(grandTotalDebits)}) do not match Total Credits (${formatPKR(grandTotalCredits)}). Difference: ${formatPKR(Math.abs(grandTotalDebits - grandTotalCredits))}`}
                  </p>
                </div>
              </div>

              <div
                className={`text-xs font-black uppercase px-3 py-1 rounded border ${
                  isBalanced
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-rose-100 border-rose-300 text-rose-800'
                }`}
              >
                {isBalanced ? 'Balanced ✓' : 'Unbalanced ✗'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}