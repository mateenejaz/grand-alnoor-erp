import { createClient } from '@/lib/supabase-server';
import { FileText, ArrowRight, Clock, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getQuotations } from '@/lib/quotations';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function QuotationsDirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let quotations: any[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('business_id')
      .eq('auth_id', user.id)
      .single();

    if (profile?.business_id) {
      quotations = await getQuotations(profile.business_id);
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Draft': return <Clock className="w-3.5 h-3.5 text-gray-500" />;
      case 'Sent': return <Send className="w-3.5 h-3.5 text-blue-500" />;
      case 'Accepted': return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Draft': return 'bg-gray-100 text-gray-700';
      case 'Sent': return 'bg-blue-50 text-blue-700';
      case 'Accepted': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-serif">Quotations Ledger</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Financial proposals, cost breakdowns, and client pricing sheets.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 sticky top-0 z-10">
                <th className="p-4 font-bold">Ref ID</th>
                <th className="p-4 font-bold">Client & Event</th>
                <th className="p-4 font-bold hidden sm:table-cell">Event Date</th>
                <th className="p-4 font-bold text-right">Grand Total</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quotations.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 font-mono text-xs text-gray-500">
                    #{q.id.split('-')[0].toUpperCase()}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{q.customers?.full_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{q.bookings?.venues?.name}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-600 hidden sm:table-cell">
                    {format(new Date(q.bookings?.event_date), 'MMM d, yyyy')}
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-black text-[#1F3864]">PKR {Number(q.total_amount).toLocaleString()}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${getStatusBadge(q.status)}`}>
                      {getStatusIcon(q.status)} {q.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/dashboard/quotations/${q.id}`} className="inline-flex p-2 text-gray-400 hover:text-[#1F3864] hover:bg-gray-100 rounded-xl transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {quotations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl m-4">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">No quotations generated yet</p>
                    <p className="text-sm">Create a new quotation from a booking on the calendar.</p>
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