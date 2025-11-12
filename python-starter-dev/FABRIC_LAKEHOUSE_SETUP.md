# Microsoft Fabric Lakehouse Integration Guide

Complete guide to connecting your Customer 360 platform to Microsoft Fabric Lakehouse.

## Table of Contents
1. [Why Microsoft Fabric](#why-microsoft-fabric)
2. [Prerequisites](#prerequisites)
3. [Finding Your Fabric Lakehouse Details](#finding-your-fabric-lakehouse-details)
4. [Setting Up Authentication](#setting-up-authentication)
5. [Installing Dependencies](#installing-dependencies)
6. [Configuring the Connection](#configuring-the-connection)
7. [Creating Tables in Fabric](#creating-tables-in-fabric)
8. [Testing the Connection](#testing-the-connection)
9. [Switching to Fabric Mode](#switching-to-fabric-mode)
10. [Troubleshooting](#troubleshooting)

---

## Why Microsoft Fabric?

Microsoft Fabric provides:
- ✅ **Unified Data Platform**: Data Lake + Data Warehouse + Analytics
- ✅ **OneLake Storage**: Single source of truth for all data
- ✅ **Delta Lake Format**: ACID transactions, time travel, schema evolution
- ✅ **SQL Analytics Endpoint**: Query lakehouse data using T-SQL
- ✅ **Seamless Integration**: Power BI, Synapse, Data Factory all built-in
- ✅ **Automatic Optimization**: No manual indexing or partitioning needed

---

## Prerequisites

###1. Microsoft Fabric Workspace
- Active Microsoft Fabric capacity (F2 or higher, or Trial)
- A Fabric Lakehouse created in your workspace
- Workspace Admin or Contributor permissions

### 2. ODBC Driver Installed

**macOS:**
```bash
brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
brew update
brew install msodbcsql18

# Verify installation
odbcinst -q -d
```

**Linux (Ubuntu/Debian):**
```bash
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt-get update
sudo ACCEPT_EULA=Y apt-get install -y msodbcsql18
```

**Windows:**
Download from: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

### 3. Azure AD App Registration (for authentication)
- Service Principal with access to your Fabric workspace
- Client ID, Client Secret, and Tenant ID

---

## Finding Your Fabric Lakehouse Details

### Step 1: Navigate to Your Lakehouse

1. Go to https://app.fabric.microsoft.com
2. Select your workspace
3. Click on your Lakehouse

### Step 2: Get SQL Analytics Endpoint

In your Lakehouse:

1. Look at the top toolbar
2. You'll see tabs: **Lakehouse** and **SQL analytics endpoint**
3. Click **SQL analytics endpoint**
4. The URL in your browser shows the endpoint

**Format:**
```
https://app.fabric.microsoft.com/groups/<workspace-id>/sqldatabases/<lakehouse-id>
```

### Step 3: Find Connection String

In SQL analytics endpoint view:

1. Click the **Settings** gear icon (top right)
2. Select **Connection strings**
3. Copy the **SQL connection string**

It will look like:
```
<workspace-id>.datawarehouse.fabric.microsoft.com
```

### Step 4: Note Your Lakehouse Name

The lakehouse name is shown in the breadcrumb or left navigation.

---

## Setting Up Authentication

Microsoft Fabric recommends using **Azure AD Service Principal** authentication.

### Option A: Create Service Principal (Recommended)

#### 1. Register App in Azure AD

```bash
# Using Azure CLI
az login

# Create app registration
az ad app create --display-name "Customer360-Fabric-Access"

# Note the appId (this is your CLIENT_ID)
```

Or via Azure Portal:
1. Go to https://portal.azure.com
2. Azure Active Directory → App registrations
3. **New registration**
   - Name: `Customer360-Fabric-Access`
   - Supported account types: Single tenant
   - Click **Register**
4. Copy **Application (client) ID**
5. Copy **Directory (tenant) ID**

#### 2. Create Client Secret

In your app registration:
1. Go to **Certificates & secrets**
2. **New client secret**
   - Description: `Fabric Lakehouse Access`
   - Expires: Choose duration (e.g., 24 months)
3. **Copy the secret VALUE immediately** (you won't see it again!)

#### 3. Grant Access to Fabric Workspace

In Microsoft Fabric:
1. Go to your workspace
2. Click **Workspace settings** (gear icon)
3. **Manage access**
4. **Add people or groups**
5. Search for your app name: `Customer360-Fabric-Access`
6. Assign role: **Member** or **Contributor**
7. Click **Add**

### Option B: SQL Authentication

If your organization has enabled SQL authentication:

1. In Fabric Lakehouse SQL endpoint
2. **Security** → **SQL authentication**
3. Create a SQL login/user
4. Grant appropriate permissions

**Note:** Azure AD authentication is preferred for security and auditing.

---

## Installing Dependencies

```bash
cd /Users/robertselemani/Customer360View/python-starter

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install pyodbc sqlalchemy

# Or install all requirements
pip install -r requirements.txt
```

---

## Configuring the Connection

### 1. Copy Environment Template

```bash
cd api
cp .env.fabric.example .env.fabric
```

### 2. Edit `.env.fabric`

```bash
nano .env.fabric
```

Fill in your actual values:

```bash
# Your Fabric SQL Endpoint
FABRIC_SQL_ENDPOINT=abc123de.datawarehouse.fabric.microsoft.com
FABRIC_LAKEHOUSE_NAME=customer360_lakehouse

# Azure AD Service Principal
FABRIC_AUTH_METHOD=aad
AZURE_TENANT_ID=12345678-1234-1234-1234-123456789012
AZURE_CLIENT_ID=abcdef12-3456-7890-abcd-ef1234567890
AZURE_CLIENT_SECRET=your_secret_value_here

# Schema (usually 'dbo' in Fabric)
FABRIC_SCHEMA=dbo

# Enable Fabric mode
DATA_SOURCE=fabric
```

### 3. Load Environment Variables

```bash
# Export all variables
export $(cat .env.fabric | grep -v '^#' | xargs)

# Or add to your shell profile (~/.zshrc or ~/.bashrc)
echo 'export $(cat /path/to/api/.env.fabric | grep -v "^#" | xargs)' >> ~/.zshrc
```

---

## Creating Tables in Fabric

You have two options to create tables in your Fabric Lakehouse:

### Option A: Using Fabric Notebook (Spark)

Create a new Notebook in your Fabric workspace:

```python
from pyspark.sql.types import *
from delta.tables import DeltaTable

# Define schema for customer_360_metrics
schema = StructType([
    StructField("account_id", StringType(), False),
    StructField("account_name", StringType(), False),
    StructField("region", StringType(), True),
    StructField("health_status", StringType(), True),
    StructField("annual_revenue", DecimalType(18, 2), True),
    StructField("monthly_recurring_revenue", DecimalType(18, 2), True),
    StructField("customer_lifetime_value", DecimalType(18, 2), True),
    StructField("active_services", IntegerType(), True),
    StructField("open_support_tickets", IntegerType(), True),
    StructField("avg_response_time_hours", DecimalType(10, 2), True),
    StructField("churn_risk_score", DecimalType(5, 2), True),
    StructField("yoy_growth_percentage", DecimalType(5, 2), True),
    StructField("contract_end_date", DateType(), True),
    StructField("customer_since", DateType(), True),
    StructField("last_updated_at", TimestampType(), True)
])

# Create empty DataFrame
df = spark.createDataFrame([], schema)

# Write as Delta table
df.write.format("delta").mode("overwrite").saveAsTable("customer_360_metrics")

print("✅ Table created: customer_360_metrics")
```

### Option B: Using SQL Analytics Endpoint

Go to SQL analytics endpoint view and run:

```sql
-- Customer 360 Metrics Table
CREATE TABLE [dbo].[customer_360_metrics] (
    [account_id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [account_name] NVARCHAR(255) NOT NULL,
    [region] NVARCHAR(100),
    [health_status] NVARCHAR(50),
    [annual_revenue] DECIMAL(18, 2),
    [monthly_recurring_revenue] DECIMAL(18, 2),
    [customer_lifetime_value] DECIMAL(18, 2),
    [active_services] INT,
    [open_support_tickets] INT,
    [avg_response_time_hours] DECIMAL(10, 2),
    [churn_risk_score] DECIMAL(5, 2),
    [yoy_growth_percentage] DECIMAL(5, 2),
    [contract_end_date] DATE,
    [customer_since] DATE,
    [last_updated_at] DATETIME DEFAULT GETDATE()
);

-- Alerts Table
CREATE TABLE [dbo].[alerts] (
    [alert_id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [account_id] NVARCHAR(50) NOT NULL,
    [alert_type] NVARCHAR(50),
    [severity] NVARCHAR(20),
    [title] NVARCHAR(255),
    [description] NVARCHAR(MAX),
    [created_at] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([account_id]) REFERENCES [dbo].[customer_360_metrics]([account_id])
);

-- Recommendations Table
CREATE TABLE [dbo].[recommendations] (
    [recommendation_id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [account_id] NVARCHAR(50) NOT NULL,
    [priority] NVARCHAR(20),
    [action_type] NVARCHAR(50),
    [action_title] NVARCHAR(255),
    [action_description] NVARCHAR(MAX),
    [expected_outcome] NVARCHAR(MAX),
    [estimated_impact_revenue] DECIMAL(18, 2),
    [created_at] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([account_id]) REFERENCES [dbo].[customer_360_metrics]([account_id])
);

-- Timeline/Events Table
CREATE TABLE [dbo].[timeline] (
    [event_id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [account_id] NVARCHAR(50) NOT NULL,
    [event_type] NVARCHAR(50),
    [event_title] NVARCHAR(255),
    [event_description] NVARCHAR(MAX),
    [event_date] DATETIME,
    [severity] NVARCHAR(20),
    [related_amount] DECIMAL(18, 2),
    [status] NVARCHAR(50),
    FOREIGN KEY ([account_id]) REFERENCES [dbo].[customer_360_metrics]([account_id])
);
```

### Load Your Data

Use your Bronze → Silver → Gold pipeline to populate these tables.

Example Spark code in Fabric Notebook:

```python
# Read from your source (Bronze/Silver layer)
df_customers = spark.read.format("delta").table("silver.account_data")

# Transform to Gold schema
df_gold = df_customers.select(
    col("account_id"),
    col("account_name"),
    col("region"),
    # ... transform other columns
)

# Write to Gold table
df_gold.write.format("delta").mode("overwrite").saveAsTable("customer_360_metrics")
```

---

## Testing the Connection

### Test Script

Create `api/test_fabric_connection.py`:

```python
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from fabric_data_loader import FabricDataLoader
import logging

logging.basicConfig(level=logging.INFO)

def test_fabric_connection():
    print("=" * 60)
    print("Testing Microsoft Fabric Lakehouse Connection")
    print("=" * 60)

    try:
        # Initialize loader in Fabric mode
        loader = FabricDataLoader(mode='fabric')

        # Health check
        print("\n1. Running health check...")
        health = loader.health_check()
        print(f"Status: {health['status']}")
        print(f"Details: {health['details']}")

        # List tables
        print("\n2. Listing available tables...")
        tables = loader.get_available_tables()
        print(f"Found {len(tables)} tables:")
        for table in tables:
            print(f"   - {table}")

        # Load sample table
        if 'customer_360_metrics' in tables:
            print("\n3. Loading customer data...")
            df = loader.load_latest('customer_360_metrics')
            print(f"Loaded {len(df)} customers")
            print(f"Columns: {df.columns.tolist()}")
            print(f"\nSample data:\n{df.head()}")

            # Get table info
            print("\n4. Getting table information...")
            info = loader.get_table_info('customer_360_metrics')
            print(f"Table has {info['column_count']} columns")
        else:
            print("\n⚠️  customer_360_metrics table not found")
            print("Available tables:", tables)

        print("\n" + "=" * 60)
        print("✅ Connection test SUCCESSFUL!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Connection test FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_fabric_connection()
```

Run the test:

```bash
cd api
export $(cat .env.fabric | xargs)
python test_fabric_connection.py
```

---

## Switching to Fabric Mode

### Update API Code

Edit `api/app.py`:

```python
# At the top of the file, replace DataLoader import
from fabric_data_loader import FabricDataLoader

# Initialize data loader (reads DATA_SOURCE from environment)
data_loader = FabricDataLoader()

# Rest of your code remains the same
```

### Start API in Fabric Mode

```bash
cd api

# Load Fabric environment
export $(cat .env.fabric | xargs)

# Start API
PORT=5001 python app.py
```

### Test API Endpoints

```bash
# Health check (includes Fabric status)
curl http://localhost:5001/api/health

# Get customers from Fabric
curl http://localhost:5001/api/customers | jq '.[0:3]'

# Get specific customer
curl http://localhost:5001/api/customer/YOUR_ACCOUNT_ID | jq
```

---

## Switching Between Local and Fabric Modes

Easily toggle between development and production:

```bash
# Development (local Parquet files)
export DATA_SOURCE=local
python app.py

# Production (Fabric Lakehouse)
export DATA_SOURCE=fabric
python app.py
```

---

## Troubleshooting

### Issue: "Login failed for user"

**Possible Causes:**
1. Wrong Client ID/Secret
2. Service Principal not added to Fabric workspace
3. Tenant ID incorrect

**Solutions:**
```bash
# Verify Service Principal exists
az ad sp show --id YOUR_CLIENT_ID

# Check workspace permissions in Fabric Portal
# Workspace → Settings → Manage access
```

### Issue: "ODBC Driver not found"

**Solution:**
```bash
# macOS
brew install msodbcsql18

# Verify
odbcinst -q -d

# Should show: ODBC Driver 18 for SQL Server
```

### Issue: "Table does not exist"

**Check tables in Fabric:**
```bash
# In Python
from fabric_data_loader import FabricDataLoader
loader = FabricDataLoader(mode='fabric')
print(loader.get_available_tables())
```

Or in Fabric SQL analytics endpoint:
```sql
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
ORDER BY TABLE_NAME;
```

### Issue: "Connection timeout"

**Possible Causes:**
1. Fabric capacity paused
2. Firewall/network issues
3. Wrong SQL endpoint URL

**Solutions:**
- Check Fabric capacity is running (Fabric Portal → Capacity settings)
- Verify SQL endpoint URL is correct
- Test from Azure Cloud Shell to rule out local network issues

### Issue: "Slow queries"

**Optimization Tips:**
1. **Increase cache TTL:**
   ```bash
   export CACHE_TTL_SECONDS=600  # 10 minutes
   ```

2. **Use specific columns:**
   ```python
   # Instead of SELECT *
   df = loader.execute_query("""
       SELECT account_id, account_name, annual_revenue
       FROM customer_360_metrics
   """)
   ```

3. **Add filters in SQL:**
   ```python
   # Filter in Fabric, not in Python
   df = loader.execute_query("""
       SELECT * FROM customer_360_metrics
       WHERE region = 'West Africa'
       AND health_status = 'Critical'
   """)
   ```

### Enable Debug Logging

Add to your code or environment:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Or:
```bash
export LOG_LEVEL=DEBUG
```

---

## Advanced: Direct OneLake Access

For advanced scenarios, you can access Delta Lake files directly via OneLake:

```python
from fabric_data_loader import FabricDataLoader

loader = FabricDataLoader(mode='fabric')

# Get OneLake path
onelake_path = fabric_config.get_onelake_path('customer_360_metrics')
print(f"OneLake path: {onelake_path}")

# Read directly with Spark (in Fabric Notebook)
df = spark.read.format("delta").load(onelake_path)
```

---

## Production Deployment Checklist

- [ ] ODBC Driver 18 installed on production server
- [ ] Service Principal created and granted workspace access
- [ ] All environment variables configured (use Azure Key Vault)
- [ ] Tables created and populated in Fabric Lakehouse
- [ ] Connection test passed successfully
- [ ] `DATA_SOURCE=fabric` set in production
- [ ] Monitoring and logging configured
- [ ] Cache TTL tuned for workload
- [ ] Health check endpoint monitored
- [ ] Backup and disaster recovery plan documented

---

## Benefits of Fabric for Customer 360

1. **Real-time Analytics**: Query fresh data as soon as it arrives
2. **No ETL Delays**: Direct access to lakehouse tables
3. **Cost Effective**: Pay for compute, not storage
4. **Scalable**: Auto-scales with your Fabric capacity
5. **Integrated**: Seamless with Power BI for visualization
6. **Governed**: Built-in data lineage and security

---

## Next Steps

1. Set up your Bronze → Silver → Gold pipeline in Fabric Data Factory
2. Schedule regular data refreshes
3. Create Power BI reports on top of the same lakehouse
4. Enable real-time streaming if needed
5. Set up monitoring and alerts

---

## Resources

- [Microsoft Fabric Documentation](https://learn.microsoft.com/en-us/fabric/)
- [Lakehouse Tutorial](https://learn.microsoft.com/en-us/fabric/data-engineering/tutorial-lakehouse-introduction)
- [SQL Analytics Endpoint](https://learn.microsoft.com/en-us/fabric/data-warehouse/sql-analytics-endpoint)
- [Service Principal Authentication](https://learn.microsoft.com/en-us/entra/identity-platform/howto-create-service-principal-portal)

---

**Happy Analyzing with Fabric! 🚀**
