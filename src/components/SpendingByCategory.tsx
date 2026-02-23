'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategoryData {
  category: string;
  amount: number;
}

interface SpendingByCategoryProps {
  data: CategoryData[];
}

const COLORS = [
  '#000000', '#404040', '#737373', '#a3a3a3', '#d4d4d4',
  '#525252', '#171717', '#262626', '#e5e5e5', '#f5f5f5',
  '#6b7280', '#374151', '#1f2937'
];

export default function SpendingByCategory({ data }: SpendingByCategoryProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

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
      <h2 className="text-xs text-neutral-500 uppercase tracking-wide mb-4">
        Spending by Category
      </h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={1}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                fontFamily: 'var(--font-ibm-plex-mono), monospace',
                fontSize: '12px',
                border: '1px solid #e5e5e5',
                borderRadius: 0,
              }}
            />
            <Legend
              formatter={(value) => <span className="text-xs">{value}</span>}
              wrapperStyle={{ fontSize: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-sm text-neutral-500 mt-2">
        Total: {formatCurrency(total)}
      </p>
    </div>
  );
}
