"""
Gold Layer Aggregation Script
Creates analytics-ready data with customer 360 metrics, risk scores, and recommendations
"""

import argparse
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd
import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GoldLayerAggregator:
    """Create Gold layer analytics from Silver layer data"""

    def __init__(self, config_path: str, metrics_config_path: str):
        """Initialize aggregator with configuration"""
        with open(config_path, 'r') as f:
            self.config = json.load(f)

        with open(metrics_config_path, 'r') as f:
            self.metrics_config = json.load(f)

        self.silver_path = Path(self.config.get('silver_path', './data/silver'))
        self.gold_path = Path(self.config.get('gold_path', './data/gold'))
        self.gold_path.mkdir(parents=True, exist_ok=True)

        # Load silver data
        self.accounts = self.load_latest_silver('account')
        self.opportunities = self.load_latest_silver('opportunity')
        self.line_items = self.load_latest_silver('opportunity_line_item')
        self.contacts = self.load_latest_silver('contact')

        logger.info("Gold layer aggregator initialized")

    def load_latest_silver(self, table_name: str) -> pd.DataFrame:
        """Load the most recent silver file for a table"""
        # Use exact match pattern to avoid matching similar table names
        # e.g., 'opportunity' should not match 'opportunity_line_item'
        files = []
        for file in self.silver_path.glob("silver_*.parquet"):
            # Extract table name from filename: silver_{table}_{suffix}.parquet
            # e.g., 'silver_opportunity_sample' or 'silver_opportunity_line_item_sample'
            file_stem = file.stem
            # Remove 'silver_' prefix and last part (timestamp or 'sample')
            without_prefix = file_stem.replace('silver_', '', 1)
            # Split from right to remove suffix (last underscore + suffix)
            parts = without_prefix.rsplit('_', 1)
            if len(parts) == 2:
                extracted_table = parts[0]  # e.g., 'opportunity' or 'opportunity_line_item'
                if extracted_table == table_name:
                    files.append(file)

        if not files:
            logger.warning(f"No silver files found for {table_name}")
            return pd.DataFrame()

        latest_file = max(files, key=lambda x: x.stat().st_mtime)
        logger.info(f"Loading silver file: {latest_file}")
        return pd.read_parquet(latest_file)

    def calculate_customer_360_metrics(self) -> pd.DataFrame:
        """Calculate core Customer 360 KPIs with persona-based metrics"""
        logger.info("Calculating Customer 360 metrics...")

        # Load subsidiary configuration
        subsidiary_config_path = Path(__file__).parent.parent / 'config' / 'subsidiaries.json'
        with open(subsidiary_config_path, 'r') as f:
            subsidiary_config = json.load(f)

        subsidiaries = subsidiary_config['subsidiaries']
        subsidiary_ids = [sub['id'] for sub in subsidiaries]

        # Join opportunities with accounts
        opps_with_accounts = self.opportunities.merge(
            self.accounts[['account_id', 'account_name', 'region']],
            on='account_id',
            how='left'
        )

        # Calculate metrics per account
        account_metrics = []

        for account_id in self.accounts['account_id'].unique():
            account_data = self.accounts[self.accounts['account_id'] == account_id].iloc[0]
            account_opps = opps_with_accounts[opps_with_accounts['account_id'] == account_id]

            # ===== FINANCIAL METRICS (Board, CEO, Billing) =====
            # Calculate CLV (sum of all closed-won deals)
            clv = account_opps[account_opps['is_won'] == True]['deal_value'].sum()

            # Calculate Annual Revenue (current year closed-won)
            current_year = datetime.now().year
            annual_revenue = account_opps[
                (account_opps['is_won'] == True) &
                (pd.to_datetime(account_opps['close_date']).dt.year == current_year)
            ]['deal_value'].sum()

            # Previous year revenue for comparison
            previous_year_revenue = account_opps[
                (account_opps['is_won'] == True) &
                (pd.to_datetime(account_opps['close_date']).dt.year == current_year - 1)
            ]['deal_value'].sum()

            # Last 3 years revenue for trend analysis (Board Chairman)
            three_year_revenue = []
            for year in range(current_year - 2, current_year + 1):
                year_revenue = account_opps[
                    (account_opps['is_won'] == True) &
                    (pd.to_datetime(account_opps['close_date']).dt.year == year)
                ]['deal_value'].sum()
                three_year_revenue.append(year_revenue)

            # Calculate MRR (assuming subscription-based revenue)
            mrr = annual_revenue / 12 if annual_revenue > 0 else 0

            # Quarterly revenue (last 4 quarters) for Sales Personnel
            quarterly_revenue = []
            for q in range(4):
                quarter_end = datetime.now() - timedelta(days=q*90)
                quarter_start = quarter_end - timedelta(days=90)
                q_revenue = account_opps[
                    (account_opps['is_won'] == True) &
                    (pd.to_datetime(account_opps['close_date']) >= quarter_start) &
                    (pd.to_datetime(account_opps['close_date']) <= quarter_end)
                ]['deal_value'].sum()
                quarterly_revenue.append(q_revenue)

            # YoY Growth
            yoy_growth = 0
            if previous_year_revenue > 0:
                yoy_growth = ((annual_revenue - previous_year_revenue) / previous_year_revenue) * 100

            # Revenue concentration risk (Board Chairman)
            total_revenue_all = opps_with_accounts[opps_with_accounts['is_won'] == True]['deal_value'].sum()
            revenue_concentration = (annual_revenue / total_revenue_all * 100) if total_revenue_all > 0 else 0

            # ===== OPERATIONAL METRICS (Operations, Service Management) =====
            # Support tickets (simulated - would connect to actual support system)
            open_tickets = np.random.randint(0, 15)
            closed_tickets = np.random.randint(20, 100)
            total_tickets = open_tickets + closed_tickets
            avg_resolution_time = np.random.uniform(2, 48)  # hours
            avg_response_time = np.random.uniform(0.5, 4)  # hours
            sla_compliance = np.random.uniform(85, 99)  # percentage
            recurring_issues = np.random.randint(0, 5)  # count of recurring problems

            # ===== SALES METRICS (Sales Personnel) =====
            # Calculate active services (unique products from line items)
            account_line_items = self.line_items.merge(
                account_opps[['opportunity_id']], on='opportunity_id'
            )
            active_services = account_line_items['product_id'].nunique()

            # Pipeline metrics
            open_opportunities = account_opps[account_opps['is_closed'] == False]
            pipeline_value = open_opportunities['deal_value'].sum()
            open_opps_count = len(open_opportunities)

            # Next close opportunity
            next_close_opp = open_opportunities.sort_values('close_date').head(1)
            next_close_date = next_close_opp['close_date'].iloc[0] if len(next_close_opp) > 0 else None
            next_close_value = next_close_opp['deal_value'].iloc[0] if len(next_close_opp) > 0 else 0
            next_close_probability = next_close_opp['win_probability'].iloc[0] if len(next_close_opp) > 0 else 0

            # Win rate
            total_closed_opps = len(account_opps[account_opps['is_closed'] == True])
            won_opps = len(account_opps[account_opps['is_won'] == True])
            win_rate = (won_opps / total_closed_opps * 100) if total_closed_opps > 0 else 0

            # Average deal size
            avg_deal_size = account_opps[account_opps['is_won'] == True]['deal_value'].mean()

            # Sales cycle length
            closed_opps_with_dates = account_opps[account_opps['is_closed'] == True].copy()
            if len(closed_opps_with_dates) > 0:
                closed_opps_with_dates['cycle_days'] = (
                    pd.to_datetime(closed_opps_with_dates['close_date']) -
                    pd.to_datetime(closed_opps_with_dates.get('created_date', datetime.now()))
                ).dt.days
                avg_sales_cycle = closed_opps_with_dates['cycle_days'].mean()
            else:
                avg_sales_cycle = 0

            # ===== BILLING METRICS (Billing Personnel) =====
            # Payment metrics (simulated)
            overdue_invoices = np.random.randint(0, 5)
            overdue_amount = overdue_invoices * np.random.uniform(1000, 50000)
            days_overdue = np.random.randint(0, 60) if overdue_invoices > 0 else 0
            disputed_invoices = np.random.randint(0, 3)
            credit_hold = overdue_amount > 100000 or days_overdue > 45
            billing_accuracy = np.random.uniform(95, 100)  # percentage
            payment_terms = np.random.choice(['Net 30', 'Net 45', 'Net 60'])

            # ===== ACCOUNT MANAGEMENT METRICS (Account Management) =====
            # Renewal opportunities
            renewal_opps = account_opps[
                (account_opps['is_closed'] == False) &
                (pd.to_datetime(account_opps['close_date']) <= datetime.now() + timedelta(days=180))
            ]
            upcoming_renewals = len(renewal_opps)
            renewal_value = renewal_opps['deal_value'].sum()

            # Contract expiry (simulated)
            contract_end_date = datetime.now() + timedelta(days=np.random.randint(30, 730))
            days_to_renewal = (contract_end_date - datetime.now()).days

            # Customer satisfaction (simulated - would use actual NPS/CSAT data)
            nps_score = np.random.randint(-20, 80)
            csat_score = np.random.uniform(3, 5)  # 1-5 scale

            # CES (Customer Effort Score) - 1-7 scale (7 = very easy, 1 = very difficult)
            # Simulated based on operational metrics: SLA compliance, support tickets, etc.
            # Higher SLA compliance and fewer tickets = easier to do business with
            base_ces = 5.0  # Average baseline
            if sla_compliance > 90:
                base_ces += 0.8
            elif sla_compliance < 75:
                base_ces -= 1.0
            if open_tickets > 3:
                base_ces -= 0.5
            if recurring_issues > 0:
                base_ces -= 0.3
            # Add some randomness
            ces_score = round(max(1.0, min(7.0, base_ces + np.random.uniform(-0.5, 0.5))), 1)

            # Engagement metrics
            last_interaction_days = np.random.randint(1, 90)
            qbr_scheduled = np.random.choice([True, False])
            executive_sponsor_engaged = np.random.choice([True, False])

            # ===== RETENTION METRICS (CEO, Board) =====
            # Customer segment profitability
            total_cost_to_serve = annual_revenue * np.random.uniform(0.3, 0.7)  # Simulated
            profit_margin = ((annual_revenue - total_cost_to_serve) / annual_revenue * 100) if annual_revenue > 0 else 0

            # Retention probability (based on multiple factors)
            retention_probability = np.random.uniform(60, 95)

            # ===== SUBSIDIARY RELATIONSHIPS =====
            # Assign 1-3 subsidiaries to this customer
            num_subsidiaries = np.random.choice([1, 2, 3], p=[0.4, 0.4, 0.2])
            customer_subsidiaries = np.random.choice(subsidiary_ids, size=num_subsidiaries, replace=False).tolist()

            # Build subsidiary details with services and metrics
            subsidiary_details = []
            for sub_id in customer_subsidiaries:
                subsidiary = next((s for s in subsidiaries if s['id'] == sub_id), None)
                if not subsidiary:
                    continue

                # Assign 2-5 random services from this subsidiary
                num_services = np.random.randint(2, min(6, len(subsidiary['services']) + 1))
                assigned_services = np.random.choice(subsidiary['services'], size=num_services, replace=False).tolist()

                # Calculate subsidiary-specific metrics (split overall metrics)
                # Revenue distribution (weighted by number of services)
                revenue_weight = num_services / sum([len(np.random.choice(next((s for s in subsidiaries if s['id'] == sid), {'services': []}).get('services', ['']), size=np.random.randint(2, 6), replace=False)) for sid in customer_subsidiaries])
                sub_annual_revenue = annual_revenue * revenue_weight if len(customer_subsidiaries) > 0 else annual_revenue

                # Service tickets distribution
                sub_tickets = int(total_tickets * revenue_weight) if len(customer_subsidiaries) > 0 else total_tickets

                subsidiary_details.append({
                    'subsidiary_id': sub_id,
                    'subsidiary_name': subsidiary['name'],
                    'subsidiary_short_name': subsidiary['short_name'],
                    'services': assigned_services,
                    'service_count': len(assigned_services),
                    'annual_revenue': round(sub_annual_revenue, 2),
                    'tickets_count': sub_tickets,
                    'relationship_start': (datetime.now() - timedelta(days=np.random.randint(365, 1825))).isoformat(),
                    'primary': sub_id == customer_subsidiaries[0]  # First subsidiary is primary
                })

            # Identify primary subsidiary
            primary_subsidiary = customer_subsidiaries[0] if customer_subsidiaries else None

            account_metrics.append({
                'account_id': account_id,
                'account_name': account_data['account_name'],
                'region': account_data.get('region', 'Unknown'),
                'customer_since': account_data.get('customer_since'),

                # Financial Metrics
                'customer_lifetime_value': clv,
                'monthly_recurring_revenue': mrr,
                'annual_revenue': annual_revenue,
                'previous_year_revenue': previous_year_revenue,
                'yoy_growth': yoy_growth,
                'quarterly_revenue': json.dumps([float(x) for x in quarterly_revenue]),  # Convert to proper JSON
                'three_year_revenue': json.dumps([float(x) for x in three_year_revenue]),  # Convert to proper JSON
                'revenue_concentration': revenue_concentration,
                'profit_margin': profit_margin,
                'total_cost_to_serve': total_cost_to_serve,

                # Sales Metrics
                'active_services': active_services,
                'win_rate': win_rate,
                'total_opportunities': len(account_opps),
                'won_opportunities': won_opps,
                'open_opportunities': open_opps_count,
                'pipeline_value': pipeline_value,
                'next_close_date': next_close_date,
                'next_close_value': next_close_value,
                'next_close_probability': next_close_probability,
                'avg_deal_size': avg_deal_size,
                'avg_sales_cycle_days': avg_sales_cycle,

                # Operational/Support Metrics
                'open_tickets': open_tickets,
                'closed_tickets': closed_tickets,
                'total_tickets': total_tickets,
                'avg_resolution_time_hours': avg_resolution_time,
                'avg_response_time_hours': avg_response_time,
                'sla_compliance_pct': sla_compliance,
                'recurring_issues_count': recurring_issues,

                # Billing Metrics
                'overdue_invoices': overdue_invoices,
                'overdue_amount': overdue_amount,
                'days_overdue': days_overdue,
                'disputed_invoices': disputed_invoices,
                'credit_hold': credit_hold,
                'billing_accuracy_pct': billing_accuracy,
                'payment_terms': payment_terms,

                # Account Management Metrics
                'upcoming_renewals_count': upcoming_renewals,
                'upcoming_renewal_value': renewal_value,
                'days_to_renewal': days_to_renewal,
                'contract_end_date': contract_end_date,
                'nps_score': nps_score,
                'csat_score': csat_score,
                'ces_score': ces_score,
                'last_interaction_days': last_interaction_days,
                'qbr_scheduled': qbr_scheduled,
                'executive_sponsor_engaged': executive_sponsor_engaged,
                'retention_probability': retention_probability,

                # Subsidiary Relationships
                'subsidiaries': json.dumps(subsidiary_details),  # JSON array of subsidiary relationships
                'subsidiary_count': len(customer_subsidiaries),
                'primary_subsidiary': primary_subsidiary,

                '_calculated_at': datetime.utcnow()
            })

        return pd.DataFrame(account_metrics)

    def calculate_health_score(self, account_metrics: pd.DataFrame) -> pd.DataFrame:
        """Calculate customer health score (0-100)"""
        logger.info("Calculating health scores...")

        # Weights from config
        weights = self.metrics_config['risk_metrics']['metrics'][1]['weights']

        for idx, row in account_metrics.iterrows():
            # Payment history score (simulated - randomized for diversity)
            # 65% Healthy (80-100), 28.5% At-Risk (50-80), 6.5% Critical (0-50)
            health_category = np.random.choice(['Healthy', 'At-Risk', 'Critical'], p=[0.65, 0.285, 0.065])
            if health_category == 'Healthy':
                base_score = np.random.uniform(80, 100)
            elif health_category == 'At-Risk':
                base_score = np.random.uniform(50, 80)
            else:
                base_score = np.random.uniform(20, 50)

            payment_score = base_score + np.random.uniform(-5, 5)
            support_score = base_score + np.random.uniform(-8, 8)
            engagement_score = base_score + np.random.uniform(-10, 10)

            # Usage trend score (based on YoY growth)
            usage_score = min(100, max(0, 50 + row['yoy_growth']))

            # Calculate weighted health score
            health_score = (
                payment_score * weights['payment_history'] +
                support_score * weights['support_tickets'] +
                usage_score * weights['usage_trends'] +
                engagement_score * weights['engagement']
            )

            # Categorize health status
            if health_score >= 80:
                health_status = 'Healthy'
            elif health_score >= 50:
                health_status = 'At-Risk'
            else:
                health_status = 'Critical'

            account_metrics.at[idx, 'health_score'] = round(health_score, 2)
            account_metrics.at[idx, 'health_status'] = health_status

        return account_metrics

    def calculate_churn_risk(self, account_metrics: pd.DataFrame) -> pd.DataFrame:
        """Calculate churn risk score (0-100)"""
        logger.info("Calculating churn risk scores...")

        weights = self.metrics_config['risk_metrics']['metrics'][0]['weights']

        for idx, row in account_metrics.iterrows():
            # Usage trend risk (negative growth = higher risk)
            usage_risk = max(0, -row['yoy_growth']) if row['yoy_growth'] < 0 else 0

            # Payment risk (simulated)
            payment_risk = 15  # Low default risk

            # Support issues risk (simulated)
            support_risk = 10  # Low default risk

            # Engagement risk (inverse of engagement score)
            engagement_risk = 25  # Moderate default risk

            # Calculate weighted churn risk
            churn_risk = (
                usage_risk * weights['usage_trend'] +
                payment_risk * weights['payment_history'] +
                support_risk * weights['support_issues'] +
                engagement_risk * weights['engagement']
            )

            # Determine risk level
            thresholds = self.metrics_config['risk_metrics']['metrics'][0]['thresholds']
            if churn_risk >= thresholds['high']:
                risk_level = 'HIGH'
            elif churn_risk >= thresholds['medium']:
                risk_level = 'MEDIUM'
            else:
                risk_level = 'LOW'

            account_metrics.at[idx, 'churn_risk_score'] = min(100, round(churn_risk, 2))
            account_metrics.at[idx, 'churn_risk_level'] = risk_level

        return account_metrics

    def generate_risk_alerts(self, account_metrics: pd.DataFrame) -> pd.DataFrame:
        """Generate risk alerts based on configured rules"""
        logger.info("Generating risk alerts...")

        alerts = []

        for _, account in account_metrics.iterrows():
            # High Churn Risk Alert
            if account['churn_risk_score'] > 70:
                alerts.append({
                    'alert_id': f"{account['account_id']}_A001",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'alert_type': 'churn_risk',
                    'severity': 'HIGH',
                    'message': f"⚠️ HIGH CHURN RISK: {account['churn_risk_score']:.0f}% probability. Immediate action required.",
                    'recommendation': 'Schedule Executive Business Review immediately',
                    'action_type': 'schedule_meeting',
                    'created_at': datetime.utcnow()
                })

            # Usage Decline Alert
            if account['yoy_growth'] < -30:
                alerts.append({
                    'alert_id': f"{account['account_id']}_A002",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'alert_type': 'usage_decline',
                    'severity': 'MEDIUM',
                    'message': f"📉 Usage declined {abs(account['yoy_growth']):.0f}% year-over-year",
                    'recommendation': 'Contact customer to understand reduced usage patterns',
                    'action_type': 'schedule_meeting',
                    'created_at': datetime.utcnow()
                })

            # Contract Expiring Soon Alert
            if 0 < account['days_to_renewal'] < 30:
                alerts.append({
                    'alert_id': f"{account['account_id']}_A003",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'alert_type': 'renewal_urgent',
                    'severity': 'HIGH',
                    'message': f"🔔 CONTRACT EXPIRING in {account['days_to_renewal']} days!",
                    'recommendation': 'Initiate renewal conversation immediately',
                    'action_type': 'initiate_renewal',
                    'created_at': datetime.utcnow()
                })

            # High Open Tickets Alert
            if account['open_tickets'] > 10:
                alerts.append({
                    'alert_id': f"{account['account_id']}_A004",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'alert_type': 'service_issues',
                    'severity': 'HIGH',
                    'message': f"🎫 {account['open_tickets']} open support tickets - service quality concern",
                    'recommendation': 'Launch service recovery plan with dedicated engineer',
                    'action_type': 'assign_engineer',
                    'created_at': datetime.utcnow()
                })

            # Payment Overdue Alert
            if account['overdue_amount'] > 50000:
                alerts.append({
                    'alert_id': f"{account['account_id']}_A005",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'alert_type': 'payment_overdue',
                    'severity': 'HIGH',
                    'message': f"💰 ${account['overdue_amount']:,.0f} overdue for {account['days_overdue']} days",
                    'recommendation': 'Escalate to collections team and contact finance lead',
                    'action_type': 'contact_finance',
                    'created_at': datetime.utcnow()
                })
            elif account['overdue_amount'] > 0:
                alerts.append({
                    'alert_id': f"{account['account_id']}_A006",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'alert_type': 'payment_overdue',
                    'severity': 'MEDIUM',
                    'message': f"💰 ${account['overdue_amount']:,.0f} overdue for {account['days_overdue']} days",
                    'recommendation': 'Send payment reminder and follow up',
                    'action_type': 'contact_finance',
                    'created_at': datetime.utcnow()
                })

            # Low NPS Alert
            if account['nps_score'] < 30:
                alerts.append({
                    'alert_id': f"{account['account_id']}_A007",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'alert_type': 'low_satisfaction',
                    'severity': 'MEDIUM',
                    'message': f"😞 Low NPS score: {account['nps_score']} - customer satisfaction at risk",
                    'recommendation': 'Schedule voice-of-customer session to understand concerns',
                    'action_type': 'schedule_meeting',
                    'created_at': datetime.utcnow()
                })

            # Credit Hold Alert
            if account['credit_hold']:
                alerts.append({
                    'alert_id': f"{account['account_id']}_A008",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'alert_type': 'credit_hold',
                    'severity': 'HIGH',
                    'message': f"🚫 ACCOUNT ON CREDIT HOLD - Service disruption risk",
                    'recommendation': 'Resolve outstanding balance immediately',
                    'action_type': 'contact_finance',
                    'created_at': datetime.utcnow()
                })

        return pd.DataFrame(alerts) if alerts else pd.DataFrame()

    def generate_recommendations(self, account_metrics: pd.DataFrame) -> pd.DataFrame:
        """Generate next-best-action recommendations"""
        logger.info("Generating recommendations...")

        recommendations = []

        for _, account in account_metrics.iterrows():
            # High Churn Risk - Schedule Retention Meeting
            if account['churn_risk_score'] > 70:
                recommendations.append({
                    'recommendation_id': f"{account['account_id']}_R001",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'priority': 'HIGH',
                    'category': 'Retention',
                    'title': 'Schedule Executive Business Review',
                    'description': f"Customer has {account['churn_risk_score']:.0f}% churn risk. Schedule immediate EBR with executive sponsor to discuss concerns and renewal strategy.",
                    'expected_outcome': 'Reduce churn risk by 30%',
                    'estimated_impact': account['annual_revenue'] * 0.3,
                    'action_type': 'schedule_meeting',
                    'action_data': {'meeting_type': 'Executive Business Review', 'attendees': ['CSM', 'Executive Sponsor']},
                    'created_at': datetime.utcnow(),
                    'status': 'OPEN'
                })

            # Contract Expiring Soon
            if account['days_to_renewal'] < 90 and account['days_to_renewal'] > 0:
                recommendations.append({
                    'recommendation_id': f"{account['account_id']}_R002",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'priority': 'HIGH' if account['days_to_renewal'] < 30 else 'MEDIUM',
                    'category': 'Renewal',
                    'title': 'Initiate Renewal Conversation',
                    'description': f"Contract expires in {account['days_to_renewal']} days. Start renewal negotiations now to secure commitment.",
                    'expected_outcome': 'Secure renewal 60 days before expiration',
                    'estimated_impact': account['annual_revenue'],
                    'action_type': 'initiate_renewal',
                    'action_data': {'days_to_renewal': account['days_to_renewal'], 'contract_value': account['annual_revenue']},
                    'created_at': datetime.utcnow(),
                    'status': 'OPEN'
                })

            # High Open Tickets - Service Recovery
            if account['open_tickets'] > 10:
                recommendations.append({
                    'recommendation_id': f"{account['account_id']}_R003",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'priority': 'HIGH',
                    'category': 'Service',
                    'title': 'Launch Service Recovery Plan',
                    'description': f"Customer has {account['open_tickets']} open tickets. Assign dedicated support engineer and resolve top 3 critical issues within 48 hours.",
                    'expected_outcome': 'Reduce open tickets by 50% within 1 week',
                    'estimated_impact': account['annual_revenue'] * 0.05,
                    'action_type': 'assign_engineer',
                    'action_data': {'open_tickets': account['open_tickets'], 'critical_count': 3},
                    'created_at': datetime.utcnow(),
                    'status': 'OPEN'
                })

            # Overdue Invoices - Collections
            if account['overdue_amount'] > 0:
                recommendations.append({
                    'recommendation_id': f"{account['account_id']}_R004",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'priority': 'HIGH' if account['overdue_amount'] > 50000 else 'MEDIUM',
                    'category': 'Finance',
                    'title': 'Escalate Collections Process',
                    'description': f"${account['overdue_amount']:,.0f} overdue for {account['days_overdue']} days. Contact finance lead immediately to set up payment plan.",
                    'expected_outcome': 'Collect 80% within 2 weeks',
                    'estimated_impact': account['overdue_amount'] * 0.8,
                    'action_type': 'contact_finance',
                    'action_data': {'overdue_amount': account['overdue_amount'], 'days_overdue': account['days_overdue']},
                    'created_at': datetime.utcnow(),
                    'status': 'OPEN'
                })

            # Low NPS - Feedback Session
            if account['nps_score'] < 30:
                recommendations.append({
                    'recommendation_id': f"{account['account_id']}_R005",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'priority': 'MEDIUM',
                    'category': 'Experience',
                    'title': 'Schedule Customer Feedback Session',
                    'description': f"NPS score of {account['nps_score']} indicates dissatisfaction. Conduct voice-of-customer interview to understand pain points.",
                    'expected_outcome': 'Improve NPS by 20 points',
                    'estimated_impact': account['annual_revenue'] * 0.15,
                    'action_type': 'schedule_meeting',
                    'action_data': {'meeting_type': 'Voice of Customer', 'focus': 'Pain Points'},
                    'created_at': datetime.utcnow(),
                    'status': 'OPEN'
                })

            # Strong Growth - Upsell Opportunity
            if account['yoy_growth'] > 20:
                recommendations.append({
                    'recommendation_id': f"{account['account_id']}_R006",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'priority': 'MEDIUM',
                    'category': 'Expansion',
                    'title': 'Present Expansion Opportunity',
                    'description': f"Revenue grew {account['yoy_growth']:.0f}% YoY. Customer is scaling fast - schedule call to discuss premium tier or additional services.",
                    'expected_outcome': 'Generate 25% upsell',
                    'estimated_impact': account['annual_revenue'] * 0.25,
                    'action_type': 'schedule_meeting',
                    'action_data': {'meeting_type': 'Expansion Discussion', 'upsell_target': account['annual_revenue'] * 0.25},
                    'created_at': datetime.utcnow(),
                    'status': 'OPEN'
                })

            # High Pipeline Value - Sales Acceleration
            if account['pipeline_value'] > 100000:
                recommendations.append({
                    'recommendation_id': f"{account['account_id']}_R007",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'priority': 'MEDIUM',
                    'category': 'Sales',
                    'title': 'Accelerate Pipeline Opportunities',
                    'description': f"${account['pipeline_value']:,.0f} in pipeline. Assign senior sales engineer to help close top 2 deals faster.",
                    'expected_outcome': 'Close 2 deals within 30 days',
                    'estimated_impact': account['pipeline_value'] * 0.4,
                    'action_type': 'assign_engineer',
                    'action_data': {'pipeline_value': account['pipeline_value'], 'target_deals': 2},
                    'created_at': datetime.utcnow(),
                    'status': 'OPEN'
                })

            # Low Engagement - Adoption Campaign
            if account['last_interaction_days'] > 60:
                recommendations.append({
                    'recommendation_id': f"{account['account_id']}_R008",
                    'account_id': account['account_id'],
                    'account_name': account['account_name'],
                    'priority': 'LOW',
                    'category': 'Adoption',
                    'title': 'Launch Product Adoption Campaign',
                    'description': f"No interaction in {account['last_interaction_days']} days. Send personalized email campaign with product tips and success stories.",
                    'expected_outcome': 'Increase engagement by 40%',
                    'estimated_impact': account['annual_revenue'] * 0.1,
                    'action_type': 'send_campaign',
                    'action_data': {'last_interaction': account['last_interaction_days'], 'campaign_type': 'Adoption'},
                    'created_at': datetime.utcnow(),
                    'status': 'OPEN'
                })

        return pd.DataFrame(recommendations) if recommendations else pd.DataFrame()

    def generate_customer_timeline(self) -> pd.DataFrame:
        """Generate customer journey timeline events"""
        logger.info("Generating customer timeline...")

        events = []

        # Add opportunity events
        for _, opp in self.opportunities.iterrows():
            if opp['is_closed']:
                event_type = 'RENEWAL' if opp['is_won'] else 'OPPORTUNITY_LOST'
                severity = 'HIGH' if opp['is_won'] else 'MEDIUM'

                events.append({
                    'event_id': f"OPP_{opp['opportunity_id']}",
                    'account_id': opp['account_id'],
                    'event_type': event_type,
                    'event_title': f"Opportunity: {opp['opportunity_name']}",
                    'event_description': f"{opp['stage']} - ${opp['deal_value']:,.2f}",
                    'event_date': opp['close_date'],
                    'severity': severity,
                    'related_amount': opp['deal_value'],
                    'status': 'RESOLVED'
                })

        return pd.DataFrame(events) if events else pd.DataFrame()

    def create_gold_layer(self) -> Dict[str, Any]:
        """Create all gold layer tables"""
        logger.info("Creating Gold layer tables...")

        results = {}

        # 1. Customer 360 Metrics
        customer_360 = self.calculate_customer_360_metrics()
        customer_360 = self.calculate_health_score(customer_360)
        customer_360 = self.calculate_churn_risk(customer_360)

        filepath = self.save_gold_table(customer_360, 'customer_360_metrics')
        results['customer_360_metrics'] = {
            'records': len(customer_360),
            'file': filepath
        }

        # 2. Risk Alerts
        alerts = self.generate_risk_alerts(customer_360)
        if not alerts.empty:
            filepath = self.save_gold_table(alerts, 'risk_alerts')
            results['risk_alerts'] = {
                'records': len(alerts),
                'file': filepath
            }

        # 3. Recommendations
        recommendations = self.generate_recommendations(customer_360)
        if not recommendations.empty:
            filepath = self.save_gold_table(recommendations, 'recommendations')
            results['recommendations'] = {
                'records': len(recommendations),
                'file': filepath
            }

        # 4. Customer Timeline
        timeline = self.generate_customer_timeline()
        if not timeline.empty:
            filepath = self.save_gold_table(timeline, 'customer_timeline')
            results['customer_timeline'] = {
                'records': len(timeline),
                'file': filepath
            }

        return results

    def save_gold_table(self, df: pd.DataFrame, table_name: str) -> str:
        """Save gold layer table"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"gold_{table_name}_{timestamp}.parquet"
        filepath = self.gold_path / filename

        df.to_parquet(filepath, compression='snappy', index=False)

        logger.info(f"Saved gold table: {filepath}")
        return str(filepath)


def main():
    parser = argparse.ArgumentParser(description='Create Gold layer analytics')
    parser.add_argument(
        '--config',
        type=str,
        default='./config/salesforce_config.json',
        help='Path to configuration file'
    )
    parser.add_argument(
        '--metrics',
        type=str,
        default='./config/silver_to_gold_metrics.json',
        help='Path to metrics configuration file'
    )

    args = parser.parse_args()

    aggregator = GoldLayerAggregator(args.config, args.metrics)
    results = aggregator.create_gold_layer()

    print(f"\n✅ Gold Layer Creation Complete!")
    print(f"Tables created:")
    for table_name, info in results.items():
        print(f"  - {table_name}: {info['records']} records")


if __name__ == '__main__':
    main()
