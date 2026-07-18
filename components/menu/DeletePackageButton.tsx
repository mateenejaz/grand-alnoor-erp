'use client';

import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-client';

interface DeletePackageButtonProps {
  packageId: string;
  packageName: string;
}

export default function DeletePackageButton({ packageId, packageName }: DeletePackageButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabaseBrowser
        .from('packages')
        .delete()
        .eq('id', packageId);

      if (error) throw error;

      setShowConfirm(false);
      router.refresh();
    } catch (err) {
      console.error("Package deletion error:", err);
      alert("Could not remove this package tier. If this package is currently referenced by live bookings, active contracts, or saved quotations, you must update or remove those records first.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors print:hidden"
        title={`Delete ${packageName}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Warning Popup Overlay Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 text-gray-900 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-serif font-bold text-red-700 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Delete Package Entry?
              </h3>
              <button 
                type="button" 
                onClick={() => setShowConfirm(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-gray-900">{packageName}</strong>? This package configuration will be removed from your master menu selections.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}