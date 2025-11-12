import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Phone,
  CreditCard,
  BarChart3,
  Target,
  Calendar,
  Briefcase,
  Settings,
  UserCheck,
  Bell,
  Lightbulb,
  Send,
  UserPlus,
  Mail
} from 'lucide-react';
import { getCustomer360, getCustomerAlerts, getCustomerRecommendations, executeAction } from '../api/customer360';
import MetricCard from './MetricCard';
import MetricDrillDownModal from './MetricDrillDownModal';
import SubsidiaryCard from './SubsidiaryCard';

interface PersonaDashboardProps {
  customerId: string;
}

type PersonaView = 'board' | 'ceo' | 'operations' | 'sales' | 'service' | 'billing' | 'account';

export default function PersonaDashboard({ customerId }: PersonaDashboardProps) {
  const [selectedPersona, setSelectedPersona] = useState<PersonaView>('ceo');
  const [drillDownMetric, setDrillDownMetric] = useState<{key: string, title: string, value: any} | null>(null);
  const [executingAction, setExecutingAction] = useState<string | null>(null);

  const { data: customer, isLoading } = useQuery(
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

  const { data: subsidiaryConfig } = useQuery(
    ['subsidiaries'],
    () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      return fetch(`${apiUrl}/subsidiaries`).then(res => res.json());
    }
  );

  const executeMutation = useMutation(executeAction, {
    onSuccess: () => {
      setExecutingAction(null);
      alert('Action executed successfully! In production, this would trigger the actual workflow.');
    },
    onError: () => {
      setExecutingAction(null);
      alert('Failed to execute action.');
    }
  });

  const handleMetricClick = (key: string, title: string, value: any) => {
    setDrillDownMetric({ key, title, value });
  };

  const handleExecuteAction = (actionId: string, actionType: string) => {
    setExecutingAction(actionId);
    executeMutation.mutate(actionId);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'schedule_meeting':
        return Calendar;
      case 'initiate_renewal':
        return Target;
      case 'assign_engineer':
        return UserPlus;
      case 'contact_finance':
        return Phone;
      case 'send_campaign':
        return Mail;
      default:
        return Send;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'schedule_meeting':
        return 'Schedule Meeting';
      case 'initiate_renewal':
        return 'Start Renewal';
      case 'assign_engineer':
        return 'Assign Engineer';
      case 'contact_finance':
        return 'Contact Finance';
      case 'send_campaign':
        return 'Send Campaign';
      default:
        return 'Take Action';
    }
  };

  // Filter alerts based on persona
  const getFilteredAlerts = () => {
    if (!alerts) return [];

    const personaAlertMap: Record<PersonaView, string[]> = {
      board: ['churn_risk', 'renewal_urgent', 'usage_decline'],  // Strategic issues
      ceo: ['churn_risk', 'usage_decline', 'renewal_urgent', 'low_satisfaction'],  // Overall health
      operations: ['service_issues', 'low_satisfaction'],  // Service quality
      sales: ['renewal_urgent', 'usage_decline'],  // Revenue & pipeline
      service: ['service_issues', 'low_satisfaction'],  // Customer experience
      billing: ['payment_overdue', 'credit_hold'],  // Financial issues
      account: ['churn_risk', 'renewal_urgent', 'low_satisfaction', 'usage_decline']  // Relationship health
    };

    const relevantAlertTypes = personaAlertMap[selectedPersona] || [];
    return alerts.filter((alert: any) => relevantAlertTypes.includes(alert.alert_type));
  };

  // Filter recommendations based on persona
  const getFilteredRecommendations = () => {
    if (!recommendations) return [];

    const personaRecMap: Record<PersonaView, string[]> = {
      board: ['Retention', 'Renewal', 'Expansion'],  // Strategic growth
      ceo: ['Retention', 'Renewal', 'Expansion', 'Experience'],  // Business outcomes
      operations: ['Service', 'Experience', 'Adoption'],  // Operational excellence
      sales: ['Expansion', 'Sales', 'Renewal'],  // Revenue generation
      service: ['Service', 'Experience', 'Adoption'],  // Customer satisfaction
      billing: ['Finance'],  // Financial operations
      account: ['Retention', 'Renewal', 'Experience', 'Adoption']  // Customer success
    };

    const relevantCategories = personaRecMap[selectedPersona] || [];
    return recommendations.filter((rec: any) => relevantCategories.includes(rec.category));
  };

  const filteredAlerts = getFilteredAlerts();
  const filteredRecommendations = getFilteredRecommendations();

  if (isLoading) {
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  const personas = [
    { id: 'board', name: 'Board Chairman', icon: Briefcase },
    { id: 'ceo', name: 'CEO', icon: Target },
    { id: 'operations', name: 'Operations', icon: Settings },
    { id: 'sales', name: 'Sales', icon: TrendingUp },
    { id: 'service', name: 'Service', icon: UserCheck },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'account', name: 'Account Management', icon: Users },
  ];

  const renderBoardView = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Board Chairman View - Strategic Oversight</h3>

      {/* Strategic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Customer Lifetime Value"
          value={formatCurrency(customer.customer_lifetime_value)}
          icon={DollarSign}
          trend={null}
          onClick={() => handleMetricClick('customer_lifetime_value', 'Customer Lifetime Value', formatCurrency(customer.customer_lifetime_value))}
        />
        <MetricCard
          title="Retention Probability"
          value={`${customer.retention_probability?.toFixed(1)}%`}
          icon={CheckCircle}
          trend={null}
          color={customer.retention_probability >= 80 ? 'green' : 'orange'}
          onClick={() => handleMetricClick('retention_probability', 'Retention Probability', `${customer.retention_probability?.toFixed(1)}%`)}
        />
        <MetricCard
          title="Revenue Concentration"
          value={`${customer.revenue_concentration?.toFixed(2)}%`}
          icon={BarChart3}
          trend={null}
          color={customer.revenue_concentration > 10 ? 'red' : 'green'}
          onClick={() => handleMetricClick('annual_revenue', 'Revenue Concentration', `${customer.revenue_concentration?.toFixed(2)}%`)}
        />
        <MetricCard
          title="Profit Margin"
          value={`${customer.profit_margin?.toFixed(1)}%`}
          icon={TrendingUp}
          trend={null}
          color={customer.profit_margin >= 20 ? 'green' : 'orange'}
          onClick={() => handleMetricClick('annual_revenue', 'Profit Margin', `${customer.profit_margin?.toFixed(1)}%`)}
        />
      </div>

      {/* 3-Year Revenue Trend */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">3-Year Revenue Trend</h4>
        <div className="flex items-end space-x-4 h-32">
          {customer.three_year_revenue && (() => {
            try {
              const revenues = JSON.parse(customer.three_year_revenue);
              const maxRev = Math.max(...revenues, 1);
              return revenues.map((rev: number, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${Math.max((rev / maxRev) * 100, 5)}%` }}
                  />
                  <span className="text-xs mt-2 text-gray-600">{new Date().getFullYear() - 2 + idx}</span>
                  <span className="text-sm font-semibold">{formatCurrency(rev)}</span>
                </div>
              ));
            } catch (e) {
              return <p className="text-gray-500">No revenue data available</p>;
            }
          })()}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">Risk Assessment</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Churn Risk</p>
            <p className={`text-2xl font-bold ${customer.churn_risk_level === 'HIGH' ? 'text-red-600' : 'text-green-600'}`}>
              {customer.churn_risk_level}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Health Status</p>
            <p className={`text-2xl font-bold ${customer.health_status === 'Healthy' ? 'text-green-600' : 'text-orange-600'}`}>
              {customer.health_status}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Days to Renewal</p>
            <p className={`text-2xl font-bold ${customer.days_to_renewal < 90 ? 'text-orange-600' : 'text-gray-900'}`}>
              {customer.days_to_renewal}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCEOView = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">CEO View - Growth & Strategy</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Annual Revenue"
          value={formatCurrency(customer.annual_revenue)}
          icon={DollarSign}
          trend={customer.yoy_growth}
          onClick={() => handleMetricClick('annual_revenue', 'Annual Revenue', formatCurrency(customer.annual_revenue))}
        />
        <MetricCard
          title="YoY Growth"
          value={`${customer.yoy_growth?.toFixed(1)}%`}
          icon={customer.yoy_growth >= 0 ? TrendingUp : TrendingDown}
          trend={null}
          color={customer.yoy_growth >= 0 ? 'green' : 'red'}
          onClick={() => handleMetricClick('annual_revenue', 'Year-over-Year Growth', `${customer.yoy_growth?.toFixed(1)}%`)}
        />
        <MetricCard
          title="NPS Score"
          value={customer.nps_score}
          icon={Activity}
          trend={null}
          color={customer.nps_score >= 50 ? 'green' : customer.nps_score >= 0 ? 'orange' : 'red'}
          onClick={() => handleMetricClick('nps_score', 'NPS Score', customer.nps_score)}
        />
        <MetricCard
          title="Active Services"
          value={formatNumber(customer.active_services)}
          icon={Users}
          trend={null}
          onClick={() => handleMetricClick('pipeline_value', 'Active Services & Pipeline', formatNumber(customer.active_services))}
        />
      </div>

      {/* Quarterly Performance */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">Quarterly Revenue Performance</h4>
        <div className="flex items-end space-x-4 h-32">
          {customer.quarterly_revenue && (() => {
            try {
              const revenues = JSON.parse(customer.quarterly_revenue).reverse();
              const maxRev = Math.max(...revenues, 1);
              return revenues.map((rev: number, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-green-500 rounded-t"
                    style={{ height: `${Math.max((rev / maxRev) * 100, 5)}%` }}
                  />
                  <span className="text-xs mt-2 text-gray-600">Q{4-idx}</span>
                  <span className="text-sm font-semibold">{formatCurrency(rev)}</span>
                </div>
              ));
            } catch (e) {
              return <p className="text-gray-500">No revenue data available</p>;
            }
          })()}
        </div>
      </div>

      {/* Growth Opportunities */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Cross-sell Potential</h4>
          <p className="text-2xl font-bold">{formatCurrency(customer.pipeline_value)}</p>
          <p className="text-sm text-gray-500 mt-1">{customer.open_opportunities} open opportunities</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Customer Segment</h4>
          <p className="text-lg font-semibold">{customer.region}</p>
          <p className="text-sm text-gray-500 mt-1">Profit Margin: {customer.profit_margin?.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );

  const renderOperationsView = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Operations View - Efficiency & Execution</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Open Tickets"
          value={formatNumber(customer.open_tickets)}
          icon={AlertTriangle}
          trend={null}
          color={customer.open_tickets > 10 ? 'red' : 'green'}
          onClick={() => handleMetricClick('open_tickets', 'Open Support Tickets', formatNumber(customer.open_tickets))}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${customer.avg_response_time_hours?.toFixed(1)}h`}
          icon={Clock}
          trend={null}
          color={customer.avg_response_time_hours < 2 ? 'green' : 'orange'}
          onClick={() => handleMetricClick('open_tickets', 'Average Response Time', `${customer.avg_response_time_hours?.toFixed(1)}h`)}
        />
        <MetricCard
          title="SLA Compliance"
          value={`${customer.sla_compliance_pct?.toFixed(1)}%`}
          icon={CheckCircle}
          trend={null}
          color={customer.sla_compliance_pct >= 95 ? 'green' : 'orange'}
          onClick={() => handleMetricClick('open_tickets', 'SLA Compliance', `${customer.sla_compliance_pct?.toFixed(1)}%`)}
        />
        <MetricCard
          title="Recurring Issues"
          value={formatNumber(customer.recurring_issues_count)}
          icon={AlertTriangle}
          trend={null}
          color={customer.recurring_issues_count > 2 ? 'red' : 'green'}
          onClick={() => handleMetricClick('open_tickets', 'Recurring Issues', formatNumber(customer.recurring_issues_count))}
        />
      </div>

      {/* Service Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Support Activity</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tickets</span>
              <span className="font-semibold">{customer.total_tickets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Closed Tickets</span>
              <span className="font-semibold">{customer.closed_tickets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Resolution Time</span>
              <span className="font-semibold">{customer.avg_resolution_time_hours?.toFixed(1)}h</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Process Efficiency</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Sales Cycle</span>
              <span className="font-semibold">{customer.avg_sales_cycle_days?.toFixed(0)} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Services</span>
              <span className="font-semibold">{customer.active_services}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Win Rate</span>
              <span className="font-semibold">{customer.win_rate?.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between border-t pt-3 mt-3">
              <span className="text-gray-600">CES (Ease of Doing Business)</span>
              <span className={`font-semibold ${customer.ces_score >= 5.5 ? 'text-green-600' : customer.ces_score >= 4.5 ? 'text-orange-600' : 'text-red-600'}`}>
                {customer.ces_score?.toFixed(1)}/7.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSalesView = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Sales View - Pipeline & Revenue</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pipeline Value"
          value={formatCurrency(customer.pipeline_value)}
          icon={DollarSign}
          trend={null}
          onClick={() => handleMetricClick('pipeline_value', 'Pipeline Value', formatCurrency(customer.pipeline_value))}
        />
        <MetricCard
          title="Open Opportunities"
          value={formatNumber(customer.open_opportunities)}
          icon={Target}
          trend={null}
          onClick={() => handleMetricClick('open_opportunities', 'Open Opportunities', formatNumber(customer.open_opportunities))}
        />
        <MetricCard
          title="Win Rate"
          value={`${customer.win_rate?.toFixed(1)}%`}
          icon={TrendingUp}
          trend={null}
          onClick={() => handleMetricClick('pipeline_value', 'Win Rate', `${customer.win_rate?.toFixed(1)}%`)}
        />
        <MetricCard
          title="Avg Deal Size"
          value={formatCurrency(customer.avg_deal_size)}
          icon={DollarSign}
          trend={null}
          onClick={() => handleMetricClick('pipeline_value', 'Average Deal Size', formatCurrency(customer.avg_deal_size))}
        />
      </div>

      {/* Next Close Opportunity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">Next Close Opportunity</h4>
        {customer.next_close_date ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Close Date</span>
              <span className="font-semibold">{new Date(customer.next_close_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deal Value</span>
              <span className="font-semibold">{formatCurrency(customer.next_close_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Win Probability</span>
              <span className="font-semibold">{customer.next_close_probability}%</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No upcoming opportunities</p>
        )}
      </div>

      {/* Sales Performance */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Q Current Revenue</h4>
          <p className="text-2xl font-bold">{formatCurrency(customer.annual_revenue / 4)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Won Opportunities</h4>
          <p className="text-2xl font-bold">{customer.won_opportunities}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Avg Sales Cycle</h4>
          <p className="text-2xl font-bold">{customer.avg_sales_cycle_days?.toFixed(0)} days</p>
        </div>
      </div>
    </div>
  );

  const renderServiceView = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Service Management View - Customer Experience</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Open Cases"
          value={formatNumber(customer.open_tickets)}
          icon={FileText}
          trend={null}
          color={customer.open_tickets > 5 ? 'red' : 'green'}
          onClick={() => handleMetricClick('open_tickets', 'Open Support Cases', formatNumber(customer.open_tickets))}
        />
        <MetricCard
          title="Avg Resolution Time"
          value={`${customer.avg_resolution_time_hours?.toFixed(1)}h`}
          icon={Clock}
          trend={null}
          onClick={() => handleMetricClick('open_tickets', 'Average Resolution Time', `${customer.avg_resolution_time_hours?.toFixed(1)}h`)}
        />
        <MetricCard
          title="CSAT Score"
          value={`${customer.csat_score?.toFixed(1)}/5.0`}
          icon={CheckCircle}
          trend={null}
          color={customer.csat_score >= 4 ? 'green' : 'orange'}
          onClick={() => handleMetricClick('csat_score', 'CSAT Score', `${customer.csat_score?.toFixed(1)}/5.0`)}
        />
        <MetricCard
          title="CES Score"
          value={`${customer.ces_score?.toFixed(1)}/7.0`}
          icon={Activity}
          trend={null}
          color={customer.ces_score >= 5.5 ? 'green' : customer.ces_score >= 4.5 ? 'orange' : 'red'}
          onClick={() => handleMetricClick('ces_score', 'Customer Effort Score', `${customer.ces_score?.toFixed(1)}/7.0 - How easy it is to do business with Cassava`)}
        />
        <MetricCard
          title="SLA Compliance"
          value={`${customer.sla_compliance_pct?.toFixed(1)}%`}
          icon={CheckCircle}
          trend={null}
          color={customer.sla_compliance_pct >= 95 ? 'green' : 'red'}
          onClick={() => handleMetricClick('open_tickets', 'SLA Compliance', `${customer.sla_compliance_pct?.toFixed(1)}%`)}
        />
      </div>

      {/* Service Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Ticket Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Open Tickets</span>
              <span className={`font-bold text-lg ${customer.open_tickets > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {customer.open_tickets}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Closed Tickets</span>
              <span className="font-semibold">{customer.closed_tickets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tickets</span>
              <span className="font-semibold">{customer.total_tickets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recurring Issues</span>
              <span className={`font-semibold ${customer.recurring_issues_count > 2 ? 'text-red-600' : 'text-gray-900'}`}>
                {customer.recurring_issues_count}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Response Metrics</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Response Time</span>
              <span className="font-semibold">{customer.avg_response_time_hours?.toFixed(1)} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Resolution Time</span>
              <span className="font-semibold">{customer.avg_resolution_time_hours?.toFixed(1)} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SLA Compliance</span>
              <span className={`font-semibold ${customer.sla_compliance_pct >= 95 ? 'text-green-600' : 'text-red-600'}`}>
                {customer.sla_compliance_pct?.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* VIP Alert */}
      {customer.annual_revenue > 500000 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-700">
              <strong>VIP Account Alert:</strong> This high-value account requires priority attention
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderBillingView = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Billing View - Financial Accuracy</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overdue Invoices"
          value={formatNumber(customer.overdue_invoices)}
          icon={AlertTriangle}
          trend={null}
          color={customer.overdue_invoices > 0 ? 'red' : 'green'}
          onClick={() => handleMetricClick('overdue_invoices', 'Overdue Invoices', formatNumber(customer.overdue_invoices))}
        />
        <MetricCard
          title="Overdue Amount"
          value={formatCurrency(customer.overdue_amount)}
          icon={DollarSign}
          trend={null}
          color={customer.overdue_amount > 0 ? 'red' : 'green'}
          onClick={() => handleMetricClick('overdue_amount', 'Overdue Amount', formatCurrency(customer.overdue_amount))}
        />
        <MetricCard
          title="Days Overdue"
          value={formatNumber(customer.days_overdue)}
          icon={Clock}
          trend={null}
          color={customer.days_overdue > 30 ? 'red' : customer.days_overdue > 0 ? 'orange' : 'green'}
          onClick={() => handleMetricClick('overdue_amount', 'Days Overdue', formatNumber(customer.days_overdue))}
        />
        <MetricCard
          title="Billing Accuracy"
          value={`${customer.billing_accuracy_pct?.toFixed(1)}%`}
          icon={CheckCircle}
          trend={null}
          color={customer.billing_accuracy_pct >= 98 ? 'green' : 'orange'}
          onClick={() => handleMetricClick('overdue_amount', 'Billing Accuracy', `${customer.billing_accuracy_pct?.toFixed(1)}%`)}
        />
      </div>

      {/* Payment Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Payment Status</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Terms</span>
              <span className="font-semibold">{customer.payment_terms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Disputed Invoices</span>
              <span className={`font-semibold ${customer.disputed_invoices > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {customer.disputed_invoices}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Credit Hold</span>
              <span className={`font-semibold ${customer.credit_hold ? 'text-red-600' : 'text-green-600'}`}>
                {customer.credit_hold ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Annual Revenue</span>
              <span className="font-semibold">{formatCurrency(customer.annual_revenue)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Outstanding Receivables</h4>
          <div className="text-center py-6">
            <p className={`text-4xl font-bold ${customer.overdue_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(customer.overdue_amount)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Total Outstanding</p>
          </div>
        </div>
      </div>

      {/* Credit Hold Warning */}
      {customer.credit_hold && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-700">
              <strong>Credit Hold Active:</strong> Customer has outstanding amount of {formatCurrency(customer.overdue_amount)} overdue by {customer.days_overdue} days
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderAccountView = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Account Management View - Relationship & Retention</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Days to Renewal"
          value={formatNumber(customer.days_to_renewal)}
          icon={Calendar}
          trend={null}
          color={customer.days_to_renewal < 90 ? 'orange' : 'green'}
          onClick={() => handleMetricClick('days_to_renewal', 'Days to Renewal', formatNumber(customer.days_to_renewal))}
        />
        <MetricCard
          title="Retention Probability"
          value={`${customer.retention_probability?.toFixed(1)}%`}
          icon={CheckCircle}
          trend={null}
          color={customer.retention_probability >= 80 ? 'green' : 'red'}
          onClick={() => handleMetricClick('retention_probability', 'Retention Probability', `${customer.retention_probability?.toFixed(1)}%`)}
        />
        <MetricCard
          title="NPS Score"
          value={customer.nps_score}
          icon={Activity}
          trend={null}
          color={customer.nps_score >= 50 ? 'green' : customer.nps_score >= 0 ? 'orange' : 'red'}
          onClick={() => handleMetricClick('nps_score', 'NPS Score', customer.nps_score)}
        />
        <MetricCard
          title="Last Interaction"
          value={`${customer.last_interaction_days} days ago`}
          icon={Clock}
          trend={null}
          color={customer.last_interaction_days < 30 ? 'green' : 'orange'}
          onClick={() => handleMetricClick('retention_probability', 'Last Interaction', `${customer.last_interaction_days} days ago`)}
        />
      </div>

      {/* Renewal Pipeline */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Renewal Status</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Contract End Date</span>
              <span className="font-semibold">{new Date(customer.contract_end_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Days to Renewal</span>
              <span className={`font-semibold ${customer.days_to_renewal < 90 ? 'text-orange-600' : 'text-gray-900'}`}>
                {customer.days_to_renewal}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Upcoming Renewals</span>
              <span className="font-semibold">{customer.upcoming_renewals_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Renewal Value</span>
              <span className="font-semibold">{formatCurrency(customer.upcoming_renewal_value)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Engagement Metrics</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">QBR Scheduled</span>
              <span className={`font-semibold ${customer.qbr_scheduled ? 'text-green-600' : 'text-red-600'}`}>
                {customer.qbr_scheduled ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Executive Sponsor</span>
              <span className={`font-semibold ${customer.executive_sponsor_engaged ? 'text-green-600' : 'text-orange-600'}`}>
                {customer.executive_sponsor_engaged ? 'Engaged' : 'Not Engaged'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CSAT Score</span>
              <span className="font-semibold">{customer.csat_score?.toFixed(1)}/5.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CES Score</span>
              <span className={`font-semibold ${customer.ces_score >= 5.5 ? 'text-green-600' : customer.ces_score >= 4.5 ? 'text-orange-600' : 'text-red-600'}`}>
                {customer.ces_score?.toFixed(1)}/7.0
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Health Status</span>
              <span className={`font-semibold ${customer.health_status === 'Healthy' ? 'text-green-600' : 'text-orange-600'}`}>
                {customer.health_status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Churn Risk Alert */}
      {customer.churn_risk_level === 'HIGH' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="text-sm text-red-700">
                <strong>High Churn Risk:</strong> Immediate action required
              </p>
              <p className="text-xs text-red-600 mt-1">
                Churn Score: {customer.churn_risk_score}/100 | Last Contact: {customer.last_interaction_days} days ago
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Renewal Opportunity Alert */}
      {customer.days_to_renewal < 90 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-orange-600 mr-2" />
            <p className="text-sm text-orange-700">
              <strong>Renewal Approaching:</strong> Contract expires in {customer.days_to_renewal} days - Schedule renewal discussion
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{customer.account_name}</h2>
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
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(customer.annual_revenue)}</p>
            <p className="text-sm text-gray-500 mt-1">Annual Revenue</p>
          </div>
        </div>
      </div>

      {/* Persona Selector */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          {personas.map((persona) => (
            <button
              key={persona.id}
              onClick={() => setSelectedPersona(persona.id as PersonaView)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedPersona === persona.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <persona.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{persona.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subsidiary Relationships */}
      {customer.subsidiaries && (
        <SubsidiaryCard
          subsidiaries={JSON.parse(customer.subsidiaries)}
          subsidiaryConfig={subsidiaryConfig}
        />
      )}

      {/* Persona-specific content */}
      {selectedPersona === 'board' && renderBoardView()}
      {selectedPersona === 'ceo' && renderCEOView()}
      {selectedPersona === 'operations' && renderOperationsView()}
      {selectedPersona === 'sales' && renderSalesView()}
      {selectedPersona === 'service' && renderServiceView()}
      {selectedPersona === 'billing' && renderBillingView()}
      {selectedPersona === 'account' && renderAccountView()}

      {/* Alerts Section */}
      {filteredAlerts && filteredAlerts.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">Active Alerts ({filteredAlerts.length})</h3>
          </div>
          <div className="space-y-3">
            {filteredAlerts.map((alert: any) => (
              <div
                key={alert.alert_id}
                className={`border-l-4 p-4 rounded ${
                  alert.severity === 'HIGH' ? 'bg-red-50 border-red-500' :
                  alert.severity === 'MEDIUM' ? 'bg-orange-50 border-orange-500' :
                  'bg-yellow-50 border-yellow-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <AlertTriangle className={`h-4 w-4 mr-2 ${
                        alert.severity === 'HIGH' ? 'text-red-600' :
                        alert.severity === 'MEDIUM' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`} />
                      <span className={`text-xs font-bold ${
                        alert.severity === 'HIGH' ? 'text-red-800' :
                        alert.severity === 'MEDIUM' ? 'text-orange-800' :
                        'text-yellow-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{alert.message}</p>
                    <p className="text-xs text-gray-600 flex items-center">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      {alert.recommendation}
                    </p>
                  </div>
                  {alert.action_type && (
                    <button
                      onClick={() => handleExecuteAction(alert.alert_id, alert.action_type)}
                      disabled={executingAction === alert.alert_id}
                      className={`ml-4 flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        executingAction === alert.alert_id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {(() => {
                        const Icon = getActionIcon(alert.action_type);
                        return <Icon className="h-4 w-4" />;
                      })()}
                      <span>{executingAction === alert.alert_id ? 'Processing...' : getActionLabel(alert.action_type)}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {filteredRecommendations && filteredRecommendations.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Lightbulb className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">Recommended Actions ({filteredRecommendations.length})</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRecommendations.map((rec: any) => (
              <div
                key={rec.recommendation_id}
                className={`border rounded-lg p-4 ${
                  rec.priority === 'HIGH' ? 'border-red-300 bg-red-50' :
                  rec.priority === 'MEDIUM' ? 'border-orange-300 bg-orange-50' :
                  'border-blue-300 bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold mr-2 ${
                      rec.priority === 'HIGH' ? 'bg-red-600 text-white' :
                      rec.priority === 'MEDIUM' ? 'bg-orange-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {rec.priority}
                    </span>
                    <span className="text-xs text-gray-600">{rec.category}</span>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{rec.title}</h4>
                <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                <div className="mb-3 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span><strong>Expected Outcome:</strong> {rec.expected_outcome}</span>
                  </div>
                  <div className="mt-1">
                    <strong>Estimated Impact:</strong> {formatCurrency(rec.estimated_impact)}
                  </div>
                </div>
                <button
                  onClick={() => handleExecuteAction(rec.recommendation_id, rec.action_type)}
                  disabled={executingAction === rec.recommendation_id}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    executingAction === rec.recommendation_id
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {(() => {
                    const Icon = getActionIcon(rec.action_type);
                    return <Icon className="h-4 w-4" />;
                  })()}
                  <span>{executingAction === rec.recommendation_id ? 'Processing...' : getActionLabel(rec.action_type)}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drill-down Modal */}
      {drillDownMetric && (
        <MetricDrillDownModal
          customerId={customerId}
          metricKey={drillDownMetric.key}
          metricTitle={drillDownMetric.title}
          metricValue={drillDownMetric.value}
          onClose={() => setDrillDownMetric(null)}
        />
      )}
    </div>
  );
}
