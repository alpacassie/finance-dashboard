'use client';

import { useState, useMemo } from 'react';
import { Transaction } from '@/lib/supabase';

interface TransactionListProps {
  transactions: Transaction[];
  categories: string[];
  accounts: string[];
}

export default function TransactionList({
  transactions,
  categories,
  accounts,
}: TransactionListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [recurringFilter, setRecurringFilter] = useState<string>('all');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (accountFilter !== 'all' && t.account !== accountFilter) return false;
      if (recurringFilter !== 'all' && t.recurring !== recurringFilter) return false;
      return true;
    });
  }, [transactions, categoryFilter, accountFilter, recurringFilter]);

  return (
    <div className="border border-neutral-200 p-4">
      <h2 className="text-xs text-neutral-500 uppercase tracking-wide mb-4">
        Transactions
      </h2>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs border border-neutral-200 px-2 py-1 bg-white"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="text-xs border border-neutral-200 px-2 py-1 bg-white"
        >
          <option value="all">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc} value={acc}>
              {acc}
            </option>
          ))}
        </select>

        <select
          value={recurringFilter}
          onChange={(e) => setRecurringFilter(e.target.value)}
          className="text-xs border border-neutral-200 px-2 py-1 bg-white"
        >
          <option value="all">All Types</option>
          <option value="no">One-time</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-neutral-200">
              <th className="text-left py-2 font-medium text-neutral-500">Date</th>
              <th className="text-left py-2 font-medium text-neutral-500">Merchant</th>
              <th className="text-left py-2 font-medium text-neutral-500">Category</th>
              <th className="text-right py-2 font-medium text-neutral-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-2 text-neutral-500">{formatDate(t.date)}</td>
                <td className="py-2 truncate max-w-[150px]">{t.merchant}</td>
                <td className="py-2">
                  <span className="inline-block px-1.5 py-0.5 bg-neutral-100 text-neutral-600 text-[10px]">
                    {t.category}
                  </span>
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-400 mt-3">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </p>
    </div>
  );
}
