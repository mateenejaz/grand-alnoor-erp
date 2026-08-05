import { supabase } from '@/lib/accounting/accounts';

export interface CustomerSummary {
  customerId: string;
  customerName: string;
  phone: string;
  cnic: string;
  totalInvoiced: number;      // sum of all contract total_amounts
  totalAdvance: number;       // sum of payments where payment_type='advance'
  totalPaid: number;          // sum of all non-refund payments
  totalRefunds: number;       // sum of all refund payments
  netReceived: number;        // totalPaid - totalRefunds
  outstandingBalance: number; // totalInvoiced - netReceived
  lastPaymentDate: string | null;
  lastPaymentAmount: number;
  contractCount: number;
  activeContracts: number;    // count where status='active'
}

export interface CustomerPayment {
  id: string;
  contractId: string | null;
  paymentDate: string;
  paymentType: string;
  paymentMethod: string;
  amount: number;
  receiptNumber: string;
  notes: string | null;
  isRefund: boolean;
  runningBalance?: number;
}

export interface CustomerContract {
  id: string;
  contractNumber: string;
  eventDate: string;
  venueName: string;
  status: string;
  totalAmount: number;
  payments: CustomerPayment[];
}

export interface CustomerLedgerDetail {
  customerId: string;
  customerName: string;
  phone: string;
  cnic: string;
  address: string | null;
  totalInvoiced: number;
  totalPaid: number;
  totalRefunds: number;
  netReceived: number;
  outstandingBalance: number;
  contracts: CustomerContract[];
  allPaymentsChronological: CustomerPayment[];
}

/**
 * Helper to extract customer fields safely from any schema variant
 */
function parseCustomerFields(cRecord: any) {
  if (!cRecord) return null;
  const obj = Array.isArray(cRecord) ? cRecord[0] : cRecord;
  if (!obj) return null;

  // Normalize keys: lowercase and strip spaces/underscores (e.g., "contact_no" -> "contactno")
  const norm: Record<string, any> = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      norm[key.toLowerCase().replace(/[\s_]/g, '')] = obj[key];
    }
  }

  const name =
    norm.name ||
    norm.fullname ||
    norm.customername ||
    norm.clientname ||
    (norm.firstname ? `${norm.firstname} ${norm.lastname || ''}`.trim() : '') ||
    norm.title ||
    '';

  const phone =
    norm.phone ||
    norm.phonenumber ||
    norm.mobile ||
    norm.mobilenumber ||
    norm.contact ||
    norm.contactnumber ||
    norm.contactno ||
    'N/A';

  const cnic =
    norm.cnic ||
    norm.cnicnumber ||
    norm.idcard ||
    norm.cnicno ||
    norm.nic ||
    'N/A';

  return { name, phone, cnic };
}

/**
 * Retrieves ledger summaries for all customers with at least one contract.
 */
export async function getAllCustomerLedger(
  businessId: string,
  asOfDate?: string
): Promise<CustomerSummary[]> {
  // 1. Fetch contracts directly
  let contractsQuery = supabase
    .from('contracts')
    .select('*');

  if (businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
    contractsQuery = contractsQuery.eq('business_id', businessId);
  }

  if (asOfDate) {
    contractsQuery = contractsQuery.lte('created_at', `${asOfDate}T23:59:59`);
  }

  const { data: contractsData, error: contractsError } = await contractsQuery;
  if (contractsError || !contractsData || contractsData.length === 0) {
    if (contractsError) console.error('Error fetching contracts:', contractsError.message);
    return [];
  }

  // Collect unique customer IDs robustly (catching customer_id, customer_code, etc.)
  const contractToCustomerMap = new Map<string, string>();
  contractsData.forEach((c) => {
    const cId = c.customer_id || c.customer_code || c.client_id || c.customer;
    if (c.id && cId) {
      contractToCustomerMap.set(c.id, String(cId));
    }
  });

  const customerIds = Array.from(new Set(Array.from(contractToCustomerMap.values())));
  if (customerIds.length === 0) return [];

  // 2. Fetch Customer Profiles (Fetching all for business to avoid UUID .in() crashes)
  const customerMap = new Map<string, { name: string; phone: string; cnic: string }>();

  let customersQuery = supabase.from('customers').select('*');
  if (businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
    customersQuery = customersQuery.eq('business_id', businessId);
  }

  const { data: customersData, error: customersError } = await customersQuery;

  if (customersError) {
    console.error('Error fetching customers:', customersError.message);
  } else {
    (customersData || []).forEach((c) => {
      const parsed = parseCustomerFields(c);
      if (parsed && parsed.name) {
        // Map by every possible ID column so it matches whatever the contract used
        if (c.id) customerMap.set(String(c.id), parsed);
        if (c.customer_id) customerMap.set(String(c.customer_id), parsed);
        if (c.customer_code) customerMap.set(String(c.customer_code), parsed);
        if (c.uuid) customerMap.set(String(c.uuid), parsed);
      }
    });
  }

  // 3. Fetch payments using contract_id link
  let paymentsData: any[] = [];
  const contractIds = Array.from(contractToCustomerMap.keys());

  if (contractIds.length > 0) {
    let paymentsQuery = supabase
      .from('payments')
      .select('*');

    if (businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
      paymentsQuery = paymentsQuery.eq('business_id', businessId);
    }

    if (asOfDate) {
      paymentsQuery = paymentsQuery.lte('payment_date', asOfDate);
    }

    const { data: pData, error: paymentsError } = await paymentsQuery.in('contract_id', contractIds);
    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError.message);
    } else if (pData) {
      paymentsData = pData;
    }
  }

  // Group payments by customer ID
  const customerPaymentsMap = new Map<string, any[]>();
  paymentsData.forEach((p) => {
    const cId = contractToCustomerMap.get(p.contract_id);
    if (!cId) return;
    const existing = customerPaymentsMap.get(cId) || [];
    existing.push(p);
    customerPaymentsMap.set(cId, existing);
  });

  // Group contracts by customer ID
  const customerContractsMap = new Map<string, any[]>();
  contractsData.forEach((c) => {
    const cId = c.customer_id || c.customer_code || c.client_id || c.customer;
    if (!cId) return;
    const existing = customerContractsMap.get(String(cId)) || [];
    existing.push(c);
    customerContractsMap.set(String(cId), existing);
  });

  // 4. Build summary objects
  const summaries: CustomerSummary[] = [];

  for (const cId of customerIds) {
    const profile = customerMap.get(cId) || {
      name: `Unknown Customer (${String(cId).substring(0, 6)})`,
      phone: 'N/A',
      cnic: 'N/A',
    };

    const cContracts = customerContractsMap.get(cId) || [];
    const cPayments = customerPaymentsMap.get(cId) || [];

    let totalInvoiced = 0;
    let activeContracts = 0;

    cContracts.forEach((contract) => {
      totalInvoiced += Number(contract.total_amount || 0);
      if (String(contract.status).toLowerCase() === 'active') {
        activeContracts++;
      }
    });

    let totalAdvance = 0;
    let totalPaid = 0;
    let totalRefunds = 0;
    let lastPaymentDate: string | null = null;
    let lastPaymentAmount = 0;

    const sortedPayments = [...cPayments].sort(
      (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
    );

    sortedPayments.forEach((p) => {
      const amt = Number(p.amount || 0);
      const pType = String(p.payment_type || '').toLowerCase();

      if (pType === 'refund') {
        totalRefunds += amt;
      } else {
        totalPaid += amt;
        if (pType === 'advance') {
          totalAdvance += amt;
        }
      }

      lastPaymentDate = p.payment_date;
      lastPaymentAmount = amt;
    });

    const netReceived = totalPaid - totalRefunds;
    const outstandingBalance = totalInvoiced - netReceived;

    summaries.push({
      customerId: cId,
      customerName: profile.name,
      phone: profile.phone,
      cnic: profile.cnic,
      totalInvoiced,
      totalAdvance,
      totalPaid,
      totalRefunds,
      netReceived,
      outstandingBalance,
      lastPaymentDate,
      lastPaymentAmount,
      contractCount: cContracts.length,
      activeContracts,
    });
  }

  summaries.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
  return summaries;
}

/**
 * Returns full transaction history for a single customer.
 */
export async function getCustomerLedgerDetail(
  customerId: string,
  businessId: string
): Promise<CustomerLedgerDetail | null> {
  // 1. Fetch customers safely to avoid Postgres UUID crashes on string codes
  let customersQuery = supabase.from('customers').select('*');
  if (businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
    customersQuery = customersQuery.eq('business_id', businessId);
  }

  const { data: allCustomers, error: customerErr } = await customersQuery;
  if (customerErr) {
    console.error('Error fetching customer detail:', customerErr.message);
  }

  // Safely find the exact customer in-memory
  const customer = (allCustomers || []).find((c) =>
    String(c.id) === String(customerId) ||
    String(c.customer_id) === String(customerId) ||
    String(c.customer_code) === String(customerId) ||
    String(c.uuid) === String(customerId)
  );

  const parsed = parseCustomerFields(customer || {});
  const customerName = parsed?.name || `Customer (${String(customerId).substring(0, 8)})`;
  const phone = parsed?.phone || 'N/A';
  const cnic = parsed?.cnic || 'N/A';

  let address = null;
  if (customer) {
    const lowerKeys = Object.keys(customer).reduce((acc: any, key) => {
      acc[key.toLowerCase().replace(/[\s_]/g, '')] = customer[key];
      return acc;
    }, {});
    address = lowerKeys.address || lowerKeys.location || lowerKeys.fulladdress || null;
  }

  // 2. Fetch contracts and filter dynamically
  let contractsQuery = supabase.from('contracts').select('*');
  if (businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
    contractsQuery = contractsQuery.eq('business_id', businessId);
  }

  const { data: allContractsData, error: contractsErr } = await contractsQuery;
  if (contractsErr) {
    console.error('Error fetching detail contracts:', contractsErr.message);
  }

  const contractsData = (allContractsData || []).filter((c: any) => {
    const matchId = String(customerId);
    return (
      String(c.customer_id) === matchId ||
      String(c.customer_code) === matchId ||
      String(c.client_id) === matchId ||
      String(c.customer) === matchId
    );
  });

  const contractIds = contractsData.map((c: any) => c.id).filter(Boolean);

  // 3. Fetch payments using contract_id
  let rawPayments: CustomerPayment[] = [];
  let totalPaid = 0;
  let totalRefunds = 0;

  if (contractIds.length > 0) {
    let paymentsQuery = supabase
      .from('payments')
      .select('*')
      .in('contract_id', contractIds);

    if (businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
      paymentsQuery = paymentsQuery.eq('business_id', businessId);
    }

    const { data: paymentsData, error: paymentsErr } = await paymentsQuery;

    if (paymentsErr) {
      console.error('Error fetching detail payments:', paymentsErr.message);
    }

    rawPayments = (paymentsData || []).map((p) => {
      const amt = Number(p.amount || 0);
      const isRefund = String(p.payment_type || '').toLowerCase() === 'refund';

      if (isRefund) {
        totalRefunds += amt;
      } else {
        totalPaid += amt;
      }

      return {
        id: p.id,
        contractId: p.contract_id,
        paymentDate: p.payment_date,
        paymentType: p.payment_type || 'Payment',
        paymentMethod: p.payment_method || 'Cash',
        amount: amt,
        receiptNumber: p.receipt_number || `REC-${String(p.id).substring(0, 8)}`,
        notes: p.notes,
        isRefund,
      };
    });
  }

  // Calculate high level totals
  let totalInvoiced = 0;
  contractsData.forEach((c) => {
    totalInvoiced += Number(c.total_amount || 0);
  });

  // Sort payments chronologically to compute running balance
  rawPayments.sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );

  let runningBalance = totalInvoiced;
  const allPaymentsChronological = rawPayments.map((p) => {
    if (p.isRefund) {
      runningBalance += p.amount;
    } else {
      runningBalance -= p.amount;
    }
    return {
      ...p,
      runningBalance,
    };
  });

  // Map payments onto contracts seamlessly
  const contracts: CustomerContract[] = contractsData.map((c: any) => {
    const contractPayments = allPaymentsChronological.filter(
      (p) => p.contractId === c.id
    );

    const venueName =
      c.venue_name ||
      c.venue ||
      (c.venue_id ? `Venue ID: ${String(c.venue_id).substring(0, 6)}` : 'Grand Alnoor Venue');

    return {
      id: c.id,
      contractNumber: c.contract_number || `CTR-${String(c.id).substring(0, 8)}`,
      eventDate: c.event_date || 'N/A',
      venueName,
      status: c.status || 'Active',
      totalAmount: Number(c.total_amount || 0),
      payments: contractPayments,
    };
  });

  const netReceived = totalPaid - totalRefunds;
  const outstandingBalance = totalInvoiced - netReceived;

  return {
    customerId,
    customerName,
    phone,
    cnic,
    address,
    totalInvoiced,
    totalPaid,
    totalRefunds,
    netReceived,
    outstandingBalance,
    contracts,
    allPaymentsChronological,
  };
}