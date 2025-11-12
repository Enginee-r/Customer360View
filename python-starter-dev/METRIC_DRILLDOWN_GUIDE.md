# Metric Drill-Down Implementation Guide

This guide explains how the metric drill-down functionality works and how to enable it for all metrics across all personas.

---

## 🎯 Overview

The drill-down feature allows users to click on any metric card to see detailed breakdowns, trends, related data, and contextual information. This provides a deeper understanding without cluttering the main dashboard.

### Components Involved:

1. **MetricCard.tsx** - The clickable metric card component
2. **MetricDrillDownModal.tsx** - The modal that displays detailed metric information
3. **PersonaDashboard.tsx** - The main dashboard that coordinates drill-downs

---

## 📦 How It Works

### 1. MetricCard Component

The MetricCard now accepts an `onClick` prop that makes it interactive:

```typescript
<MetricCard
  title="Annual Revenue"
  value={formatCurrency(customer.annual_revenue)}
  icon={DollarSign}
  trend={customer.yoy_growth}
  onClick={() => handleMetricClick('annual_revenue', 'Annual Revenue', formatCurrency(customer.annual_revenue))}
/>
```

**Visual Indicators:**
- Hover effect: Card scales up and shows blue border
- Chevron icon appears on the right
- "Click for details →" text at bottom
- Cursor changes to pointer

### 2. MetricDrillDownModal Component

The modal receives:
- `customerId` - To fetch related data
- `metricKey` - Identifies which metric (e.g., 'annual_revenue', 'nps_score')
- `metricTitle` - Display name
- `metricValue` - Current value to display prominently
- `onClose` - Function to close the modal

**Modal Features:**
- Full-screen overlay with dark background
- Scrollable content area
- Responsive design (max-width, max-height)
- Close button in header

### 3. Drill-Down Logic

The modal uses a switch statement to render different content based on `metricKey`:

```typescript
switch (metricKey) {
  case 'annual_revenue':
    // Show revenue breakdown, quarterly data, YoY comparison
    break;
  case 'nps_score':
    // Show satisfaction drivers, engagement metrics
    break;
  // ... etc
}
```

---

## 🚀 Adding Drill-Down to Your Metrics

### Step 1: Add onClick Handler to MetricCard

In any persona view (e.g., `renderCEOView`), add the `onClick` prop:

```typescript
<MetricCard
  title="Customer Lifetime Value"
  value={formatCurrency(customer.customer_lifetime_value)}
  icon={DollarSign}
  trend={null}
  onClick={() => handleMetricClick(
    'customer_lifetime_value',  // metric key
    'Customer Lifetime Value',   // display title
    formatCurrency(customer.customer_lifetime_value)  // current value
  )}
/>
```

### Step 2: Implement Drill-Down Content

The drill-down content for common metrics is already implemented in `MetricDrillDownModal.tsx`. Here are the available metrics:

#### Financial Metrics
- `customer_lifetime_value` - Shows won opportunities, avg deal size, revenue breakdown, growth indicators
- `annual_revenue` / `monthly_recurring_revenue` - Revenue trends, quarterly breakdown, cost to serve
- `retention_probability` - Contributing factors, engagement signals

#### Sales Metrics
- `pipeline_value` / `open_opportunities` - Pipeline details, next close opportunity, sales performance
- `win_rate` - Included in sales performance views

#### Service Metrics
- `open_tickets` / `total_tickets` - Ticket breakdown, service metrics, customer satisfaction
- `sla_compliance_pct` - Included in service metrics views

#### Billing Metrics
- `overdue_invoices` / `overdue_amount` - Payment details, credit hold status, revenue context

#### Account Management Metrics
- `days_to_renewal` / `upcoming_renewals_count` - Contract details, renewal health indicators
- `nps_score` / `csat_score` - Satisfaction drivers, engagement metrics

#### Risk/Health Metrics
- `health_score` / `churn_risk_score` - Key health indicators, risk factors

---

## 📝 Example: Complete Implementation

Here's how to add drill-down to ALL metrics in the Board Chairman view:

```typescript
const renderBoardView = () => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-gray-900">Board Chairman View - Strategic Oversight</h3>

    {/* Strategic Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Customer Lifetime Value"
        value={formatCurrency(customer.customer_lifetime_value)}
        icon={DollarSign}
        trend={null}
        onClick={() => handleMetricClick('customer_lifetime_value', 'Customer Lifetime Value', formatCurrency(customer.customer_lifetime_value))}
      />
      <MetricCard
        title="Retention Probability"
        value={`${customer.retention_probability?.toFixed(1)}%`}
        icon={CheckCircle}
        trend={null}
        color={customer.retention_probability >= 80 ? 'green' : 'orange'}
        onClick={() => handleMetricClick('retention_probability', 'Retention Probability', `${customer.retention_probability?.toFixed(1)}%`)}
      />
      <MetricCard
        title="Revenue Concentration"
        value={`${customer.revenue_concentration?.toFixed(2)}%`}
        icon={BarChart3}
        trend={null}
        color={customer.revenue_concentration > 10 ? 'red' : 'green'}
        onClick={() => handleMetricClick('annual_revenue', 'Revenue Concentration', `${customer.revenue_concentration?.toFixed(2)}%`)}
      />
      <MetricCard
        title="Profit Margin"
        value={`${customer.profit_margin?.toFixed(1)}%`}
        icon={TrendingUp}
        trend={null}
        color={customer.profit_margin >= 20 ? 'green' : 'orange'}
        onClick={() => handleMetricClick('annual_revenue', 'Profit Margin', `${customer.profit_margin?.toFixed(1)}%`)}
      />
    </div>
    {/* ... rest of the view */}
  </div>
);
```

---

## 🔧 Customizing Drill-Down Content

### Adding a New Metric Type

To add drill-down for a custom metric not yet implemented:

1. **Open `MetricDrillDownModal.tsx`**
2. **Add a new case** in the switch statement:

```typescript
case 'your_new_metric':
  return (
    <div className="space-y-6">
      {/* Header with main value */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-3xl font-bold text-blue-900">{metricValue}</h3>
        <p className="text-sm text-blue-600 mt-1">{metricTitle}</p>
      </div>

      {/* Breakdown section */}
      <div>
        <h4 className="font-semibold mb-3">Breakdown</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-sm">Sub-Metric 1</span>
            <span className="font-semibold">{customer.sub_metric_1}</span>
          </div>
          {/* Add more rows */}
        </div>
      </div>

      {/* Related metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Related Metric A</p>
          <p className="text-2xl font-bold mt-1">{customer.related_a}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Related Metric B</p>
          <p className="text-2xl font-bold mt-1">{customer.related_b}</p>
        </div>
      </div>

      {/* Alerts or recommendations */}
      {customer.some_condition && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-700">
              <strong>Warning:</strong> Some important message
            </p>
          </div>
        </div>
      )}
    </div>
  );
```

---

## 🎨 Design Patterns

### Color-Coded Sections

Use background colors to indicate status:
- **Green (`bg-green-50`)** - Good performance, healthy metrics
- **Orange (`bg-orange-50`)** - Warning, needs attention
- **Red (`bg-red-50`)** - Critical, immediate action required
- **Blue (`bg-blue-50`)** - Informational, neutral

### Section Types

1. **Hero Section** - Large display of main value
2. **Grid Metrics** - 2-4 column grids for related metrics
3. **List Breakdowns** - Vertical lists with labels and values
4. **Charts** - Simple bar charts showing trends
5. **Alerts** - Color-coded warnings with icons

### Example Layout:

```typescript
<div className="space-y-6">
  {/* 1. Hero - Main Value */}
  <div className="bg-blue-50 rounded-lg p-6">
    <h3 className="text-3xl font-bold text-blue-900">$2.5M</h3>
    <p className="text-sm text-blue-600 mt-1">Total Value</p>
  </div>

  {/* 2. Grid - Quick Stats */}
  <div className="grid grid-cols-3 gap-3">
    <div className="bg-white border rounded-lg p-4 text-center">
      <p className="text-sm text-gray-600">Stat 1</p>
      <p className="text-2xl font-bold mt-1">42</p>
    </div>
    {/* More grid items */}
  </div>

  {/* 3. List - Detailed Breakdown */}
  <div>
    <h4 className="font-semibold mb-3">Details</h4>
    <div className="space-y-2">
      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
        <span className="text-sm">Item 1</span>
        <span className="font-semibold">Value 1</span>
      </div>
      {/* More list items */}
    </div>
  </div>

  {/* 4. Alert - Contextual Information */}
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
    <p className="text-sm text-yellow-700">Important note...</p>
  </div>
</div>
```

---

## 📋 Quick Reference: All Metrics

### Board Chairman
- ✅ `customer_lifetime_value`
- ✅ `retention_probability`
- Revenue Concentration (uses `annual_revenue` drill-down)
- Profit Margin (uses `annual_revenue` drill-down)

### CEO
- ✅ `annual_revenue`
- ✅ `nps_score`
- ✅ `pipeline_value`
- YoY Growth (uses `annual_revenue` drill-down)

### Operations
- ✅ `open_tickets`
- ✅ `sla_compliance_pct` (in service metrics)
- Response Time (in `open_tickets` drill-down)
- Recurring Issues (in `open_tickets` drill-down)

### Sales
- ✅ `pipeline_value`
- ✅ `open_opportunities`
- Win Rate (in `pipeline_value` drill-down)
- Avg Deal Size (in `pipeline_value` drill-down)

### Service Management
- ✅ `open_tickets`
- ✅ `csat_score`
- SLA Compliance (in `open_tickets` drill-down)
- Resolution Time (in `open_tickets` drill-down)

### Billing
- ✅ `overdue_invoices`
- ✅ `overdue_amount`
- Days Overdue (in `overdue_amount` drill-down)
- Billing Accuracy (in `overdue_amount` drill-down)

### Account Management
- ✅ `days_to_renewal`
- ✅ `retention_probability`
- ✅ `nps_score`
- Engagement (in `retention_probability` drill-down)

---

## 🧪 Testing Your Drill-Downs

### Checklist:
- [ ] Metric card shows hover effect (scale, border, cursor)
- [ ] Click opens modal with correct data
- [ ] Modal displays metric title and customer name
- [ ] All sections render without errors
- [ ] Close button works
- [ ] Click outside modal doesn't close it (intentional)
- [ ] Press Escape key closes modal (if implemented)
- [ ] Modal scrolls if content is long
- [ ] Colors match metric status (green/orange/red)
- [ ] All values format correctly (currency, percentages, etc.)

---

## 💡 Best Practices

### 1. Keep It Focused
Only show data relevant to the selected metric. Don't overwhelm with unrelated information.

### 2. Show Context
Always include related metrics that provide context (e.g., show overdue amount alongside overdue invoices).

### 3. Use Visual Hierarchy
- Largest text = main value
- Medium text = section headers
- Small text = labels and descriptions

### 4. Add Actionable Insights
Include alerts or recommendations when thresholds are crossed:
```typescript
{customer.overdue_amount > 100000 && (
  <div className="bg-red-100 border-l-4 border-red-500 p-4">
    <AlertTriangle className="h-5 w-5 text-red-600" />
    <p className="text-sm font-semibold text-red-800">ACTION REQUIRED</p>
  </div>
)}
```

### 5. Make Values Scannable
Use consistent formatting:
- Currency: `formatCurrency(value)`
- Percentages: `formatPercent(value)`
- Numbers: `formatNumber(value)`
- Dates: `new Date(value).toLocaleDateString()`

---

## 🚧 Known Limitations

1. **Mobile Responsiveness**: Modal works on mobile but may need scroll optimization for very long content
2. **Keyboard Navigation**: Escape key to close not yet implemented
3. **Loading States**: Drill-down assumes data is already loaded from main query
4. **Historical Data**: Many drill-downs show simulated data that would come from time-series database in production

---

## 🔮 Future Enhancements

Planned improvements:
- [ ] Add trend charts using Recharts library
- [ ] Export drill-down data to CSV/PDF
- [ ] Add comparison mode (compare two customers side-by-side)
- [ ] Deep-link to drill-down (URL parameter)
- [ ] Keyboard shortcuts (ESC to close, arrow keys to navigate)
- [ ] Add filters within drill-down (date ranges, categories)
- [ ] Drill-down history/breadcrumbs
- [ ] Animation on open/close

---

## 📚 Resources

- **MetricCard Component**: `dashboard/src/components/MetricCard.tsx`
- **Modal Component**: `dashboard/src/components/MetricDrillDownModal.tsx`
- **Dashboard Integration**: `dashboard/src/components/PersonaDashboard.tsx`
- **API Endpoints**: All data comes from `GET /api/customer/<id>`

---

**Last Updated**: October 2025
**Version**: 1.0 - Initial Drill-Down Implementation
