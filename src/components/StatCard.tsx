interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
}

export default function StatCard({ label, value, subtext }: StatCardProps) {
  return (
    <div className="border border-neutral-200 p-4">
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
