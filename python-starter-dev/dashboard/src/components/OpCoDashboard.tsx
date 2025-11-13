import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { ChevronDown, ChevronUp, Globe, X } from 'lucide-react';
import CustomerListItem from './CustomerListItem';

interface OpCo {
  id: string;
  name: string;
  code: string;
  region: string;
}

interface OpCoDashboardProps {
  opCoId: string;
  onSelectCustomer: (customerId: string) => void;
}

export default function OpCoDashboard({ opCoId, onSelectCustomer }: OpCoDashboardProps) {
  const [opCoInfo, setOpCoInfo] = useState<OpCo | null>(null);
  const [expandedHealthStatus, setExpandedHealthStatus] = useState<string | null>(null);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [showTopRevenue, setShowTopRevenue] = useState<boolean>(false);
  const [showAtRisk, setShowAtRisk] = useState<boolean>(false);

  // Refs for click-outside detection
  const topRevenueRef = useRef<HTMLDivElement>(null);
  const atRiskRef = useRef<HTMLDivElement>(null);

  // Fetch OpCo information
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    fetch(`${apiUrl}/opcos`)
      .then(res => res.json())
      .then(data => {
        const opco = data.opcos?.find((o: OpCo) => o.id === opCoId);
        if (opco) {
          setOpCoInfo(opco);
        }
      })
      .catch(err => console.error('Error fetching OpCo info:', err));
  }, [opCoId]);

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside all curtains
      const isOutsideTopRevenue = topRevenueRef.current && !topRevenueRef.current.contains(target);
      const isOutsideAtRisk = atRiskRef.current && !atRiskRef.current.contains(target);

      if (isOutsideTopRevenue && showTopRevenue) {
        setShowTopRevenue(false);
      }
      if (isOutsideAtRisk && showAtRisk) {
        setShowAtRisk(false);
      }
    };

    // Add event listener when any curtain is open
    if (showTopRevenue || showAtRisk) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTopRevenue, showAtRisk]);

  const scrollToElement = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTotalCustomersClick = () => {
    scrollToElement('health-distribution');
    setExpandedHealthStatus('Healthy');
  };

  const handleRevenueClick = () => {
    setShowTopRevenue(true);
    setTimeout(() => scrollToElement('top-customers-section'), 100);
  };

  const handleAtRiskClick = () => {
    setShowAtRisk(true);
    setTimeout(() => scrollToElement('top-customers-section'), 100);
  };

  const handleHealthScoreClick = () => {
    scrollToElement('health-distribution');
  };

  const { data: dashboardData } = useQuery(['opco-dashboard', opCoId], async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${apiUrl}/opco/${opCoId}/dashboard`);
    return response.json();
  });

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-datacamp-brand"></div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-5">
      {/* OpCo Header */}
      <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-3 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{opCoInfo?.code}</div>
          <div>
            <h2 className="text-xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
              {opCoInfo?.name}
            </h2>
            <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
              {opCoInfo?.region} Region • Operational Country View
            </p>
          </div>
        </div>
      </div>

      {/* Search prompt */}
      <div className="text-center py-4 mt-4">
        <Globe className="mx-auto h-10 w-10 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle" />
        <h3 className="mt-2 text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
          Search for a customer in {opCoInfo?.name}
        </h3>
        <p className="mt-1 text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
          Use the search bar above to find customers operating in this country
        </p>
      </div>

      {/* Key Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={handleTotalCustomersClick}
          className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-5 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-datacamp-brand"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Total Customers</h3>
            <svg className="h-5 w-5 text-datacamp-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="mt-4 text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
            {formatNumber(dashboardData.total_customers)}
          </p>
          <p className="mt-2 text-xs text-datacamp-success">Active accounts • Click to view</p>
        </div>

        <div
          onClick={handleRevenueClick}
          className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-5 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-datacamp-success"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Annual Revenue</h3>
            <svg className="h-5 w-5 text-datacamp-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-4 text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
            ${formatNumber(dashboardData.total_revenue)}
          </p>
          <p className="mt-2 text-xs text-datacamp-success">Total ARR • Click to view</p>
        </div>

        <div
          onClick={handleHealthScoreClick}
          className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-5 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-datacamp-warning"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Avg Health Score</h3>
            <svg className="h-5 w-5 text-datacamp-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="mt-4 text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
            {dashboardData.avg_health_score.toFixed(1)}
          </p>
          <p className="mt-2 text-xs text-datacamp-text-subtle">Across all accounts • Click to view</p>
        </div>

        <div
          onClick={handleAtRiskClick}
          className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-5 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-datacamp-red"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">At-Risk Accounts</h3>
            <svg className="h-5 w-5 text-datacamp-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="mt-4 text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
            {dashboardData.high_risk_customers}
          </p>
          <p className="mt-2 text-xs text-datacamp-red">Require attention • Click to view</p>
        </div>
      </div>

      {/* Top Customers Section - Collapsible */}
      {(showTopRevenue || showAtRisk) && (
        <div id="top-customers-section" className="scroll-mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Revenue Customers */}
            {showTopRevenue && (
              <div ref={topRevenueRef} className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-5 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary flex items-center gap-2">
                    <svg className="h-5 w-5 text-datacamp-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Top Revenue Customers
                  </h3>
                  <button
                    onClick={() => setShowTopRevenue(false)}
                    className="text-datacamp-text-subtle hover:text-datacamp-text-primary"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  {dashboardData.top_revenue_customers?.slice(0, 10).map((customer: any, idx: number) => (
                    <div
                      key={customer.account_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main cursor-pointer hover:bg-datacamp-bg-tertiary dark:hover:bg-datacamp-dark-bg-tertiary transition-colors"
                      onClick={() => onSelectCustomer(customer.account_id)}
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
                          ${formatNumber(customer.annual_revenue)}
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
            )}

            {/* At-Risk Customers */}
            {showAtRisk && (
              <div ref={atRiskRef} className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-5 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary flex items-center gap-2">
                    <svg className="h-5 w-5 text-datacamp-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    At-Risk Customers
                  </h3>
                  <button
                    onClick={() => setShowAtRisk(false)}
                    className="text-datacamp-text-subtle hover:text-datacamp-text-primary"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {(!dashboardData.at_risk_customers_sample || dashboardData.at_risk_customers_sample.length === 0) ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                      No at-risk customers found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.at_risk_customers_sample.slice(0, 10).map((customer: any) => (
                      <div
                        key={customer.account_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main cursor-pointer hover:bg-datacamp-bg-tertiary dark:hover:bg-datacamp-dark-bg-tertiary transition-colors"
                        onClick={() => onSelectCustomer(customer.account_id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary truncate">
                            {customer.account_name}
                          </p>
                          <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-0.5">
                            {customer.region} • Churn Risk: {customer.churn_risk_score?.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-semibold text-datacamp-red">
                            ${formatNumber(customer.annual_revenue)}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 bg-datacamp-warning/10 text-datacamp-warning">
                            At-Risk
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Distribution Sections */}
      <div id="health-distribution" className="grid grid-cols-1 lg:grid-cols-3 gap-5 scroll-mt-5">
        {/* Health Distribution */}
        <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-5 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary lg:col-span-2">
          <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-4">
            Customer Health Distribution
          </h3>
          <div className="space-y-4">
            {/* Healthy */}
            {dashboardData.health_distribution.Healthy > 0 && (
              <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-3">
                <div
                  onClick={() => setExpandedHealthStatus(expandedHealthStatus === 'Healthy' ? null : 'Healthy')}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Healthy</span>
                      {expandedHealthStatus === 'Healthy' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                    <span className="text-sm font-medium text-datacamp-success">
                      {dashboardData.health_distribution.Healthy} ({((dashboardData.health_distribution.Healthy / dashboardData.total_customers) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-datacamp-bg-tertiary dark:bg-datacamp-dark-bg-tertiary rounded-full h-2">
                    <div
                      className="bg-datacamp-success h-2 rounded-full transition-all"
                      style={{ width: `${(dashboardData.health_distribution.Healthy / dashboardData.total_customers) * 100}%` }}
                    ></div>
                  </div>
                </div>
                {expandedHealthStatus === 'Healthy' && dashboardData.healthy_customers_sample && (
                  <div className="mt-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                        Healthy Customers
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedHealthStatus(null);
                        }}
                        className="text-datacamp-text-subtle hover:text-datacamp-text-primary dark:text-datacamp-dark-text-subtle dark:hover:text-datacamp-dark-text-primary transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {dashboardData.healthy_customers_sample.slice(0, 5).map((customer: any) => (
                        <CustomerListItem
                          key={customer.account_id}
                          customer={customer}
                          onClick={() => onSelectCustomer(customer.account_id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* At-Risk */}
            {dashboardData.health_distribution['At-Risk'] > 0 && (
              <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-3">
                <div
                  onClick={() => setExpandedHealthStatus(expandedHealthStatus === 'At-Risk' ? null : 'At-Risk')}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">At-Risk</span>
                      {expandedHealthStatus === 'At-Risk' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                    <span className="text-sm font-medium text-datacamp-warning">
                      {dashboardData.health_distribution['At-Risk']} ({((dashboardData.health_distribution['At-Risk'] / dashboardData.total_customers) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-datacamp-bg-tertiary dark:bg-datacamp-dark-bg-tertiary rounded-full h-2">
                    <div
                      className="bg-datacamp-warning h-2 rounded-full transition-all"
                      style={{ width: `${(dashboardData.health_distribution['At-Risk'] / dashboardData.total_customers) * 100}%` }}
                    ></div>
                  </div>
                </div>
                {expandedHealthStatus === 'At-Risk' && dashboardData.at_risk_customers_sample && (
                  <div className="mt-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                        At-Risk Customers
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedHealthStatus(null);
                        }}
                        className="text-datacamp-text-subtle hover:text-datacamp-text-primary dark:text-datacamp-dark-text-subtle dark:hover:text-datacamp-dark-text-primary transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {dashboardData.at_risk_customers_sample.slice(0, 5).map((customer: any) => (
                        <CustomerListItem
                          key={customer.account_id}
                          customer={customer}
                          onClick={() => onSelectCustomer(customer.account_id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Critical */}
            {dashboardData.health_distribution.Critical > 0 && (
              <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-3">
                <div
                  onClick={() => setExpandedHealthStatus(expandedHealthStatus === 'Critical' ? null : 'Critical')}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Critical</span>
                      {expandedHealthStatus === 'Critical' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                    <span className="text-sm font-medium text-datacamp-red">
                      {dashboardData.health_distribution.Critical} ({((dashboardData.health_distribution.Critical / dashboardData.total_customers) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-datacamp-bg-tertiary dark:bg-datacamp-dark-bg-tertiary rounded-full h-2">
                    <div
                      className="bg-datacamp-red h-2 rounded-full transition-all"
                      style={{ width: `${(dashboardData.health_distribution.Critical / dashboardData.total_customers) * 100}%` }}
                    ></div>
                  </div>
                </div>
                {expandedHealthStatus === 'Critical' && dashboardData.critical_customers_sample && (
                  <div className="mt-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                        Critical Customers
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedHealthStatus(null);
                        }}
                        className="text-datacamp-text-subtle hover:text-datacamp-text-primary dark:text-datacamp-dark-text-subtle dark:hover:text-datacamp-dark-text-primary transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {dashboardData.critical_customers_sample.slice(0, 5).map((customer: any) => (
                        <CustomerListItem
                          key={customer.account_id}
                          customer={customer}
                          onClick={() => onSelectCustomer(customer.account_id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Regional Split */}
        <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-5 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
          <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-4">
            Top Regions
          </h3>
          <div className="space-y-3">
            {Object.entries(dashboardData.region_distribution || {})
              .sort(([, a]: any, [, b]: any) => b - a)
              .slice(0, 5)
              .map(([region, count]: [string, any]) => (
                <div key={region} className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-3">
                  <div
                    onClick={() => setExpandedRegion(expandedRegion === region ? null : region)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">{region}</span>
                      {expandedRegion === region ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </div>
                    <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">{count}</span>
                  </div>
                  {expandedRegion === region && dashboardData.region_samples?.[region] && (
                    <div className="mt-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                          {region} Customers
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRegion(null);
                          }}
                          className="text-datacamp-text-subtle hover:text-datacamp-text-primary dark:text-datacamp-dark-text-subtle dark:hover:text-datacamp-dark-text-primary transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        {dashboardData.region_samples[region].slice(0, 3).map((customer: any) => (
                          <CustomerListItem
                            key={customer.account_id}
                            customer={customer}
                            onClick={() => onSelectCustomer(customer.account_id)}
                            showRevenue={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
