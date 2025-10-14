# Customer 360° View - Project Structure

## Directory Layout

```
python-starter/
├── api/
│   └── app.py                          # Flask REST API server
├── config/
│   ├── salesforce_config.json          # Salesforce credentials and paths
│   ├── bronze_to_silver_mapping.json   # Data transformation mappings
│   └── silver_to_gold_metrics.json     # Metrics definitions and rules
├── dashboard/
│   ├── src/
│   │   ├── api/
│   │   │   └── customer360.ts          # API client functions
│   │   ├── components/
│   │   │   ├── AlertCard.tsx           # Risk alert component
│   │   │   ├── CustomerDashboard.tsx   # Main dashboard view
│   │   │   ├── CustomerSearch.tsx      # Search autocomplete
│   │   │   ├── MetricCard.tsx          # KPI card component
│   │   │   ├── RecommendationCard.tsx  # Action recommendation
│   │   │   └── TimelineEvent.tsx       # Timeline event item
│   │   └── App.tsx                     # Main React app
│   ├── package.json                    # Node dependencies
│   ├── tailwind.config.js              # TailwindCSS config
│   └── vite.config.ts                  # Vite build config
├── scripts/
│   ├── extract_bronze.py               # Salesforce extraction
│   ├── transform_silver.py             # Data cleansing/standardization
│   ├── aggregate_gold.py               # Analytics and metrics
│   ├── currency_normalizer.py          # Multi-currency conversion
│   └── account_linker.py               # Cross-regional account linking
├── data/
│   ├── bronze/                         # Raw Salesforce data
│   ├── silver/                         # Cleansed data
│   └── gold/                           # Analytics-ready data
├── requirements.txt                    # Python dependencies
├── README.md                           # Project overview
├── SETUP_GUIDE.md                      # Installation instructions
└── PROJECT_STRUCTURE.md                # This file

```

## Component Descriptions

### API Layer (`api/`)

**app.py**
- Flask REST API server
- Endpoints for customer search, 360 view, alerts, recommendations, timeline
- Data caching for performance
- CORS enabled for frontend access

**Key Endpoints:**
- `GET /api/customers?q=query` - Search customers
- `GET /api/customer/:id` - Get 360° view
- `GET /api/customer/:id/alerts` - Get risk alerts
- `GET /api/customer/:id/recommendations` - Get next-best actions
- `GET /api/customer/:id/timeline` - Get journey events
- `POST /api/actions/:id/execute` - Execute action
- `GET /api/dashboard/summary` - Executive summary

### Configuration Files (`config/`)

**salesforce_config.json**
```json
{
  "salesforce": {
    "username": "...",
    "password": "...",
    "security_token": "...",
    "instance_url": "..."
  },
  "bronze_path": "./data/bronze",
  "silver_path": "./data/silver",
  "gold_path": "./data/gold"
}
```

**bronze_to_silver_mapping.json**
- Column-level transformation rules
- Data type conversions
- Standardization logic
- Null handling
- Separate configs per table (account, opportunity, etc.)

**silver_to_gold_metrics.json**
- Customer 360 metrics definitions (CLV, MRR, etc.)
- Risk scoring formulas
- Alert trigger conditions
- Recommendation rules with priorities
- Expected outcomes and impact estimates

### Data Pipeline Scripts (`scripts/`)

**extract_bronze.py**
- Connects to Salesforce via simple-salesforce
- Executes SOQL queries for each table
- Saves to Parquet format with metadata
- Generates extraction metrics
- Supports incremental loads

**transform_silver.py**
- Loads latest Bronze files
- Applies transformation mappings from JSON config
- Performs data cleansing and standardization
- Handles currency detection
- Saves transformed data to Silver layer

**currency_normalizer.py**
- Fetches exchange rates (or uses defaults)
- Detects currency from region/field
- Converts all revenue fields to USD
- Stores original amounts and rates used
- Supports historical rate lookups

**account_linker.py**
- Normalizes company names
- Performs fuzzy matching (85%+ similarity)
- Checks parent account relationships
- Validates contact email/phone overlap
- Creates master account records
- Generates linkage confidence scores

**aggregate_gold.py**
- Calculates Customer 360 metrics:
  - CLV, MRR, Annual Revenue, YoY Growth
  - Active Services, Win Rate
  - Health Score (0-100)
  - Churn Risk Score (0-100)
- Generates risk alerts based on rules
- Creates next-best-action recommendations
- Builds customer journey timeline
- Saves to Gold layer tables

### Dashboard (`dashboard/`)

**React + TypeScript + TailwindCSS**

**Key Features:**
- Customer search with autocomplete
- Real-time health status badges
- Comprehensive 360° customer view
- Interactive metric cards
- Color-coded risk alerts
- Actionable recommendations with "Schedule" buttons
- Chronological timeline with event types
- Responsive design for all screen sizes

**API Integration:**
- React Query for data fetching and caching
- Axios for HTTP requests
- Automatic retry and error handling

### Data Layers

**Bronze Layer**
- Raw, unmodified data from Salesforce
- Parquet format with Snappy compression
- Includes extraction metadata (_extracted_at, _source_system)
- File naming: `bronze_<table>_<timestamp>.parquet`

**Silver Layer**
- Cleansed and standardized data
- Consistent column names and data types
- Business logic applied
- Currency normalization (optional)
- File naming: `silver_<table>_<timestamp>.parquet`

**Gold Layer**
- Analytics-ready aggregated data
- Customer 360 metrics
- Risk scores and alerts
- Recommendations with priorities
- Timeline events
- File naming: `gold_<table>_<timestamp>.parquet`

## Data Flow

```
1. Salesforce
   ↓ (extract_bronze.py)
2. Bronze Layer (Raw Data)
   ↓ (transform_silver.py)
3. Silver Layer (Cleansed Data)
   ↓ (currency_normalizer.py - optional)
   ↓ (account_linker.py - optional)
   ↓ (aggregate_gold.py)
4. Gold Layer (Analytics)
   ↓ (API reads Gold files)
5. REST API
   ↓ (Dashboard queries API)
6. Web Dashboard
```

## Key Algorithms

### Health Score Calculation
```python
health_score = (
    payment_history * 0.30 +
    support_quality * 0.25 +
    usage_trends * 0.25 +
    engagement * 0.20
)
```

**Categories:**
- 80-100: Healthy (Green)
- 50-79: At-Risk (Orange)
- 0-49: Critical (Red)

### Churn Risk Score
```python
churn_risk = (
    usage_decline * 0.30 +
    payment_issues * 0.30 +
    support_problems * 0.25 +
    low_engagement * 0.15
)
```

**Thresholds:**
- ≥70: HIGH risk
- 40-69: MEDIUM risk
- <40: LOW risk

### Account Linking Logic

1. **Exact Match** (confidence: 100%)
   - Normalized company names identical

2. **Fuzzy Match** (confidence: 85-95%)
   - ≥85% name similarity
   - Bonus: +10% if same parent account
   - Bonus: +10% if shared contacts

3. **Parent Match** (confidence: 90%)
   - Same parent_account_id
   - ≥70% name similarity

4. **Contact Match** (confidence: 85%)
   - Shared email or phone
   - ≥70% name similarity

5. **Manual** (confidence: 100%)
   - Explicitly defined in manual_account_linkages.json

## Recommendation Rules

### R001: High Churn Risk + Contract Expiring
- **Conditions:** churn_risk > 70 AND days_to_expiry < 90
- **Priority:** HIGH
- **Action:** Schedule Urgent Retention Call

### R002: Usage Spike + Limited Services
- **Conditions:** usage_growth > 50% AND active_services < 5
- **Priority:** MEDIUM
- **Action:** Propose Service Upgrade

### R003: Payment Overdue
- **Conditions:** days_overdue > 15
- **Priority:** MEDIUM
- **Action:** Send Payment Reminder

### R004: SLA Breach
- **Conditions:** sla_breaches > 0
- **Priority:** HIGH
- **Action:** Technical Review Meeting

### R005: Strong Revenue Growth
- **Conditions:** yoy_growth > 20%
- **Priority:** LOW
- **Action:** Executive Relationship Building

### R006: Low Engagement
- **Conditions:** engagement_score < 30
- **Priority:** MEDIUM
- **Action:** Schedule Quarterly Business Review

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Data Extraction** | simple-salesforce | Salesforce API integration |
| **Data Processing** | pandas, numpy | Data transformation |
| **Data Storage** | PyArrow, Parquet | Columnar storage format |
| **API Backend** | Flask, Flask-CORS | REST API server |
| **Frontend Framework** | React 18 + TypeScript | UI components |
| **Styling** | TailwindCSS | Utility-first CSS |
| **Icons** | Lucide React | Icon library |
| **Data Fetching** | React Query, Axios | API integration |
| **Build Tool** | Vite | Fast dev server and bundler |

## Performance Considerations

### Data Pipeline
- **Parquet format**: Columnar storage for fast queries
- **Snappy compression**: Balance between speed and size
- **Incremental loads**: Only extract changed data
- **Partitioning**: Split large tables by date/region

### API
- **Caching**: 5-minute TTL for Gold data
- **Lazy loading**: Load latest files on demand
- **Indexing**: Filter DataFrames efficiently

### Dashboard
- **React Query**: Automatic caching and deduplication
- **Lazy loading**: Components load on demand
- **Code splitting**: Reduce initial bundle size
- **Optimistic updates**: UI updates before API confirmation

## Extending the System

### Adding New Metrics

1. Update `config/silver_to_gold_metrics.json`
2. Add calculation logic in `aggregate_gold.py`
3. Update API endpoint if needed
4. Create UI component in dashboard

### Adding New Data Sources

1. Create extraction script (similar to `extract_bronze.py`)
2. Define mapping in config JSON
3. Add transformation logic
4. Join with existing tables in Gold layer

### Adding New Recommendation Rules

1. Add rule to `silver_to_gold_metrics.json`
2. Implement condition checking in `aggregate_gold.py`
3. Dashboard automatically displays new recommendations

### Custom Dashboards

1. Create new React components
2. Add API endpoints for custom data
3. Update routing in App.tsx

## Best Practices

### Data Quality
- Validate data at each layer
- Log transformation errors
- Monitor null percentages
- Track data lineage

### Code Quality
- Type hints in Python
- TypeScript for frontend
- Docstrings for functions
- Unit tests for critical logic

### Operations
- Automated daily pipeline runs
- Monitor processing times
- Alert on failures
- Regular data quality checks

### Security
- Never commit credentials
- Use environment variables
- Implement API authentication
- Encrypt sensitive data

## Metrics to Monitor

### Pipeline Health
- Records extracted per day
- Transformation error rate
- Processing time per layer
- Data freshness (last update time)

### API Performance
- Response time (p50, p95, p99)
- Error rate
- Cache hit rate
- Concurrent users

### Business Metrics
- Total customers
- High-risk customer count
- Average health score
- Recommendation execution rate

---

**Last Updated:** October 2025
**Version:** 2.0
