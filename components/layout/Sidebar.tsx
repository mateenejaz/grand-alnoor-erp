'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  FileCheck,
  Users,
  UtensilsCrossed,
  Package,
  Receipt,
  DollarSign,
  Building2,
  Settings,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Bookings & Calendar', href: '/dashboard/bookings', icon: CalendarDays },
    { name: 'Quotations', href: '/dashboard/quotations', icon: FileText },
    { name: 'Contracts', href: '/dashboard/contracts', icon: FileCheck },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Menu & Catering', href: '/dashboard/menu', icon: UtensilsCrossed },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
    { name: 'Payments & Ledger', href: '/dashboard/payments', icon: Receipt },
    { name: 'Expenses', href: '/dashboard/expenses', icon: DollarSign },
    { name: 'Venues', href: '/dashboard/venues', icon: Building2 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#1F3864] text-white min-h-screen flex flex-col justify-between p-4 shrink-0 shadow-lg print:hidden">
      <div className="space-y-6">
        {/* Brand Logo Header */}
        <div className="px-3 py-2 border-b border-white/10 pb-4">
          <h1 className="text-2xl font-black font-serif uppercase tracking-tight text-white">
            Grand Alnoor
          </h1>
          <p className="text-[10px] text-[#B8860B] font-bold tracking-widest uppercase mt-0.5">
            ERP Management System
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#B8860B] text-white shadow-md'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-4 border-t border-white/10 space-y-2">
        <div className="px-3 py-2 text-[10px] text-blue-200 font-semibold">
          RSM Hall & JTS Hall
        </div>
        <Link
          href="/login"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:bg-red-500/20 transition-all w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </Link>
      </div>
    </div>
  );
}