'use client';

import React, { useState, useEffect } from 'react';
import { Account, AccountType, createAccount, updateAccount } from '@/lib/accounting/accounts';

interface AccountFormProps {
  businessId: string;
  account?: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SUB_TYPES: Record<AccountType, { value: string; label: string }[]> = {
  asset: [
    { value: 'current_asset', label: 'Current Asset' },
    { value: 'fixed_asset', label: 'Fixed Asset' },
    { value: 'non_current_asset', label: 'Non-Current Asset' },
  ],
  liability: [
    { value: 'current_liability', label: 'Current Liability' },
    { value: 'long_term_liability', label: 'Long-Term Liability' },
  ],
  equity: [
    { value: 'equity', label: 'Owner Equity' },
  ],
  income: [
    { value: 'revenue', label: 'Operating Revenue' },
    { value: 'other_income', label: 'Other Income' },
  ],
  expense: [
    { value: 'cost_of_sales', label: 'Cost of Sales' },
    { value: 'overhead', label: 'Overhead Expense' },
    { value: 'operating_expense', label: 'Operating Expense' },
  ],
};

export default function AccountForm({
  businessId,
  account,
  isOpen,
  onClose,
  onSuccess,
}: AccountFormProps) {
  const isEditing = !!account;
  const isSystem = account?.is_system ?? false;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('asset');
  const [subType, setSubType] = useState('current_asset');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      setCode(account.code);
      setName(account.name);
      setType(account.type);
      setSubType(account.sub_type);
      setDescription(account.description || '');
      setIsActive(account.is_active);
    } else {
      setCode('');
      setName('');
      setType('asset');
      setSubType('current_asset');
      setDescription('');
      setIsActive(true);
    }
    setErrorMsg('');
  }, [account, isOpen]);

  const handleTypeChange = (newType: AccountType) => {
    setType(newType);
    const availableSubTypes = SUB_TYPES[newType];
    if (availableSubTypes && availableSubTypes.length > 0) {
      setSubType(availableSubTypes[0].value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSystem) return;

    setErrorMsg('');
    setSubmitting(true);

    try {
      if (isEditing && account) {
        await updateAccount(account.id, {
          name,
          sub_type: subType,
          description,
          is_active: isActive,
        });
      } else {
        await createAccount({
          business_id: businessId,
          code,
          name,
          type,
          sub_type: subType,
          description,
          is_active: isActive,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {isEditing ? (isSystem ? 'View System Account' : 'Edit Account') : 'Add New Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {isSystem && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <strong>System Account:</strong> Standard system accounts are protected and cannot be edited or deleted.
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Account Code
            </label>
            <input
              type="text"
              required
              disabled={isEditing}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 1010"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:disabled:bg-slate-800/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Account Name
            </label>
            <input
              type="text"
              required
              disabled={isSystem}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Meezan Bank Account"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Account Type
              </label>
              <select
                disabled={isEditing}
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as AccountType)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Sub-Type
              </label>
              <select
                disabled={isSystem}
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
              >
                {SUB_TYPES[type].map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              disabled={isSystem}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              disabled={isSystem}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Active Account
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            {!isSystem && (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : isEditing ? 'Update Account' : 'Create Account'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}