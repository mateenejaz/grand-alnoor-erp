import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ContractDetail from '@/components/contracts/ContractDetail';
import { getContractById } from '@/lib/contracts';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ContractDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const contractId = resolvedParams.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const contract = await getContractById(contractId);
  if (!contract) redirect('/dashboard/contracts');

  return (
    <div className="space-y-4 h-full pb-10 max-w-6xl mx-auto">
      <Link href="/dashboard/contracts" className="text-sm font-semibold text-gray-500 hover:text-[#1F3864] flex items-center gap-1 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Contracts Ledger
      </Link>
      
      <ContractDetail contract={contract} />
    </div>
  );
}