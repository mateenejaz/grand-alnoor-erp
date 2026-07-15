import { createClient } from '@/lib/supabase-server';
import { CreditCard, FileSignature, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getAllPayments, getMonthlyRevenue, getTotalOutstanding } from '@/lib/payments';
import Link from 'next/link';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// A simple way to get URL search params in server component Next.js 14
export default async function PaymentsDirectoryPage(props: { searchParams: Promise<{ month?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let payments: any[] = [];
  let monthlyRevenue = 0;
  let totalOutstanding = 0;

  // Filter logic: Default to current month if no parameter is provided
  const now = new Date();
  const targetYear = searchParams.month ? parseInt(searchParams.month.split('-')[0]) : now.getFullYear();
  const targetMonth = searchParams.month ? parseInt(searchParams.month.split('-')[1]) : now.getMonth() + 1; // 1-12 format
  
  // Create first day and last day strings for the query
  const startStr = new Date(targetYear, targetMonth - 1, 1).toISOString();
  const endStr = new Date(targetYear, targetMonth, 0, 23, 59, 59).toISOString();

  if (user) {
    const { data: profile } = await supabase.from('users').select('business_id').eq('auth_id', user.id).single();

    if (profile?.business_id) {
      payments = await getAllPayments(profile.business_id, startStr, endStr);
      monthlyRevenue = await getMonthlyRevenue(profile.business_id, targetYear, targetMonth);
      totalOutstanding = await getTotalOutstanding(profile.business_id);
    }
  }

  const monthLabel = format(new Date(targetYear, targetMonth - 1), 'MMMM yyyy');

  return (
    <div className="space-y-6 h-full pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-serif">Global Payments Ledger</h2>
            <p className="text-sm text-gray-500 mt-0.5">Tracking all incoming funds and outstanding balances.</p>
          </div>
        </div>
        
        {/* Simple Date Filter */}
        <form className="flex items-center gap-2">
          <input 
            type="month" 
            name="month" 
            defaultValue={`${targetYear}-${targetMonth.toString().padStart(2, '0')}`}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-gray-50 focus:outline-none focus:border-purple-400"
          />
          <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors">
            Filter
          </button>
        </form>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-50 rounded-full text-green-600 shrink-0"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Collected Revenue ({monthLabel})</p>
            <p className="text-2xl font-black text-gray-900 mt-1">PKR {monthlyRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-orange-50 rounded-full text-orange-600 shrink-0"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Outstanding (All Active)</p>
            <p className="text-2xl font-black text-gray-900 mt-1">PKR {totalOutstanding.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 sticky top-0 z-10">
                <th className="p-4 font-bold">Receipt & Date</th>
                <th className="p-4 font-bold">Client / Contract</th>
                <th className="p-4 font-bold">Type & Method</th>
                <th className="p-4 font-bold text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p) => {
                const isRefund = p.payment_type?.toLowerCase() === 'refund';
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-mono font-bold text-gray-800">{p.receipt_number}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{format(new Date(p.payment_date), 'MMM d, yyyy')}</p>
                    </td>
                    <td className="p-4">
                      <Link href={`/dashboard/contracts/${p.contracts?.id}`} className="font-bold text-[#1F3864] hover:underline flex items-center gap-1.5">
                        <FileSignature className="w-3.5 h-3.5" />
                        #{p.contracts?.id.split('-')[0].toUpperCase()}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">{p.contracts?.customers?.full_name}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      <span className="font-bold text-gray-900">{p.payment_type}</span>
                      <p className="text-xs text-gray-500 mt-0.5">via {p.payment_method}</p>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-black text-lg ${isRefund ? 'text-red-600' : 'text-green-600'}`}>
                        {isRefund ? '-' : '+'} {Number(p.amount).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl m-4">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">No payments found</p>
                    <p className="text-sm">No transactions were recorded in {monthLabel}.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}