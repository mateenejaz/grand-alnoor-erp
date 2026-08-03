'use client';

import { useState, useEffect } from 'react';
import InventoryList from '@/components/inventory/InventoryList';
import { supabaseBrowser } from '@/lib/supabase-client';

export default function InventoryPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const { data, error } = await supabaseBrowser
          .from('businesses')
          .select('id')
          .limit(1)
          .single();

        if (error) {
          // Fallback if limit(1) single throws multi-row error
          const { data: list } = await supabaseBrowser.from('businesses').select('id');
          if (list && list.length > 0) {
            setBusinessId(list[0].id);
          }
        } else if (data) {
          setBusinessId(data.id);
        }
      } catch (err) {
        console.error('Failed to resolve business id:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm font-medium text-gray-500">
        Initializing Inventory Module...
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="p-8 text-center text-red-600 font-bold bg-red-50 rounded-2xl border border-red-200">
        Could not detect business profile. Please contact administrator.
      </div>
    );
  }

  return <InventoryList businessId={businessId} />;
}