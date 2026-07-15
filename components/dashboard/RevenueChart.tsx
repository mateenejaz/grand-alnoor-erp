'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: { month: string; total: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  // Custom tooltip to format PKR properly on hover
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700 text-sm">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-[#B8860B] font-black">
            PKR {Number(payload[0].value).toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full min-h-[350px]">
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">6-Month Revenue Trend</h3>
        <p className="text-xs text-gray-500 mt-1">Total collected payments minus refunds.</p>
      </div>
      
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6B7280' }} 
              tickFormatter={(value) => `Rs ${(value / 1000)}k`}
              dx={-10}
            />
            <Tooltip cursor={{ fill: '#F3F4F6' }} content={<CustomTooltip />} />
            <Bar 
              dataKey="total" 
              fill="#1F3864" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}