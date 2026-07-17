'use client';

import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-client';

interface DeleteQuotationButtonProps {
  quotationId: string;
}

export default function DeleteQuotationButton({ quotationId }: DeleteQuotationButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabaseBrowser
        .from('quotations')
        .delete()
        .eq('id', quotationId);

      if (error) throw error;

      // Send the user out of this screen back to the main quotation dashboard
      router.push('/dashboard/quotations');
      router.refresh();
    } catch (err) {
      console.error("Deletion failure error:", err);
      alert("Could not remove this quotation record. If a contract has already been generated from this quote, you may need to delete that contract first.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Permanent Delete Trigger Button */}
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 text-sm font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2 print:hidden"
      >
        <Trash2 className="w-4 h-4" /> Delete Quote
      </button>

      {/* Pop-up Safety Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 text-gray-900 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-serif font-bold text-red-700 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Erase Quotation Record?
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
              Are you sure you want to permanently delete this quotation entry? This will permanently remove its menu layout configurations and calculated pricing summaries.
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
                {isDeleting ? 'Deleting...' : 'Yes, Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}