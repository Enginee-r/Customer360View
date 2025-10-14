# Customer 360° View - Setup Guide

## Quick Start

This guide will help you set up and run the complete Customer 360° View platform.

## Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- Salesforce account with API access
- Sufficient disk space for data storage (recommended: 10GB+)

## Installation Steps

### 1. Install Python Dependencies

```bash
cd python-starter
pip install -r requirements.txt
```

### 2. Configure Salesforce Credentials

Edit `config/salesforce_config.json`:

```json
{
  "salesforce": {
    "username": "your-sf-username@company.com",
    "password": "your-sf-password",
    "security_token": "your-security-token",
    "instance_url": "https://your-instance.salesforce.com"
  },
  "bronze_path": "./data/bronze",
  "silver_path": "./data/silver",
  "gold_path": "./data/gold"
}
```

### 3. Create Data Directories

```bash
mkdir -p data/bronze data/silver data/gold
```

## Running the Data Pipeline

### Step 1: Extract Bronze Layer

Extract data from Salesforce:

```bash
python scripts/extract_bronze.py --tables account,opportunity,opportunity_line_item,contact
```

**Expected output:**
- Bronze layer Parquet files in `data/bronze/`
- Extraction metrics JSON file
- ~5 minutes for 4 tables

### Step 2: Transform to Silver Layer

Apply cleansing and standardization:

```bash
python scripts/transform_silver.py --tables account,opportunity,opportunity_line_item,contact
```

**Expected output:**
- Silver layer Parquet files in `data/silver/`
- Transformation metrics JSON file
- ~10 minutes processing time

### Step 3: Normalize Currencies (Optional)

Convert all revenue fields to USD:

```bash
python scripts/currency_normalizer.py --tables account,opportunity,opportunity_line_item
```

**Expected output:**
- Normalized Parquet files with `_normalized` suffix
- Currency conversion metadata
- ~5 minutes processing time

### Step 4: Link Cross-Regional Accounts (Optional)

Identify same customers across regions:

```bash
python scripts/account_linker.py
```

**Expected output:**
- `gold_account_linkages_*.parquet` - Matched accounts
- `gold_master_accounts_*.parquet` - Consolidated view
- ~15 minutes for fuzzy matching

### Step 5: Create Gold Layer Analytics

Generate all analytics and metrics:

```bash
python scripts/aggregate_gold.py
```

**Expected output:**
- `gold_customer_360_metrics_*.parquet` - Core KPIs
- `gold_risk_alerts_*.parquet` - Risk alerts
- `gold_recommendations_*.parquet` - Next-best actions
- `gold_customer_timeline_*.parquet` - Journey events
- ~15 minutes processing time

## Running the API Server

Start the Flask API:

```bash
cd api
python app.py
```

The API will be available at `http://localhost:5000`

**Test the API:**

```bash
# Health check
curl http://localhost:5000/api/health

# Search customers
curl "http://localhost:5000/api/customers?q=acme"

# Get customer 360 view
curl http://localhost:5000/api/customer/ACCOUNT_ID
```

## Running the Dashboard

### Install Dashboard Dependencies

```bash
cd dashboard
npm install
```

### Start Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## Using the Dashboard

### 1. Search for Customers

- Type customer name in the search bar
- Select from autocomplete results
- View customer health status in search results

### 2. View Customer 360° Profile

Once a customer is selected, you'll see:

**Header Section:**
- Customer name and location
- Health status badge (Healthy/At-Risk/Critical)
- Churn risk level (HIGH/MEDIUM/LOW)
- Annual revenue with YoY growth

**Key Metrics:**
- Customer Lifetime Value (CLV)
- Monthly Recurring Revenue (MRR)
- Active Services count
- Health Score (0-100)
- Win Rate percentage

**Risk Alerts:**
- High-priority alerts (red)
- Medium-priority alerts (orange)
- Alert type and message
- Date created

**Recommended Actions:**
- Prioritized recommendations
- Category (Retention/Growth/Support/Billing)
- Expected outcome
- Estimated revenue impact
- "Schedule" button to execute action

**Customer Journey Timeline:**
- Chronological events
- Event type icons
- Event descriptions
- Status indicators
- Related amounts

## Data Pipeline Schedule

Recommended schedule for automated runs:

```bash
# Bronze extraction: Daily at 2 AM
0 2 * * * cd /path/to/project && python scripts/extract_bronze.py --tables account,opportunity,opportunity_line_item,contact

# Silver transformation: Daily at 3 AM
0 3 * * * cd /path/to/project && python scripts/transform_silver.py

# Gold aggregation: Daily at 4 AM
0 4 * * * cd /path/to/project && python scripts/aggregate_gold.py
```

## Troubleshooting

### Issue: Salesforce Authentication Failed

**Solution:**
1. Verify credentials in `config/salesforce_config.json`
2. Reset security token in Salesforce
3. Check IP whitelist settings

### Issue: No Data in Dashboard

**Solution:**
1. Verify Gold layer files exist in `data/gold/`
2. Check API is running: `curl http://localhost:5000/api/health`
3. Review browser console for errors
4. Verify CORS is enabled in API

### Issue: Memory Error During Processing

**Solution:**
1. Process tables one at a time
2. Increase available memory
3. Use chunking for large datasets

### Issue: Currency Conversion Errors

**Solution:**
1. Check exchange rate API availability
2. Verify default rates in `currency_normalizer.py`
3. Manually specify currency codes if needed

## Performance Optimization

### For Large Datasets (>1M records)

1. **Enable Incremental Loads:**
   - Modify Bronze extraction to use watermark columns
   - Only extract changed records

2. **Partition Data:**
   - Partition by date or region
   - Process partitions in parallel

3. **Optimize Parquet:**
   - Use appropriate compression (snappy for speed, gzip for size)
   - Enable predicate pushdown
   - Use appropriate row group sizes

## Monitoring and Logging

### Check Logs

```bash
# View extraction logs
cat data/bronze/extraction_metrics_*.json

# View transformation logs
cat data/silver/transformation_metrics_*.json

# View API logs
tail -f api/app.log
```

### Key Metrics to Monitor

- Records extracted per table
- Processing time per layer
- Error rates
- API response times
- Dashboard load times

## Security Best Practices

1. **Never commit credentials:**
   - Add `config/salesforce_config.json` to `.gitignore`
   - Use environment variables in production

2. **Secure the API:**
   - Add authentication middleware
   - Implement rate limiting
   - Use HTTPS in production

3. **Protect sensitive data:**
   - Encrypt data at rest
   - Mask PII in logs
   - Implement access controls

## Next Steps

1. **Customize Metrics:**
   - Edit `config/silver_to_gold_metrics.json`
   - Add custom calculations
   - Define new alert rules

2. **Enhance Recommendations:**
   - Add more recommendation rules
   - Integrate with CRM for automatic actions
   - Track recommendation effectiveness

3. **Extend Dashboard:**
   - Add executive summary page
   - Create regional comparison views
   - Build custom report builder

4. **Integrate Systems:**
   - Connect billing systems
   - Pull support ticket data
   - Sync with marketing automation

## Support

For issues or questions:
- Review README.md for architecture details
- Check configuration files for examples
- Review code comments for implementation details

## Version History

- **v2.0** - Full Customer 360° implementation with AI-powered recommendations
- **v1.0** - Initial Bronze/Silver/Gold pipeline

---

**Last Updated:** October 2025
