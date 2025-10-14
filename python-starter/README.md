# Customer 360° View

> **B2B Telco Customer Intelligence Platform**  
> A comprehensive lakehouse-powered solution delivering unified customer insights, predictive analytics, and actionable recommendations for enterprise telecommunications.

---

## 🎯 Vision

Transform fragmented Salesforce data into a unified, intelligent customer view that empowers executives and account managers with:
- **Real-time risk detection** and proactive alerts
- **AI-powered recommendations** for next-best actions
- **Executive-ready visualizations** with actionable insights
- **Cross-regional intelligence** with unified account views

## ✨ Key Features

### 📊 Unified Customer Dashboard
- **360° Customer Profile**: Comprehensive view including revenue, growth metrics, and customer health scores
- **Key Performance Indicators**: 
  - Customer Lifetime Value (CLV)
  - Monthly Recurring Revenue (MRR)
  - Active Services count
  - Support ticket volume and response times
  - Year-over-Year growth tracking

### 🚨 Risk Alerts & Warnings
- **Churn Risk Detection**: Identify customers at risk based on usage patterns and engagement
- **SLA Breach Monitoring**: Real-time alerts for service level violations
- **Payment Risk Tracking**: Overdue invoices and credit limit warnings
- **Usage Anomalies**: Spike detection for unusual data consumption patterns
- **Contract Renewal Tracking**: Proactive notifications for approaching renewals

### 🎯 Recommended Next Best Actions
Intelligent, prioritized recommendations with:
- **Risk-based prioritization** (HIGH/MEDIUM/LOW)
- **Actionable outcomes**: Schedule calls, send reminders, discuss upgrades
- **Expected impact metrics**: Retention rates, revenue potential, satisfaction scores
- **Category tagging**: Retention, Growth, Support, Billing

### 📅 Customer Journey Timeline
Comprehensive event tracking:
- Contract renewals and milestones
- Support incidents and resolutions
- Billing activities and payment history
- Usage pattern changes
- Quarterly business reviews
- Escalations and critical events

### 🌍 Multi-Regional Intelligence
- **Cross-border account linking**: Unified view of Group and regional accounts
- **Multi-currency normalization**: All financials converted to USD for accurate comparisons
- **Regional performance insights**: Compare metrics across South Africa, Group, and other markets

---

## 🏗️ Architecture

### Data Pipeline: Bronze → Silver → Gold

```
┌─────────────┐
│  Salesforce │
│   (Source)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│     Bronze Layer (Raw Data)         │
│  • account                          │
│  • opportunity                      │
│  • opportunity_line_item            │
│  • end_user                         │
└──────┬──────────────────────────────┘
       │ JSON Config Mapping
       ▼
┌─────────────────────────────────────┐
│   Silver Layer (Cleansed Data)      │
│  • Standardized columns             │
│  • Data quality checks              │
│  • Business logic applied           │
└──────┬──────────────────────────────┘
       │ Aggregation & Enrichment
       ▼
┌─────────────────────────────────────┐
│    Gold Layer (Analytics-Ready)     │
│  • Customer 360 metrics             │
│  • Risk scores                      │
│  • Recommendations                  │
│  • Timeline events                  │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│           Web Dashboard             │
└─────────────────────────────────────┘
```

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Data Lake** | Lakehouse Architecture (Delta/Parquet) |
| **Source System** | Salesforce CRM |
| **ETL/Orchestration** | Notebooks with JSON Configuration |
| **Visualization** | Web UI |
| **Future: AI/ML** | Predictive analytics for churn & recommendations |

---

## 📋 Data Model

### Core Tables

#### **Account (Bronze → Silver → Gold)**
```json
{
  "account_id": "string",
  "account_name": "string",
  "account_type": "Wholesale/Enterprise/SMB",
  "region": "Group/South Africa/Kenya",
  "annual_revenue_usd": "decimal",
  "customer_since": "date",
  "risk_score": "calculated",
  "health_status": "calculated"
}
```

#### **Opportunity**
Key fields: deal_value, stage, close_date, win_probability, product_line

#### **Opportunity Line Item**
Product-level details: product_name, quantity, unit_price, discount

#### **End User**
Contact information, role, engagement metrics

### Calculated Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Customer Lifetime Value** | Total revenue potential | Sum of all historical + projected revenue |
| **Churn Risk Score** | Probability of customer leaving | ML model based on usage, support, payment patterns |
| **Health Score** | Overall customer satisfaction | Composite of NPS, usage trends, support tickets |
| **YoY Growth** | Annual revenue growth | (Current Year - Previous Year) / Previous Year |

---

## 🎨 UI/UX Design Principles

Based on stakeholder feedback emphasizing executive-level presentation:

### ✅ Do's
- **Clean & Uncluttered**: Minimize visual noise, surface only critical information
- **Actionable Insights**: Every metric should suggest an action
- **Visual Hierarchy**: Use color-coded risk levels (RED/ORANGE/GREEN)
- **Perfect Alignment**: All boxes, cards, and elements precisely aligned
- **Responsive Layout**: Optimized for desktop, tablet, and mobile
- **Contextual Actions**: "Schedule", "Execute", "Review" buttons inline with recommendations

### ❌ Don'ts
- Avoid overwhelming users with raw data tables
- No misaligned UI elements (executives notice these details)
- Don't show metrics without context or comparison
- Avoid technical jargon in executive views
- Never display inconsistent currencies without normalization

### Color Coding Strategy
- 🔴 **Red**: HIGH priority/risk - immediate action required
- 🟠 **Orange**: MEDIUM priority - schedule action
- 🟢 **Green**: LOW priority or positive trend
- 🔵 **Blue**: Informational or growth opportunities

---

## 🚀 Getting Started

### Prerequisites
```bash
✓ Salesforce API access with appropriate permissions
✓ Lakehouse platform credentials
✓ Python 3.8+ with required libraries
✓ JSON configuration files access
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd customer360-platform
```

2. **Configure Salesforce connection**
```json
{
  "salesforce": {
    "username": "your-sf-username",
    "password": "your-sf-password",
    "security_token": "your-token",
    "instance_url": "https://your-instance.salesforce.com"
  }
}
```

3. **Set up Bronze layer extraction**
```bash
python scripts/extract_bronze.py --tables account,opportunity,opportunity_line_item,end_user
```

4. **Apply Silver transformations**
```bash
python scripts/transform_silver.py --config configs/silver_mapping.json
```

5. **Generate Gold analytics**
```bash
python scripts/aggregate_gold.py --config configs/gold_metrics.json
```

6. **Launch dashboard**
```bash

# For Web UI (future)
npm install && npm run dev
```

---

## 🤖 AI Prompts for Development

Below are the prompts used to build this solution. Use these as templates for extending functionality:

### Prompt 1: Initial Bronze Layer Setup
```
Create a Python script that extracts the following Salesforce tables into a lakehouse bronze layer:
- Account
- Opportunity  
- Opportunity Line Item
- End User

Requirements:
- Use Salesforce REST API
- Save as Parquet files with 'bronze_' prefix
- Include timestamp and watermark columns
- Handle incremental loads
- Log all extraction metrics
```

### Prompt 2: JSON Configuration System
```
Design a JSON configuration file structure for mapping Salesforce columns to our silver layer schema. 

For each table, define:
- source_column: Salesforce field name
- target_column: Standardized field name  
- data_type: Target data type
- transformation: Any cleaning/standardization logic
- nullable: Whether nulls are allowed

Create separate configs for: bronze_to_silver and silver_to_gold transformations.
```

### Prompt 3: Multi-Currency Normalization
```
Build a transformation notebook that:
1. Identifies all currency fields in opportunity and account tables
2. Fetches current exchange rates for: ZAR, KES, NGN, USD, EUR
3. Converts all revenue fields to USD
4. Stores original currency and conversion rate used
5. Handles historical exchange rates for trend analysis

Handle edge cases like missing exchange rates gracefully.
```

### Prompt 4: Customer Health Score Algorithm
```
Create a customer health score algorithm (0-100) that combines:

Factors:
- Payment history: 30% weight (on-time payments, overdue invoices)
- Support tickets: 25% weight (volume, severity, resolution time)
- Usage trends: 25% weight (growing vs declining)
- Engagement: 20% weight (QBR attendance, contract renewals)

Output should categorize customers as:
- Healthy (80-100): Green
- At-Risk (50-79): Orange  
- Critical (0-49): Red

Provide SQL or Python implementation for gold layer.
```

### Prompt 5: Churn Risk Prediction
```
Design a churn risk detection system using the following signals:

High Risk Indicators:
- Usage declined >30% in last 90 days
- Multiple escalated support tickets
- Payment overdue >30 days
- No engagement in last 60 days
- Contract expiring within 90 days

Create a scoring model that outputs:
- churn_risk_score (0-100)
- risk_level (HIGH/MEDIUM/LOW)
- contributing_factors (array)
- recommended_action (text)

Implement as a notebook that runs daily and writes to gold layer.
```

### Prompt 6: Next Best Action Recommendation Engine
```
Build an intelligent recommendation engine that suggests actions based on customer state:

Rules:
IF churn_risk > 70 AND contract_expires < 90_days → "Schedule Retention Call" (HIGH)
IF usage_spike > 50% AND services < 5 → "Propose Service Upgrade" (MEDIUM)
IF payment_overdue > 15_days → "Send Payment Reminder" (MEDIUM)
IF sla_breach_count > 0 → "Technical Review Meeting" (HIGH)
IF revenue_growth > 20% → "Executive Relationship Building" (LOW)

Output format:
- recommendation_id
- customer_id  
- priority (HIGH/MEDIUM/LOW)
- action_type (Retention/Growth/Support/Billing)
- action_title
- action_description
- expected_outcome
- estimated_impact_revenue

Store in gold.recommendations table.
```

### Prompt 7: Customer Journey Timeline
```
Create a unified customer timeline view that aggregates events from:

Sources:
- Salesforce opportunities (stage changes, wins/losses)
- Support system (ticket creation, escalations, resolutions)
- Billing system (invoices, payments, credits)
- Usage database (spike detections, threshold breaches)
- Manual entries (QBRs, executive meetings)

Output schema:
- event_id
- customer_id
- event_type (RENEWAL/SUPPORT/BILLING/USAGE)
- event_title
- event_description  
- event_date
- severity (HIGH/MEDIUM/LOW/INFO)
- related_amount (if financial)
- status (OPEN/RESOLVED/SCHEDULED)

Sort chronologically and provide last 12 months by default.
```

### Prompt 8: Power BI Dashboard Design
```
Create a Power BI dashboard with the following pages:

Page 1: Executive Overview
- Total customers, revenue, growth metrics (big numbers)
- Risk distribution pie chart
- Top 10 at-risk customers table
- Revenue trend line (last 12 months)

Page 2: Customer Detail View (as shown in mockup)
- Customer header with health badges
- KPI cards: CLV, MRR, Active Services, Support Tickets, Response Time
- Risk Alerts section (scrollable list)
- Recommended Actions section (Schedule/Execute buttons)
- Customer Journey Timeline (chronological)

Page 3: Regional Analysis
- Revenue by region
- Customer count by region  
- Win rate comparison
- Product mix by region

Design requirements:
- Clean, modern aesthetic
- Color-coded risk levels
- Perfect alignment of all elements
- Interactive filters
- Drill-through capability
```

### Prompt 9: Account Linking Across Regions
```
Build a master account linking system that identifies the same customer across regions:

Matching Logic:
1. Exact company name match (normalized)
2. Same parent company ID if available
3. Fuzzy name matching (>85% similarity)
4. Shared contact emails or phone numbers
5. Manual linkage table for edge cases

Output:
- master_account_id (unique global identifier)
- regional_account_ids (array)
- confidence_score (0-100)
- linking_method (exact/fuzzy/manual)

Create gold.account_master table with consolidated metrics across all regions.
```

### Prompt 10: Web UI Dashboard (React)
```
Create a modern React web application that replicates the Lovable mockup design:

Components needed:
1. SearchBar component with autocomplete
2. CustomerHeader component (name, badges, location, revenue, growth)
3. MetricCard component (reusable for CLV, MRR, etc.)
4. AlertCard component (risk alerts with icons, priorities)
5. RecommendationCard component (actions with Schedule/Execute buttons)
6. TimelineEvent component (journey timeline items)

Tech stack:
- React 18+ with TypeScript
- TailwindCSS for styling
- Lucide icons
- Recharts for sparklines
- React Query for data fetching

API Requirements:
- GET /api/customers (search)
- GET /api/customer/:id (360 view data)
- GET /api/customer/:id/alerts
- GET /api/customer/:id/recommendations  
- GET /api/customer/:id/timeline
- POST /api/actions/:action_id/execute

Match the color scheme and layout from the mockup exactly.
```

---

## 📊 Metrics & KPIs Tracked

### Customer Metrics
- **Customer Lifetime Value (CLV)**: Total projected revenue over customer relationship
- **Monthly Recurring Revenue (MRR)**: Predictable monthly income stream
- **Annual Revenue**: Total yearly revenue per customer
- **YoY Growth**: Year-over-year revenue growth percentage
- **Active Services**: Number of active products/services

### Operational Metrics
- **Support Tickets**: Total open tickets per customer
- **Average Response Time**: Mean time to first response
- **SLA Compliance**: Percentage of tickets meeting SLA
- **Resolution Rate**: Percentage of tickets resolved within target

### Risk Metrics
- **Churn Risk Score**: 0-100 probability of customer leaving
- **Health Score**: 0-100 composite customer satisfaction
- **Payment Risk**: Days overdue, outstanding amount
- **Usage Trend**: Increasing/Stable/Declining

### Business Metrics
- **Win Rate**: Opportunity conversion percentage
- **Average Deal Size**: Mean closed-won opportunity value
- **Sales Cycle Length**: Average days from opportunity creation to close
- **Contract Renewal Rate**: Percentage of contracts successfully renewed

---

## 🛣️ Roadmap

### ✅ Phase 1: Foundation (Completed)
- [x] Bronze layer Salesforce extraction
- [x] JSON-based configuration system
- [x] Silver layer transformations
- [x] Gold layer analytics
- [x] Initial Power BI visualizations

### 🔄 Phase 2: Intelligence (Current)
- [ ] Churn risk prediction model
- [ ] Next-best-action recommendation engine
- [ ] Customer health scoring algorithm
- [ ] Multi-currency normalization
- [ ] Cross-regional account linking

### 📅 Phase 3: Automation (Next)
- [ ] Automated alert system with email notifications
- [ ] Scheduled action reminders
- [ ] API endpoints for recommendations
- [ ] Real-time data refresh
- [ ] Audit logging for all actions

### 🚀 Phase 4: Advanced Features (Future)
- [ ] AI-powered customer segmentation
- [ ] Predictive revenue forecasting
- [ ] Sentiment analysis from support tickets
- [ ] Integration with billing systems
- [ ] Mobile app for on-the-go insights
- [ ] Custom report builder
- [ ] Webhook integrations for external systems

---

## 🧪 Testing & Validation

### Data Quality Checks
```sql
-- Validate no duplicate accounts
SELECT account_id, COUNT(*) 
FROM gold.accounts 
GROUP BY account_id 
HAVING COUNT(*) > 1;

-- Ensure all revenue in USD
SELECT DISTINCT currency 
FROM gold.revenue_metrics 
WHERE currency != 'USD';

-- Check for orphaned records
SELECT * FROM gold.opportunities 
WHERE account_id NOT IN (SELECT account_id FROM gold.accounts);
```

### Performance Benchmarks
- Bronze extraction: < 5 minutes for 4 tables
- Silver transformation: < 10 minutes
- Gold aggregation: < 15 minutes
- Dashboard refresh: < 30 seconds
- API response time: < 200ms (p95)

---

## 👥 Team & Contributors

### Core Team
- **Robert** - Data Engineering Lead
  - Pipeline architecture
  - ETL development
  
- **Hari** - Product & Architecture
  - User experience design
  - Requirements gathering
  - AI/ML strategy
  
- **Charl** - Business Requirements
  - Salesforce expertise
  - Metric definitions
  - Stakeholder liaison

### Stakeholders
- Account Managers (primary users)
- C-Level Executives (strategic insights)
- Operations Team (daily monitoring)
- Finance Team (revenue analytics)

---

### Customer 360 Dashboard – Persona-Based Questions
#### Board Chairman (Strategic Oversight)
1.	What is our overall customer retention rate across all regions and products?
2.	Who are our top 10 revenue generating customers, and how has their value trended over the past 3 years?
3.	What percentage of revenue is concentrated among our top 5 customers, and what risks does this pose?
4.	Which customer segments are showing the highest long-term profitability versus churn risk?
5.	How is customer satisfaction impacting shareholder value and brand reputation?

#### CEO (Growth & Business Strategy)
1.	Which customer segments are growing the fastest, and how do they align with our strategic goals?
2.	What is the lifetime value (LTV) of our average customer, and how does this compare across regions or product lines?
3.	How does customer churn correlate with pricing changes, service quality, or competitor activity?
4.	Which accounts have the highest potential for cross-sell or upsell?
5.	How do our NPS (Net Promoter Score) and satisfaction scores impact financial performance?

#### Operational Personnel (Efficiency & Execution)
1.	What recurring service or product issues do customers most frequently report?
2.	Which processes create the longest delays in customer onboarding or service delivery?
3.	What percentage of customer complaints are resolved within SLA targets?
4.	Which products or services drive the most support tickets per customer?
5.	How often do the same customers return with repeat operational issues?

#### Sales Personnel (Revenue Growth)
1.	What stage is each customer currently at in the sales pipeline?
2.	Which customers are most likely to purchase again based on past buying behaviour?
3.	What is the total revenue generated by my assigned accounts this quarter?
4.	Which accounts have open opportunities, and what is their probability of closing?
5.	Which customers have reduced or stopped purchasing, and why?

#### Service Management Personnel (Customer Experience)
1.	Which customers currently have open service cases, and what is their status?
2.	What is the average resolution time for customer issues?
3.	How do support satisfaction scores vary by product, region, or agent?
4.	Which customers have recurring service problems that indicate systemic issues?
5.	Which VIP or high-value accounts currently need urgent service attention?

#### Billing Personnel (Financial Accuracy)
1.	Which customers have overdue invoices, and for how long?
2.	What is the total outstanding receivables by customer segment or account manager?
3.	Which customers frequently dispute invoices or request adjustments?
4.	How many customers are on credit holds, and what is the impact on revenue?
5.	What is the billing accuracy rate and how does it affect customer satisfaction?

#### Account Management Personnel (Relationship & Retention)
1.	What is the complete history of interactions with a specific customer (sales, service, billing, complaints)?
2.	Which customers are at risk of churn, and why?
3.	Which accounts have open renewal opportunities in the next 3–6 months?
4.	What feedback have we received from my assigned customers?
5.	What cross-sell or upsell opportunities exist within my portfolio of accounts?

---

## 📞 Support & Feedback

### How to Contribute
1. Review the current dashboard and identify gaps
2. Submit enhancement requests via team channel
3. Provide feedback on UI/UX during iteration reviews
4. Suggest new data sources or metrics to track

### Feedback Channels
- **Daily Standups**: Quick updates and blockers
- **Iteration Reviews**: Demo new features and gather feedback
- **Slack Channel**: #customer360-platform
- **Email**: customer360-team@company.com

### Known Issues
- Multi-currency handling still being refined
- Some accounts not linked across regions (manual review needed)

---

## 📚 Additional Resources

### Documentation
- [Salesforce API Documentation](https://developer.salesforce.com/docs/apis)
- [Lakehouse Best Practices](#)
- [JSON Configuration Schema](#)

### Training Materials
- Customer 360 User Guide (for account managers)
- Dashboard Navigation Tutorial
- How to Interpret Risk Scores
- Best Practices for Taking Action on Recommendations

---

## 📄 License

Internal use only - Proprietary to [Company Name]

---

## 🎉 Acknowledgments

Special thanks to the account management team for their invaluable feedback during the design phase, and to the data governance team for ensuring data quality and compliance throughout the pipeline.

---

**Status**: 🔄 Active Development - Iterating daily on UI/UX improvements

**Last Updated**: October 2025

**Version**: 2.0 - Enhanced with AI-powered recommendations

---

*"Transforming customer data into customer intelligence, one insight at a time."*