# Persona-Based Metrics Mapping

This document maps the persona-based questions from the README to the specific metrics and dashboard views that answer them.

---

## 🏢 Board Chairman (Strategic Oversight)

### Dashboard View: "Board Chairman"
**Access**: Click "Board Chairman" tab in the persona selector

### Questions & Metrics Mapping:

| Question | Metric/View | Location |
|----------|-------------|----------|
| 1. What is our overall customer retention rate? | `retention_probability` | Board View - Strategic Metrics |
| 2. Who are our top 10 revenue generating customers? | `annual_revenue` (sorted) | API: `/api/dashboard/summary` - top_revenue_customers |
| 3. Revenue concentration risk? | `revenue_concentration` | Board View - Strategic Metrics |
| 4. Segment profitability vs churn risk? | `profit_margin`, `churn_risk_level` | Board View - Risk Assessment |
| 5. Customer satisfaction impact? | `nps_score`, `health_status` | Board View - 3-Year Revenue Trend |

### Key Metrics Displayed:
- **Customer Lifetime Value**: Total revenue potential
- **Retention Probability**: Likelihood of renewal
- **Revenue Concentration**: % of total revenue from this customer
- **Profit Margin**: Profitability of serving this customer
- **3-Year Revenue Trend**: Visual chart showing growth trajectory
- **Risk Assessment**: Churn risk, health status, contract renewal timeline

---

## 💼 CEO (Growth & Business Strategy)

### Dashboard View: "CEO"
**Access**: Click "CEO" tab in the persona selector

### Questions & Metrics Mapping:

| Question | Metric/View | Location |
|----------|-------------|----------|
| 1. Which segments are growing fastest? | `yoy_growth`, `region` | CEO View - Annual Revenue card with YoY growth |
| 2. What is customer LTV? | `customer_lifetime_value` | CEO View - Financial Metrics (calculated per region/product) |
| 3. Churn correlation analysis? | `churn_risk_score`, `pricing`, `service quality` | CEO View - NPS Score & Growth Metrics |
| 4. Cross-sell/upsell potential? | `pipeline_value`, `active_services` | CEO View - Growth Opportunities |
| 5. NPS impact on financial performance? | `nps_score`, `annual_revenue`, `profit_margin` | CEO View - Strategic Metrics |

### Key Metrics Displayed:
- **Annual Revenue**: Current year revenue with YoY comparison
- **YoY Growth**: Year-over-year growth percentage
- **NPS Score**: Net Promoter Score with color coding
- **Active Services**: Number of products/services used
- **Quarterly Revenue Performance**: Visual chart of last 4 quarters
- **Cross-sell Potential**: Pipeline value and open opportunities
- **Customer Segment**: Region and profit margin

---

## ⚙️ Operational Personnel (Efficiency & Execution)

### Dashboard View: "Operations"
**Access**: Click "Operations" tab in the persona selector

### Questions & Metrics Mapping:

| Question | Metric/View | Location |
|----------|-------------|----------|
| 1. Most frequent service/product issues? | `recurring_issues_count`, `total_tickets` | Operations View - Open Tickets |
| 2. Process delays in onboarding/delivery? | `avg_sales_cycle_days` | Operations View - Process Efficiency |
| 3. SLA target compliance? | `sla_compliance_pct` | Operations View - SLA Compliance card |
| 4. Products driving most support tickets? | `total_tickets`, `active_services` | Operations View - Support Activity |
| 5. Recurring customer issues? | `recurring_issues_count` | Operations View - Recurring Issues card |

### Key Metrics Displayed:
- **Open Tickets**: Current unresolved support cases
- **Avg Response Time**: Mean time to first response (hours)
- **SLA Compliance**: % of tickets meeting SLA targets
- **Recurring Issues**: Count of repeated problems
- **Support Activity**: Total, open, and closed tickets with resolution times
- **Process Efficiency**: Sales cycle length and service metrics

---

## 💰 Sales Personnel (Revenue Growth)

### Dashboard View: "Sales"
**Access**: Click "Sales" tab in the persona selector

### Questions & Metrics Mapping:

| Question | Metric/View | Location |
|----------|-------------|----------|
| 1. Customer pipeline stage? | `open_opportunities`, `pipeline_value` | Sales View - Pipeline Value |
| 2. Likelihood of repeat purchase? | `win_rate`, `previous purchases` | Sales View - Win Rate card |
| 3. Total revenue this quarter? | `quarterly_revenue`, `annual_revenue` | Sales View - Q Current Revenue |
| 4. Open opportunities & close probability? | `next_close_date`, `next_close_probability` | Sales View - Next Close Opportunity |
| 5. Customers who stopped purchasing? | `yoy_growth` (negative), `last_interaction_days` | Sales View - Combined with Account View |

### Key Metrics Displayed:
- **Pipeline Value**: Total value of open opportunities
- **Open Opportunities**: Number of active deals
- **Win Rate**: Historical close rate percentage
- **Avg Deal Size**: Mean value of won opportunities
- **Next Close Opportunity**: Details of upcoming close (date, value, probability)
- **Won Opportunities**: Total successfully closed deals
- **Avg Sales Cycle**: Mean time from opportunity creation to close

---

## 🎧 Service Management Personnel (Customer Experience)

### Dashboard View: "Service"
**Access**: Click "Service" tab in the persona selector

### Questions & Metrics Mapping:

| Question | Metric/View | Location |
|----------|-------------|----------|
| 1. Open service cases & status? | `open_tickets` | Service View - Open Cases card |
| 2. Average resolution time? | `avg_resolution_time_hours` | Service View - Avg Resolution Time |
| 3. Support satisfaction by product/region/agent? | `csat_score`, `sla_compliance_pct` | Service View - CSAT Score |
| 4. Recurring service problems? | `recurring_issues_count` | Service View - Ticket Summary |
| 5. VIP accounts needing urgent attention? | `annual_revenue`, `open_tickets` | Service View - VIP Account Alert |

### Key Metrics Displayed:
- **Open Cases**: Current open support tickets
- **Avg Resolution Time**: Mean time to resolve issues
- **CSAT Score**: Customer satisfaction rating (1-5 scale)
- **SLA Compliance**: Percentage meeting service level targets
- **Ticket Summary**: Open, closed, total, and recurring issues
- **Response Metrics**: Average response and resolution times
- **VIP Alert**: Special notification for high-value accounts

---

## 💳 Billing Personnel (Financial Accuracy)

### Dashboard View: "Billing"
**Access**: Click "Billing" tab in the persona selector

### Questions & Metrics Mapping:

| Question | Metric/View | Location |
|----------|-------------|----------|
| 1. Overdue invoices & duration? | `overdue_invoices`, `days_overdue` | Billing View - Overdue Invoices & Days Overdue |
| 2. Outstanding receivables by segment? | `overdue_amount`, `region` | Billing View - Outstanding Receivables |
| 3. Invoice disputes/adjustments? | `disputed_invoices` | Billing View - Payment Status |
| 4. Customers on credit hold & impact? | `credit_hold`, `overdue_amount` | Billing View - Credit Hold Warning |
| 5. Billing accuracy rate? | `billing_accuracy_pct` | Billing View - Billing Accuracy card |

### Key Metrics Displayed:
- **Overdue Invoices**: Count of unpaid invoices past due date
- **Overdue Amount**: Total outstanding receivables
- **Days Overdue**: Number of days past payment terms
- **Billing Accuracy**: Percentage of error-free invoices
- **Payment Status**: Payment terms, disputed invoices, credit hold status
- **Outstanding Receivables**: Large visual display of total owed
- **Credit Hold Warning**: Alert banner when account is on hold

---

## 👤 Account Management Personnel (Relationship & Retention)

### Dashboard View: "Account Mgmt"
**Access**: Click "Account Mgmt" tab in the persona selector

### Questions & Metrics Mapping:

| Question | Metric/View | Location |
|----------|-------------|----------|
| 1. Complete interaction history? | `customer_timeline` (API endpoint) | Account View - Combined with Timeline |
| 2. Customers at risk of churn? | `churn_risk_level`, `churn_risk_score` | Account View - Churn Risk Alert |
| 3. Renewal opportunities (3-6 months)? | `days_to_renewal`, `upcoming_renewals_count` | Account View - Days to Renewal & Renewal Status |
| 4. Customer feedback? | `nps_score`, `csat_score` | Account View - NPS Score card |
| 5. Cross-sell/upsell opportunities? | `pipeline_value`, `active_services` | Account View - Engagement Metrics |

### Key Metrics Displayed:
- **Days to Renewal**: Time until contract expiration
- **Retention Probability**: Likelihood of contract renewal
- **NPS Score**: Customer loyalty metric
- **Last Interaction**: Days since last contact
- **Renewal Status**: Contract end date, upcoming renewals count and value
- **Engagement Metrics**: QBR status, executive sponsor engagement, CSAT
- **Churn Risk Alert**: Warning banner for high-risk accounts
- **Renewal Opportunity Alert**: Notification for contracts expiring within 90 days

---

## 📊 Summary of All Metrics by Persona Priority

### Financial Metrics (Board, CEO, Billing)
- `customer_lifetime_value` - Total revenue potential
- `annual_revenue` - Current year revenue
- `monthly_recurring_revenue` - MRR
- `previous_year_revenue` - Prior year comparison
- `yoy_growth` - Year-over-year growth %
- `quarterly_revenue` - Last 4 quarters breakdown
- `three_year_revenue` - 3-year trend data
- `revenue_concentration` - % of total company revenue
- `profit_margin` - Profitability %
- `total_cost_to_serve` - Cost to maintain account

### Sales Metrics (Sales Personnel)
- `active_services` - Number of products/services
- `win_rate` - Opportunity close rate %
- `total_opportunities` - All opportunities count
- `won_opportunities` - Successfully closed deals
- `open_opportunities` - Active pipeline deals
- `pipeline_value` - Total open deal value
- `next_close_date` - Upcoming close date
- `next_close_value` - Next deal value
- `next_close_probability` - Win likelihood %
- `avg_deal_size` - Mean deal value
- `avg_sales_cycle_days` - Mean days to close

### Operational/Support Metrics (Operations, Service Management)
- `open_tickets` - Current unresolved cases
- `closed_tickets` - Resolved cases count
- `total_tickets` - All tickets count
- `avg_resolution_time_hours` - Mean resolution time
- `avg_response_time_hours` - Mean first response time
- `sla_compliance_pct` - SLA adherence %
- `recurring_issues_count` - Repeated problems count

### Billing Metrics (Billing Personnel)
- `overdue_invoices` - Count of late invoices
- `overdue_amount` - Total outstanding $
- `days_overdue` - Days past payment terms
- `disputed_invoices` - Contested invoice count
- `credit_hold` - Boolean - account on hold
- `billing_accuracy_pct` - Error-free invoice %
- `payment_terms` - Contract payment terms

### Account Management Metrics (Account Management Personnel)
- `upcoming_renewals_count` - Renewals in next 6 months
- `upcoming_renewal_value` - Total renewal $
- `days_to_renewal` - Days until contract end
- `contract_end_date` - Contract expiration date
- `nps_score` - Net Promoter Score
- `csat_score` - Customer satisfaction (1-5)
- `last_interaction_days` - Days since last contact
- `qbr_scheduled` - Boolean - QBR scheduled
- `executive_sponsor_engaged` - Boolean - sponsor active
- `retention_probability` - Likelihood of renewal %

### Risk/Health Metrics (All Personas)
- `health_score` - Overall customer health (0-100)
- `health_status` - Healthy/At-Risk/Critical
- `churn_risk_score` - Churn likelihood (0-100)
- `churn_risk_level` - HIGH/MEDIUM/LOW

---

## 🚀 How to Use This Mapping

### For Users:
1. **Identify your role** from the persona list
2. **Click your persona tab** in the dashboard
3. **View metrics** relevant to your questions
4. **Drill down** into specific customers using the search

### For Developers:
1. **Map new questions** to existing metrics or create new ones
2. **Update gold layer** (`scripts/aggregate_gold.py`) to calculate new metrics
3. **Update dashboard** (`PersonaDashboard.tsx`) to display new metrics
4. **Test end-to-end** by regenerating data and viewing in UI

### API Endpoints for Each Persona:
- **All Personas**: `GET /api/customer/<account_id>` - Returns all metrics
- **Board/CEO**: `GET /api/dashboard/summary` - Executive summary
- **Sales/Account**: `GET /api/customer/<account_id>/recommendations` - Next best actions
- **Service**: `GET /api/customer/<account_id>/alerts` - Risk alerts
- **All**: `GET /api/customer/<account_id>/timeline` - Customer journey history

---

## 📝 Notes

- All simulated metrics (tickets, NPS, etc.) will be replaced with actual data sources in production
- Metrics are recalculated daily via the gold layer aggregation script
- Dashboard caches data for 5 minutes to improve performance
- Color coding: 🟢 Green = Good, 🟠 Orange = Warning, 🔴 Red = Critical

---

**Last Updated**: October 2025
**Version**: 2.0 - Persona-Based Views
