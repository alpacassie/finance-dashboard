'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface CategoryData {
  category: string;
  amount: number;
}

interface SpendingByCategoryProps {
  data: CategoryData[];
  selectedCategory: string | null;
  onCategoryClick: (category: string) => void;
}

export default function SpendingByCategory({
  data,
  selectedCategory,
  onCategoryClick,
}: SpendingByCategoryProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Dynamic height based on number of categories
  const chartHeight = Math.max(200, data.length * 28);

  return (
    <div className="border border-neutral-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs text-neutral-500 uppercase tracking-wide">
          Spending by Category
        </h2>
        <span className="text-sm font-semibold">{formatCurrency(total)}</span>
      </div>
      <div style={{ height: chartHeight }} className="outline-none [&_*]:outline-none">
          <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="category"
                width={80}
                tick={{ fontSize: 11, fill: '#737373' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  fontFamily: 'var(--font-ibm-plex-mono), monospace',
                  fontSize: '12px',
                  border: '1px solid #e5e5e5',
                  borderRadius: 0,
                }}
                cursor={{ fill: '#f5f5f5' }}
              />
              <Bar
                dataKey="amount"
                radius={[0, 2, 2, 0]}
                cursor="pointer"
                onClick={(data) => {
                  if (data?.category) {
                    onCategoryClick(data.category);
                  }
                }}
              >
                {data.map((entry) => (
                  <Cell
                    key={`cell-${entry.category}`}
                    fill={
                      selectedCategory === null
                        ? entry.category === data[0]?.category
                          ? '#000000'
                          : '#a3a3a3'
                        : entry.category === selectedCategory
                        ? '#000000'
                        : '#e5e5e5'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
      </div>
      {selectedCategory && (
        <p className="text-xs text-neutral-500 mt-2">
          Filtering by: <span className="font-medium">{selectedCategory}</span>
        </p>
      )}
    </div>
  );
}
