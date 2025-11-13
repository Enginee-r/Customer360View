# Customer 360 Platform - Deployment Guide

This guide will walk you through deploying your Customer 360 platform to **Vercel (Frontend)** and **Render (Backend)** - both on their **FREE tiers**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│           VERCEL (Frontend)                 │
│   React + TypeScript + Vite Dashboard       │
│   URL: https://your-app.vercel.app          │
└──────────────────┬──────────────────────────┘
                   │ API Calls
                   ▼
┌─────────────────────────────────────────────┐
│          RENDER (Backend)                   │
│   Flask REST API + Parquet Data             │
│   URL: https://your-app.onrender.com/api    │
└─────────────────────────────────────────────┘
```

---

## Prerequisites

1. **GitHub Account** (for connecting to Vercel/Render)
2. **Git installed** locally
3. **Vercel Account** (free) - Sign up at https://vercel.com
4. **Render Account** (free) - Sign up at https://render.com

---

## Step 1: Prepare Your Code for Deployment

### 1.1 Initialize Git Repository (if not already done)

```bash
cd /Users/robertselemani/Customer360View/python-starter
git init
git add .
git commit -m "Initial commit - Customer 360 Platform"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `customer360-platform`
3. Don't initialize with README (we already have code)
4. Copy the repository URL

### 1.3 Push Code to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/customer360-platform.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render (FREE)

### 2.1 Sign Up/Login to Render
- Go to https://render.com
- Sign up with your GitHub account

### 2.2 Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `customer360-platform`
3. Configure the service:

   **Basic Settings:**
   - **Name:** `customer360-api`
   - **Region:** `Oregon (US West)` or closest to you
   - **Branch:** `main`
   - **Root Directory:** leave blank
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `cd api && gunicorn app:app --bind 0.0.0.0:$PORT`

   **Advanced Settings:**
   - **Plan:** `Free` (select this!)
   - **Environment Variables:** Add these:
     ```
     PYTHON_VERSION=3.11.0
     DATA_SOURCE=local
     FLASK_ENV=production
     ```

4. Click **"Create Web Service"**

### 2.3 Wait for Deployment

- Render will build and deploy your API (takes 5-10 minutes)
- Once complete, you'll get a URL like: `https://customer360-api.onrender.com`
- Test it: `https://customer360-api.onrender.com/api/health`

**Important:** Free tier sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up.

---

## Step 3: Deploy Frontend to Vercel (FREE)

### 3.1 Sign Up/Login to Vercel
- Go to https://vercel.com
- Sign up with your GitHub account

### 3.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository: `customer360-platform`
3. Configure the project:

   **Framework Preset:** `Vite`
   **Root Directory:** `dashboard`
   **Build Command:** `npm run build`
   **Output Directory:** `dist`

### 3.3 Configure Environment Variables

In the **Environment Variables** section, add:

```
VITE_API_URL=https://customer360-api.onrender.com/api
```

Replace `customer360-api.onrender.com` with YOUR actual Render URL from Step 2.3

### 3.4 Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy (takes 2-3 minutes)
3. Once complete, you'll get a URL like: `https://customer360-platform.vercel.app`

---

## Step 4: Test Your Deployed Application

1. Open your Vercel URL in a browser: `https://YOUR-APP.vercel.app`
2. Wait 30 seconds on first load (backend waking up from sleep)
3. Try searching for customers:
   - "Safaricom"
   - "MTN"
   - "Vodacom"
4. View customer dashboards, metrics, and timelines

---

## Step 5: Configure Custom Domain (Optional)

### Vercel Custom Domain (Frontend)
1. Go to your Vercel project → **Settings** → **Domains**
2. Add your domain (e.g., `customer360.yourdomain.com`)
3. Update DNS records as instructed by Vercel

### Render Custom Domain (Backend)
1. Go to your Render service → **Settings** → **Custom Domain**
2. Add your API domain (e.g., `api.yourdomain.com`)
3. Update DNS records as instructed by Render
4. Update `VITE_API_URL` in Vercel to point to your custom API domain

---

## Deployment File Reference

### Created Configuration Files:

1. **`dashboard/vercel.json`** - Vercel deployment configuration
2. **`dashboard/.env.production`** - Production environment variables
3. **`render.yaml`** - Render deployment configuration (optional - can use UI)
4. **`requirements.txt`** - Updated with `gunicorn` for production

---

## Troubleshooting

### Frontend Issues

**Problem:** API calls failing with CORS errors
- **Solution:** Make sure `VITE_API_URL` environment variable in Vercel matches your Render URL exactly (including `/api` at the end)

**Problem:** Build fails on Vercel
- **Solution:** Check that `dashboard` is set as the root directory and build command is `npm run build`

### Backend Issues

**Problem:** Backend not starting on Render
- **Solution:** Check logs in Render dashboard. Common issues:
  - Missing `gunicorn` in requirements.txt (we added this)
  - Wrong start command (should be: `cd api && gunicorn app:app --bind 0.0.0.0:$PORT`)

**Problem:** API returns 404
- **Solution:** Make sure all API routes are prefixed with `/api` (they already are in app.py)

**Problem:** Slow first load
- **Solution:** This is normal on free tier. Render sleeps after 15 min inactivity. Consider:
  - Upgrading to paid tier ($7/month for always-on)
  - Using a keep-alive service like UptimeRobot (free) to ping your API every 14 minutes

### Data Issues

**Problem:** No customer data showing
- **Solution:** Verify the dummy data files in `/data/silver` and `/data/gold` are included in your Git repository. Check `.gitignore` to ensure they're not excluded.

---

## Cost Breakdown

| Service | Tier | Cost | Limits |
|---------|------|------|--------|
| **Vercel** | Free | $0/month | 100GB bandwidth, unlimited deployments |
| **Render** | Free | $0/month | 750 hours/month, sleeps after 15 min inactivity |
| **Total** | - | **$0/month** | Perfect for demos and MVPs |

---

## Upgrading to Paid (Optional)

### When to Upgrade:

- **Render ($7/month):** If you need always-on backend (no cold starts)
- **Vercel ($20/month):** If you need more bandwidth or team collaboration features

### Azure Migration Path:

When you're ready to move to Azure:
- **Frontend:** Azure Static Web Apps (Free tier available)
- **Backend:** Azure App Service (Basic B1 ~$13/month)
- **Data:** Azure Blob Storage for Parquet files
- **Database:** Azure SQL Database or Synapse Analytics

---

## Next Steps

1. ✅ Test the deployed application thoroughly
2. ✅ Share the Vercel URL with your team/stakeholders
3. ✅ Monitor performance in Vercel and Render dashboards
4. ✅ Set up custom domains if needed
5. ✅ Consider upgrading if you need always-on backend

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **Project Issues:** Create an issue in your GitHub repository

---

**Congratulations! Your Customer 360 Platform is now live! 🎉**
