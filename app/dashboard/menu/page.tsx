import { createClient } from '@/lib/supabase-server';
import PackageList from '@/components/menu/PackageList';
import MenuItemList from '@/components/menu/MenuItemList';
import { ChefHat } from 'lucide-react';
import { getPackages, getMenuItems } from '@/lib/menu';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function MenuSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let packages: any[] = [];
  let menuItems: any[] = [];
  let businessId = '';

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('business_id')
      .eq('auth_id', user.id)
      .single();

    if (profile?.business_id) {
      businessId = profile.business_id;

      // Fetch all required data using our library functions
      [packages, menuItems] = await Promise.all([
        getPackages(businessId),
        getMenuItems(businessId)
      ]);
    }
  }

  return (
    <div className="space-y-6 h-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#B8860B]/10 rounded-xl text-[#B8860B]">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1F3864] font-serif">Menu & Catering Setup</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Define individual dishes and configure per-head pricing packages for quotations.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        <PackageList businessId={businessId} packages={packages} allItems={menuItems} />
        <MenuItemList businessId={businessId} items={menuItems} />
      </div>
    </div>
  );
}