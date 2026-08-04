'use client';

import React, { useState } from 'react';
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
  BookOpen,
  ChevronDown,
  ChevronRight,
  Book,
  FileSpreadsheet,
  UserCheck,
  Truck,
  PieChart,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const isAccountingRoute = Boolean(pathname?.startsWith('/dashboard/accounting'));
  const [accountingOpen, setAccountingOpen] = useState<boolean>(true);

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

  const accountingSubMenu = [
    { name: 'Chart of Accounts', href: '/dashboard/accounting/chart-of-accounts', icon: Book },
    { name: 'Day Book', href: '/dashboard/accounting/day-book', icon: Receipt },
    { name: 'General Ledger', href: '/dashboard/accounting/general-ledger', icon: FileSpreadsheet }, // FIXED LINE
    { name: 'Customer Ledger', href: '/dashboard/accounting/customer-ledger', icon: UserCheck },
    { name: 'Supplier Ledger', href: '/dashboard/accounting/supplier-ledger', icon: Truck },
    { name: 'Journal Entries', href: '/dashboard/accounting/journal-entries', icon: FileText },
    { name: 'Reports', href: '/dashboard/accounting/reports', icon: PieChart },
  ];

  return (
    <aside className="w-64 bg-[#1F3864] text-white h-screen sticky top-0 flex flex-col justify-between p-4 shrink-0 shadow-lg overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 print:hidden">
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
        <nav className="space-y-1 pb-4">
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

          {/* Collapsible Phase 2 Accounting Section */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setAccountingOpen((prev) => !prev)}
              className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isAccountingRoute
                  ? 'bg-white/15 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 shrink-0 text-[#B8860B]" />
                <span>Accounting</span>
              </div>
              {accountingOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
              )}
            </button>

            {accountingOpen && (
              <div className="ml-4 mt-1.5 space-y-1 border-l border-white/15 pl-2.5">
                {accountingSubMenu.map((subItem) => {
                  const isSubActive = pathname === subItem.href;
                  const SubIcon = subItem.icon;

                  return (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                        isSubActive
                          ? 'bg-[#B8860B] text-white shadow-md'
                          : 'text-blue-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <SubIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{subItem.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-4 border-t border-white/10 space-y-2 mt-auto">
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
    </aside>
  );
}