import React from 'react';
import GeneralLedger from '@/components/accounting/GeneralLedger';

export const metadata = {
  title: 'General Ledger | Grand Alnoor ERP',
  description: 'Detailed account transaction statements and Trial Balance summaries.',
};

export default function GeneralLedgerPage() {
  return (
    <main className="min-h-screen bg-gray-50/50 py-4">
      <GeneralLedger />
    </main>
  );
}