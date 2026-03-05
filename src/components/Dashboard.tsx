'use client';

import { useState, useMemo } from 'react';
import { Transaction } from '@/lib/supabase';
import DateFilter, { DateRange, filterByDate } from './DateFilter';
import StatCard from './StatCard';
import SpendingByCategory from './SpendingByCategory';
import MonthlyTrends from './MonthlyTrends';
import RecurringTracker from './RecurringTracker';
import TransactionList from './TransactionList';

interface DashboardProps {
  transactions: Transaction[];
}

export default function Dashboard({ transactions }: DashboardProps) {
  const now = new Date();
  // Default to last complete month
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [selectedYear, setSelectedYear] = useState(lastMonth.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(lastMonth.getMonth());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showIncomeView, setShowIncomeView] = useState(false);

  const availableYears = useMemo(() => {
    const years = [...new Set(transactions.map((t) => new Date(t.date).getFullYear()))];
    return years.sort((a, b) => b - a);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return filterByDate(transactions, dateRange, selectedYear, selectedMonth) as Transaction[];
  }, [transactions, dateRange, selectedYear, selectedMonth]);

  const totalSpend = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.category !== 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredTransactions]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.category === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredTransactions]);

  // Avg per month uses ALL transactions (not filtered)
  const avgPerMonth = useMemo(() => {
    const allMonthlyTotals = transactions.reduce((acc, t) => {
      const month = new Date(t.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
      acc[month] = (acc[month] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);
    const monthCount = Object.keys(allMonthlyTotals).length;
    const allTimeTotal = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return monthCount > 0 ? allTimeTotal / monthCount : 0;
  }, [transactions]);

  const allTimeMonthCount = useMemo(() => {
    const months = new Set(transactions.map((t) =>
      new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    ));
    return months.size;
  }, [transactions]);

  const categoryTotals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);
  }, [filteredTransactions]);

  // Top category excludes income
  const sortedCategories = Object.entries(categoryTotals)
    .filter(([category]) => category !== 'income')
    .sort(([, a], [, b]) => b - a);
  const topCategory = sortedCategories[0]?.[0] || 'N/A';

  const categoryData = sortedCategories.map(([category, amount]) => ({
    category,
    amount,
  }));

  // Monthly trends - filtered by category if selected
  const monthlyData = useMemo(() => {
    const filtered = selectedCategory
      ? transactions.filter((t) => t.category === selectedCategory)
      : transactions;
    const monthlyTotals = filtered.reduce((acc, t) => {
      const month = new Date(t.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
      acc[month] = (acc[month] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(monthlyTotals)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [transactions, selectedCategory]);

  // Transactions filtered by category for recurring
  const categoryFilteredTransactions = useMemo(() => {
    if (!selectedCategory) return filteredTransactions;
    return filteredTransactions.filter((t) => t.category === selectedCategory);
  }, [filteredTransactions, selectedCategory]);

  // Exclude income and transfer from spending transactions
  const spendingTransactions = useMemo(() => {
    return categoryFilteredTransactions.filter(
      (t) => t.category !== 'income' && t.category !== 'transfer'
    );
  }, [categoryFilteredTransactions]);

  // Income transactions for income view
  const incomeTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => t.category === 'income');
  }, [filteredTransactions]);

  const categories = [...new Set(filteredTransactions.map((t) => t.category))]
    .filter((c) => c !== 'income' && c !== 'transfer')
    .sort();
  const accounts = [...new Set(filteredTransactions.map((t) => t.account))].sort();
  const owners = [...new Set(filteredTransactions.map((t) => t.owner).filter(Boolean))].sort();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDateRangeLabel = () => {
    if (dateRange === 'all') return 'all time';
    if (dateRange === 'week') return 'this week';
    if (dateRange === 'year') return String(selectedYear);
    if (dateRange === 'month') {
      const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long' });
      return `${monthName} ${selectedYear}`;
    }
    return '';
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Finance Dashboard</h1>
            <p className="text-xs text-neutral-500 mt-1">
              {filteredTransactions.length} transactions · {getDateRangeLabel()}
            </p>
          </div>
          <DateFilter
            selectedRange={dateRange}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            availableYears={availableYears}
            onRangeChange={setDateRange}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
          />
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Spend"
          value={formatCurrency(totalSpend)}
          subtext={`${filteredTransactions.filter((t) => t.category !== 'income').length} transactions`}
          onClick={() => {
            setShowIncomeView(false);
            setSelectedCategory(null);
          }}
          selected={!showIncomeView}
        />
        <StatCard
          label="Income"
          value={formatCurrency(totalIncome)}
          subtext={`${filteredTransactions.filter((t) => t.category === 'income').length} transactions`}
          onClick={() => {
            setShowIncomeView(!showIncomeView);
            if (!showIncomeView) setSelectedCategory(null);
          }}
          selected={showIncomeView}
        />
        <StatCard
          label="Avg per Month"
          value={formatCurrency(avgPerMonth)}
          subtext={`${allTimeMonthCount} months (all time)`}
        />
        <StatCard
          label="Top Category"
          value={topCategory}
          subtext={formatCurrency(categoryTotals[topCategory] || 0)}
          onClick={() => {
            setShowIncomeView(false);
            setSelectedCategory(selectedCategory === topCategory ? null : topCategory);
          }}
          selected={selectedCategory === topCategory}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SpendingByCategory
          data={categoryData}
          selectedCategory={selectedCategory}
          onCategoryClick={(category) => {
            setShowIncomeView(false);
            setSelectedCategory(selectedCategory === category ? null : category);
          }}
        />
        <MonthlyTrends data={monthlyData} selectedCategory={selectedCategory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        <div className="lg:col-span-3">
          <TransactionList
            transactions={showIncomeView ? incomeTransactions : categoryFilteredTransactions}
            categories={showIncomeView ? [] : [...new Set(categoryFilteredTransactions.map((t) => t.category))].sort()}
            accounts={accounts}
            owners={owners}
            selectedCategory={showIncomeView ? null : selectedCategory}
            onCategoryChange={setSelectedCategory}
            title={showIncomeView ? 'Income' : 'Transactions'}
            defaultTypeFilter={showIncomeView ? 'all' : 'spending'}
          />
        </div>
        <RecurringTracker transactions={spendingTransactions} />
      </div>
    </main>
  );
}
