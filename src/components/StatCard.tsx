interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  onClick?: () => void;
  selected?: boolean;
}

export default function StatCard({ label, value, subtext, onClick, selected }: StatCardProps) {
  return (
    <div
      className={`border p-4 ${
        onClick ? 'cursor-pointer hover:bg-neutral-50' : ''
      } ${selected ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}
      onClick={onClick}
    >
      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-semibold">{value}</p>
      {subtext && (
        <p className="text-xs text-neutral-400 mt-1">{subtext}</p>
      )}
    </div>
  );
}
