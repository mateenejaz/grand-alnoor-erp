'use client';

import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 1. Parent container locks to the screen viewport height and width
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      
      {/* 2. Sidebar stays fixed on the left and does not shrink */}
      <Sidebar className="w-64 flex-shrink-0 h-full" />

      {/* 3. Main Content Wrapper fills the remaining horizontal space */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        
        {/* TopBar remains fixed at the top */}
        <TopBar />

        {/* 4. CRITICAL FIX: 'overflow-y-auto' enables independent scrolling 
            for the calendar and content pages, leaving Sidebar/TopBar locked in place. */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}