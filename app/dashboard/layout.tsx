import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // Route security shield
  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left fixed tracking sidebar navigation navigation */}
      <Sidebar />

      {/* Main variable page view container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Dynamic header tracker passing layout context */}
        <TopBar title="dashboard" />

        {/* Render child dashboard pages code blocks inside clean canvas viewport */}
        <main className="p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}