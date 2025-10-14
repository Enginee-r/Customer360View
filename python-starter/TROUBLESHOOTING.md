# Troubleshooting Guide

## Platform Overview

The Customer 360 platform consists of:
- **Frontend Dashboard**: React app running on http://localhost:3001
- **Backend API**: Flask app running on http://localhost:5002
- **Data Layer**: Parquet files in `data/gold/` directory

---

## Common Issues and Solutions

### 1. Blank Page When Viewing Customer

**Symptoms:**
- Search works fine
- Clicking on a customer shows a blank page
- No errors visible

**Causes & Solutions:**

#### A. API Port Mismatch
**Check:** Frontend is pointing to the wrong API port
```bash
# Check the API URL in the frontend
grep -n "API_BASE_URL" dashboard/src/api/customer360.ts
```

**Fix:** Ensure the API URL matches the running API port
```typescript
// Should be:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
```

#### B. CORS Issues
**Check:** Browser console for CORS errors (F12 → Console tab)

**Fix:** Restart the API server to ensure CORS is enabled
```bash
# Stop the API (Ctrl+C or kill the process)
# Restart:
cd /Users/robertselemani/Customer360View/python-starter
source venv/bin/activate
cd api
PORT=5002 python app.py
```

#### C. Stale API Cache
**Check:** API is returning old cached data

**Fix:** Restart the API to clear the 5-minute cache
```bash
# Kill and restart the API as shown above
```

#### D. Invalid JSON Data
**Check:** Browser console shows JSON parse errors

**Fix:** Regenerate the gold layer data
```bash
cd /Users/robertselemani/Customer360View/python-starter
source venv/bin/activate
python scripts/aggregate_gold.py
```

---

### 2. Component Not Rendering

**Symptoms:**
- Customer data loads but persona tabs don't show
- Partial page rendering

**Causes & Solutions:**

#### A. TypeScript/JavaScript Errors
**Check:** Browser console (F12 → Console)

**Fix:** Look for errors related to:
- Undefined properties
- Failed JSON parsing
- Missing dependencies

#### B. Missing Metrics
**Check:** Some metrics showing as `undefined` or `null`

**Fix:** Ensure all required metrics exist in gold layer:
```bash
# Check if metrics are in the data
cd /Users/robertselemani/Customer360View/python-starter
source venv/bin/activate
python -c "import pandas as pd; df = pd.read_parquet('data/gold/gold_customer_360_metrics_20251013_075651.parquet'); print(df.columns.tolist())"
```

---

### 3. API Connection Refused

**Symptoms:**
- Dashboard loads but shows "No customer data available"
- Browser console shows `ERR_CONNECTION_REFUSED`

**Causes & Solutions:**

#### A. API Not Running
**Check:**
```bash
curl http://localhost:5002/api/health
```

**Fix:** Start the API server
```bash
cd /Users/robertselemani/Customer360View/python-starter
source venv/bin/activate
cd api
PORT=5002 python app.py
```

#### B. Wrong Port
**Check:** API is running on a different port

**Fix:** Find the actual port:
```bash
lsof -i :5002  # Check what's on 5002
ps aux | grep "python.*app.py"  # Find running API processes
```

---

### 4. No Search Results

**Symptoms:**
- Search bar doesn't return any customers
- Search works but shows empty results

**Causes & Solutions:**

#### A. No Data in Gold Layer
**Check:**
```bash
ls -la data/gold/
```

**Fix:** Generate sample data and gold layer
```bash
source venv/bin/activate
python scripts/generate_sample_data.py
python scripts/aggregate_gold.py
```

#### B. API Can't Find Data Files
**Check:** API logs for file not found errors

**Fix:** Ensure correct path in API data loader (should be `../data/gold`)

---

### 5. Port Already in Use

**Symptoms:**
- Error: "Address already in use"
- Can't start API or dashboard

**Solutions:**

#### For API (Port 5002):
```bash
# Find process using port 5002
lsof -ti:5002

# Kill the process
kill -9 $(lsof -ti:5002)

# Or use a different port
PORT=5003 python app.py
# Then update dashboard/src/api/customer360.ts accordingly
```

#### For Dashboard (Port 3001):
```bash
# Find process using port 3001
lsof -ti:3001

# Kill the process
kill -9 $(lsof -ti:3001)

# Vite will automatically try the next available port
```

---

### 6. Data Not Updating

**Symptoms:**
- Changes to gold layer script don't reflect in dashboard
- Old metrics still showing

**Solutions:**

**Step 1:** Regenerate gold layer
```bash
source venv/bin/activate
python scripts/aggregate_gold.py
```

**Step 2:** Clear API cache (restart API)
```bash
# Kill API process
# Restart: PORT=5002 python api/app.py
```

**Step 3:** Hard refresh browser
- Chrome/Firefox: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or clear browser cache

---

### 7. Persona Tabs Not Working

**Symptoms:**
- Can't switch between persona views
- Tabs don't respond to clicks

**Check:** Browser console for JavaScript errors

**Fix:** Ensure PersonaDashboard component is imported correctly
```bash
# Verify import in App.tsx
grep -n "PersonaDashboard" dashboard/src/App.tsx
```

---

### 8. Charts Not Displaying

**Symptoms:**
- Revenue charts show "No revenue data available"
- Bar charts are empty

**Causes & Solutions:**

#### A. JSON Parse Error
**Check:** Quarterly/3-year revenue fields contain valid JSON

**Fix:** Ensure gold layer uses proper JSON serialization
```python
# In scripts/aggregate_gold.py, should be:
'quarterly_revenue': json.dumps([float(x) for x in quarterly_revenue]),
'three_year_revenue': json.dumps([float(x) for x in three_year_revenue]),
```

#### B. All Zero Values
**Check:** Sample data has actual revenue

**Solution:** This is expected for sample data with no closed opportunities. In production, real Salesforce data will populate these values.

---

## Quick Health Check Commands

### Check Everything is Running
```bash
# API Health
curl http://localhost:5002/api/health

# Dashboard
curl http://localhost:3001

# Data Files Exist
ls -la data/gold/gold_customer_360_metrics_*.parquet
```

### View API Logs in Real-time
```bash
# If running in background, check logs
tail -f api/logs/app.log  # If logging to file

# Or check the terminal where API is running
```

### Test Full Flow
```bash
# 1. Get customer list
curl http://localhost:5002/api/customers?q=Digital

# 2. Get customer details (use an ID from step 1)
curl http://localhost:5002/api/customer/ACCQAHFTRXCKAFNAFQ

# 3. Check if data is valid JSON
curl http://localhost:5002/api/customer/ACCQAHFTRXCKAFNAFQ | python3 -m json.tool
```

---

## Restart Everything from Scratch

If all else fails:

```bash
cd /Users/robertselemani/Customer360View/python-starter

# 1. Kill all running processes
pkill -f "python.*app.py"
pkill -f "vite"

# 2. Regenerate data
source venv/bin/activate
python scripts/generate_sample_data.py
python scripts/aggregate_gold.py

# 3. Start API
cd api
PORT=5002 python app.py &
cd ..

# 4. Start Dashboard (in new terminal)
cd dashboard
npm run dev &
cd ..

# 5. Wait 5 seconds for services to start
sleep 5

# 6. Open browser
# Mac:
open http://localhost:3001

# Linux:
xdg-open http://localhost:3001
```

---

## Browser Developer Tools

### Essential Checks:

1. **Console Tab (F12)**: Look for JavaScript errors
2. **Network Tab (F12)**:
   - Check API requests are going to correct URL
   - Verify HTTP status codes (200 = success)
   - Look at response preview to see data
3. **React DevTools**: Install React DevTools extension to inspect component state

---

## Getting Help

If issues persist:

1. **Check browser console** for specific error messages
2. **Check API terminal** for Python errors or stack traces
3. **Verify data exists**: `ls -la data/gold/`
4. **Test API directly**: Use curl commands above
5. **Check documentation**: `README.md`, `PERSONA_METRICS_MAPPING.md`

---

## Contact

For technical support or bug reports:
- Check `README.md` for project overview
- Review `PERSONA_METRICS_MAPPING.md` for metrics documentation
- Check `ARCHITECTURE.md` for system design

---

**Last Updated**: October 2025
