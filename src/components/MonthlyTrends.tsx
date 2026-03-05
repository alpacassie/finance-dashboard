'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyData {
  month: string;
  amount: number;
}

interface MonthlyTrendsProps {
  data: MonthlyData[];
  selectedCategory: string | null;
}

export default function MonthlyTrends({ data, selectedCategory }: MonthlyTrendsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="border border-neutral-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs text-neutral-500 uppercase tracking-wide">
          Monthly Spending Trends
        </h2>
        {selectedCategory && (
          <span className="text-xs text-neutral-500">
            Filtering: <span className="font-medium">{selectedCategory}</span>
          </span>
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e5e5' }}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e5e5' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), 'Spent']}
              contentStyle={{
                fontFamily: 'var(--font-ibm-plex-mono), monospace',
                fontSize: '12px',
                border: '1px solid #e5e5e5',
                borderRadius: 0,
              }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#000000"
              strokeWidth={2}
              dot={{ fill: '#000000', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#000000' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
