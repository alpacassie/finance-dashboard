'use client';

import { useMemo } from 'react';

export type DateRange = 'all' | 'year' | 'month' | 'week';

interface DateFilterProps {
  selectedRange: DateRange;
  selectedYear: number;
  selectedMonth: number;
  availableYears: number[];
  onRangeChange: (range: DateRange) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DateFilter({
  selectedRange,
  selectedYear,
  selectedMonth,
  availableYears,
  onRangeChange,
  onYearChange,
  onMonthChange,
}: DateFilterProps) {
  return (
    <div className="flex gap-2 items-center flex-wrap">
      <select
        value={selectedRange}
        onChange={(e) => onRangeChange(e.target.value as DateRange)}
        className="text-xs border border-neutral-200 px-2 py-1.5 bg-white"
      >
        <option value="all">All Time</option>
        <option value="year">Year</option>
        <option value="month">Month</option>
        <option value="week">This Week</option>
      </select>

      {(selectedRange === 'year' || selectedRange === 'month') && (
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="text-xs border border-neutral-200 px-2 py-1.5 bg-white"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      )}

      {selectedRange === 'month' && (
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className="text-xs border border-neutral-200 px-2 py-1.5 bg-white"
        >
          {MONTHS.map((month, idx) => (
            <option key={month} value={idx}>
              {month}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function filterByDate(
  transactions: { date: string }[],
  range: DateRange,
  year: number,
  month: number
) {
  if (range === 'all') return transactions;

  const now = new Date();

  return transactions.filter((t) => {
    const date = new Date(t.date);

    if (range === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo && date <= now;
    }

    if (range === 'year') {
      return date.getFullYear() === year;
    }

    if (range === 'month') {
      return date.getFullYear() === year && date.getMonth() === month;
    }

    return true;
  });
}
