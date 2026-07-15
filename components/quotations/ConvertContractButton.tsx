'use client';

import { useState } from 'react';
import { FileSignature, Loader2 } from 'lucide-react';
import { createContractFromQuotation } from '@/lib/contracts';
import { useRouter } from 'next/navigation';

export default function ConvertContractButton({ quotationId }: { quotationId: string }) {
  const router = useRouter();
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    const confirm = window.confirm("Has the client agreed to this quotation? This will lock the booking and generate a binding contract.");
    if (!confirm) return;

    setIsConverting(true);
    try {
      const newContract = await createContractFromQuotation(quotationId);
      router.push(`/dashboard/contracts/${newContract.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to convert quotation to contract.");
      setIsConverting(false);
    }
  };

  return (
    <button 
      onClick={handleConvert}
      disabled={isConverting}
      className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 print:hidden disabled:opacity-50"
    >
      {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}
      Accept & Convert to Contract
    </button>
  );
}