"""
Customer 360 API
REST API for serving customer analytics data to the dashboard
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from pathlib import Path
import pandas as pd
from datetime import datetime
import logging
import os
from openai import OpenAI

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Data paths
DATA_PATH = Path('../data/gold')


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

    # Convert to dict
    results = filtered[['account_id', 'account_name', 'region', 'health_status']].to_dict('records')

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

    # Convert timestamps to ISO format
    for key, value in customer_data.items():
        if pd.api.types.is_datetime64_any_dtype(type(value)):
            customer_data[key] = value.isoformat()
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

    summary = {
        'total_customers': len(customers),
        'total_revenue': float(customers['annual_revenue'].sum()),
        'avg_health_score': float(customers['health_score'].mean()),
        'high_risk_customers': len(customers[customers['churn_risk_level'] == 'HIGH']),
        'health_distribution': customers['health_status'].value_counts().to_dict(),
        'risk_distribution': customers['churn_risk_level'].value_counts().to_dict(),
        'top_revenue_customers': customers.nlargest(10, 'annual_revenue')[
            ['account_id', 'account_name', 'annual_revenue', 'health_status']
        ].to_dict('records'),
        'at_risk_customers': customers[customers['churn_risk_level'] == 'HIGH'][
            ['account_id', 'account_name', 'churn_risk_score', 'annual_revenue']
        ].to_dict('records')
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
        context = f"""You are a helpful AI assistant for a Customer 360° analytics platform.
You have access to customer data and can answer questions about customer health, revenue, regions, and recommendations.

Current Data Summary:
- Total Customers: {summary_stats['total_customers']}
- Total Annual Revenue: ${summary_stats['total_revenue']:,.2f}
- Average Health Score: {summary_stats['avg_health_score']:.1f}/100
- Health Distribution: {summary_stats['health_distribution']}
- Region Distribution: {summary_stats['region_distribution']}
- High Risk Customers: {summary_stats['high_risk_customers']}
- Average Churn Risk: {summary_stats['avg_churn_risk']:.1f}%

Top 5 Customers by Revenue:
{chr(10).join([f"- {c['account_name']}: ${c['annual_revenue']:,.2f} ({c['health_status']}, {c['region']})" for c in top_customers])}

Top 5 At-Risk Customers:
{chr(10).join([f"- {c['account_name']}: {c['health_status']} (Health: {c['health_score']:.1f}, Churn Risk: {c['churn_risk_score']:.1f}%, {c['region']})" for c in at_risk])}

Answer the user's question based on this data. Be concise, specific, and actionable.
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
        return f"Hello! I'm your Customer 360 Assistant. I can help you understand our customer data! We have **{stats['total_customers']} customers** with **${stats['total_revenue']:,.2f}** in annual revenue.\n\nAsk me about:\n- Customer health and risk\n- Revenue and top customers\n- Regional distribution\n- Specific recommendations\n\nWhat would you like to know?"

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

    # Top customer queries
    elif 'top customer' in query_lower or 'best customer' in query_lower:
        top_5_text = '\n'.join([f"{i+1}. **{c['account_name']}** - ${c['annual_revenue']:,.2f} ({c['health_status']})" for i, c in enumerate(top_customers)])
        return f"Here are our top 5 customers by revenue:\n\n{top_5_text}"

    # Recommendation queries
    elif 'recommend' in query_lower or 'should' in query_lower or 'action' in query_lower:
        return f"Based on the current data, here are my recommendations:\n\n1. **Focus on At-Risk Customers**: We have {stats['health_distribution'].get('At-Risk', 0) + stats['health_distribution'].get('Critical', 0)} customers needing attention. Prioritize {at_risk[0]['account_name']} with {at_risk[0]['churn_risk_score']:.1f}% churn risk.\n\n2. **Revenue Protection**: Ensure top revenue accounts remain healthy. {top_customers[0]['account_name']} generates ${top_customers[0]['annual_revenue']:,.2f} and is currently {top_customers[0]['health_status']}.\n\n3. **Regional Strategy**: {max(stats['region_distribution'], key=stats['region_distribution'].get)} has the most customers - consider region-specific initiatives."

    # Default response
    else:
        return f"I can help you understand our customer data! We have {stats['total_customers']} customers with ${stats['total_revenue']:,.2f} in annual revenue. Ask me about:\n- Customer health and risk\n- Revenue and top customers\n- Regional distribution\n- Specific recommendations\n\nWhat would you like to know?"


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting Customer 360 API server on port {port}...")
    app.run(debug=True, host='0.0.0.0', port=port)
