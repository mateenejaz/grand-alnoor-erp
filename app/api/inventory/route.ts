import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');

    if (!businessId) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
    }

    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });

    if (itemsError) throw itemsError;

    const { data: purchases, error: purchasesError } = await supabase
      .from('stock_purchases')
      .select('*, inventory_items(name, unit_of_measure)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (purchasesError) throw purchasesError;

    return NextResponse.json({ items, purchases }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'CREATE_ITEM') {
      const { business_id, name, unit_of_measure, reorder_level, default_selling_price_pkr } = body;

      const { data, error } = await supabase
        .from('inventory_items')
        .insert([
          {
            business_id,
            name,
            unit_of_measure: unit_of_measure || 'bottles',
            reorder_level: Number(reorder_level) || 0,
            default_selling_price_pkr: Number(default_selling_price_pkr) || 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data }, { status: 201 });
    }

    if (action === 'ADD_STOCK') {
      const { business_id, item_id, quantity_added, purchase_unit_price_pkr, supplier_name, notes } = body;

      const { data, error } = await supabase
        .from('stock_purchases')
        .insert([
          {
            business_id,
            item_id,
            quantity_added: Number(quantity_added),
            purchase_unit_price_pkr: Number(purchase_unit_price_pkr),
            supplier_name: supplier_name || null,
            notes: notes || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action provided' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}