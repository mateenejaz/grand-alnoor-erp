'use client';

import { useState } from 'react';
import { Plus, Edit, EyeOff, Eye, PackageOpen } from 'lucide-react';
import PackageForm from './PackageForm';
import DeletePackageButton from './DeletePackageButton'; // Imported new delete component
import { updatePackage } from '@/lib/menu';
import { useRouter } from 'next/navigation';

interface PackageListProps {
  businessId: string;
  packages: any[];
  allItems: any[];
}

export default function PackageList({ businessId, packages, allItems }: PackageListProps) {
  const router = useRouter();
  const [editingPkg, setEditingPkg] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const toggleStatus = async (pkg: any) => {
    try {
      await updatePackage(pkg.id, { is_active: !pkg.is_active });
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
      <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <PackageOpen className="w-5 h-5 text-[#B8860B]" />
          <h3 className="font-bold text-gray-900 font-serif text-lg">Menu Packages</h3>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[#B8860B] hover:bg-[#986f08] text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Package
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {packages.map(pkg => (
            <div key={pkg.id} className={`flex flex-col p-5 rounded-2xl border transition-colors ${pkg.is_active ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className={`text-lg font-black font-serif ${pkg.is_active ? 'text-gray-900' : 'text-gray-500 line-through'}`}>{pkg.name}</h4>
                  <p className="text-sm font-bold text-[#B8860B] mt-0.5">PKR {pkg.price_per_head.toLocaleString()} <span className="text-xs text-gray-500 font-normal">/ head</span></p>
                </div>
                <div className="flex gap-1.5 bg-white rounded-lg shadow-sm border border-gray-100 p-1 items-center">
                  {/* Status Toggle Eye Button */}
                  <button onClick={() => toggleStatus(pkg)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title={pkg.is_active ? "Deactivate" : "Activate"}>
                    {pkg.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  
                  {/* Edit Button */}
                  <button onClick={() => setEditingPkg(pkg)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* NEW: Permanent Secure Delete Button */}
                  <DeletePackageButton packageId={pkg.id} packageName={pkg.name} />
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{pkg.description || 'No description provided.'}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Includes {pkg.package_items?.length || 0} Items</span>
                {!pkg.is_active && <span className="text-red-500">Inactive</span>}
              </div>
            </div>
          ))}
          {packages.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
              No packages defined yet. Create packages to bundle your dishes.
            </div>
          )}
        </div>
      </div>

      {(showAddModal || editingPkg) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <PackageForm 
            businessId={businessId} 
            allItems={allItems}
            initialData={editingPkg} 
            onClose={() => { setShowAddModal(false); setEditingPkg(null); }} 
            onSuccess={() => { setShowAddModal(false); setEditingPkg(null); }} 
          />
        </div>
      )}
    </div>
  );
}