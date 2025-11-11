import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  children: ReactNode;
}

export default function DashboardCard({ title, icon: Icon, iconColor, iconBg, children }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <div className={`${iconBg} p-3 rounded-xl`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
