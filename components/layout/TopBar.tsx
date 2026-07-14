'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { LogOut, User as UserIcon } from 'lucide-react';

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const [fullName, setFullName] = useState<string>('Staff Account');

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('full_name')
            .eq('auth_id', user.id)
            .single();

          if (!error && data?.full_name) {
            setFullName(data.full_name);
          }
        }
      } catch (err) {
        console.error('Error loading profile context:', err);
      }
    }

    fetchUserProfile();
  }, []);

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shadow-sm">
      {/* Dynamic Title */}
      <h1 className="text-2xl font-bold text-[#1F3864] font-serif capitalize">
        {title === 'dashboard' ? 'Overview Summary' : title}
      </h1>

      {/* Profile actions container */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
          <div className="w-8 h-8 rounded-full bg-[#1F3864]/5 flex items-center justify-center border border-[#B8860B]/30">
            <UserIcon className="w-4 h-4 text-[#1F3864]" />
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {fullName}
          </span>
        </div>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50/50 transition-all duration-200"
          title="Sign out of system"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}