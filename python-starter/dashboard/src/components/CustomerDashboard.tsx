import { useQuery } from 'react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import {
  getCustomer360,
  getCustomerAlerts,
  getCustomerRecommendations,
  getCustomerTimeline,
} from '../api/customer360';
import MetricCard from './MetricCard';
import AlertCard from './AlertCard';
import RecommendationCard from './RecommendationCard';
import TimelineEvent from './TimelineEvent';

interface CustomerDashboardProps {
  customerId: string;
}

export default function CustomerDashboard({ customerId }: CustomerDashboardProps) {
  const { data: customer, isLoading: customerLoading } = useQuery(
    ['customer', customerId],
    () => getCustomer360(customerId)
  );

  const { data: alerts } = useQuery(
    ['alerts', customerId],
    () => getCustomerAlerts(customerId)
  );

  const { data: recommendations } = useQuery(
    ['recommendations', customerId],
    () => getCustomerRecommendations(customerId)
  );

  const { data: timeline } = useQuery(
    ['timeline', customerId],
    () => getCustomerTimeline(customerId)
  );

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer data not available</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimation: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {customer.account_name}
            </h2>
            <div className="mt-2 flex items-center space-x-4">
              <span className="text-sm text-gray-500">{customer.region}</span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  customer.health_status === 'Healthy'
                    ? 'bg-green-100 text-green-800'
                    : customer.health_status === 'At-Risk'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {customer.health_status}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  customer.churn_risk_level === 'HIGH'
                    ? 'bg-red-100 text-red-800'
                    : customer.churn_risk_level === 'MEDIUM'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {customer.churn_risk_level} Risk
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(customer.annual_revenue || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Annual Revenue</p>
            <div className="mt-2 flex items-center justify-end">
              {customer.yoy_growth >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  customer.yoy_growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {customer.yoy_growth >= 0 ? '+' : ''}
                {customer.yoy_growth?.toFixed(1)}% YoY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Customer Lifetime Value"
          value={formatCurrency(customer.customer_lifetime_value || 0)}
          icon={DollarSign}
          trend={null}
        />
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(customer.monthly_recurring_revenue || 0)}
          icon={Activity}
          trend={null}
        />
        <MetricCard
          title="Active Services"
          value={formatNumber(customer.active_services || 0)}
          icon={Users}
          trend={null}
        />
        <MetricCard
          title="Health Score"
          value={`${customer.health_score?.toFixed(0) || 0}/100`}
          icon={customer.health_score >= 80 ? CheckCircle : AlertTriangle}
          trend={null}
          color={customer.health_score >= 80 ? 'green' : customer.health_score >= 50 ? 'orange' : 'red'}
        />
        <MetricCard
          title="Win Rate"
          value={`${customer.win_rate?.toFixed(0) || 0}%`}
          icon={TrendingUp}
          trend={null}
        />
      </div>

      {/* Risk Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Risk Alerts
          </h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert: any, idx: number) => (
              <AlertCard key={idx} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
            Recommended Next Best Actions
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec: any) => (
              <RecommendationCard key={rec.recommendation_id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Customer Journey Timeline */}
      {timeline && timeline.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 text-gray-500 mr-2" />
            Customer Journey Timeline
          </h3>
          <div className="space-y-4">
            {timeline.slice(0, 10).map((event: any) => (
              <TimelineEvent key={event.event_id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
