import { supabase, Transaction } from '@/lib/supabase';
import Dashboard from '@/components/Dashboard';

async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

export const revalidate = 60;

export default async function Page() {
  const transactions = await getTransactions();
  return <Dashboard transactions={transactions} />;
}
