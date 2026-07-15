import { createClient } from '@/lib/supabase-server';
import { FileSignature, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getContracts } from '@/lib/contracts';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function ContractsDirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let contracts: any[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('business_id')
      .eq('auth_id', user.id)
      .single();

    if (profile?.business_id) {
      contracts = await getContracts(profile.business_id);
    }
  }

  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-serif">Active Contracts Ledger</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Binding agreements, financial tracking, and balance monitoring.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 sticky top-0 z-10">
                <th className="p-4 font-bold">Contract Ref</th>
                <th className="p-4 font-bold">Client & Venue</th>
                <th className="p-4 font-bold hidden sm:table-cell">Event Date</th>
                <th className="p-4 font-bold text-right">Total Amount</th>
                <th className="p-4 font-bold text-right">Balance Due</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contracts.map((c) => {
                const totalAmt = Number(c.total_amount) || 0;
                const paidAmt = c.payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
                const balance = totalAmt - paidAmt;

                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 font-mono text-xs text-gray-500">#{c.id.split('-')[0].toUpperCase()}</td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{c.customers?.full_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.bookings?.venues?.name}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-600 hidden sm:table-cell">
                      {format(new Date(c.bookings?.event_date), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-right font-medium text-gray-600">
                      PKR {totalAmt.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-black ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        PKR {balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'Active' ? 'bg-green-100 text-green-700' : 
                        c.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/dashboard/contracts/${c.id}`} className="inline-flex p-2 text-gray-400 hover:text-[#1F3864] hover:bg-gray-100 rounded-xl transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl m-4">
                    <FileSignature className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">No contracts established yet</p>
                    <p className="text-sm">Convert a 'Sent' quotation into a contract to begin tracking balances.</p>
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