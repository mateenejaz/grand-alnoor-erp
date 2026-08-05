import React from 'react';
import CustomerLedger from '@/components/accounting/CustomerLedger';

export const metadata = {
  title: 'Customer Ledger | Grand Alnoor Management',
  description: 'Detailed customer account receivables and payment history',
};

export default function CustomerLedgerPage() {
  return <CustomerLedger />;
}