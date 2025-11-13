import { LucideIcon, ChevronRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number | null;
  color?: 'green' | 'orange' | 'red' | 'blue';
  onClick?: () => void;
  metricKey?: string;
}

export default function MetricCard({ title, value, icon: Icon, trend, color, onClick }: MetricCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'bg-green-50 text-green-600';
      case 'orange':
        return 'bg-orange-50 text-orange-600';
      case 'red':
        return 'bg-red-50 text-red-600';
      case 'blue':
        return 'bg-blue-50 text-blue-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow p-3 sm:p-5 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:border-2 hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className={`p-1.5 sm:p-2 rounded-lg ${getColorClasses()}`}>
          <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {trend !== null && trend !== undefined && (
            <span
              className={`text-xs sm:text-sm font-medium ${
                trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
          )}
          {onClick && (
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          )}
        </div>
      </div>
      <div className="mt-2 sm:mt-4">
        <p className="text-lg sm:text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{title}</p>
      </div>
      {onClick && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
          <p className="text-xs text-blue-600 font-medium">Click for details →</p>
        </div>
      )}
    </div>
  );
}
