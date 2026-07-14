'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  FileText, 
  FileCheck, 
  CreditCard, 
  Utensils, 
  MapPin, 
  Settings as SettingsIcon 
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Bookings', href: '/dashboard/bookings', icon: CalendarDays },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Quotations', href: '/dashboard/quotations', icon: FileText },
  { name: 'Contracts', href: '/dashboard/contracts', icon: FileCheck },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Menu & Catering', href: '/dashboard/menu', icon: Utensils },
  { name: 'Venues', href: '/dashboard/venues', icon: MapPin },
  { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1F3864] text-white flex flex-col min-h-screen shadow-xl border-r border-[#B8860B]/20">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 text-center">
        <p className="text-xs font-semibold tracking-widest text-[#B8860B] uppercase">
          Marquee System
        </p>
        <h2 className="text-xl font-bold tracking-tight text-white mt-1 font-serif">
          Grand Alnoor
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-white/10 text-[#B8860B] border-l-4 border-[#B8860B] pl-3'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-[#B8860B]' : 'text-gray-400 group-hover:text-white'
                }`} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/10 text-center text-xs text-gray-400">
        Grand Alnoor ERP v1.0
      </div>
    </aside>
  );
}