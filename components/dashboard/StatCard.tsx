import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  isCurrency?: boolean;
}

export default function StatCard({ title, value, icon, subtitle, isCurrency = false }: StatCardProps) {
  const displayValue = isCurrency 
    ? `PKR ${Number(value).toLocaleString()}`
    : value.toLocaleString();

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 transition-transform hover:-translate-y-1 duration-200">
      <div className="p-4 bg-gray-50 rounded-xl text-[#1F3864] shrink-0 border border-gray-100">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-black text-gray-900 font-serif">{displayValue}</p>
        {subtitle && (
          <p className="text-xs font-semibold text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}