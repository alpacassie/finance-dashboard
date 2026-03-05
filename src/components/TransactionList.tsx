'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  const [catOpen, setCatOpen] = useState(false);
  const [accOpen, setAccOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const accRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTypeFilter(defaultTypeFilter);
  }, [defaultTypeFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
      if (accRef.current && !accRef.current.contains(e.target as Node)) {
        setAccOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter categories based on type filter
  const filteredCategories = useMemo(() => {
    if (typeFilter === 'spending') {
      return categories.filter(c => c !== 'income' && c !== 'transfer');
    }
    if (typeFilter === 'income') {
      return categories.filter(c => c === 'income');
    }
    if (typeFilter === 'transfer') {
      return categories.filter(c => c === 'transfer');
    }
    return categories;
  }, [categories, typeFilter]);

  // Auto-deselect categories that don't match type filter
  useEffect(() => {
    if (typeFilter === 'spending') {
      setSelectedCategories(prev => prev.filter(c => c !== 'income' && c !== 'transfer' && c !== '__none__'));
    }
  }, [typeFilter]);

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
      if (selectedCategories.length > 0 && !selectedCategories.includes(t.category) && !selectedCategories.includes('__none__')) return false;
      if (selectedCategories.includes('__none__')) return false;
      if (selectedAccounts.length > 0 && !selectedAccounts.includes(t.account) && !selectedAccounts.includes('__none__')) return false;
      if (selectedAccounts.includes('__none__')) return false;
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

      <div className="flex gap-2 mb-4 flex-wrap items-start">
        {/* Categories Multi-Select */}
        <div className="relative" ref={catRef}>
          <button
            type="button"
            onClick={() => { setCatOpen(prev => !prev); setAccOpen(false); }}
            className="text-xs border border-neutral-200 px-2 py-1 bg-white flex items-center gap-1"
          >
            {selectedCategories.length === 0 ? 'All Categories' : `${selectedCategories.length} categories`}
            <span className="text-[10px]">▼</span>
          </button>
          {catOpen && <div className="absolute top-full left-0 mt-1 bg-[#3d3d3d]/95 backdrop-blur-sm rounded-md shadow-2xl z-50 py-0.5 whitespace-nowrap">
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded cursor-pointer text-[11px] text-white ${selectedCategories.length === 0 ? 'bg-blue-500' : 'hover:bg-blue-500'}`}
              onClick={() => {
                if (selectedCategories.length === 0) {
                  setSelectedCategories(['__none__']);
                } else {
                  setSelectedCategories([]);
                }
              }}
            >
              <span className="w-3 text-[10px]">{selectedCategories.length === 0 ? '✓' : ''}</span>
              Select All
            </div>
            {filteredCategories.map((cat) => (
              <div
                key={cat}
                className="flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded cursor-pointer text-[11px] text-white hover:bg-blue-500"
                onClick={() => {
                  if (selectedCategories.length === 0) {
                    setSelectedCategories(filteredCategories.filter(c => c !== cat));
                  } else if (selectedCategories.includes(cat)) {
                    const newSel = selectedCategories.filter(c => c !== cat);
                    setSelectedCategories(newSel.length === 0 ? ['__none__'] : newSel);
                  } else {
                    const newSel = [...selectedCategories.filter(c => c !== '__none__'), cat];
                    setSelectedCategories(newSel.length === filteredCategories.length ? [] : newSel);
                  }
                }}
              >
                <span className="w-3 text-[10px]">{(selectedCategories.length === 0 || selectedCategories.includes(cat)) ? '✓' : ''}</span>
                {cat}
              </div>
            ))}
          </div>}
        </div>

        {/* Accounts Multi-Select */}
        <div className="relative" ref={accRef}>
          <button
            type="button"
            onClick={() => { setAccOpen(prev => !prev); setCatOpen(false); }}
            className="text-xs border border-neutral-200 px-2 py-1 bg-white flex items-center gap-1"
          >
            {selectedAccounts.length === 0 ? 'All Accounts' : `${selectedAccounts.length} accounts`}
            <span className="text-[10px]">▼</span>
          </button>
          {accOpen && <div className="absolute top-full left-0 mt-1 bg-[#3d3d3d]/95 backdrop-blur-sm rounded-md shadow-2xl z-50 py-0.5 whitespace-nowrap">
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded cursor-pointer text-[11px] text-white ${selectedAccounts.length === 0 ? 'bg-blue-500' : 'hover:bg-blue-500'}`}
              onClick={() => {
                if (selectedAccounts.length === 0) {
                  setSelectedAccounts(['__none__']);
                } else {
                  setSelectedAccounts([]);
                }
              }}
            >
              <span className="w-3 text-[10px]">{selectedAccounts.length === 0 ? '✓' : ''}</span>
              Select All
            </div>
            {accounts.map((acc) => (
              <div
                key={acc}
                className="flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded cursor-pointer text-[11px] text-white hover:bg-blue-500"
                onClick={() => {
                  if (selectedAccounts.length === 0) {
                    setSelectedAccounts(accounts.filter(a => a !== acc));
                  } else if (selectedAccounts.includes(acc)) {
                    const newSel = selectedAccounts.filter(a => a !== acc);
                    setSelectedAccounts(newSel.length === 0 ? ['__none__'] : newSel);
                  } else {
                    const newSel = [...selectedAccounts.filter(a => a !== '__none__'), acc];
                    setSelectedAccounts(newSel.length === accounts.length ? [] : newSel);
                  }
                }}
              >
                <span className="w-3 text-[10px]">{(selectedAccounts.length === 0 || selectedAccounts.includes(acc)) ? '✓' : ''}</span>
                {acc}
              </div>
            ))}
          </div>}
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
