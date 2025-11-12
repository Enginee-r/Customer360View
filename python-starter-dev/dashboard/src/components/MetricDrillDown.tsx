import { X, ArrowLeft, CheckCircle, AlertTriangle, Lightbulb, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { searchCustomers, getDashboardSummary, getCustomer360, getCustomerRecommendations, executeAction, getSegmentRecommendations } from '../api/customer360';

interface MetricDrillDownProps {
  metric: 'customers' | 'revenue' | 'health' | 'at-risk';
  filterCriteria?: { type: 'health' | 'region', value: string } | null;
  onClose: () => void;
}

export default function MetricDrillDown({ metric, filterCriteria, onClose }: MetricDrillDownProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [internalFilter, setInternalFilter] = useState<{ type: 'health' | 'region', value: string } | null>(filterCriteria || null);
  const [currentView, setCurrentView] = useState<'customers' | 'revenue' | 'health' | 'at-risk'>(metric);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionContext, setActionContext] = useState<'recommendations' | 'alerts' | 'profile' | null>(null);

  const { data: customers, isLoading: customersLoading } = useQuery(
    'allCustomers',
    () => searchCustomers(''),
    {
      enabled: currentView === 'customers' || currentView === 'at-risk'
    }
  );

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'dashboardSummary',
    getDashboardSummary,
    { enabled: currentView === 'revenue' || currentView === 'health' }
  );

  const { data: customerProfile, isLoading: profileLoading } = useQuery(
    ['customer360', selectedCustomerId],
    () => getCustomer360(selectedCustomerId!),
    { enabled: !!selectedCustomerId }
  );

  const { data: recommendations, isLoading: recommendationsLoading, refetch: refetchRecommendations } = useQuery(
    ['recommendations', selectedCustomerId],
    () => getCustomerRecommendations(selectedCustomerId!),
    { enabled: !!selectedCustomerId }
  );

  // Fetch segment-level recommendations when filtering by health or region
  const { data: segmentData, isLoading: segmentLoading } = useQuery(
    ['segmentRecommendations', internalFilter?.type, internalFilter?.value],
    () => {
      return getSegmentRecommendations(internalFilter!.type, internalFilter!.value);
    },
    {
      enabled: !!internalFilter && !!internalFilter.type && !!internalFilter.value,
      onError: (error) => console.error('Segment query error:', error)
    }
  );

  const executeMutation = useMutation(executeAction, {
    onSuccess: (data) => {
      setExecutingAction(null);
      setSuccessMessage('✓ Action executed successfully! The team has been notified.');
      setTimeout(() => {
        setSuccessMessage(null);
        setActionContext(null);
      }, 5000);
    },
    onError: (error) => {
      setExecutingAction(null);
      setErrorMessage('✗ Failed to execute action. Please try again.');
      setTimeout(() => {
        setErrorMessage(null);
        setActionContext(null);
      }, 5000);
    }
  });

  const handleExecuteSegmentAction = (actionId: string, context: 'recommendations' | 'alerts') => {
    setExecutingAction(actionId);
    setActionContext(context);
    executeMutation.mutate(actionId);
  };

  const isLoading = customersLoading || dashboardLoading;

  const handleTakeAction = async (actionId: string) => {
    try {
      setExecutingAction(actionId);
      setActionContext('profile');
      await executeAction(actionId);
      setSuccessMessage('✓ Action executed successfully! Task has been created and assigned.');
      setTimeout(() => {
        setSuccessMessage(null);
        setActionContext(null);
      }, 5000);
      await refetchRecommendations();
    } catch (error) {
      console.error('Failed to execute action:', error);
      setErrorMessage('✗ Failed to execute action. Please try again.');
      setTimeout(() => {
        setErrorMessage(null);
        setActionContext(null);
      }, 5000);
    } finally {
      setExecutingAction(null);
    }
  };

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleBack = () => {
    if (selectedCustomerId) {
      setSelectedCustomerId(null);
    } else if (metric === 'health' && currentView === 'customers') {
      // Going back from customer list to health distribution
      setCurrentView('health');
      setInternalFilter(null);
    } else if (metric === 'at-risk' && currentView === 'customers') {
      // Going back from customer list to at-risk summary
      setCurrentView('at-risk');
      setInternalFilter(null);
    }
  };

  const renderCustomerProfile = () => {
    if (profileLoading || recommendationsLoading) {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-datacamp-brand"></div>
          <p className="mt-4 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Loading customer profile...</p>
        </div>
      );
    }

    if (!customerProfile) return null;

    return (
      <div className="space-y-6">
        {/* Customer Header */}
        <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                {customerProfile.account_name}
              </h3>
              <p className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">
                {customerProfile.region} • {customerProfile.industry}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                customerProfile.health_status === 'Healthy'
                  ? 'bg-datacamp-success/10 text-datacamp-success border border-datacamp-success/20'
                  : customerProfile.health_status === 'At-Risk'
                  ? 'bg-datacamp-warning/10 text-datacamp-warning border border-datacamp-warning/20'
                  : 'bg-datacamp-red/10 text-datacamp-red border border-datacamp-red/20'
              }`}
            >
              {customerProfile.health_status}
            </span>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Health Score</p>
              <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mt-1">
                {customerProfile.health_score?.toFixed(1) || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Annual Revenue</p>
              <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mt-1">
                ${customerProfile.annual_revenue ? (customerProfile.annual_revenue / 1000000).toFixed(2) : '0'}M
              </p>
            </div>
            <div>
              <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Churn Risk</p>
              <p className={`text-2xl font-bold mt-1 ${
                customerProfile.churn_risk_level === 'LOW' ? 'text-datacamp-success' :
                customerProfile.churn_risk_level === 'MEDIUM' ? 'text-datacamp-warning' :
                'text-datacamp-red'
              }`}>
                {customerProfile.churn_risk_level || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
              Recommendations
            </h4>
            <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
              {recommendations?.length || 0} actions
            </span>
          </div>

          {/* Success/Error messages for profile recommendation actions */}
          {actionContext === 'profile' && successMessage && (
            <div className="mb-4 animate-slide-down">
              <div className="bg-datacamp-success/10 border border-datacamp-success/20 text-datacamp-success px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{successMessage}</span>
              </div>
            </div>
          )}
          {actionContext === 'profile' && errorMessage && (
            <div className="mb-4 animate-slide-down">
              <div className="bg-datacamp-red/10 border border-datacamp-red/20 text-datacamp-red px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            </div>
          )}

          {!recommendations || recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-datacamp-success mx-auto" />
              <p className="mt-3 text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                No recommendations at this time
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[40vh] overflow-auto">
              {recommendations.map((rec: any) => (
                <div
                  key={rec.recommendation_id}
                  className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            rec.priority === 'HIGH'
                              ? 'text-datacamp-red'
                              : rec.priority === 'MEDIUM'
                              ? 'text-datacamp-warning'
                              : 'text-datacamp-text-subtle'
                          }`}
                        />
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            rec.priority === 'HIGH'
                              ? 'bg-datacamp-red/10 text-datacamp-red'
                              : rec.priority === 'MEDIUM'
                              ? 'bg-datacamp-warning/10 text-datacamp-warning'
                              : 'bg-datacamp-text-subtle/10 text-datacamp-text-subtle'
                          }`}
                        >
                          {rec.priority}
                        </span>
                        <span className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                          {rec.recommendation_type}
                        </span>
                      </div>
                      <p className="text-sm text-datacamp-text-primary dark:text-datacamp-dark-text-primary font-medium mb-1">
                        {rec.recommendation}
                      </p>
                      <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                        {rec.reason}
                      </p>
                      {rec.expected_impact && (
                        <p className="text-xs text-datacamp-success mt-2">
                          Expected Impact: {rec.expected_impact}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleTakeAction(rec.recommendation_id)}
                      disabled={executingAction === rec.recommendation_id}
                      className="px-4 py-2 bg-datacamp-brand hover:bg-datacamp-brand/80 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {executingAction === rec.recommendation_id ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          Acting...
                        </span>
                      ) : (
                        'Take Action'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
            <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-2">Product Adoption</p>
            <p className="text-xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
              {customerProfile.product_adoption_rate ? `${(customerProfile.product_adoption_rate * 100).toFixed(0)}%` : '—'}
            </p>
          </div>
          <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
            <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-2">Support Tickets</p>
            <p className="text-xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
              {customerProfile.total_support_tickets || 0}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (selectedCustomerId) {
      return renderCustomerProfile();
    }

    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-datacamp-brand"></div>
          <p className="mt-4 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Loading data...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'customers':
        const filteredCustomers = internalFilter
          ? customers?.filter((c: any) => {
              if (internalFilter.type === 'health') {
                return c.health_status === internalFilter.value;
              } else if (internalFilter.type === 'region') {
                return c.region === internalFilter.value;
              }
              return true;
            })
          : customers;

        const titlePrefix = internalFilter
          ? internalFilter.type === 'health'
            ? `${internalFilter.value} Customers`
            : `Customers in ${internalFilter.value}`
          : 'All Customers';

        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                {titlePrefix} ({filteredCustomers?.length || 0})
              </h3>
              {internalFilter?.type === 'health' && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    internalFilter.value === 'Healthy'
                      ? 'bg-datacamp-success/10 text-datacamp-success border border-datacamp-success/20'
                      : internalFilter.value === 'At-Risk'
                      ? 'bg-datacamp-warning/10 text-datacamp-warning border border-datacamp-warning/20'
                      : 'bg-datacamp-red/10 text-datacamp-red border border-datacamp-red/20'
                  }`}
                >
                  {internalFilter.value}
                </span>
              )}
            </div>

            {/* Segment Statistics */}
            {segmentData?.segment_stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-5 w-5 text-datacamp-brand" />
                  </div>
                  <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {segmentData.segment_stats.customer_count}
                  </p>
                  <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">Total Customers</p>
                </div>
                <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-5 w-5 text-datacamp-success" />
                  </div>
                  <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    ${(segmentData.segment_stats.total_revenue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">Total Revenue</p>
                </div>
                <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-datacamp-warning" />
                  </div>
                  <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {segmentData.segment_stats.avg_health_score.toFixed(1)}
                  </p>
                  <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">Avg Health Score</p>
                </div>
                <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="h-5 w-5 text-datacamp-red" />
                  </div>
                  <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {segmentData.segment_stats.high_risk_count}
                  </p>
                  <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">High Risk</p>
                </div>
              </div>
            )}

            {/* Segment Recommendations */}
            {segmentData?.top_recommendations && segmentData.top_recommendations.length > 0 && (
              <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                {/* Success/Error messages for recommendation actions */}
                {actionContext === 'recommendations' && successMessage && (
                  <div className="mb-4 animate-slide-down">
                    <div className="bg-datacamp-success/10 border border-datacamp-success/20 text-datacamp-success px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">{successMessage}</span>
                    </div>
                  </div>
                )}
                {actionContext === 'recommendations' && errorMessage && (
                  <div className="mb-4 animate-slide-down">
                    <div className="bg-datacamp-red/10 border border-datacamp-red/20 text-datacamp-red px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">{errorMessage}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center mb-4">
                  <Lightbulb className="h-5 w-5 text-datacamp-brand mr-2" />
                  <h4 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    Top Segment Recommendations
                  </h4>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {segmentData.top_recommendations.map((rec: any) => (
                    <div
                      key={rec.recommendation_id}
                      className={`border rounded-lg p-4 ${
                        rec.priority === 'HIGH' ? 'border-datacamp-red bg-datacamp-red/5' :
                        rec.priority === 'MEDIUM' ? 'border-datacamp-warning bg-datacamp-warning/5' :
                        'border-datacamp-brand bg-datacamp-brand/5'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            rec.priority === 'HIGH' ? 'bg-datacamp-red text-white' :
                            rec.priority === 'MEDIUM' ? 'bg-datacamp-warning text-white' :
                            'bg-datacamp-brand text-white'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                            {rec.category}
                          </span>
                        </div>
                      </div>
                      <h5 className="font-semibold text-sm text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-1">
                        {rec.title}
                      </h5>
                      <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-2">
                        {rec.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-datacamp-success">
                          Impact: ${(rec.estimated_impact / 1000).toFixed(0)}K
                        </span>
                        <button
                          onClick={() => handleExecuteSegmentAction(rec.recommendation_id, 'recommendations')}
                          disabled={executingAction === rec.recommendation_id}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            executingAction === rec.recommendation_id
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-datacamp-brand text-white hover:bg-datacamp-brand/80'
                          }`}
                        >
                          {executingAction === rec.recommendation_id ? 'Acting...' : 'Take Action'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Critical Alerts */}
            {segmentData?.critical_alerts && segmentData.critical_alerts.length > 0 && (
              <div className="bg-datacamp-red/10 border border-datacamp-red/20 rounded-lg p-6">
                {/* Success/Error messages for alert actions */}
                {actionContext === 'alerts' && successMessage && (
                  <div className="mb-4 animate-slide-down">
                    <div className="bg-datacamp-success/10 border border-datacamp-success/20 text-datacamp-success px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">{successMessage}</span>
                    </div>
                  </div>
                )}
                {actionContext === 'alerts' && errorMessage && (
                  <div className="mb-4 animate-slide-down">
                    <div className="bg-datacamp-red/10 border border-datacamp-red/20 text-datacamp-red px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">{errorMessage}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-5 w-5 text-datacamp-red mr-2" />
                  <h4 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    Critical Alerts ({segmentData.critical_alerts.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {segmentData.critical_alerts.map((alert: any) => (
                    <div
                      key={alert.alert_id}
                      className="bg-white dark:bg-datacamp-dark-bg-secondary rounded p-3 border border-datacamp-red"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-1">
                            {alert.message}
                          </p>
                          <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                            💡 {alert.recommendation}
                          </p>
                        </div>
                        {alert.action_type && (
                          <button
                            onClick={() => handleExecuteSegmentAction(alert.alert_id, 'alerts')}
                            disabled={executingAction === alert.alert_id}
                            className={`ml-3 px-3 py-1 rounded text-xs font-medium transition-colors ${
                              executingAction === alert.alert_id
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-datacamp-red text-white hover:bg-datacamp-red/80'
                            }`}
                          >
                            {executingAction === alert.alert_id ? 'Acting...' : 'Act Now'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer List */}
            <div>
              <h4 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-4">
                All Customers in Segment
              </h4>
              {(!filteredCustomers || filteredCustomers.length === 0) ? (
                <div className="text-center py-12 bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                  <AlertTriangle className="h-12 w-12 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mx-auto mb-4" />
                  <p className="text-lg font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    No customers found in this segment
                  </p>
                  <p className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-2">
                    {internalFilter?.type === 'health'
                      ? `There are currently no customers with "${internalFilter.value}" health status.`
                      : `There are currently no customers in the "${internalFilter?.value}" region.`}
                  </p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[40vh]">
                  <table className="w-full">
                  <thead className="sticky top-0 bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast">
                    <tr className="border-b border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                      <th className="px-4 py-3 text-left text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Customer Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Region</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Health Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-datacamp-bg-tertiary dark:divide-datacamp-dark-bg-tertiary">
                    {filteredCustomers?.map((customer: any) => (
                      <tr
                        key={customer.account_id}
                        onClick={() => handleCustomerClick(customer.account_id)}
                        className="hover:bg-datacamp-bg-secondary dark:hover:bg-datacamp-dark-bg-contrast transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                          {customer.account_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                          {customer.region}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              customer.health_status === 'Healthy'
                                ? 'bg-datacamp-success/10 text-datacamp-success border border-datacamp-success/20'
                                : customer.health_status === 'At-Risk'
                                ? 'bg-datacamp-warning/10 text-datacamp-warning border border-datacamp-warning/20'
                                : 'bg-datacamp-red/10 text-datacamp-red border border-datacamp-red/20'
                            }`}
                          >
                            {customer.health_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'revenue':
        const topRevenueCustomers = dashboardData?.top_revenue_customers || [];
        return (
          <div>
            <h3 className="text-xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-6">
              Revenue Breakdown
            </h3>
            <div className="mb-6 p-4 bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg">
              <p className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Total Annual Revenue</p>
              <p className="text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mt-2">
                ${dashboardData?.total_revenue ? (dashboardData.total_revenue / 1000000).toFixed(1) : '0'}M
              </p>
            </div>
            <h4 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-4">
              Top 10 Revenue Customers
            </h4>
            <div className="overflow-auto max-h-[50vh]">
              <table className="w-full">
                <thead className="sticky top-0 bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast">
                  <tr className="border-b border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                    <th className="px-4 py-3 text-left text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Customer Name</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Annual Revenue</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-datacamp-bg-tertiary dark:divide-datacamp-dark-bg-tertiary">
                  {topRevenueCustomers.map((customer: any, index: number) => (
                    <tr
                      key={customer.account_id}
                      onClick={() => handleCustomerClick(customer.account_id)}
                      className="hover:bg-datacamp-bg-secondary dark:hover:bg-datacamp-dark-bg-contrast transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                        #{index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                        {customer.account_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                        ${(customer.annual_revenue / 1000000).toFixed(2)}M
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.health_status === 'Healthy'
                              ? 'bg-datacamp-success/10 text-datacamp-success border border-datacamp-success/20'
                              : customer.health_status === 'At-Risk'
                              ? 'bg-datacamp-warning/10 text-datacamp-warning border border-datacamp-warning/20'
                              : 'bg-datacamp-red/10 text-datacamp-red border border-datacamp-red/20'
                          }`}
                        >
                          {customer.health_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'health':
        const healthDistribution = dashboardData?.health_distribution || {};
        const totalCustomers = dashboardData?.total_customers || 1;
        return (
          <div>
            <h3 className="text-xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-6">
              Health Score Distribution
            </h3>
            <div className="mb-6 p-4 bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg">
              <p className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Average Health Score</p>
              <p className="text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mt-2">
                {dashboardData?.avg_health_score?.toFixed(1) || '—'}
              </p>
            </div>
            <div className="space-y-6">
              {Object.entries(healthDistribution).map(([status, count]: [string, any]) => {
                const percentage = ((count / totalCustomers) * 100).toFixed(1);
                const colorClass = status === 'Healthy'
                  ? 'text-datacamp-success bg-datacamp-success'
                  : status === 'At-Risk'
                  ? 'text-datacamp-warning bg-datacamp-warning'
                  : 'text-datacamp-red bg-datacamp-red';

                return (
                  <div
                    key={status}
                    onClick={() => {
                      setInternalFilter({ type: 'health', value: status });
                      setCurrentView('customers');
                    }}
                    className="p-4 bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast rounded-lg cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border border-transparent hover:border-datacamp-brand"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                          {status}
                        </h4>
                        <span className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                          Click to view →
                        </span>
                      </div>
                      <span className={`text-2xl font-bold ${colorClass.split(' ')[0]}`}>
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-datacamp-bg-tertiary dark:bg-datacamp-dark-bg-main rounded-full h-3">
                      <div
                        className={`${colorClass.split(' ')[1]} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="mt-2 text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                      {percentage}% of total customers
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'at-risk':
        const atRiskCustomers = customers?.filter((c: any) => c.health_status === 'Critical' || c.health_status === 'At-Risk') || [];
        const atRiskCount = customers?.filter((c: any) => c.health_status === 'At-Risk').length || 0;
        const criticalCount = customers?.filter((c: any) => c.health_status === 'Critical').length || 0;

        return (
          <div>
            <h3 className="text-xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-6">
              At-Risk & Critical Customers ({atRiskCustomers.length})
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                onClick={() => {
                  setInternalFilter({ type: 'health', value: 'At-Risk' });
                  setCurrentView('customers');
                }}
                className="p-4 bg-datacamp-warning/10 border border-datacamp-warning/20 rounded-lg cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:border-datacamp-warning"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">At-Risk</p>
                  <span className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Click to view →</span>
                </div>
                <p className="text-2xl font-bold text-datacamp-warning mt-2">
                  {atRiskCount}
                </p>
              </div>
              <div
                onClick={() => {
                  setInternalFilter({ type: 'health', value: 'Critical' });
                  setCurrentView('customers');
                }}
                className="p-4 bg-datacamp-red/10 border border-datacamp-red/20 rounded-lg cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:border-datacamp-red"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Critical</p>
                  <span className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Click to view →</span>
                </div>
                <p className="text-2xl font-bold text-datacamp-red mt-2">
                  {criticalCount}
                </p>
              </div>
            </div>
            <div className="overflow-auto max-h-[50vh]">
              <table className="w-full">
                <thead className="sticky top-0 bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-contrast">
                  <tr className="border-b border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                    <th className="px-4 py-3 text-left text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Customer Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Region</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-datacamp-bg-tertiary dark:divide-datacamp-dark-bg-tertiary">
                  {atRiskCustomers.map((customer: any) => (
                    <tr
                      key={customer.account_id}
                      onClick={() => handleCustomerClick(customer.account_id)}
                      className="hover:bg-datacamp-bg-secondary dark:hover:bg-datacamp-dark-bg-contrast transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                        {customer.account_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                        {customer.region}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.health_status === 'At-Risk'
                              ? 'bg-datacamp-warning/10 text-datacamp-warning border border-datacamp-warning/20'
                              : 'bg-datacamp-red/10 text-datacamp-red border border-datacamp-red/20'
                          }`}
                        >
                          {customer.health_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">No data available</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-xl shadow-2xl w-full max-w-4xl border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
            <div className="flex items-center gap-3">
              {(selectedCustomerId || ((metric === 'health' || metric === 'at-risk') && currentView === 'customers')) && (
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg hover:bg-datacamp-bg-secondary dark:hover:bg-datacamp-dark-bg-contrast transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle" />
                </button>
              )}
              <h2 className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                {selectedCustomerId ? 'Customer Profile' : currentView === 'health' ? 'Health Score Distribution' : currentView === 'at-risk' ? 'At-Risk & Critical Customers' : currentView === 'customers' ? 'Customer Details' : 'Metric Details'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-datacamp-bg-secondary dark:hover:bg-datacamp-dark-bg-contrast transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
