import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getDashboardStats, getUpcomingEvents, getMonthlyRevenueLast6Months } from '@/lib/dashboard';
import StatCard from '@/components/dashboard/StatCard';
import UpcomingEvents from '@/components/dashboard/UpcomingEvents';
import RevenueChart from '@/components/dashboard/RevenueChart';
import { CalendarCheck, CalendarDays, Wallet, AlertCircle, Tag } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get Business ID
  const { data: profile } = await supabase
    .from('users')
    .select('business_id, full_name')
    .eq('auth_id', user.id)
    .single();

  const businessId = profile?.business_id;
  if (!businessId) {
    return <div className="p-10 text-center">Business Profile not found. Please contact support.</div>;
  }

  // Fetch all dashboard data concurrently for maximum speed
  const [stats, upcomingEvents, revenueData] = await Promise.all([
    getDashboardStats(businessId),
    getUpcomingEvents(businessId, 10),
    getMonthlyRevenueLast6Months(businessId)
  ]);

  return (
    <div className="space-y-6">
      
      {/* Top Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Revenue This Month" 
          value={stats.revenueThisMonth} 
          isCurrency={true}
          icon={<Wallet className="w-6 h-6" />} 
          subtitle="Total payments collected"
        />
        <StatCard 
          title="Discount This Month" 
          value={stats.discountThisMonth || 0} 
          isCurrency={true}
          icon={<Tag className="w-6 h-6" />} 
          subtitle="Concessions offered"
        />
        <StatCard 
          title="Total Outstanding" 
          value={stats.totalOutstanding} 
          isCurrency={true}
          icon={<AlertCircle className="w-6 h-6" />} 
          subtitle="Across all active contracts"
        />
        <StatCard 
          title="Events This Month" 
          value={stats.confirmedBookingsThisMonth} 
          icon={<CalendarCheck className="w-6 h-6" />} 
          subtitle="Confirmed bookings"
        />
        <StatCard 
          title="Events Next Month" 
          value={stats.confirmedBookingsNextMonth} 
          icon={<CalendarDays className="w-6 h-6" />} 
          subtitle="Upcoming confirmed bookings"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Left Side: Schedule (Takes up 2 columns on wide screens) */}
        <div className="lg:col-span-2 h-full">
          <UpcomingEvents events={upcomingEvents} />
        </div>
        
        {/* Right Side: Analytics Chart (Takes up 1 column) */}
        <div className="lg:col-span-1 h-full">
          <RevenueChart data={revenueData} />
        </div>
      </div>

    </div>
  );
}