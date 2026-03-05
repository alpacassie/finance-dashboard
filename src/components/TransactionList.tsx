'use client';

import { useState, useMemo, useEffect } from 'react';
import { Transaction } from '@/lib/supabase';

interface TransactionListProps {
  transactions: Transaction[];
  categories: string[];
  accounts: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  title?: string;
  defaultTypeFilter?: 'all' | 'spending' | 'income' | 'transfer';
}

export default function TransactionList({
  transactions,
  categories,
  accounts,
  selectedCategory,
  onCategoryChange,
  title = 'Transactions',
  defaultTypeFilter = 'spending',
}: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [recurringFilter, setRecurringFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>(defaultTypeFilter);
  const [sortColumn, setSortColumn] = useState<'date' | 'merchant' | 'category' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

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
      if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;
      if (selectedAccounts.length > 0 && !selectedAccounts.includes(t.account)) return false;
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
  }, [transactions, searchQuery, selectedCategory, selectedCategories, selectedAccounts, recurringFilter, typeFilter, sortColumn, sortDirection]);

  const total = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredTransactions]);

  return (
    <div className="border border-neutral-200 p-4">
      <h2 className="text-xs text-neutral-500 uppercase tracking-wide mb-4">
        {title}
      </h2>

      <div className="flex gap-2 mb-4 flex-nowrap overflow-x-auto">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="text-xs border border-neutral-200 px-2 py-1 bg-white flex items-center gap-1"
          >
            {selectedCategories.length === 0 ? 'All Categories' : `Categories (${selectedCategories.length})`}
            <span className="text-[10px]">▼</span>
          </button>
          {showCategoryDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 shadow-lg z-10 max-h-48 overflow-y-auto min-w-[120px]">
              <div
                className="flex items-center gap-2 px-2 py-1 hover:bg-neutral-50 cursor-pointer text-xs whitespace-nowrap border-b border-neutral-100 font-medium"
                onClick={() => setSelectedCategories([])}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.length === 0}
                  readOnly
                />
                Select All
              </div>
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-neutral-50 cursor-pointer text-xs whitespace-nowrap"
                  onClick={() => {
                    if (selectedCategories.length === 0) {
                      // Currently all selected, uncheck this one = select all except this
                      setSelectedCategories(categories.filter((c) => c !== cat));
                    } else if (selectedCategories.includes(cat)) {
                      // Already selected, remove it
                      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
                    } else {
                      // Not selected, add it
                      const newSelected = [...selectedCategories, cat];
                      if (newSelected.length === categories.length) {
                        setSelectedCategories([]);
                      } else {
                        setSelectedCategories(newSelected);
                      }
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.length === 0 || selectedCategories.includes(cat)}
                    readOnly
                  />
                  {cat}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="text-xs border border-neutral-200 px-2 py-1 bg-white flex items-center gap-1"
          >
            {selectedAccounts.length === 0 ? 'All Accounts' : `Accounts (${selectedAccounts.length})`}
            <span className="text-[10px]">▼</span>
          </button>
          {showAccountDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 shadow-lg z-10 max-h-48 overflow-y-auto min-w-[120px]">
              <div
                className="flex items-center gap-2 px-2 py-1 hover:bg-neutral-50 cursor-pointer text-xs whitespace-nowrap border-b border-neutral-100 font-medium"
                onClick={() => setSelectedAccounts([])}
              >
                <input
                  type="checkbox"
                  checked={selectedAccounts.length === 0}
                  readOnly
                />
                Select All
              </div>
              {accounts.map((acc) => (
                <div
                  key={acc}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-neutral-50 cursor-pointer text-xs whitespace-nowrap"
                  onClick={() => {
                    if (selectedAccounts.length === 0) {
                      setSelectedAccounts(accounts.filter((a) => a !== acc));
                    } else if (selectedAccounts.includes(acc)) {
                      setSelectedAccounts(selectedAccounts.filter((a) => a !== acc));
                    } else {
                      const newSelected = [...selectedAccounts, acc];
                      if (newSelected.length === accounts.length) {
                        setSelectedAccounts([]);
                      } else {
                        setSelectedAccounts(newSelected);
                      }
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAccounts.length === 0 || selectedAccounts.includes(acc)}
                    readOnly
                  />
                  {acc}
                </div>
              ))}
            </div>
          )}
        </div>

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
