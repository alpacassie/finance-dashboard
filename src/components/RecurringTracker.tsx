'use client';

import { useMemo } from 'react';
import { Transaction } from '@/lib/supabase';

interface RecurringTrackerProps {
  transactions: Transaction[];
}

interface MerchantSummary {
  merchant: string;
  amount: number;
  count: number;
}

interface RecurringGroup {
  type: 'weekly' | 'monthly' | 'yearly';
  merchants: MerchantSummary[];
  total: number;
  monthlyEquivalent: number;
}

export default function RecurringTracker({ transactions }: RecurringTrackerProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const groups = useMemo(() => {
    const recurringTypes = ['weekly', 'monthly', 'yearly'] as const;

    return recurringTypes.map((type) => {
      // For monthly, also include 'every 2 weeks'
      const filtered = transactions.filter((t) => {
        if (type === 'monthly') {
          return t.recurring === 'monthly' || t.recurring === 'every 2 weeks';
        }
        return t.recurring === type;
      });

      // Group by merchant and calculate average per-period cost
      const merchantMap = filtered.reduce((acc, t) => {
        const key = t.merchant;
        const isEvery2Weeks = t.recurring === 'every 2 weeks';
        if (!acc[key]) {
          acc[key] = { merchant: key, amount: 0, count: 0 };
        }
        // For 'every 2 weeks', multiply by 2 to get monthly equivalent
        const monthlyAmount = isEvery2Weeks ? Math.abs(t.amount) * 2 : Math.abs(t.amount);
        acc[key].amount += monthlyAmount;
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, MerchantSummary>);

      // Calculate average per-period cost for each merchant
      const merchants = Object.values(merchantMap)
        .map((m) => ({
          ...m,
          amount: m.count > 0 ? m.amount / m.count : 0, // Average per occurrence
        }))
        .sort((a, b) => b.amount - a.amount);
      const total = merchants.reduce((sum, m) => sum + m.amount, 0);

      let monthlyEquivalent = total;
      if (type === 'weekly') monthlyEquivalent = total * 4.33;
      if (type === 'yearly') monthlyEquivalent = total / 12;

      return { type, merchants, total, monthlyEquivalent };
    });
  }, [transactions]);

  
  return (
    <div className="border border-neutral-200 p-4">
      <h2 className="text-xs text-neutral-500 uppercase tracking-wide mb-4">
        Recurring Expenses
      </h2>

      <div className="space-y-4">
        {groups.filter((group) => group.merchants.length > 0).map((group) => (
          <div key={group.type} className="border-b border-neutral-100 pb-3 last:border-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium uppercase">{group.type}</span>
              <span className="text-sm">
                {formatCurrency(group.total)}
                <span className="text-neutral-400 text-xs ml-1">
                  ({group.merchants.length})
                </span>
              </span>
            </div>
            <div className="space-y-1">
              {group.merchants.map((m) => (
                <div key={m.merchant} className="flex justify-between text-xs text-neutral-600">
                  <span className="truncate max-w-[150px]">{m.merchant}</span>
                  <span>{formatCurrency(m.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {groups.filter((g) => g.merchants.length > 0).length > 0 && (
        <div className="mt-4 pt-3 border-t border-neutral-200">
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">Recurring Monthly Total</span>
            <span className="font-semibold">{formatCurrency(
              groups.reduce((sum, g) => {
                if (g.type === 'weekly') return sum + g.total * 4.33;
                if (g.type === 'yearly') return sum + g.total / 12;
                return sum + g.total;
              }, 0)
            )}</span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            (weekly × 4.33 + monthly + yearly ÷ 12)
          </p>
        </div>
      )}
    </div>
  );
}
