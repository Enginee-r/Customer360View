"""
Sample Data Generator
Creates sample data for testing the Customer 360 pipeline without Salesforce access
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
import random
import string

# Seed for reproducibility
np.random.seed(42)
random.seed(42)

# Output paths
SILVER_PATH = Path('./data/silver')
SILVER_PATH.mkdir(parents=True, exist_ok=True)


def random_string(length=10):
    """Generate random string"""
    return ''.join(random.choices(string.ascii_uppercase, k=length))


def generate_accounts(n=3000):
    """Generate sample account data"""
    # Match the regions from the dashboard UI
    regions = ['East Africa', 'West Africa', 'Southern Africa', 'Central Africa', 'North Africa']
    region_weights = [0.30, 0.26, 0.22, 0.16, 0.07]  # Distribute according to UI numbers
    account_types = ['Enterprise', 'Wholesale', 'SMB']
    industries = ['Telecommunications', 'Financial Services', 'Healthcare', 'Retail', 'Manufacturing']

    companies = [
        'Acme Corp', 'Global Telecom', 'Tech Solutions', 'Enterprise Systems',
        'Digital Networks', 'Cloud Services Inc', 'Data Systems Ltd',
        'Network Providers', 'Wireless Solutions', 'Broadband Plus',
        'Fiber Networks', 'Mobile Connect', 'Satellite Systems',
        'Internet Services', 'Communication Hub', 'Telecom Partners',
        'Network Solutions', 'Digital Connect', 'Tech Partners',
        'Enterprise Networks', 'Global Connect', 'Wireless Tech'
    ]

    accounts = []
    for i in range(n):
        account_id = f'ACC{random_string(15)}'
        base_name = random.choice(companies)

        # Use weighted random choice for regions to match dashboard distribution
        region = random.choices(regions, weights=region_weights, k=1)[0]

        # Add region suffix for more variety
        if i < 100:
            account_name = f'{base_name} {region}'
        else:
            account_name = f'{base_name} {i}'

        customer_since = datetime.now() - timedelta(days=random.randint(365, 3650))

        accounts.append({
            'account_id': account_id,
            'account_name': account_name,
            'account_type': random.choice(account_types),
            'region': region,
            'annual_revenue_usd': random.uniform(100000, 10000000),
            'customer_since': customer_since.date(),
            'industry': random.choice(industries),
            'employee_count': random.randint(50, 10000),
            'account_rating': random.choice(['Hot', 'Warm', 'Cold']),
            'parent_account_id': f'PARENT{random_string(10)}' if random.random() > 0.7 else None,
            '_processed_at': datetime.utcnow(),
            '_layer': 'silver'
        })

    return pd.DataFrame(accounts)


def generate_opportunities(accounts_df, n_per_account_avg=3):
    """Generate sample opportunity data"""
    stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
    product_lines = ['Mobile', 'Fiber', 'Cloud', 'IoT', 'Data Center']

    opportunities = []

    for _, account in accounts_df.iterrows():
        n_opps = random.randint(1, n_per_account_avg * 2)

        for i in range(n_opps):
            opp_id = f'OPP{random_string(15)}'
            stage = random.choice(stages)
            is_closed = stage in ['Closed Won', 'Closed Lost']
            is_won = stage == 'Closed Won'

            close_date = None
            if is_closed:
                close_date = (datetime.now() - timedelta(days=random.randint(0, 730))).date()

            opportunities.append({
                'opportunity_id': opp_id,
                'account_id': account['account_id'],
                'opportunity_name': f'{random.choice(product_lines)} Expansion {i+1}',
                'deal_value': random.uniform(10000, 1000000) if is_won else random.uniform(5000, 500000),
                'stage': stage,
                'close_date': close_date,
                'win_probability': 1.0 if is_won else (0.0 if is_closed else random.uniform(0.1, 0.9)),
                'product_line': random.choice(product_lines),
                'is_won': is_won,
                'is_closed': is_closed,
                '_processed_at': datetime.utcnow(),
                '_layer': 'silver'
            })

    return pd.DataFrame(opportunities)


def generate_line_items(opportunities_df, n_per_opp_avg=2):
    """Generate sample opportunity line items"""
    products = [
        'Mobile Data Plan', 'Fiber Internet', 'Cloud Storage', 'IoT Platform',
        'Data Center Hosting', 'VoIP Service', 'SD-WAN', 'Security Suite'
    ]

    line_items = []

    for _, opp in opportunities_df.iterrows():
        if not opp['is_closed']:
            continue  # Only add line items for closed deals

        n_items = random.randint(1, n_per_opp_avg * 2)

        for i in range(n_items):
            quantity = random.randint(1, 100)
            unit_price = random.uniform(50, 5000)

            line_items.append({
                'line_item_id': f'LI{random_string(15)}',
                'opportunity_id': opp['opportunity_id'],
                'product_id': f'PROD{random_string(10)}',
                'product_name': random.choice(products),
                'quantity': quantity,
                'unit_price': unit_price,
                'discount': random.uniform(0, 0.2),
                'total_price': quantity * unit_price * (1 - random.uniform(0, 0.2)),
                '_processed_at': datetime.utcnow(),
                '_layer': 'silver'
            })

    return pd.DataFrame(line_items)


def generate_contacts(accounts_df, n_per_account_avg=3):
    """Generate sample contact data"""
    first_names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']
    titles = ['CEO', 'CTO', 'VP Engineering', 'Director IT', 'Account Manager', 'Project Manager']
    departments = ['Executive', 'IT', 'Operations', 'Finance', 'Sales']

    contacts = []

    for _, account in accounts_df.iterrows():
        n_contacts = random.randint(1, n_per_account_avg * 2)

        for i in range(n_contacts):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            email = f'{first_name.lower()}.{last_name.lower()}@{account["account_name"].lower().replace(" ", "")}.com'

            contacts.append({
                'contact_id': f'CON{random_string(15)}',
                'account_id': account['account_id'],
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'phone': f'+1-{random.randint(200, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}',
                'role': random.choice(titles),
                'department': random.choice(departments),
                '_processed_at': datetime.utcnow(),
                '_layer': 'silver'
            })

    return pd.DataFrame(contacts)


def generate_tickets(accounts_df, n_per_account_avg=15):
    """Generate sample support ticket data"""
    priorities = ['Low', 'Medium', 'High', 'Critical']
    statuses = ['Open', 'In Progress', 'Pending Customer', 'Resolved', 'Closed']
    categories = ['Technical Issue', 'Billing Question', 'Service Request', 'Feature Request', 'Bug Report', 'Performance Issue']

    tickets = []

    for _, account in accounts_df.iterrows():
        n_tickets = random.randint(int(n_per_account_avg * 0.5), int(n_per_account_avg * 1.5))

        for i in range(n_tickets):
            ticket_id = f'CASE{random_string(15)}'
            status = random.choice(statuses)
            is_closed = status in ['Resolved', 'Closed']

            created_date = datetime.now() - timedelta(days=random.randint(0, 730))

            # Calculate resolution time based on priority
            priority = random.choice(priorities)
            if is_closed:
                if priority == 'Critical':
                    response_hours = random.uniform(0.5, 4)
                    resolution_hours = random.uniform(4, 24)
                elif priority == 'High':
                    response_hours = random.uniform(1, 8)
                    resolution_hours = random.uniform(8, 48)
                elif priority == 'Medium':
                    response_hours = random.uniform(2, 12)
                    resolution_hours = random.uniform(24, 96)
                else:  # Low
                    response_hours = random.uniform(4, 24)
                    resolution_hours = random.uniform(48, 168)

                closed_date = created_date + timedelta(hours=resolution_hours)
            else:
                response_hours = random.uniform(0.5, 48)
                resolution_hours = None
                closed_date = None

            tickets.append({
                'ticket_id': ticket_id,
                'account_id': account['account_id'],
                'subject': f'{random.choice(categories)} - {account["account_name"]}',
                'priority': priority,
                'status': status,
                'category': random.choice(categories),
                'created_date': created_date,
                'closed_date': closed_date,
                'response_time_hours': response_hours,
                'resolution_time_hours': resolution_hours,
                'is_sla_violated': random.random() < 0.05,  # 5% SLA violations
                'customer_satisfaction': random.uniform(3.5, 5.0) if is_closed else None,
                '_processed_at': datetime.utcnow(),
                '_layer': 'silver'
            })

    return pd.DataFrame(tickets)


def generate_invoices(accounts_df, n_per_account_avg=12):
    """Generate sample invoice data"""
    payment_statuses = ['Paid', 'Paid', 'Paid', 'Paid', 'Paid', 'Partially Paid', 'Overdue', 'Pending']  # Weighted towards paid
    payment_methods = ['Wire Transfer', 'Credit Card', 'ACH', 'Check']

    invoices = []

    for _, account in accounts_df.iterrows():
        n_invoices = random.randint(int(n_per_account_avg * 0.5), int(n_per_account_avg * 1.5))

        for i in range(n_invoices):
            invoice_id = f'INV{random_string(15)}'
            status = random.choice(payment_statuses)

            invoice_date = datetime.now() - timedelta(days=random.randint(0, 730))
            due_date = invoice_date + timedelta(days=30)  # Net 30 terms

            invoice_amount = random.uniform(5000, 100000)

            if status == 'Paid':
                paid_date = due_date - timedelta(days=random.randint(-10, 20))
                paid_amount = invoice_amount
                overdue_days = 0
            elif status == 'Partially Paid':
                paid_date = due_date + timedelta(days=random.randint(5, 30))
                paid_amount = invoice_amount * random.uniform(0.3, 0.8)
                overdue_days = max(0, (datetime.now() - due_date).days)
            elif status == 'Overdue':
                paid_date = None
                paid_amount = 0
                overdue_days = max(1, (datetime.now() - due_date).days)
            else:  # Pending
                paid_date = None
                paid_amount = 0
                overdue_days = 0 if datetime.now() < due_date else (datetime.now() - due_date).days

            invoices.append({
                'invoice_id': invoice_id,
                'account_id': account['account_id'],
                'invoice_number': f'INV-{datetime.now().year}-{i+1:05d}',
                'invoice_date': invoice_date,
                'due_date': due_date,
                'invoice_amount': invoice_amount,
                'paid_amount': paid_amount,
                'balance': invoice_amount - paid_amount,
                'status': status,
                'paid_date': paid_date,
                'payment_method': random.choice(payment_methods) if paid_amount > 0 else None,
                'overdue_days': overdue_days,
                'disputed': random.random() < 0.02,  # 2% disputed
                '_processed_at': datetime.utcnow(),
                '_layer': 'silver'
            })

    return pd.DataFrame(invoices)


def main():
    """Generate all sample data"""
    print("Generating sample data for Customer 360 testing...")

    # Generate accounts
    print("1. Generating accounts...")
    accounts = generate_accounts()  # Will use default n=3000
    accounts.to_parquet(SILVER_PATH / 'silver_account_sample.parquet', index=False)
    print(f"   Created {len(accounts)} accounts")

    # Generate opportunities
    print("2. Generating opportunities...")
    opportunities = generate_opportunities(accounts)
    opportunities.to_parquet(SILVER_PATH / 'silver_opportunity_sample.parquet', index=False)
    print(f"   Created {len(opportunities)} opportunities")

    # Generate line items
    print("3. Generating line items...")
    line_items = generate_line_items(opportunities)
    line_items.to_parquet(SILVER_PATH / 'silver_opportunity_line_item_sample.parquet', index=False)
    print(f"   Created {len(line_items)} line items")

    # Generate contacts
    print("4. Generating contacts...")
    contacts = generate_contacts(accounts)
    contacts.to_parquet(SILVER_PATH / 'silver_contact_sample.parquet', index=False)
    print(f"   Created {len(contacts)} contacts")

    # Generate tickets
    print("5. Generating support tickets...")
    tickets = generate_tickets(accounts)
    tickets.to_parquet(SILVER_PATH / 'silver_ticket_sample.parquet', index=False)
    print(f"   Created {len(tickets)} tickets")

    # Generate invoices
    print("6. Generating invoices...")
    invoices = generate_invoices(accounts)
    invoices.to_parquet(SILVER_PATH / 'silver_invoice_sample.parquet', index=False)
    print(f"   Created {len(invoices)} invoices")

    # Print summary
    print("\n✅ Sample data generation complete!")
    print(f"\nFiles created in {SILVER_PATH}:")
    print("  - silver_account_sample.parquet")
    print("  - silver_opportunity_sample.parquet")
    print("  - silver_opportunity_line_item_sample.parquet")
    print("  - silver_contact_sample.parquet")
    print("  - silver_ticket_sample.parquet")
    print("  - silver_invoice_sample.parquet")

    print("\n📊 Summary Statistics:")
    print(f"  Total Accounts: {len(accounts)}")
    print(f"  Total Opportunities: {len(opportunities)}")
    print(f"  Closed Won Opportunities: {len(opportunities[opportunities['is_won']])}")
    print(f"  Total Revenue (Closed Won): ${opportunities[opportunities['is_won']]['deal_value'].sum():,.2f}")
    print(f"  Average Deal Size: ${opportunities[opportunities['is_won']]['deal_value'].mean():,.2f}")

    print("\n🔧 Next Steps:")
    print("  1. Run: python scripts/aggregate_gold.py")
    print("  2. Start API: python api/app.py")
    print("  3. Start Dashboard: cd dashboard && npm run dev")


if __name__ == '__main__':
    main()
