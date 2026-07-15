import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import QuotationBuilder from '@/components/quotations/QuotationBuilder';
import QuotationPrintView from '@/components/quotations/QuotationPrintView';
import ConvertContractButton from '@/components/quotations/ConvertContractButton';
import { getPackages } from '@/lib/menu';
import { getQuotationById } from '@/lib/quotations';
import { FileText } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function QuotationDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const quotationId = resolvedParams.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('auth_id', user.id)
    .single();

  const businessId = profile?.business_id;
  if (!businessId) redirect('/login');

  const quotation = await getQuotationById(quotationId);
  if (!quotation) redirect('/dashboard/quotations');

  const packages = await getPackages(businessId);
  
  const isEditable = quotation.status === 'Draft' || quotation.status === 'Sent';
  const canConvert = quotation.status === 'Sent';

  return (
    <div className="space-y-6 h-full pb-20 max-w-5xl mx-auto">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-serif">Quotation #{quotation.id.split('-')[0].toUpperCase()}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Current Status: <strong className={quotation.status === 'Sent' ? 'text-blue-600' : quotation.status === 'Accepted' ? 'text-green-600' : 'text-gray-700'}>{quotation.status}</strong>
            </p>
          </div>
        </div>
        
        {/* NEW: Convert to Contract Action Button */}
        {canConvert && <ConvertContractButton quotationId={quotation.id} />}
      </div>

      {isEditable && (
        <QuotationBuilder 
          businessId={businessId} 
          booking={quotation.bookings} 
          packages={packages} 
          existingQuotation={quotation}
        />
      )}

      <QuotationPrintView quotation={quotation} />
    </div>
  );
}