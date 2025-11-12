# Azure Synapse Integration Guide

This guide explains how to connect your Customer 360 platform to Azure Synapse Analytics.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Install Dependencies](#step-1-install-dependencies)
3. [Step 2: Configure Synapse Connection](#step-2-configure-synapse-connection)
4. [Step 3: Prepare Your Synapse Tables](#step-3-prepare-your-synapse-tables)
5. [Step 4: Switch to Synapse Mode](#step-4-switch-to-synapse-mode)
6. [Step 5: Test the Connection](#step-5-test-the-connection)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Azure Synapse Workspace
- Active Azure Synapse Analytics workspace
- Dedicated SQL pool or Serverless SQL pool
- Network access configured (firewall rules)

### 2. ODBC Driver (macOS/Linux)
For macOS:
```bash
# Install Microsoft ODBC Driver 17 or 18
brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
brew update
brew install msodbcsql17

# OR for ODBC Driver 18
brew install msodbcsql18
```

For Linux (Ubuntu/Debian):
```bash
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt-get update
sudo ACCEPT_EULA=Y apt-get install -y msodbcsql17
```

### 3. Authentication Details
You'll need one of:
- **SQL Authentication**: Username and password
- **Azure AD Service Principal**: Tenant ID, Client ID, Client Secret

---

## Step 1: Install Dependencies

```bash
cd /Users/robertselemani/Customer360View/python-starter

# Activate virtual environment
source venv/bin/activate

# Install Synapse dependencies
pip install pyodbc sqlalchemy

# Or install all requirements
pip install -r requirements.txt
```

---

## Step 2: Configure Synapse Connection

### Option A: Environment Variables (Recommended)

Create a `.env.synapse` file in the `api/` directory:

```bash
cp api/.env.synapse.example api/.env.synapse
```

Edit `api/.env.synapse` with your actual values:

```bash
# Synapse Server Details
SYNAPSE_SERVER=your-workspace.sql.azuresynapse.net
SYNAPSE_DATABASE=customer360_db
SYNAPSE_PORT=1433

# SQL Authentication
SYNAPSE_AUTH_METHOD=sql
SYNAPSE_USERNAME=sqladmin
SYNAPSE_PASSWORD=YourStrongPassword123!

# Schema Configuration
SYNAPSE_GOLD_SCHEMA=gold

# Data Source Mode
DATA_SOURCE=synapse
```

### Option B: Azure AD Authentication

For service principal authentication:

```bash
# Azure AD Authentication
SYNAPSE_AUTH_METHOD=aad
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### Load environment variables

Add to your shell profile or run before starting the API:

```bash
export $(cat api/.env.synapse | xargs)
```

---

## Step 3: Prepare Your Synapse Tables

### 3.1 Create Gold Schema

Connect to your Synapse SQL pool and create the schema:

```sql
CREATE SCHEMA gold;
GO
```

### 3.2 Create Tables

The platform expects the following tables in the `gold` schema:

#### Customer 360 Metrics Table
```sql
CREATE TABLE gold.customer_360_metrics (
    account_id VARCHAR(50) PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    health_status VARCHAR(50),
    annual_revenue DECIMAL(18, 2),
    monthly_recurring_revenue DECIMAL(18, 2),
    customer_lifetime_value DECIMAL(18, 2),
    active_services INT,
    open_support_tickets INT,
    avg_response_time_hours DECIMAL(10, 2),
    churn_risk_score DECIMAL(5, 2),
    yoy_growth_percentage DECIMAL(5, 2),
    contract_end_date DATE,
    customer_since DATE,
    last_updated_at DATETIME DEFAULT GETDATE()
);
```

#### Alerts Table
```sql
CREATE TABLE gold.alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL,
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    title VARCHAR(255),
    description TEXT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (account_id) REFERENCES gold.customer_360_metrics(account_id)
);
```

#### Recommendations Table
```sql
CREATE TABLE gold.recommendations (
    recommendation_id VARCHAR(50) PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL,
    priority VARCHAR(20),
    action_type VARCHAR(50),
    action_title VARCHAR(255),
    action_description TEXT,
    expected_outcome TEXT,
    estimated_impact_revenue DECIMAL(18, 2),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (account_id) REFERENCES gold.customer_360_metrics(account_id)
);
```

#### Timeline Table
```sql
CREATE TABLE gold.timeline (
    event_id VARCHAR(50) PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(50),
    event_title VARCHAR(255),
    event_description TEXT,
    event_date DATETIME,
    severity VARCHAR(20),
    related_amount DECIMAL(18, 2),
    status VARCHAR(50),
    FOREIGN KEY (account_id) REFERENCES gold.customer_360_metrics(account_id)
);
```

### 3.3 Load Your Data

Use your existing ETL pipeline (Bronze → Silver → Gold) to populate these tables in Synapse. Example:

```sql
-- Insert sample data (replace with your actual data pipeline)
INSERT INTO gold.customer_360_metrics
SELECT
    account_id,
    account_name,
    region,
    health_status,
    annual_revenue,
    -- ... other columns
FROM your_source_table;
```

---

## Step 4: Switch to Synapse Mode

### Update API Code

Edit `api/app.py` to use the new HybridDataLoader:

```python
# Replace the existing DataLoader import and usage
from synapse_data_loader import HybridDataLoader

# Initialize data loader (reads DATA_SOURCE from environment)
data_loader = HybridDataLoader()

# Or explicitly set mode
# data_loader = HybridDataLoader(mode='synapse')
```

### Start API with Synapse Mode

```bash
cd api

# Load Synapse environment variables
export $(cat .env.synapse | xargs)

# Start the API
PORT=5001 python app.py
```

The API will now connect to Synapse instead of local files.

---

## Step 5: Test the Connection

### 5.1 Test Connection Script

Create a test script `api/test_synapse_connection.py`:

```python
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from synapse_data_loader import HybridDataLoader
import logging

logging.basicConfig(level=logging.INFO)

def test_connection():
    print("Testing Synapse connection...")

    # Initialize loader
    loader = HybridDataLoader(mode='synapse')

    # Test health check
    health = loader.health_check()
    print(f"\nHealth Check: {health}")

    # List available tables
    tables = loader.get_available_tables()
    print(f"\nAvailable tables: {tables}")

    # Try loading a sample table
    if 'customer_360_metrics' in tables:
        df = loader.load_latest('customer_360_metrics')
        print(f"\nLoaded {len(df)} customers")
        print(f"Columns: {df.columns.tolist()}")
        print(f"\nSample data:\n{df.head()}")
    else:
        print("\nWarning: customer_360_metrics table not found")

    print("\n✅ Connection test complete!")

if __name__ == '__main__':
    test_connection()
```

Run the test:

```bash
cd api
export $(cat .env.synapse | xargs)
python test_synapse_connection.py
```

### 5.2 Test API Endpoints

With the API running, test endpoints:

```bash
# Health check
curl http://localhost:5001/api/health

# Get customers
curl http://localhost:5001/api/customers

# Get specific customer
curl http://localhost:5001/api/customer/ACCQAHFTRXCKAFNAFQ
```

---

## Switching Between Local and Synapse Modes

You can easily switch between development (local files) and production (Synapse):

### For Local Development:
```bash
export DATA_SOURCE=local
python app.py
```

### For Production (Synapse):
```bash
export DATA_SOURCE=synapse
python app.py
```

This allows you to:
- Develop locally with sample data
- Test with production data from Synapse
- Deploy to production seamlessly

---

## Troubleshooting

### Issue: "ODBC Driver not found"

**Solution**: Install Microsoft ODBC Driver

```bash
# macOS
brew install msodbcsql17

# Check installed drivers
odbcinst -q -d
```

### Issue: "Login failed for user"

**Possible causes**:
1. Wrong credentials → Check username/password
2. Firewall blocking → Add your IP to Synapse firewall rules
3. Database doesn't exist → Verify database name

**Test connection manually**:
```bash
isql -v "DRIVER={ODBC Driver 17 for SQL Server};SERVER=your-server.sql.azuresynapse.net;DATABASE=your_db;UID=username;PWD=password"
```

### Issue: "Table not found"

**Solution**: Ensure tables exist in the `gold` schema

```sql
-- List all tables in gold schema
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'gold';
```

### Issue: "Connection timeout"

**Possible causes**:
1. Network issues → Check VPN/network connectivity
2. Synapse pool paused → Resume SQL pool in Azure Portal
3. Firewall rules → Ensure your IP is whitelisted

### Issue: "Slow query performance"

**Solutions**:
1. Add indexes to frequently queried columns
2. Use column store indexes for large tables
3. Increase cache TTL in code (default 5 minutes)
4. Consider creating materialized views

```sql
-- Example: Add index
CREATE INDEX idx_account_id ON gold.alerts(account_id);
```

### Enable Debug Logging

Add to your code:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## Advanced Configuration

### Custom Query Example

```python
# In your API code
from synapse_data_loader import HybridDataLoader

loader = HybridDataLoader(mode='synapse')

# Execute custom SQL
query = """
SELECT
    c.account_name,
    c.annual_revenue,
    COUNT(a.alert_id) as alert_count
FROM gold.customer_360_metrics c
LEFT JOIN gold.alerts a ON c.account_id = a.account_id
WHERE c.health_status = 'Critical'
GROUP BY c.account_name, c.annual_revenue
ORDER BY c.annual_revenue DESC
"""

critical_customers = loader.execute_query(query)
```

### Connection Pooling

The loader uses SQLAlchemy connection pooling by default:
- Pool size: 5 connections (configurable via `SYNAPSE_POOL_SIZE`)
- Timeout: 30 seconds (configurable via `SYNAPSE_POOL_TIMEOUT`)

---

## Production Deployment Checklist

- [ ] ODBC driver installed on production server
- [ ] Environment variables configured securely (e.g., Azure Key Vault)
- [ ] Synapse firewall rules allow production IP
- [ ] Tables created and populated in Synapse
- [ ] Connection tested successfully
- [ ] `DATA_SOURCE=synapse` set in production environment
- [ ] Monitoring and logging configured
- [ ] Cache TTL tuned for production workload
- [ ] Backup and disaster recovery plan in place

---

## Need Help?

- Check the [Azure Synapse documentation](https://docs.microsoft.com/en-us/azure/synapse-analytics/)
- Review connection logs: `api/logs/`
- Contact your Azure administrator for access issues

---

**Happy Querying! 🚀**
