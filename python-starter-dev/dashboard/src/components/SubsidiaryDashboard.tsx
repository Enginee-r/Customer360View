import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  TrendingUp,
  Globe,
  BarChart3,
  Heart,
  Star,
  Smile
} from 'lucide-react';
import MetricCard from './MetricCard';

interface BusinessUnitInfo {
  id: string;
  name: string;
  short_name: string;
  color: string;
  description: string;
  countries: string[];
  logo?: string;
  website?: string;
}

interface BusinessUnitDashboardProps {
  subsidiaryId: string;
  opCoId?: string | null;
  onSelectCustomer?: (customerId: string) => void;
}

interface DashboardData {
  subsidiary_id: string;
  total_customers: number;
  total_revenue: number;
  avg_health_score: number;
  high_risk_customers: number;
  health_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
  region_distribution: Record<string, number>;
  top_revenue_customers: Array<{
    account_id: string;
    account_name: string;
    annual_revenue: number;
    health_status: string;
    region: string;
  }>;
  at_risk_customers: Array<{
    account_id: string;
    account_name: string;
    churn_risk_score: number;
    annual_revenue: number;
    health_status: string;
  }>;
  avg_nps: number;
  avg_csat: number;
  avg_ces: number;
  avg_support_tickets: number;
  avg_sla_compliance: number;
  avg_revenue_per_customer: number;
}

export default function BusinessUnitDashboard({ subsidiaryId, opCoId, onSelectCustomer }: BusinessUnitDashboardProps) {
  const [businessUnitInfo, setBusinessUnitInfo] = useState<BusinessUnitInfo | null>(null);

  // Fetch business unit information
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    fetch(`${apiUrl}/subsidiaries`)
      .then(res => res.json())
      .then(data => {
        const sub = data.subsidiaries?.find((s: BusinessUnitInfo) => s.id === subsidiaryId);
        if (sub) {
          setBusinessUnitInfo(sub);
        }
      })
      .catch(err => console.error('Error fetching business unit info:', err));
  }, [subsidiaryId]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery<DashboardData>(
    ['business-unit-dashboard', subsidiaryId, opCoId],
    async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const url = opCoId
        ? `${apiUrl}/subsidiary/${subsidiaryId}/dashboard?opco=${opCoId}`
        : `${apiUrl}/subsidiary/${subsidiaryId}/dashboard`;
      const response = await fetch(url);
      return response.json();
    },
    {
      enabled: !!subsidiaryId,
    }
  );

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-datacamp-brand"></div>
      </div>
    );
  }

  if (!dashboardData || !businessUnitInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
          Subsidiary data not available
        </p>
      </div>
    );
  }

  const accentColor = businessUnitInfo.color;

  return (
    <div className="space-y-6 p-6">
      {/* Subsidiary Header */}
      <div
        className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border-l-4"
        style={{ borderLeftColor: accentColor }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8" style={{ color: accentColor }} />
              <div>
                <h1 className="text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                  {businessUnitInfo.name}
                </h1>
                <p className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">
                  {businessUnitInfo.description}
                </p>
              </div>
            </div>

            {/* Countries */}
            {businessUnitInfo.countries && businessUnitInfo.countries.length > 0 && (
              <div className="mt-4 flex items-start gap-2">
                <Globe className="h-4 w-4 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-0.5" />
                <div className="flex flex-wrap gap-1.5">
                  {businessUnitInfo.countries.map((country, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs rounded bg-datacamp-bg-tertiary dark:bg-datacamp-dark-bg-tertiary text-datacamp-text-primary dark:text-datacamp-dark-text-primary"
                    >
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {businessUnitInfo.website && (
            <a
              href={businessUnitInfo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: `${accentColor}20`,
                color: accentColor,
              }}
            >
              Visit Website
            </a>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Customers"
          value={formatNumber(dashboardData.total_customers)}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(dashboardData.total_revenue)}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Avg Health Score"
          value={`${dashboardData.avg_health_score.toFixed(1)}%`}
          icon={Activity}
          color={dashboardData.avg_health_score >= 75 ? 'green' : dashboardData.avg_health_score >= 60 ? 'orange' : 'red'}
        />
        <MetricCard
          title="High Risk Customers"
          value={formatNumber(dashboardData.high_risk_customers)}
          icon={AlertTriangle}
          color={dashboardData.high_risk_customers > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Customer Satisfaction Metrics */}
      <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
        <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-4">
          Customer Satisfaction
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <p className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                NPS Score
              </p>
            </div>
            <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
              {dashboardData.avg_nps.toFixed(0)}
            </p>
            <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">
              Net Promoter Score
            </p>
          </div>

          <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Smile className="h-5 w-5 text-blue-500" />
              <p className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                CSAT Score
              </p>
            </div>
            <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
              {dashboardData.avg_csat.toFixed(1)}/5.0
            </p>
            <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">
              Customer Satisfaction
            </p>
          </div>

          <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-purple-500" />
              <p className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                CES Score
              </p>
            </div>
            <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
              {dashboardData.avg_ces.toFixed(1)}/7.0
            </p>
            <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">
              Customer Effort Score
            </p>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Distribution */}
        <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-datacamp-brand" />
            <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
              Health Distribution
            </h3>
          </div>
          <div className="space-y-3">
            {Object.entries(dashboardData.health_distribution).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                  {status}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {count}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      status === 'Healthy' ? 'bg-green-500' :
                      status === 'At-Risk' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-datacamp-brand" />
            <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
              Risk Distribution
            </h3>
          </div>
          <div className="space-y-3">
            {Object.entries(dashboardData.risk_distribution).map(([risk, count]) => (
              <div key={risk} className="flex items-center justify-between">
                <span className="text-sm text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                  {risk}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {count}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      risk === 'LOW' ? 'bg-green-500' :
                      risk === 'MEDIUM' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Region Distribution */}
        <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-datacamp-brand" />
            <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
              Region Distribution
            </h3>
          </div>
          <div className="space-y-3">
            {Object.entries(dashboardData.region_distribution)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([region, count]) => (
                <div key={region} className="flex items-center justify-between">
                  <span className="text-sm text-datacamp-text-primary dark:text-datacamp-dark-text-primary truncate">
                    {region}
                  </span>
                  <span className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary ml-2">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Top Revenue Customers & At-Risk Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Revenue Customers */}
        <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5" style={{ color: accentColor }} />
            <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
              Top Revenue Customers
            </h3>
          </div>
          <div className="space-y-3">
            {dashboardData.top_revenue_customers.slice(0, 5).map((customer, idx) => (
              <div
                key={customer.account_id}
                className="flex items-center justify-between p-3 rounded-lg bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main cursor-pointer hover:bg-datacamp-bg-tertiary dark:hover:bg-datacamp-dark-bg-tertiary transition-colors"
                onClick={() => onSelectCustomer?.(customer.account_id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                      #{idx + 1}
                    </span>
                    <p className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary truncate">
                      {customer.account_name}
                    </p>
                  </div>
                  <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-0.5">
                    {customer.region}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {formatCurrency(customer.annual_revenue)}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      customer.health_status === 'Healthy'
                        ? 'bg-datacamp-success/10 text-datacamp-success'
                        : customer.health_status === 'At-Risk'
                        ? 'bg-datacamp-warning/10 text-datacamp-warning'
                        : 'bg-datacamp-red/10 text-datacamp-red'
                    }`}
                  >
                    {customer.health_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk Customers */}
        <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-datacamp-red" />
            <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
              At-Risk Customers
            </h3>
          </div>
          {dashboardData.at_risk_customers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                No high-risk customers
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.at_risk_customers.slice(0, 5).map((customer) => (
                <div
                  key={customer.account_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main cursor-pointer hover:bg-datacamp-bg-tertiary dark:hover:bg-datacamp-dark-bg-tertiary transition-colors"
                  onClick={() => onSelectCustomer?.(customer.account_id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary truncate">
                      {customer.account_name}
                    </p>
                    <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-0.5">
                      Risk Score: {customer.churn_risk_score.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold text-datacamp-red">
                      {formatCurrency(customer.annual_revenue)}
                    </p>
                    <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-0.5">
                      at risk
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Service Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
          <p className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-2">
            Avg Revenue per Customer
          </p>
          <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
            {formatCurrency(dashboardData.avg_revenue_per_customer)}
          </p>
        </div>

        <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
          <p className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-2">
            Avg Support Tickets
          </p>
          <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
            {dashboardData.avg_support_tickets.toFixed(1)}
          </p>
        </div>

        <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
          <p className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-2">
            Avg SLA Compliance
          </p>
          <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
            {dashboardData.avg_sla_compliance.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
