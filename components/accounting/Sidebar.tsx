'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Receipt,
  FileSpreadsheet,
  PlusCircle,
  Building2,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    name: 'Chart of Accounts',
    href: '/dashboard/accounting/accounts',
    icon: FileSpreadsheet,
  },
  {
    name: 'Day Book',
    href: '/dashboard/accounting/day-book',
    icon: Receipt,
  },
  {
    name: 'General Ledger',
    href: '/dashboard/accounting/general-ledger', // Fixed URL path
    icon: BookOpen,
  },
  {
    name: 'New Journal Entry',
    href: '/dashboard/accounting/journal-entry',
    icon: PlusCircle,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1F3864] text-white min-h-screen p-4 flex flex-col justify-between print:hidden">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="px-2 border-b border-blue-900/50 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#B8860B]" />
            <h2 className="font-bold text-lg text-white font-serif tracking-wide uppercase">
              Grand Alnoor
            </h2>
          </div>
          <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-wider font-semibold">
            Financial Accounting ERP
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#B8860B] text-white shadow-md'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="px-2 pt-4 border-t border-blue-900/50 text-[10px] text-gray-400">
        <p className="font-bold text-gray-300">Phase 2: Financials</p>
        <p className="mt-0.5">RSM & JTS Venues</p>
      </div>
    </aside>
  );
}