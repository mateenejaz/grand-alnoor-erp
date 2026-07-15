import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserCircle, Phone, MapPin, Hash, ArrowLeft, Edit, CalendarPlus, Info } from 'lucide-react';
import CustomerBookingHistory from '@/components/customers/CustomerBookingHistory';
import CustomerForm from '@/components/customers/CustomerForm';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// Next.js strictly requires params and searchParams to be treated as Promises
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function CustomerProfilePage({ params, searchParams }: Props) {
  // 1. Unpack the URL parameters securely
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const customerId = resolvedParams.id;
  const showEditModal = resolvedSearchParams?.edit === 'true';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('auth_id', user.id)
    .single();

  const businessId = profile?.business_id;

  // 2. Fetch Customer Data using the resolved ID
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (!customer) redirect('/dashboard/customers');

  // 3. Fetch Booking History
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, venues(name)')
    .eq('customer_id', customerId)
    .order('event_date', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/dashboard/customers" className="text-sm font-semibold text-gray-500 hover:text-[#1F3864] flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#1F3864]/5 to-transparent rounded-bl-[100px] pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-[#1F3864] text-white rounded-2xl flex items-center justify-center shadow-lg font-serif text-3xl font-bold uppercase">
            {customer.full_name.charAt(0)}
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-gray-900 font-serif">{customer.full_name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600">
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-[#1F3864]" /> {customer.phone}</span>
              {customer.cnic && <span className="flex items-center gap-1.5"><Hash className="w-4 h-4 text-gray-400" /> CNIC: {customer.cnic}</span>}
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
              Source: {customer.referral_source || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto relative z-10">
          <Link href={`/dashboard/customers/${customer.id}?edit=true`} className="flex-1 md:flex-none px-6 py-2.5 bg-white border-2 border-gray-200 hover:border-[#1F3864] hover:text-[#1F3864] text-gray-700 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2">
            <Edit className="w-4 h-4" /> Edit Profile
          </Link>
          <Link href={`/dashboard/bookings?customerId=${customer.id}`} className="flex-1 md:flex-none px-6 py-2.5 bg-[#1F3864] hover:bg-[#152644] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
            <CalendarPlus className="w-4 h-4" /> New Booking
          </Link>
        </div>
      </div>

      {/* Grid Layout for Details & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details & Notes */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-[#1F3864]" /> Client Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registered Address</p>
                <p className="text-sm font-medium text-gray-800 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> 
                  {customer.address || 'No address on file.'}
                </p>
              </div>
              <div className="h-px bg-gray-100" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Background Notes</p>
                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 text-sm text-gray-700 italic flex items-start gap-2">
                  <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  {customer.notes || 'No specific background notes have been logged for this client.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Booking History */}
        <div className="lg:col-span-2">
          <CustomerBookingHistory bookings={bookings || []} />
        </div>
      </div>

      {/* Edit Modal (Controlled via URL state) */}
      {showEditModal && businessId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <CustomerForm businessId={businessId} initialData={customer} />
        </div>
      )}
    </div>
  );
}