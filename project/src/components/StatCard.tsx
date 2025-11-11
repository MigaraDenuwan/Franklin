interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function StatCard({ label, value, trend, trendValue }: StatCardProps) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && trendValue && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend === 'up'
                ? 'bg-green-100 text-green-700'
                : trend === 'down'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
