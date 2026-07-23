import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  isCurrency?: boolean;
}

export default function StatCard({ title, value, icon, subtitle, isCurrency = false }: StatCardProps) {
  const formattedNumber = Number(value).toLocaleString();

  return (
    <div className="bg-white p-3.5 xl:p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-2.5 transition-transform hover:-translate-y-1 duration-200 min-w-0">
      {/* Icon Box */}
      <div className="p-2 bg-gray-50 rounded-xl text-[#1F3864] shrink-0 border border-gray-100 mt-0.5">
        {icon}
      </div>

      {/* Details Area */}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] xl:text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </p>

        {isCurrency ? (
          <div className="leading-tight">
            <span className="block text-xs font-black text-gray-900 font-serif">PKR</span>
            <span className="block text-base xl:text-lg font-black text-gray-900 font-serif tracking-tight">
              {formattedNumber}
            </span>
          </div>
        ) : (
          <p className="text-xl xl:text-2xl font-black text-gray-900 font-serif leading-tight">
            {formattedNumber}
          </p>
        )}

        {subtitle && (
          <p className="text-[10px] xl:text-[11px] font-semibold text-gray-500 mt-1 leading-tight">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}