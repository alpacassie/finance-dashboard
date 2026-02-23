import { supabase, Transaction } from '@/lib/supabase';
import StatCard from '@/components/StatCard';
import SpendingByCategory from '@/components/SpendingByCategory';
import MonthlyTrends from '@/components/MonthlyTrends';
import RecurringTracker from '@/components/RecurringTracker';
import TransactionList from '@/components/TransactionList';

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

export default async function Dashboard() {
  const transactions = await getTransactions();

  const totalSpend = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const monthlyTotals = transactions.reduce((acc, t) => {
    const month = new Date(t.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
    acc[month] = (acc[month] || 0) + Math.abs(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const months = Object.keys(monthlyTotals);
  const avgPerMonth = months.length > 0 ? totalSpend / months.length : 0;

  const categoryTotals = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a);

  const topCategory = sortedCategories[0]?.[0] || 'N/A';

  const categoryData = sortedCategories.map(([category, amount]) => ({
    category,
    amount,
  }));

  const monthlyData = Object.entries(monthlyTotals)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  const categories = [...new Set(transactions.map((t) => t.category))].sort();
  const accounts = [...new Set(transactions.map((t) => t.account))].sort();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-xl font-semibold">Finance Dashboard</h1>
        <p className="text-xs text-neutral-500 mt-1">
          {transactions.length} transactions across {accounts.length} accounts
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Spend"
          value={formatCurrency(totalSpend)}
          subtext={`${transactions.length} transactions`}
        />
        <StatCard
          label="Avg per Month"
          value={formatCurrency(avgPerMonth)}
          subtext={`${months.length} months`}
        />
        <StatCard
          label="Top Category"
          value={topCategory}
          subtext={formatCurrency(categoryTotals[topCategory] || 0)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SpendingByCategory data={categoryData} />
        <MonthlyTrends data={monthlyData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TransactionList
            transactions={transactions}
            categories={categories}
            accounts={accounts}
          />
        </div>
        <RecurringTracker transactions={transactions} />
      </div>
    </main>
  );
}
