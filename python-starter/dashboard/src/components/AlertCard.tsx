import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface AlertCardProps {
  alert: {
    alert_type: string;
    severity: string;
    message: string;
    created_at: string;
  };
}

export default function AlertCard({ alert }: AlertCardProps) {
  const getSeverityConfig = () => {
    switch (alert.severity) {
      case 'HIGH':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800',
        };
      case 'MEDIUM':
        return {
          icon: AlertCircle,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-600',
          textColor: 'text-orange-800',
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800',
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${config.iconColor} mt-0.5 mr-3 flex-shrink-0`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${config.textColor}`}>
              {alert.alert_type.replace(/_/g, ' ').toUpperCase()}
            </p>
            <span className="text-xs text-gray-500">
              {formatDate(alert.created_at)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-700">{alert.message}</p>
        </div>
      </div>
    </div>
  );
}
