import { X, TrendingUp, TrendingDown, Calendar, DollarSign, AlertTriangle, Users, Activity, FileText, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from 'react-query';
import { getCustomer360, getCustomerTimeline, getCustomerOpportunities, getCustomerTickets, getCustomerInvoices } from '../api/customer360';

interface MetricDrillDownModalProps {
  customerId: string;
  metricKey: string;
  metricTitle: string;
  metricValue: any;
  onClose: () => void;
}

export default function MetricDrillDownModal({
  customerId,
  metricKey,
  metricTitle,
  metricValue,
  onClose
}: MetricDrillDownModalProps) {
  const { data: customer } = useQuery(['customer', customerId], () => getCustomer360(customerId));
  const { data: timeline } = useQuery(['timeline', customerId], () => getCustomerTimeline(customerId));
  const { data: opportunities } = useQuery(['opportunities', customerId], () => getCustomerOpportunities(customerId));
  const { data: tickets } = useQuery(['tickets', customerId], () => getCustomerTickets(customerId));
  const { data: invoices } = useQuery(['invoices', customerId], () => getCustomerInvoices(customerId));

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

  const formatPercent = (value: number) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const renderMetricDetails = () => {
    if (!customer) return null;

    switch (metricKey) {
      // Financial Metrics
      case 'customer_lifetime_value':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-3xl font-bold text-blue-900">{formatCurrency(customer.customer_lifetime_value)}</h3>
              <p className="text-sm text-blue-600 mt-1">Total Lifetime Value</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-600">Won Opportunities</p>
                <p className="text-2xl font-bold mt-1">{customer.won_opportunities}</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-600">Average Deal Size</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(customer.avg_deal_size)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Revenue Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Annual Revenue (Current Year)</span>
                  <span className="font-semibold">{formatCurrency(customer.annual_revenue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Previous Year Revenue</span>
                  <span className="font-semibold">{formatCurrency(customer.previous_year_revenue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Monthly Recurring Revenue</span>
                  <span className="font-semibold">{formatCurrency(customer.monthly_recurring_revenue)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Growth Indicators</h4>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                {customer.yoy_growth >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
                <div className="text-right">
                  <p className="text-sm text-gray-600">Year-over-Year Growth</p>
                  <p className={`text-2xl font-bold ${customer.yoy_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {customer.yoy_growth >= 0 ? '+' : ''}{customer.yoy_growth?.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'annual_revenue':
      case 'monthly_recurring_revenue':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-3xl font-bold text-green-900">{metricValue}</h3>
              <p className="text-sm text-green-600 mt-1">{metricTitle}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Revenue Trend Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Current Year</span>
                  <span className="font-semibold">{formatCurrency(customer.annual_revenue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Previous Year</span>
                  <span className="font-semibold">{formatCurrency(customer.previous_year_revenue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-sm font-medium">Growth</span>
                  <span className={`font-bold ${customer.yoy_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {customer.yoy_growth >= 0 ? '+' : ''}{formatPercent(customer.yoy_growth)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Quarterly Breakdown</h4>
              {customer.quarterly_revenue && JSON.parse(customer.quarterly_revenue).map((rev: number, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded mb-2">
                  <span className="text-sm">Q{idx + 1}</span>
                  <span className="font-semibold">{formatCurrency(rev)}</span>
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Cost to Serve:</strong> {formatCurrency(customer.total_cost_to_serve)}
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                <strong>Profit Margin:</strong> {formatPercent(customer.profit_margin)}
              </p>
            </div>
          </div>
        );

      case 'retention_probability':
        return (
          <div className="space-y-6">
            <div className={`rounded-lg p-6 ${customer.retention_probability >= 80 ? 'bg-green-50' : 'bg-orange-50'}`}>
              <h3 className={`text-3xl font-bold ${customer.retention_probability >= 80 ? 'text-green-900' : 'text-orange-900'}`}>
                {formatPercent(customer.retention_probability)}
              </h3>
              <p className="text-sm mt-1">Likelihood of Renewal</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Contributing Factors</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Churn Risk Level</span>
                  <span className={`font-semibold px-3 py-1 rounded ${
                    customer.churn_risk_level === 'HIGH' ? 'bg-red-100 text-red-800' :
                    customer.churn_risk_level === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {customer.churn_risk_level}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Health Status</span>
                  <span className={`font-semibold px-3 py-1 rounded ${
                    customer.health_status === 'Healthy' ? 'bg-green-100 text-green-800' :
                    customer.health_status === 'At-Risk' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {customer.health_status}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Days to Renewal</span>
                  <span className={`font-semibold ${customer.days_to_renewal < 90 ? 'text-orange-600' : 'text-gray-900'}`}>
                    {customer.days_to_renewal} days
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Engagement Signals</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-lg border-2 ${customer.qbr_scheduled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <p className="text-xs text-gray-600">QBR Scheduled</p>
                  <p className={`text-lg font-bold mt-1 ${customer.qbr_scheduled ? 'text-green-700' : 'text-gray-500'}`}>
                    {customer.qbr_scheduled ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border-2 ${customer.executive_sponsor_engaged ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <p className="text-xs text-gray-600">Exec Sponsor</p>
                  <p className={`text-lg font-bold mt-1 ${customer.executive_sponsor_engaged ? 'text-green-700' : 'text-gray-500'}`}>
                    {customer.executive_sponsor_engaged ? 'Engaged' : 'Not Engaged'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pipeline_value':
      case 'open_opportunities':
        const openOpps = opportunities?.filter((opp: any) => !opp.is_closed) || [];
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-3xl font-bold text-purple-900">{metricKey === 'pipeline_value' ? formatCurrency(customer.pipeline_value) : customer.open_opportunities}</h3>
              <p className="text-sm text-purple-600 mt-1">{metricTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-600">Open Opportunities</p>
                <p className="text-2xl font-bold mt-1">{customer.open_opportunities}</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Pipeline Value</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(customer.pipeline_value)}</p>
              </div>
            </div>

            {/* Detailed Opportunity List */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center justify-between">
                <span>Open Opportunities ({openOpps.length})</span>
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {openOpps.length > 0 ? openOpps.map((opp: any) => (
                  <div key={opp.opportunity_id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">{opp.opportunity_name}</h5>
                        <p className="text-sm text-gray-500">{opp.product_line}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">{formatCurrency(opp.deal_value)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opp.stage === 'Negotiation' ? 'bg-blue-100 text-blue-800' :
                        opp.stage === 'Proposal' ? 'bg-purple-100 text-purple-800' :
                        opp.stage === 'Qualification' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {opp.stage}
                      </span>
                      <span className="text-gray-600">{formatPercent(opp.win_probability * 100)} win probability</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">No open opportunities</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Sales Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Win Rate</span>
                  <span className="font-semibold text-green-600">{formatPercent(customer.win_rate)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Average Deal Size</span>
                  <span className="font-semibold">{formatCurrency(customer.avg_deal_size)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Avg Sales Cycle</span>
                  <span className="font-semibold">{customer.avg_sales_cycle_days?.toFixed(0)} days</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'open_tickets':
      case 'total_tickets':
        const openTickets = tickets?.filter((t: any) => t.status !== 'Resolved' && t.status !== 'Closed') || [];
        return (
          <div className="space-y-6">
            <div className={`rounded-lg p-6 ${customer.open_tickets > 5 ? 'bg-red-50' : 'bg-green-50'}`}>
              <h3 className={`text-3xl font-bold ${customer.open_tickets > 5 ? 'text-red-900' : 'text-green-900'}`}>
                {metricKey === 'open_tickets' ? customer.open_tickets : customer.total_tickets}
              </h3>
              <p className="text-sm mt-1">{metricTitle}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Open</p>
                <p className={`text-2xl font-bold mt-1 ${customer.open_tickets > 5 ? 'text-red-600' : 'text-gray-900'}`}>
                  {customer.open_tickets}
                </p>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Closed</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{customer.closed_tickets}</p>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold mt-1">{customer.total_tickets}</p>
              </div>
            </div>

            {/* Detailed Ticket List */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center justify-between">
                <span>Open Tickets ({openTickets.length})</span>
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {openTickets.length > 0 ? openTickets.map((ticket: any) => (
                  <div key={ticket.ticket_id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">{ticket.subject}</h5>
                        <p className="text-sm text-gray-500">{ticket.category}</p>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'In Progress' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </span>
                      <span className="text-gray-600">
                        {new Date(ticket.created_date).toLocaleDateString()}
                        {ticket.is_sla_violated && <span className="ml-2 text-red-600 font-medium">SLA Violated</span>}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">No open tickets</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Service Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Avg Response Time</span>
                  <span className={`font-semibold ${customer.avg_response_time_hours < 2 ? 'text-green-600' : 'text-orange-600'}`}>
                    {customer.avg_response_time_hours?.toFixed(1)} hours
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Avg Resolution Time</span>
                  <span className="font-semibold">{customer.avg_resolution_time_hours?.toFixed(1)} hours</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">SLA Compliance</span>
                  <span className={`font-semibold ${customer.sla_compliance_pct >= 95 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(customer.sla_compliance_pct)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Recurring Issues</span>
                  <span className={`font-semibold ${customer.recurring_issues_count > 2 ? 'text-red-600' : 'text-green-600'}`}>
                    {customer.recurring_issues_count}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Customer Satisfaction</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700">CSAT Score</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{customer.csat_score?.toFixed(1)}/5.0</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-700">NPS Score</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{customer.nps_score}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'overdue_invoices':
      case 'overdue_amount':
        const overdueInvoices = invoices?.filter((inv: any) => inv.status === 'Overdue' || inv.overdue_days > 0) || [];
        return (
          <div className="space-y-6">
            <div className={`rounded-lg p-6 ${customer.overdue_amount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <h3 className={`text-3xl font-bold ${customer.overdue_amount > 0 ? 'text-red-900' : 'text-green-900'}`}>
                {metricKey === 'overdue_invoices' ? customer.overdue_invoices : formatCurrency(customer.overdue_amount)}
              </h3>
              <p className="text-sm mt-1">{metricTitle}</p>
            </div>

            {customer.credit_hold && (
              <div className="bg-red-100 border-l-4 border-red-500 p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm font-semibold text-red-800">ACCOUNT ON CREDIT HOLD</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Overdue Invoices</p>
                <p className={`text-2xl font-bold mt-1 ${customer.overdue_invoices > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {customer.overdue_invoices}
                </p>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Amount</p>
                <p className={`text-xl font-bold mt-1 ${customer.overdue_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(customer.overdue_amount)}
                </p>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Days Overdue</p>
                <p className={`text-2xl font-bold mt-1 ${customer.days_overdue > 30 ? 'text-red-600' : customer.days_overdue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {customer.days_overdue}
                </p>
              </div>
            </div>

            {/* Detailed Invoice List */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center justify-between">
                <span>Overdue Invoices ({overdueInvoices.length})</span>
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {overdueInvoices.length > 0 ? overdueInvoices.map((invoice: any) => (
                  <div key={invoice.invoice_id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">{invoice.invoice_number}</h5>
                        <p className="text-sm text-gray-500">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{formatCurrency(invoice.balance)}</p>
                        <p className="text-xs text-gray-500">of {formatCurrency(invoice.invoice_amount)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        invoice.overdue_days > 60 ? 'bg-red-100 text-red-800' :
                        invoice.overdue_days > 30 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.overdue_days} days overdue
                      </span>
                      <div className="text-gray-600">
                        {invoice.disputed && <span className="text-orange-600 font-medium">⚠ Disputed</span>}
                        {!invoice.disputed && <span>{invoice.status}</span>}
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">No overdue invoices</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Payment Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Payment Terms</span>
                  <span className="font-semibold">{customer.payment_terms}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Disputed Invoices</span>
                  <span className={`font-semibold ${customer.disputed_invoices > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                    {customer.disputed_invoices}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Billing Accuracy</span>
                  <span className={`font-semibold ${customer.billing_accuracy_pct >= 98 ? 'text-green-600' : 'text-orange-600'}`}>
                    {formatPercent(customer.billing_accuracy_pct)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Credit Hold Status</span>
                  <span className={`font-semibold ${customer.credit_hold ? 'text-red-600' : 'text-green-600'}`}>
                    {customer.credit_hold ? 'ON HOLD' : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-blue-900">Annual Revenue Context</h4>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(customer.annual_revenue)}</p>
              <p className="text-xs text-blue-700 mt-1">
                Outstanding represents {((customer.overdue_amount / customer.annual_revenue) * 100).toFixed(1)}% of annual revenue
              </p>
            </div>
          </div>
        );

      case 'days_to_renewal':
      case 'upcoming_renewals_count':
        return (
          <div className="space-y-6">
            <div className={`rounded-lg p-6 ${customer.days_to_renewal < 90 ? 'bg-orange-50' : 'bg-green-50'}`}>
              <h3 className={`text-3xl font-bold ${customer.days_to_renewal < 90 ? 'text-orange-900' : 'text-green-900'}`}>
                {metricKey === 'days_to_renewal' ? `${customer.days_to_renewal} days` : customer.upcoming_renewals_count}
              </h3>
              <p className="text-sm mt-1">{metricTitle}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Contract Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Contract End Date</span>
                  <span className="font-semibold">{new Date(customer.contract_end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Days Until Renewal</span>
                  <span className={`font-semibold ${customer.days_to_renewal < 90 ? 'text-orange-600' : 'text-gray-900'}`}>
                    {customer.days_to_renewal}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Upcoming Renewals</span>
                  <span className="font-semibold">{customer.upcoming_renewals_count}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Renewal Value</span>
                  <span className="font-semibold text-green-600">{formatCurrency(customer.upcoming_renewal_value)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Renewal Health Indicators</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Retention Probability</span>
                  <span className={`font-semibold ${customer.retention_probability >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                    {formatPercent(customer.retention_probability)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Churn Risk</span>
                  <span className={`font-semibold px-3 py-1 rounded ${
                    customer.churn_risk_level === 'HIGH' ? 'bg-red-100 text-red-800' :
                    customer.churn_risk_level === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {customer.churn_risk_level}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Last Interaction</span>
                  <span className={`font-semibold ${customer.last_interaction_days > 60 ? 'text-red-600' : customer.last_interaction_days > 30 ? 'text-orange-600' : 'text-green-600'}`}>
                    {customer.last_interaction_days} days ago
                  </span>
                </div>
              </div>
            </div>

            {customer.days_to_renewal < 90 && (
              <div className="bg-orange-100 border-l-4 border-orange-500 p-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                  <div>
                    <p className="text-sm font-semibold text-orange-800">Renewal Action Required</p>
                    <p className="text-xs text-orange-700 mt-1">Contract expires in {customer.days_to_renewal} days - Schedule renewal discussion immediately</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'nps_score':
      case 'csat_score':
        return (
          <div className="space-y-6">
            <div className={`rounded-lg p-6 ${
              (metricKey === 'nps_score' && customer.nps_score >= 50) || (metricKey === 'csat_score' && customer.csat_score >= 4)
                ? 'bg-green-50' : 'bg-orange-50'
            }`}>
              <h3 className={`text-3xl font-bold ${
                (metricKey === 'nps_score' && customer.nps_score >= 50) || (metricKey === 'csat_score' && customer.csat_score >= 4)
                  ? 'text-green-900' : 'text-orange-900'
              }`}>
                {metricKey === 'nps_score' ? customer.nps_score : `${customer.csat_score?.toFixed(1)}/5.0`}
              </h3>
              <p className="text-sm mt-1">{metricTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-lg p-4 ${customer.nps_score >= 50 ? 'bg-green-50' : customer.nps_score >= 0 ? 'bg-orange-50' : 'bg-red-50'}`}>
                <p className="text-sm text-gray-700">NPS Score</p>
                <p className={`text-2xl font-bold mt-1 ${customer.nps_score >= 50 ? 'text-green-700' : customer.nps_score >= 0 ? 'text-orange-700' : 'text-red-700'}`}>
                  {customer.nps_score}
                </p>
                <p className="text-xs mt-1 text-gray-600">
                  {customer.nps_score >= 50 ? 'Promoter' : customer.nps_score >= 0 ? 'Passive' : 'Detractor'}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${customer.csat_score >= 4 ? 'bg-green-50' : 'bg-orange-50'}`}>
                <p className="text-sm text-gray-700">CSAT Score</p>
                <p className={`text-2xl font-bold mt-1 ${customer.csat_score >= 4 ? 'text-green-700' : 'text-orange-700'}`}>
                  {customer.csat_score?.toFixed(1)}/5.0
                </p>
                <p className="text-xs mt-1 text-gray-600">
                  {customer.csat_score >= 4 ? 'Satisfied' : 'Needs Attention'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Satisfaction Drivers</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Health Status</span>
                  <span className={`font-semibold px-3 py-1 rounded ${
                    customer.health_status === 'Healthy' ? 'bg-green-100 text-green-800' :
                    customer.health_status === 'At-Risk' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {customer.health_status}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">SLA Compliance</span>
                  <span className={`font-semibold ${customer.sla_compliance_pct >= 95 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(customer.sla_compliance_pct)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Response Time</span>
                  <span className={`font-semibold ${customer.avg_response_time_hours < 2 ? 'text-green-600' : 'text-orange-600'}`}>
                    {customer.avg_response_time_hours?.toFixed(1)} hours
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Recurring Issues</span>
                  <span className={`font-semibold ${customer.recurring_issues_count > 2 ? 'text-red-600' : 'text-green-600'}`}>
                    {customer.recurring_issues_count}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Engagement</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-lg ${customer.qbr_scheduled ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
                  <p className="text-xs text-gray-600">QBR Scheduled</p>
                  <p className={`text-lg font-bold mt-1 ${customer.qbr_scheduled ? 'text-green-700' : 'text-gray-500'}`}>
                    {customer.qbr_scheduled ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${customer.executive_sponsor_engaged ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
                  <p className="text-xs text-gray-600">Exec Engaged</p>
                  <p className={`text-lg font-bold mt-1 ${customer.executive_sponsor_engaged ? 'text-green-700' : 'text-gray-500'}`}>
                    {customer.executive_sponsor_engaged ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'health_score':
      case 'churn_risk_score':
        return (
          <div className="space-y-6">
            <div className={`rounded-lg p-6 ${
              (metricKey === 'health_score' && customer.health_score >= 80) || (metricKey === 'churn_risk_score' && customer.churn_risk_score < 30)
                ? 'bg-green-50' : 'bg-orange-50'
            }`}>
              <h3 className={`text-3xl font-bold ${
                (metricKey === 'health_score' && customer.health_score >= 80) || (metricKey === 'churn_risk_score' && customer.churn_risk_score < 30)
                  ? 'text-green-900' : 'text-orange-900'
              }`}>
                {metricKey === 'health_score' ? `${customer.health_score?.toFixed(0)}/100` : `${customer.churn_risk_score}/100`}
              </h3>
              <p className="text-sm mt-1">{metricTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-lg p-4 ${
                customer.health_status === 'Healthy' ? 'bg-green-50' :
                customer.health_status === 'At-Risk' ? 'bg-orange-50' : 'bg-red-50'
              }`}>
                <p className="text-sm text-gray-700">Health Status</p>
                <p className={`text-xl font-bold mt-1 ${
                  customer.health_status === 'Healthy' ? 'text-green-700' :
                  customer.health_status === 'At-Risk' ? 'text-orange-700' : 'text-red-700'
                }`}>
                  {customer.health_status}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${
                customer.churn_risk_level === 'LOW' ? 'bg-green-50' :
                customer.churn_risk_level === 'MEDIUM' ? 'bg-orange-50' : 'bg-red-50'
              }`}>
                <p className="text-sm text-gray-700">Churn Risk</p>
                <p className={`text-xl font-bold mt-1 ${
                  customer.churn_risk_level === 'LOW' ? 'text-green-700' :
                  customer.churn_risk_level === 'MEDIUM' ? 'text-orange-700' : 'text-red-700'
                }`}>
                  {customer.churn_risk_level}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Key Health Indicators</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Revenue Growth (YoY)</span>
                  <span className={`font-semibold ${customer.yoy_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {customer.yoy_growth >= 0 ? '+' : ''}{formatPercent(customer.yoy_growth)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">NPS Score</span>
                  <span className={`font-semibold ${customer.nps_score >= 50 ? 'text-green-600' : customer.nps_score >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {customer.nps_score}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Open Support Tickets</span>
                  <span className={`font-semibold ${customer.open_tickets > 5 ? 'text-red-600' : 'text-green-600'}`}>
                    {customer.open_tickets}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">Payment Status</span>
                  <span className={`font-semibold ${customer.overdue_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {customer.overdue_amount > 0 ? `Overdue: ${formatCurrency(customer.overdue_amount)}` : 'Current'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Risk Factors</h4>
              <div className="space-y-2">
                {customer.yoy_growth < 0 && (
                  <div className="flex items-start p-3 bg-red-50 border-l-4 border-red-400 rounded">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Declining Revenue</p>
                      <p className="text-xs text-red-700">YoY growth is {formatPercent(customer.yoy_growth)}</p>
                    </div>
                  </div>
                )}
                {customer.last_interaction_days > 60 && (
                  <div className="flex items-start p-3 bg-orange-50 border-l-4 border-orange-400 rounded">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800">Low Engagement</p>
                      <p className="text-xs text-orange-700">Last interaction was {customer.last_interaction_days} days ago</p>
                    </div>
                  </div>
                )}
                {customer.recurring_issues_count > 2 && (
                  <div className="flex items-start p-3 bg-orange-50 border-l-4 border-orange-400 rounded">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800">Recurring Issues</p>
                      <p className="text-xs text-orange-700">{customer.recurring_issues_count} systemic problems detected</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900">{metricValue}</h3>
              <p className="text-sm text-gray-600 mt-1">{metricTitle}</p>
            </div>
            <p className="text-sm text-gray-500">Detailed analytics for this metric coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{metricTitle}</h2>
            <p className="text-sm text-gray-500 mt-1">{customer?.account_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {renderMetricDetails()}
        </div>
      </div>
    </div>
  );
}
