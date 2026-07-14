'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getVenues, createVenue, updateVenue, toggleVenueActive } from '@/lib/venues';
import VenueList from '@/components/venues/VenueList';
import VenueForm from '@/components/venues/VenueForm';
import { Loader2 } from 'lucide-react';

export default function VenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<any | null>(null);

  // Load profile contexts and pull corporate dataset arrays
  async function loadData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Pull current business profile relationship setup
      const { data: profile } = await supabase
        .from('users')
        .select('business_id')
        .eq('auth_id', user.id)
        .single();

      if (profile?.business_id) {
        setBusinessId(profile.business_id);
        let list = await getVenues(profile.business_id);

        // AUTO-SEED ENGINE: Check and insert default venues if empty
        if (list.length === 0) {
          const rsmSeed = {
            business_id: profile.business_id,
            name: 'RSM Hall',
            type: 'Marquee',
            capacity: 450,
            description: 'Premium operational independent hall space with custom lighting matrix grids.',
            is_active: true,
          };

          const jtsSeed = {
            business_id: profile.business_id,
            name: 'JTS Hall',
            type: 'Marquee',
            capacity: 350,
            description: 'Independent banquet hall layout equipped with automated cooling plants.',
            is_active: true,
          };

          await createVenue(rsmSeed);
          await createVenue(jtsSeed);
          
          // Re-fetch clean database records arrays
          list = await getVenues(profile.business_id);
        }
        setVenues(list);
      }
    } catch (err) {
      console.error('Error handling data synchronization:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingVenue(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (venue: any) => {
    setEditingVenue(venue);
    setIsFormOpen(true);
  };

  const handleSaveVenue = async (formData: any) => {
    if (!businessId) return;

    if (editingVenue) {
      await updateVenue(editingVenue.id, formData);
    } else {
      await createVenue({ ...formData, business_id: businessId });
    }
    await loadData();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await toggleVenueActive(id, !currentStatus);
    await loadData();
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-[#1F3864]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-3 font-medium text-gray-500">Synchronizing Venue Contexts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VenueList
        venues={venues}
        onAddClick={handleOpenAdd}
        onEditClick={handleOpenEdit}
        onToggleActive={handleToggleActive}
      />

      {isFormOpen && (
        <VenueForm
          venue={editingVenue}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveVenue}
        />
      )}
    </div>
  );
}