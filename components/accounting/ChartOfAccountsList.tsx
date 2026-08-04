'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Account,
  AccountType,
  getAccounts,
  getAccountBalance,
  formatPKR,
} from '@/lib/accounting/accounts';
import AccountForm from './AccountForm';

interface ChartOfAccountsListProps {
  businessId: string;
}

interface AccountWithBalance extends Account {
  balance: number;
}

const CATEGORY_ORDER: { type: AccountType; title: string }[] = [
  { type: 'asset', title: 'Assets' },
  { type: 'liability', title: 'Liabilities' },
  { type: 'equity', title: 'Equity' },
  { type: 'income', title: 'Income' },
  { type: 'expense', title: 'Expenses' },
];

export default function ChartOfAccountsList({ businessId }: ChartOfAccountsListProps) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const rawAccounts = await getAccounts(businessId);

    const withBalances = await Promise.all(
      rawAccounts.map(async (acc) => {
        const balance = await getAccountBalance(acc.id);
        return { ...acc, balance };
      })
    );

    setAccounts(withBalances);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (account: Account) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Chart of Accounts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Grand Alnoor master financial accounts ledger (PKR currency format)
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          + Add Account
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Loading Chart of Accounts...
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORY_ORDER.map(({ type, title }) => {
            const groupAccounts = accounts.filter((a) => a.type === type);
            const groupTotal = groupAccounts.reduce((sum, a) => sum + a.balance, 0);

            return (
              <div
                key={type}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/30 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">Account Name</th>
                        <th className="px-6 py-3">Sub-Type</th>
                        <th className="px-6 py-3 text-right">Balance (PKR)</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {groupAccounts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-slate-400">
                            No accounts registered for this category.
                          </td>
                        </tr>
                      ) : (
                        groupAccounts.map((acc) => (
                          <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="px-6 py-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                              {acc.code}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                              {acc.name}
                              {acc.is_system && (
                                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                  SYSTEM
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 capitalize text-slate-500 dark:text-slate-400">
                              {acc.sub_type.replace(/_/g, ' ')}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                              {formatPKR(acc.balance)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                  acc.is_active
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {acc.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleOpenEdit(acc)}
                                className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                              >
                                {acc.is_system ? 'View' : 'Edit'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-200 bg-slate-50/50 font-semibold dark:border-slate-800 dark:bg-slate-800/20">
                      <tr>
                        <td colSpan={3} className="px-6 py-3 text-slate-700 dark:text-slate-300">
                          Total {title}
                        </td>
                        <td className="px-6 py-3 text-right text-emerald-700 dark:text-emerald-400">
                          {formatPKR(groupTotal)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AccountForm
        businessId={businessId}
        account={selectedAccount}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}