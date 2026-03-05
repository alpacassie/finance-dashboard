'use client';

import { useState, useMemo, useEffect } from 'react';
import { Transaction } from '@/lib/supabase';

interface TransactionListProps {
  transactions: Transaction[];
  categories: string[];
  accounts: string[];
  owners: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  title?: string;
  defaultTypeFilter?: 'all' | 'spending' | 'income' | 'transfer';
}

export default function TransactionList({
  transactions,
  categories,
  accounts,
  owners,
  selectedCategory,
  onCategoryChange,
  title = 'Transactions',
  defaultTypeFilter = 'spending',
}: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [recurringFilter, setRecurringFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>(defaultTypeFilter);
  const [sortColumn, setSortColumn] = useState<'date' | 'merchant' | 'category' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  useEffect(() => {
    setTypeFilter(defaultTypeFilter);
  }, [defaultTypeFilter]);

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

  const handleSort = (column: 'date' | 'merchant' | 'category' | 'amount') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'date' ? 'desc' : 'asc');
    }
  };

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = transactions.filter((t) => {
      if (query && !t.merchant.toLowerCase().includes(query) && !t.category.toLowerCase().includes(query)) {
        return false;
      }
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (accountFilter !== 'all' && t.account !== accountFilter) return false;
      if (ownerFilter !== 'all' && t.owner !== ownerFilter) return false;
      if (recurringFilter !== 'all' && t.recurring !== recurringFilter) return false;
      // Type filter
      if (typeFilter === 'spending' && (t.category === 'income' || t.category === 'transfer')) return false;
      if (typeFilter === 'income' && t.category !== 'income') return false;
      if (typeFilter === 'transfer' && t.category !== 'transfer') return false;
      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortColumn === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortColumn === 'merchant') {
        comparison = a.merchant.localeCompare(b.merchant);
      } else if (sortColumn === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortColumn === 'amount') {
        comparison = a.amount - b.amount;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [transactions, searchQuery, selectedCategory, accountFilter, ownerFilter, recurringFilter, typeFilter, sortColumn, sortDirection]);

  const total = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredTransactions]);

  return (
    <div className="border border-neutral-200 p-4">
      <h2 className="text-xs text-neutral-500 uppercase tracking-wide mb-4">
        {title}
      </h2>

      <div className="flex gap-2 mb-4 flex-nowrap overflow-x-auto">
        <select
          value={selectedCategory || 'all'}
          onChange={(e) => {
            const val = e.target.value;
            onCategoryChange(val === 'all' ? null : val);
          }}
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
          className="text-xs border border-neutral-200 px-2 py-1 bg-white max-w-[140px]"
        >
          <option value="all">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc} value={acc}>
              {acc}
            </option>
          ))}
        </select>

        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="text-xs border border-neutral-200 px-2 py-1 bg-white"
        >
          <option value="all">All Owners</option>
          {owners.map((owner) => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </select>

        <select
          value={recurringFilter}
          onChange={(e) => setRecurringFilter(e.target.value)}
          className="text-xs border border-neutral-200 px-2 py-1 bg-white"
        >
          <option value="all">All Recurring</option>
          <option value="no">One-time</option>
          <option value="weekly">Weekly</option>
          <option value="every 2 weeks">Every 2 weeks</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs border border-neutral-200 px-2 py-1 bg-white"
        >
          <option value="all">All Types</option>
          <option value="spending">Spending</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs border border-neutral-200 px-2 py-1 bg-white w-32"
        />
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-neutral-200">
              <th
                className="text-left py-2 font-medium text-neutral-500 cursor-pointer hover:text-neutral-700 w-[15%]"
                onClick={() => handleSort('date')}
              >
                Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-left py-2 font-medium text-neutral-500 cursor-pointer hover:text-neutral-700 w-[35%]"
                onClick={() => handleSort('merchant')}
              >
                Merchant {sortColumn === 'merchant' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-left py-2 font-medium text-neutral-500 cursor-pointer hover:text-neutral-700 w-[25%]"
                onClick={() => handleSort('category')}
              >
                Category {sortColumn === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-right py-2 font-medium text-neutral-500 cursor-pointer hover:text-neutral-700 w-[25%]"
                onClick={() => handleSort('amount')}
              >
                Amount {sortColumn === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-2 text-neutral-500">{formatDate(t.date)}</td>
                <td className="py-2 truncate max-w-0">{t.merchant}</td>
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

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-200">
        <p className="text-xs text-neutral-400">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </p>
        <p className="text-sm font-semibold">
          Total: {formatCurrency(total)}
        </p>
      </div>
    </div>
  );
}
