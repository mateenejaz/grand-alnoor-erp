import React from 'react';
import DayBook from '@/components/accounting/DayBook';

export const metadata = {
  title: 'Day Book | Grand Alnoor ERP',
  description: 'Chronological Day Book log for payments, expenses, and journals.',
};

export default function DayBookPage() {
  return (
    <main className="min-h-screen bg-gray-50/50 py-4">
      <DayBook />
    </main>
  );
}