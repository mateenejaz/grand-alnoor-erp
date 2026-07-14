import { CalendarDays, Star, Coins, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Brand Greetings Grid Section */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864] font-serif">
            Welcome to Grand Alnoor ERP
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Marquee operations panel overview. Select sections from the sidebar to begin processing bookings.
          </p>
        </div>
        <div className="px-4 py-2 bg-[#B8860B]/10 rounded-xl border border-[#B8860B]/30 text-[#B8860B] text-xs font-semibold uppercase tracking-wider">
          Live Connection
        </div>
      </div>

      {/* 4 Core Premium Analytical KPI Stats Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Monthly Bookings Counter */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#1F3864]/30 transition-all duration-200">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Bookings This Month</p>
            <p className="text-2xl font-bold text-[#1F3864]">24</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#1F3864]/5 flex items-center justify-center text-[#1F3864]">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Upcoming Marquee Events Count */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#1F3864]/30 transition-all duration-200">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Upcoming Events</p>
            <p className="text-2xl font-bold text-[#1F3864]">18</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B]">
            <Star className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Revenue Metrics Tracker (PKR) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#1F3864]/30 transition-all duration-200">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Revenue This Month</p>
            <p className="text-2xl font-bold text-[#1F3864] font-sans">PKR 3.4M</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Outstanding Receivables / Pending Payments */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#1F3864]/30 transition-all duration-200">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Pending Payments</p>
            <p className="text-2xl font-bold text-red-600">08</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

      </div>
    </div>
  );
}