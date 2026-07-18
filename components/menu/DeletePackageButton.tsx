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
      alert("Could not remove this package tier. If a customer's active quotation or signed contract is built using this specific package, the database will block its removal.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5 print:hidden"
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete Package
      </button>

      {/* Warning Popup Overlay Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 text-gray-900 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-serif font-bold text-red-700 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Remove Menu Package?
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
              Are you sure you want to permanently delete the <strong className="text-gray-900">{packageName}</strong> setup? This action will remove the entire package tier option from your calculation templates.
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