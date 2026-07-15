import { createClient } from '@/lib/supabase-server';
import CustomerList from '@/components/customers/CustomerList';
import { Users } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialCustomers: any[] = [];
  let businessId = '';

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('business_id')
      .eq('auth_id', user.id)
      .single();

    if (profile?.business_id) {
      businessId = profile.business_id;

      // Pre-fetch the latest 50 customers to show instantly on load
      const { data: customersData } = await supabase
        .from('customers')
        .select('*, bookings(id, event_date, status)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (customersData) {
        initialCustomers = customersData;
      }
    }
  }

  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#1F3864]/5 rounded-xl text-[#1F3864]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1F3864] font-serif">Customer Directory</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Identity verification fields, contact history, and lightning-fast phone lookup.
            </p>
          </div>
        </div>
      </div>

      <CustomerList initialCustomers={initialCustomers} businessId={businessId} />
    </div>
  );
}