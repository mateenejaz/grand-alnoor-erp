import ChartOfAccountsList from '@/components/accounting/ChartOfAccountsList';

export const metadata = {
  title: 'Chart of Accounts | Grand Alnoor ERP',
};

export default function ChartOfAccountsPage() {
  // Using default placeholder business_id; can be fetched dynamically via user session
  const businessId = '00000000-0000-0000-0000-000000000000';

  return (
    <div className="p-6">
      <ChartOfAccountsList businessId={businessId} />
    </div>
  );
}