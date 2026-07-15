import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import QuotationBuilder from '@/components/quotations/QuotationBuilder';
import { getPackages } from '@/lib/menu';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ bookingId?: string }>;
};

export default async function NewQuotationPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const bookingId = resolvedParams.bookingId;

  if (!bookingId) redirect('/dashboard/bookings');

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

  // Fetch Booking Details securely
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, customers(full_name, phone), venues(name)')
    .eq('id', bookingId)
    .single();

  if (!booking) redirect('/dashboard/bookings');

  // Fetch Packages for the dropdown
  const packages = await getPackages(businessId);

  return (
    <div className="space-y-6 h-full pb-10 max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#1F3864] font-serif">Generate Quotation</h1>
        <p className="text-sm text-gray-500">Construct financial terms and event pricing.</p>
      </div>

      <QuotationBuilder 
        businessId={businessId} 
        booking={booking} 
        packages={packages} 
      />
    </div>
  );
}