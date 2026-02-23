'use client';

import { Transaction } from '@/lib/supabase';

interface RecurringTrackerProps {
  transactions: Transaction[];
}

interface RecurringGroup {
  type: 'weekly' | 'monthly' | 'yearly';
  transactions: Transaction[];
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

  const recurringTypes = ['weekly', 'monthly', 'yearly'] as const;

  const groups: RecurringGroup[] = recurringTypes.map((type) => {
    const filtered = transactions.filter((t) => t.recurring === type);
    const total = filtered.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    let monthlyEquivalent = total;
    if (type === 'weekly') monthlyEquivalent = total * 4.33;
    if (type === 'yearly') monthlyEquivalent = total / 12;
    return { type, transactions: filtered, total, monthlyEquivalent };
  });

  const totalMonthlyRecurring = groups.reduce((sum, g) => sum + g.monthlyEquivalent, 0);

  return (
    <div className="border border-neutral-200 p-4">
      <h2 className="text-xs text-neutral-500 uppercase tracking-wide mb-4">
        Recurring Expenses
      </h2>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.type} className="border-b border-neutral-100 pb-3 last:border-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium uppercase">{group.type}</span>
              <span className="text-sm">
                {formatCurrency(group.total)}
                <span className="text-neutral-400 text-xs ml-1">
                  ({group.transactions.length})
                </span>
              </span>
            </div>
            <div className="space-y-1">
              {group.transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex justify-between text-xs text-neutral-600">
                  <span className="truncate max-w-[150px]">{t.merchant}</span>
                  <span>{formatCurrency(Math.abs(t.amount))}</span>
                </div>
              ))}
              {group.transactions.length > 5 && (
                <p className="text-xs text-neutral-400">
                  +{group.transactions.length - 5} more
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-200">
        <div className="flex justify-between items-center">
          <span className="text-xs text-neutral-500">Est. Monthly Total</span>
          <span className="font-semibold">{formatCurrency(totalMonthlyRecurring)}</span>
        </div>
      </div>
    </div>
  );
}
