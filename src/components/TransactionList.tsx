'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  const [columnWidths, setColumnWidths] = useState({ date: 60, merchant: 140, category: 100, amount: 80 });
  const resizingRef = useRef<{ column: string; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    setTypeFilter(defaultTypeFilter);
  }, [defaultTypeFilter]);

  const handleResizeStart = useCallback((e: React.MouseEvent, column: string) => {
    e.preventDefault();
    resizingRef.current = {
      column,
      startX: e.clientX,
      startWidth: columnWidths[column as keyof typeof columnWidths],
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = e.clientX - resizingRef.current.startX;
      const newWidth = Math.max(40, resizingRef.current.startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [resizingRef.current!.column]: newWidth }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths]);

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
        <table className="text-xs table-fixed" style={{ width: columnWidths.date + columnWidths.merchant + columnWidths.category + columnWidths.amount + 12 }}>
          <colgroup>
            <col style={{ width: columnWidths.date }} />
            <col style={{ width: columnWidths.merchant }} />
            <col style={{ width: columnWidths.category }} />
            <col style={{ width: columnWidths.amount }} />
          </colgroup>
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-neutral-200">
              <th
                className="text-left py-2 font-medium text-neutral-500 relative"
              >
                <span className="cursor-pointer hover:text-neutral-700" onClick={() => handleSort('date')}>
                  Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </span>
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-neutral-300"
                  onMouseDown={(e) => handleResizeStart(e, 'date')}
                />
              </th>
              <th
                className="text-left py-2 font-medium text-neutral-500 relative"
              >
                <span className="cursor-pointer hover:text-neutral-700" onClick={() => handleSort('merchant')}>
                  Merchant {sortColumn === 'merchant' && (sortDirection === 'asc' ? '↑' : '↓')}
                </span>
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-neutral-300"
                  onMouseDown={(e) => handleResizeStart(e, 'merchant')}
                />
              </th>
              <th
                className="text-left py-2 font-medium text-neutral-500 relative"
              >
                <span className="cursor-pointer hover:text-neutral-700" onClick={() => handleSort('category')}>
                  Category {sortColumn === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                </span>
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-neutral-300"
                  onMouseDown={(e) => handleResizeStart(e, 'category')}
                />
              </th>
              <th
                className="text-right py-2 font-medium text-neutral-500 cursor-pointer hover:text-neutral-700"
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
                <td className="py-2 truncate">{t.merchant}</td>
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
