import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;

    const { data, error } = await supabase
      .from('contract_consumables')
      .select('*, inventory_items(name, unit_of_measure)')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;
    const { item_id, quantity_consumed, unit_price_pkr } = await request.json();

    const { data, error } = await supabase
      .from('contract_consumables')
      .insert([
        {
          contract_id: contractId,
          item_id,
          quantity_consumed: Number(quantity_consumed),
          unit_price_pkr: Number(unit_price_pkr),
        },
      ])
      .select('*, inventory_items(name, unit_of_measure)')
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}