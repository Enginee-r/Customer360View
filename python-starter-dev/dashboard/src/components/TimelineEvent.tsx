import {
  FileText,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface TimelineEventProps {
  event: {
    event_id: string;
    event_type: string;
    event_title: string;
    event_description: string;
    event_date: string;
    severity: string;
    related_amount?: number;
    status: string;
  };
}

export default function TimelineEvent({ event }: TimelineEventProps) {
  const getEventIcon = () => {
    switch (event.event_type) {
      case 'RENEWAL':
        return TrendingUp;
      case 'SUPPORT':
        return AlertCircle;
      case 'BILLING':
        return DollarSign;
      case 'USAGE':
        return TrendingUp;
      default:
        return FileText;
    }
  };

  const getEventColor = () => {
    switch (event.severity) {
      case 'HIGH':
        return 'text-red-600 bg-red-100';
      case 'MEDIUM':
        return 'text-orange-600 bg-orange-100';
      case 'LOW':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const Icon = getEventIcon();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex items-start space-x-4">
      <div className={`flex-shrink-0 p-2 rounded-full ${getEventColor()}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">
            {event.event_title}
          </p>
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(event.event_date)}
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-600">{event.event_description}</p>
        <div className="mt-2 flex items-center space-x-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            event.status === 'RESOLVED'
              ? 'bg-green-100 text-green-800'
              : event.status === 'OPEN'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {event.status}
          </span>
          {event.related_amount && event.related_amount > 0 && (
            <span className="text-xs text-gray-500">
              {formatCurrency(event.related_amount)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
