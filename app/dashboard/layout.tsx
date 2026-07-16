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
      
      {/* 2. Wrapped Sidebar in a standard div to handle sizing safely without prop type issues */}
      <div className="w-64 flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* 3. Main Content Wrapper fills the remaining horizontal space */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        
        {/* 4. FIXED: Passed the required 'title' prop to TopBar to solve the compilation error */}
        <TopBar title="Grand Alnoor Management" />

        {/* 5. CRITICAL SCROLL FIX: Enables independent scrolling for the calendar layout */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}