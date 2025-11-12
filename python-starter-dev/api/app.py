"""
Customer 360 API
REST API for serving customer analytics data to the dashboard
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime
import logging
import os
import json
from openai import OpenAI

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Data paths
# Use absolute path to ensure data files are found
import os
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / 'data' / 'gold'


class DataLoader:
    """Load and cache gold layer data"""

    def __init__(self):
        self.cache = {}
        self.cache_time = {}

    def load_latest(self, table_name: str) -> pd.DataFrame:
        """Load latest version of a gold table"""
        # Check cache (5 minute TTL)
        if table_name in self.cache:
            if (datetime.now() - self.cache_time[table_name]).seconds < 300:
                return self.cache[table_name]

        # Load from file
        pattern = f"gold_{table_name}_*.parquet"
        files = list(DATA_PATH.glob(pattern))

        if not files:
            logger.warning(f"No gold files found for {table_name}")
            return pd.DataFrame()

        latest_file = max(files, key=lambda x: x.stat().st_mtime)
        logger.info(f"Loading: {latest_file}")

        df = pd.read_parquet(latest_file)

        # Cache it
        self.cache[table_name] = df
        self.cache_time[table_name] = datetime.now()

        return df


data_loader = DataLoader()


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})


@app.route('/api/customers', methods=['GET'])
def search_customers():
    """Search customers by name"""
    query = request.args.get('q', '').lower()

    customers = data_loader.load_latest('customer_360_metrics')

    if customers.empty:
        return jsonify([])

    # Filter by query
    if query:
        filtered = customers[
            customers['account_name'].str.lower().str.contains(query, na=False)
        ]
    else:
        filtered = customers  # Return all customers if no query

    # Convert to dict with all columns
    results = filtered.to_dict('records')

    # Clean up NaN values and convert timestamps
    for customer in results:
        for key, value in list(customer.items()):
            if pd.api.types.is_datetime64_any_dtype(type(value)) or isinstance(value, (pd.Timestamp, datetime)):
                customer[key] = value.isoformat() if not pd.isna(value) else None
            elif isinstance(value, (np.integer, np.floating)):
                customer[key] = None if pd.isna(value) else float(value)
            elif pd.isna(value):
                customer[key] = None

    return jsonify(results)


@app.route('/api/customer/<account_id>', methods=['GET'])
def get_customer_360(account_id: str):
    """Get complete 360 view for a customer"""
    customers = data_loader.load_latest('customer_360_metrics')

    if customers.empty:
        return jsonify({'error': 'No customer data available'}), 404

    customer = customers[customers['account_id'] == account_id]

    if customer.empty:
        return jsonify({'error': 'Customer not found'}), 404

    customer_data = customer.iloc[0].to_dict()

    # Clean up NaN values and convert timestamps
    for key, value in list(customer_data.items()):
        if pd.api.types.is_datetime64_any_dtype(type(value)) or isinstance(value, (pd.Timestamp, datetime)):
            customer_data[key] = value.isoformat() if not pd.isna(value) else None
        elif isinstance(value, (np.integer, np.floating)):
            customer_data[key] = None if pd.isna(value) else float(value)
        elif pd.isna(value):
            customer_data[key] = None

    return jsonify(customer_data)


@app.route('/api/customer/<account_id>/alerts', methods=['GET'])
def get_customer_alerts(account_id: str):
    """Get risk alerts for a customer"""
    alerts = data_loader.load_latest('risk_alerts')

    if alerts.empty:
        return jsonify([])

    customer_alerts = alerts[alerts['account_id'] == account_id]

    results = customer_alerts.to_dict('records')

    # Convert timestamps
    for alert in results:
        for key, value in alert.items():
            if pd.api.types.is_datetime64_any_dtype(type(value)):
                alert[key] = value.isoformat()
            elif pd.isna(value):
                alert[key] = None

    return jsonify(results)


@app.route('/api/customer/<account_id>/recommendations', methods=['GET'])
def get_customer_recommendations(account_id: str):
    """Get recommendations for a customer"""
    recommendations = data_loader.load_latest('recommendations')

    if recommendations.empty:
        return jsonify([])

    customer_recs = recommendations[recommendations['account_id'] == account_id]

    # Sort by priority
    priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    customer_recs['priority_order'] = customer_recs['priority'].map(priority_order)
    customer_recs = customer_recs.sort_values('priority_order')

    results = customer_recs.to_dict('records')

    # Convert timestamps
    for rec in results:
        for key, value in rec.items():
            if pd.api.types.is_datetime64_any_dtype(type(value)):
                rec[key] = value.isoformat()
            elif pd.isna(value):
                rec[key] = None

    return jsonify(results)


@app.route('/api/customer/<account_id>/timeline', methods=['GET'])
def get_customer_timeline(account_id: str):
    """Get customer journey timeline"""
    timeline = data_loader.load_latest('customer_timeline')

    if timeline.empty:
        return jsonify([])

    customer_events = timeline[timeline['account_id'] == account_id]

    # Sort by date descending
    customer_events = customer_events.sort_values('event_date', ascending=False)

    results = customer_events.to_dict('records')

    # Convert timestamps
    for event in results:
        for key, value in event.items():
            if pd.api.types.is_datetime64_any_dtype(type(value)):
                event[key] = value.isoformat()
            elif pd.isna(value):
                event[key] = None

    return jsonify(results)


@app.route('/api/customer/<account_id>/opportunities', methods=['GET'])
def get_customer_opportunities(account_id: str):
    """Get opportunities for a customer"""
    # Load from silver layer
    silver_path = Path('../data/silver')
    opp_file = silver_path / 'silver_opportunity_sample.parquet'

    if not opp_file.exists():
        return jsonify([])

    opportunities = pd.read_parquet(opp_file)
    customer_opps = opportunities[opportunities['account_id'] == account_id]

    # Sort by deal value descending
    customer_opps = customer_opps.sort_values('deal_value', ascending=False)

    results = customer_opps.to_dict('records')

    # Convert timestamps and handle NaN
    for opp in results:
        for key, value in opp.items():
            if pd.api.types.is_datetime64_any_dtype(type(value)):
                opp[key] = value.isoformat()
            elif pd.isna(value):
                opp[key] = None

    return jsonify(results)


@app.route('/api/customer/<account_id>/tickets', methods=['GET'])
def get_customer_tickets(account_id: str):
    """Get support tickets for a customer"""
    # Load from silver layer
    silver_path = Path('../data/silver')
    ticket_file = silver_path / 'silver_ticket_sample.parquet'

    if not ticket_file.exists():
        return jsonify([])

    tickets = pd.read_parquet(ticket_file)
    customer_tickets = tickets[tickets['account_id'] == account_id]

    # Sort by created date descending
    customer_tickets = customer_tickets.sort_values('created_date', ascending=False)

    results = customer_tickets.to_dict('records')

    # Convert timestamps and handle NaN
    for ticket in results:
        for key, value in ticket.items():
            if pd.api.types.is_datetime64_any_dtype(type(value)):
                ticket[key] = value.isoformat()
            elif pd.isna(value):
                ticket[key] = None

    return jsonify(results)


@app.route('/api/customer/<account_id>/invoices', methods=['GET'])
def get_customer_invoices(account_id: str):
    """Get invoices for a customer"""
    # Load from silver layer
    silver_path = Path('../data/silver')
    invoice_file = silver_path / 'silver_invoice_sample.parquet'

    if not invoice_file.exists():
        return jsonify([])

    invoices = pd.read_parquet(invoice_file)
    customer_invoices = invoices[invoices['account_id'] == account_id]

    # Sort by invoice date descending
    customer_invoices = customer_invoices.sort_values('invoice_date', ascending=False)

    results = customer_invoices.to_dict('records')

    # Convert timestamps and handle NaN
    for invoice in results:
        for key, value in invoice.items():
            if pd.api.types.is_datetime64_any_dtype(type(value)):
                invoice[key] = value.isoformat()
            elif pd.isna(value):
                invoice[key] = None

    return jsonify(results)


@app.route('/api/actions/<action_id>/execute', methods=['POST'])
def execute_action(action_id: str):
    """Execute a recommended action"""
    # In production, this would trigger workflows, send emails, create tasks, etc.
    logger.info(f"Executing action: {action_id}")

    # Update recommendation status
    recommendations = data_loader.load_latest('recommendations')

    if not recommendations.empty:
        rec = recommendations[recommendations['recommendation_id'] == action_id]
        if not rec.empty:
            # In production, update the database
            return jsonify({
                'status': 'success',
                'message': f'Action {action_id} scheduled for execution',
                'executed_at': datetime.utcnow().isoformat()
            })

    return jsonify({'error': 'Action not found'}), 404


@app.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """Get executive dashboard summary metrics"""
    customers = data_loader.load_latest('customer_360_metrics')

    if customers.empty:
        return jsonify({})

    # Helper function to add subsidiary info to customer records
    def add_subsidiary_info(customer_df):
        results = []
        for _, customer in customer_df.iterrows():
            customer_data = {
                'account_id': customer['account_id'],
                'account_name': customer['account_name'],
                'annual_revenue': float(customer.get('annual_revenue', 0)),
                'health_status': customer.get('health_status'),
                'region': customer.get('region'),
                'churn_risk_score': float(customer.get('churn_risk_score', 0)),
                'subsidiaries': []
            }

            # Parse and add subsidiary information
            if customer.get('subsidiaries'):
                try:
                    subs = json.loads(customer['subsidiaries']) if isinstance(customer['subsidiaries'], str) else customer['subsidiaries']
                    customer_data['subsidiaries'] = subs
                    customer_data['subsidiary_count'] = len(subs)
                except:
                    pass

            results.append(customer_data)
        return results

    # Get customers by health status
    healthy_customers = add_subsidiary_info(
        customers[customers['health_status'] == 'Healthy'].head(10)
    )
    at_risk_customers_health = add_subsidiary_info(
        customers[customers['health_status'] == 'At-Risk'].head(10)
    )
    critical_customers = add_subsidiary_info(
        customers[customers['health_status'] == 'Critical'].head(10)
    )

    # Get customers by region
    region_samples = {}
    for region in customers['region'].unique():
        region_customers = customers[customers['region'] == region].head(5)
        region_samples[region] = add_subsidiary_info(region_customers)

    # Customer satisfaction metrics
    avg_nps = float(customers['nps_score'].mean()) if 'nps_score' in customers.columns else 0
    avg_csat = float(customers['csat_score'].mean()) if 'csat_score' in customers.columns else 0
    avg_ces = float(customers['ces_score'].mean()) if 'ces_score' in customers.columns else 0

    # Service metrics
    avg_support_tickets = float(customers['support_tickets_open'].mean()) if 'support_tickets_open' in customers.columns else 0
    avg_sla_compliance = float(customers['sla_compliance_rate'].mean()) if 'sla_compliance_rate' in customers.columns else 0
    total_revenue = float(customers['annual_revenue'].sum())
    total_customers_count = len(customers)

    summary = {
        'total_customers': total_customers_count,
        'total_revenue': total_revenue,
        'avg_health_score': float(customers['health_score'].mean()),
        'high_risk_customers': len(customers[customers['churn_risk_level'] == 'HIGH']),
        'health_distribution': customers['health_status'].value_counts().to_dict(),
        'risk_distribution': customers['churn_risk_level'].value_counts().to_dict(),
        'region_distribution': customers['region'].value_counts().to_dict(),
        'top_revenue_customers': add_subsidiary_info(
            customers.nlargest(10, 'annual_revenue')
        ),
        'at_risk_customers': add_subsidiary_info(
            customers[customers['churn_risk_level'] == 'HIGH'].head(10)
        ),
        'healthy_customers_sample': healthy_customers,
        'at_risk_customers_sample': at_risk_customers_health,
        'critical_customers_sample': critical_customers,
        'region_samples': region_samples,
        # Customer satisfaction metrics
        'avg_nps': avg_nps,
        'avg_csat': avg_csat,
        'avg_ces': avg_ces,
        # Service metrics
        'avg_support_tickets': avg_support_tickets,
        'avg_sla_compliance': avg_sla_compliance,
        'avg_revenue_per_customer': float(total_revenue / total_customers_count) if total_customers_count > 0 else 0
    }

    return jsonify(summary)


@app.route('/api/segment/recommendations', methods=['GET'])
def get_segment_recommendations():
    """Get aggregated recommendations for a customer segment"""
    filter_type = request.args.get('type')  # 'health' or 'region'
    filter_value = request.args.get('value')  # e.g., 'Healthy', 'East Africa'

    if not filter_type or not filter_value:
        return jsonify({'error': 'Missing type or value parameter'}), 400

    customers = data_loader.load_latest('customer_360_metrics')
    recommendations = data_loader.load_latest('recommendations')
    alerts = data_loader.load_latest('risk_alerts')

    if customers.empty:
        return jsonify({
            'segment_info': {},
            'top_recommendations': [],
            'critical_alerts': [],
            'segment_stats': {}
        })

    # Filter customers by segment
    if filter_type == 'health':
        segment_customers = customers[customers['health_status'] == filter_value]
    elif filter_type == 'region':
        segment_customers = customers[customers['region'] == filter_value]
    else:
        return jsonify({'error': 'Invalid filter type'}), 400

    if segment_customers.empty:
        return jsonify({
            'segment_info': {'filter_type': filter_type, 'filter_value': filter_value},
            'top_recommendations': [],
            'critical_alerts': [],
            'segment_stats': {'customer_count': 0}
        })

    segment_account_ids = segment_customers['account_id'].tolist()

    # Get recommendations for this segment
    segment_recommendations = []
    if not recommendations.empty:
        segment_recommendations = recommendations[
            recommendations['account_id'].isin(segment_account_ids)
        ]

        # Sort by priority and limit to top 5 most common
        priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
        segment_recommendations['priority_order'] = segment_recommendations['priority'].map(priority_order)
        segment_recommendations = segment_recommendations.sort_values('priority_order').head(5)

    # Get critical alerts for this segment
    segment_alerts = []
    if not alerts.empty:
        segment_alerts = alerts[
            (alerts['account_id'].isin(segment_account_ids)) &
            (alerts['severity'] == 'HIGH')
        ]
        segment_alerts = segment_alerts.head(5)

    # Calculate segment statistics
    segment_stats = {
        'customer_count': len(segment_customers),
        'total_revenue': float(segment_customers['annual_revenue'].sum()),
        'avg_health_score': float(segment_customers['health_score'].mean()),
        'high_risk_count': len(segment_customers[segment_customers['churn_risk_level'] == 'HIGH']),
        'at_risk_revenue': float(
            segment_customers[segment_customers['churn_risk_level'].isin(['HIGH', 'MEDIUM'])]['annual_revenue'].sum()
        ),
        'avg_churn_risk': float(segment_customers['churn_risk_score'].mean())
    }

    # Convert to dicts
    rec_results = segment_recommendations.to_dict('records') if not segment_recommendations.empty else []
    alert_results = segment_alerts.to_dict('records') if not segment_alerts.empty else []

    # Convert timestamps
    for rec in rec_results:
        for key, value in rec.items():
            if pd.api.types.is_datetime64_any_dtype(type(value)):
                rec[key] = value.isoformat()
            elif pd.isna(value):
                rec[key] = None

    for alert in alert_results:
        for key, value in alert.items():
            if pd.api.types.is_datetime64_any_dtype(type(value)):
                alert[key] = value.isoformat()
            elif pd.isna(value):
                alert[key] = None

    return jsonify({
        'segment_info': {
            'filter_type': filter_type,
            'filter_value': filter_value
        },
        'top_recommendations': rec_results,
        'critical_alerts': alert_results,
        'segment_stats': segment_stats
    })


@app.route('/api/chatbot/query', methods=['POST'])
def chatbot_query():
    """Answer questions about customer data using LLM"""
    data = request.get_json()
    query = data.get('query', '')
    conversation_history = data.get('history', [])

    if not query:
        return jsonify({'error': 'Query is required'}), 400

    try:
        # Load customer data for context
        customers = data_loader.load_latest('customer_360_metrics')

        # Get summary statistics
        summary_stats = {
            'total_customers': len(customers),
            'total_revenue': float(customers['annual_revenue'].sum()),
            'avg_health_score': float(customers['health_score'].mean()),
            'health_distribution': customers['health_status'].value_counts().to_dict(),
            'region_distribution': customers['region'].value_counts().to_dict(),
            'avg_churn_risk': float(customers['churn_risk_score'].mean()),
            'high_risk_customers': len(customers[customers['churn_risk_level'] == 'HIGH']),
            'avg_nps_score': float(customers['nps_score'].mean()),
            'avg_csat_score': float(customers['csat_score'].mean()),
            'avg_ces_score': float(customers['ces_score'].mean()),
            'avg_clv': float(customers['customer_lifetime_value'].mean()),
            'total_clv': float(customers['customer_lifetime_value'].sum()),
        }

        # Get top customers by revenue
        top_customers = customers.nlargest(5, 'annual_revenue')[
            ['account_name', 'annual_revenue', 'health_status', 'region']
        ].to_dict('records')

        # Get at-risk customers
        at_risk = customers[customers['health_status'].isin(['At-Risk', 'Critical'])][
            ['account_name', 'health_status', 'health_score', 'churn_risk_score', 'region']
        ].nlargest(5, 'churn_risk_score').to_dict('records')

        # Create context for LLM
        context = f"""You are a helpful AI assistant for a Customer 360° analytics platform for Cassava Technologies.
You have access to customer data and can answer questions about customer health, revenue, regions, satisfaction metrics, and recommendations.

Current Data Summary:
- Total Customers: {summary_stats['total_customers']}
- Total Annual Revenue: ${summary_stats['total_revenue']:,.2f}
- Average Health Score: {summary_stats['avg_health_score']:.1f}/100
- Health Distribution: {summary_stats['health_distribution']}
- Region Distribution: {summary_stats['region_distribution']}
- High Risk Customers: {summary_stats['high_risk_customers']}
- Average Churn Risk: {summary_stats['avg_churn_risk']:.1f}%

Customer Satisfaction Metrics:
- Average NPS (Net Promoter Score): {summary_stats['avg_nps_score']:.1f}
- Average CSAT (Customer Satisfaction): {summary_stats['avg_csat_score']:.1f}/100
- Average CES (Customer Effort Score): {summary_stats['avg_ces_score']:.1f}/10 (measures ease of doing business)
- Average CLV (Customer Lifetime Value): ${summary_stats['avg_clv']:,.2f}
- Total CLV: ${summary_stats['total_clv']:,.2f}

Top 5 Customers by Revenue:
{chr(10).join([f"- {c['account_name']}: ${c['annual_revenue']:,.2f} ({c['health_status']}, {c['region']})" for c in top_customers])}

Top 5 At-Risk Customers:
{chr(10).join([f"- {c['account_name']}: {c['health_status']} (Health: {c['health_score']:.1f}, Churn Risk: {c['churn_risk_score']:.1f}%, {c['region']})" for c in at_risk])}

Answer the user's question based on this data. Be concise, specific, and actionable.
Use **bold** for emphasis on key metrics and customer names.
If asked for recommendations, provide 2-3 specific, data-driven suggestions.
If the question cannot be answered with the available data, politely explain what information is available."""

        # Initialize OpenAI client (will use OPENAI_API_KEY env variable)
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY', 'sk-demo-key'))

        # Build messages for conversation
        messages = [{"role": "system", "content": context}]

        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-6:]:  # Keep last 6 messages for context
                if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
                    messages.append({"role": msg['role'], "content": msg['content']})

        # Add current query
        messages.append({"role": "user", "content": query})

        # Call OpenAI API (or return demo response if no API key)
        if not os.getenv('OPENAI_API_KEY') or os.getenv('OPENAI_API_KEY') == 'sk-demo-key':
            # Demo mode - return intelligent response based on query
            response_text = generate_demo_response(query, summary_stats, top_customers, at_risk, customers)
        else:
            # Real API call
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Cost-effective model
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            response_text = response.choices[0].message.content

        return jsonify({
            'response': response_text,
            'timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        import traceback
        logger.error(f"Chatbot error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Failed to process query',
            'message': str(e)
        }), 500


def generate_demo_response(query, stats, top_customers, at_risk, customers_df=None):
    """Generate demo responses when OpenAI API key is not available"""
    query_lower = query.lower()

    # Greeting queries
    greeting_words = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening']
    if any(word in query_lower for word in greeting_words):
        return f"Hello! I'm your Customer 360 Assistant. I can help you understand our customer data! We have **{stats['total_customers']} customers** with **${stats['total_revenue']:,.2f}** in annual revenue.\n\nAsk me about:\n- Customer health and risk\n- Revenue and top customers\n- Regional distribution\n- Satisfaction metrics (NPS, CSAT, CES, CLV)\n- Specific recommendations\n\nWhat would you like to know?"

    # Gratitude/Thank you queries
    gratitude_words = ['thank', 'thanks', 'appreciate', 'grateful', 'thx']
    if any(word in query_lower for word in gratitude_words):
        return "You're welcome! Is there anything else I can help you with?"

    # Specific customer queries - check if a customer name is mentioned
    if customers_df is not None:
        # Extract potential customer names from the query (simplified approach)
        for _, customer in customers_df.iterrows():
            customer_name = customer['account_name'].lower()
            if customer_name in query_lower:
                # Found a specific customer query
                return f"""**{customer['account_name']}** ({customer['region']})

**Health Status**: {customer['health_status']}
**Health Score**: {customer['health_score']:.1f}/100
**Churn Risk**: {customer['churn_risk_score']:.1f}% ({customer['churn_risk_level']} risk)
**Annual Revenue**: ${customer['annual_revenue']:,.2f}
**Customer Lifetime Value**: ${customer['customer_lifetime_value']:,.2f}

**Customer Satisfaction Metrics**:
- **NPS**: {customer['nps_score']:.0f}
- **CSAT**: {customer['csat_score']:.1f}/100
- **CES**: {customer['ces_score']:.1f}/10

**Summary**: This customer is currently in {customer['health_status'].lower()} status with a health score of {customer['health_score']:.1f}/100. {'They require immediate attention due to their critical status.' if customer['health_status'] == 'Critical' else 'They should be monitored closely.' if customer['health_status'] == 'At-Risk' else 'They are performing well.'}"""

    # Customer count queries
    if 'how many customer' in query_lower or 'total customer' in query_lower:
        return f"We currently have **{stats['total_customers']}** customers in our system. They are distributed across {len(stats['region_distribution'])} regions, with the highest concentration in {max(stats['region_distribution'], key=stats['region_distribution'].get)}."

    # Revenue queries
    elif 'revenue' in query_lower or 'money' in query_lower:
        return f"Our total annual revenue across all customers is **${stats['total_revenue']:,.2f}**. The top revenue generator is {top_customers[0]['account_name']} with ${top_customers[0]['annual_revenue']:,.2f} annual revenue."

    # Health queries
    elif 'health' in query_lower:
        healthy_count = stats['health_distribution'].get('Healthy', 0)
        at_risk_count = stats['health_distribution'].get('At-Risk', 0)
        critical_count = stats['health_distribution'].get('Critical', 0)
        return f"Customer health distribution:\n- **{healthy_count} Healthy** ({healthy_count/stats['total_customers']*100:.1f}%)\n- **{at_risk_count} At-Risk** ({at_risk_count/stats['total_customers']*100:.1f}%)\n- **{critical_count} Critical** ({critical_count/stats['total_customers']*100:.1f}%)\n\nAverage health score is **{stats['avg_health_score']:.1f}/100**."

    # Risk queries
    elif 'risk' in query_lower or 'churn' in query_lower:
        return f"We have **{stats['high_risk_customers']} high-risk customers** with an average churn risk of {stats['avg_churn_risk']:.1f}%. Top at-risk customer: {at_risk[0]['account_name']} ({at_risk[0]['health_status']}) with {at_risk[0]['churn_risk_score']:.1f}% churn risk."

    # Region queries
    elif 'region' in query_lower:
        regions_text = ', '.join([f"{region}: {count}" for region, count in stats['region_distribution'].items()])
        return f"Our customers are distributed across regions as follows:\n{regions_text}\n\nThe largest region is **{max(stats['region_distribution'], key=stats['region_distribution'].get)}** with {max(stats['region_distribution'].values())} customers."

    # NPS (Net Promoter Score) queries
    elif 'nps' in query_lower or 'net promoter' in query_lower:
        return f"Our average **NPS (Net Promoter Score)** is **{stats['avg_nps_score']:.1f}**. NPS measures customer loyalty and ranges from -100 to 100, with scores above 0 being good and above 50 being excellent. This indicates {'excellent' if stats['avg_nps_score'] > 50 else 'good' if stats['avg_nps_score'] > 0 else 'needs improvement'} customer loyalty."

    # CSAT (Customer Satisfaction) queries
    elif 'csat' in query_lower or 'customer satisfaction' in query_lower or 'satisfaction' in query_lower:
        return f"Our average **CSAT (Customer Satisfaction)** score is **{stats['avg_csat_score']:.1f}/100**. CSAT measures how satisfied customers are with our products and services. A score above 80 is considered excellent. Our current score indicates {'excellent' if stats['avg_csat_score'] >= 80 else 'good' if stats['avg_csat_score'] >= 70 else 'needs improvement'} customer satisfaction."

    # CES (Customer Effort Score) queries
    elif 'ces' in query_lower or 'customer effort' in query_lower or 'effort score' in query_lower:
        return f"Our average **CES (Customer Effort Score)** is **{stats['avg_ces_score']:.1f}/10**. CES measures how easy or difficult it is for customers to do business with Cassava Technologies. Lower scores are better, with scores below 3 being excellent. Our current score indicates {'excellent' if stats['avg_ces_score'] < 3 else 'good' if stats['avg_ces_score'] < 5 else 'needs improvement'} ease of doing business."

    # CLV (Customer Lifetime Value) queries
    elif 'clv' in query_lower or 'lifetime value' in query_lower or 'customer value' in query_lower:
        return f"Customer Lifetime Value (CLV) metrics:\n- **Average CLV**: ${stats['avg_clv']:,.2f} per customer\n- **Total CLV**: ${stats['total_clv']:,.2f} across all customers\n\nCLV represents the total revenue we can expect from a customer throughout their relationship with Cassava Technologies. Higher CLV indicates more valuable long-term customer relationships."

    # Top customer queries
    elif 'top customer' in query_lower or 'best customer' in query_lower:
        top_5_text = '\n'.join([f"{i+1}. **{c['account_name']}** - ${c['annual_revenue']:,.2f} ({c['health_status']})" for i, c in enumerate(top_customers)])
        return f"Here are our top 5 customers by revenue:\n\n{top_5_text}"

    # Recommendation queries
    elif 'recommend' in query_lower or 'should' in query_lower or 'action' in query_lower:
        return f"Based on the current data, here are my recommendations:\n\n1. **Focus on At-Risk Customers**: We have {stats['health_distribution'].get('At-Risk', 0) + stats['health_distribution'].get('Critical', 0)} customers needing attention. Prioritize {at_risk[0]['account_name']} with {at_risk[0]['churn_risk_score']:.1f}% churn risk.\n\n2. **Revenue Protection**: Ensure top revenue accounts remain healthy. {top_customers[0]['account_name']} generates ${top_customers[0]['annual_revenue']:,.2f} and is currently {top_customers[0]['health_status']}.\n\n3. **Regional Strategy**: {max(stats['region_distribution'], key=stats['region_distribution'].get)} has the most customers - consider region-specific initiatives."

    # Default response
    else:
        return f"I can help you understand our customer data! We have {stats['total_customers']} customers with ${stats['total_revenue']:,.2f} in annual revenue. Ask me about:\n- Customer health and risk\n- Revenue and top customers\n- Regional distribution\n- Satisfaction metrics (NPS, CSAT, CES, CLV)\n- Specific recommendations\n\nWhat would you like to know?"


@app.route('/api/subsidiaries', methods=['GET'])
def get_subsidiaries():
    """Get list of all Cassava Group subsidiaries"""
    import json
    from pathlib import Path

    config_path = Path(__file__).parent.parent / 'config' / 'subsidiaries.json'
    with open(config_path, 'r') as f:
        subsidiary_config = json.load(f)

    return jsonify(subsidiary_config)


@app.route('/api/subsidiary/<subsidiary_id>/customers', methods=['GET'])
def get_subsidiary_customers(subsidiary_id: str):
    """Get all customers for a specific subsidiary"""
    customers = data_loader.load_latest('customer_360_metrics')

    if customers.empty:
        return jsonify([])

    # Filter customers who have relationship with this subsidiary
    filtered_customers = []
    logger.info(f"Filtering customers for subsidiary: {subsidiary_id}")
    logger.info(f"Total customers loaded: {len(customers)}")

    for idx, customer in customers.iterrows():
        subs_field = customer.get('subsidiaries')
        if subs_field:
            try:
                subs = json.loads(subs_field) if isinstance(subs_field, str) else subs_field
                # Check if this subsidiary is in the customer's subsidiaries
                if any(sub['subsidiary_id'] == subsidiary_id for sub in subs):
                    filtered_customers.append({
                        'account_id': customer['account_id'],
                        'account_name': customer['account_name'],
                        'region': customer['region'],
                        'health_status': customer['health_status'],
                        'annual_revenue': customer.get('annual_revenue', 0),
                        'primary_subsidiary': customer.get('primary_subsidiary')
                    })
            except Exception as e:
                logger.warning(f"Error parsing subsidiaries for customer {customer.get('account_id')}: {e}")
                continue

    logger.info(f"Found {len(filtered_customers)} customers for subsidiary {subsidiary_id}")
    return jsonify(filtered_customers)


@app.route('/api/subsidiary/<subsidiary_id>/stats', methods=['GET'])
def get_subsidiary_stats(subsidiary_id: str):
    """Get statistics for a specific subsidiary"""
    customers = data_loader.load_latest('customer_360_metrics')

    if customers.empty:
        return jsonify({})

    total_customers = 0
    total_revenue = 0
    total_tickets = 0

    for _, customer in customers.iterrows():
        if customer.get('subsidiaries'):
            try:
                subs = json.loads(customer['subsidiaries'])
                for sub in subs:
                    if sub['subsidiary_id'] == subsidiary_id:
                        total_customers += 1
                        total_revenue += sub.get('annual_revenue', 0)
                        total_tickets += sub.get('tickets_count', 0)
            except:
                continue

    return jsonify({
        'subsidiary_id': subsidiary_id,
        'total_customers': total_customers,
        'total_revenue': total_revenue,
        'total_tickets': total_tickets,
        'avg_revenue_per_customer': total_revenue / total_customers if total_customers > 0 else 0
    })


@app.route('/api/subsidiary/<subsidiary_id>/dashboard', methods=['GET'])
def get_subsidiary_dashboard(subsidiary_id: str):
    """Get comprehensive dashboard metrics for a specific subsidiary"""
    customers = data_loader.load_latest('customer_360_metrics')

    if customers.empty:
        return jsonify({})

    # Filter customers who have relationship with this subsidiary
    subsidiary_customers = []
    subsidiary_revenues = {}  # Map of account_id to subsidiary-specific revenue

    for _, customer in customers.iterrows():
        if customer.get('subsidiaries'):
            try:
                subs = json.loads(customer['subsidiaries'])
                for sub in subs:
                    if sub['subsidiary_id'] == subsidiary_id:
                        subsidiary_customers.append(customer)
                        subsidiary_revenues[customer['account_id']] = sub.get('annual_revenue', 0)
                        break  # Found this subsidiary, move to next customer
            except:
                continue

    if not subsidiary_customers:
        return jsonify({
            'subsidiary_id': subsidiary_id,
            'total_customers': 0,
            'total_revenue': 0,
            'avg_health_score': 0,
            'high_risk_customers': 0,
            'health_distribution': {},
            'risk_distribution': {},
            'region_distribution': {},
            'top_revenue_customers': [],
            'at_risk_customers': [],
            'avg_nps': 0,
            'avg_csat': 0,
            'avg_ces': 0
        })

    # Convert to DataFrame for easier aggregation
    sub_df = pd.DataFrame(subsidiary_customers)

    # Calculate aggregate metrics
    total_revenue = sum(subsidiary_revenues.values())
    avg_health_score = float(sub_df['health_score'].mean())
    high_risk_customers = len(sub_df[sub_df['churn_risk_level'] == 'HIGH'])

    # Distributions
    health_distribution = sub_df['health_status'].value_counts().to_dict()
    risk_distribution = sub_df['churn_risk_level'].value_counts().to_dict()
    region_distribution = sub_df['region'].value_counts().to_dict()

    # Top revenue customers (by subsidiary-specific revenue)
    top_customers = []
    for _, customer in sub_df.iterrows():
        top_customers.append({
            'account_id': customer['account_id'],
            'account_name': customer['account_name'],
            'annual_revenue': subsidiary_revenues.get(customer['account_id'], 0),
            'health_status': customer['health_status'],
            'region': customer['region']
        })
    top_customers = sorted(top_customers, key=lambda x: x['annual_revenue'], reverse=True)[:10]

    # At-risk customers
    at_risk_df = sub_df[sub_df['churn_risk_level'] == 'HIGH']
    at_risk_customers = []
    for _, customer in at_risk_df.iterrows():
        at_risk_customers.append({
            'account_id': customer['account_id'],
            'account_name': customer['account_name'],
            'churn_risk_score': float(customer['churn_risk_score']),
            'annual_revenue': subsidiary_revenues.get(customer['account_id'], 0),
            'health_status': customer['health_status']
        })
    at_risk_customers = sorted(at_risk_customers, key=lambda x: x['churn_risk_score'], reverse=True)[:10]

    # Customer satisfaction metrics
    avg_nps = float(sub_df['nps_score'].mean()) if 'nps_score' in sub_df.columns else 0
    avg_csat = float(sub_df['csat_score'].mean()) if 'csat_score' in sub_df.columns else 0
    avg_ces = float(sub_df['ces_score'].mean()) if 'ces_score' in sub_df.columns else 0

    # Service metrics
    avg_support_tickets = float(sub_df['support_tickets_open'].mean()) if 'support_tickets_open' in sub_df.columns else 0
    avg_sla_compliance = float(sub_df['sla_compliance_rate'].mean()) if 'sla_compliance_rate' in sub_df.columns else 0

    return jsonify({
        'subsidiary_id': subsidiary_id,
        'total_customers': len(sub_df),
        'total_revenue': float(total_revenue),
        'avg_health_score': avg_health_score,
        'high_risk_customers': high_risk_customers,
        'health_distribution': health_distribution,
        'risk_distribution': risk_distribution,
        'region_distribution': region_distribution,
        'top_revenue_customers': top_customers,
        'at_risk_customers': at_risk_customers,
        'avg_nps': avg_nps,
        'avg_csat': avg_csat,
        'avg_ces': avg_ces,
        'avg_support_tickets': avg_support_tickets,
        'avg_sla_compliance': avg_sla_compliance,
        'avg_revenue_per_customer': float(total_revenue / len(sub_df)) if len(sub_df) > 0 else 0
    })


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting Customer 360 API server on port {port}...")
    app.run(debug=True, host='0.0.0.0', port=port)
