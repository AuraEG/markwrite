# Deployment Guide

> **Version:** 1.0  
> **Last Updated:** 2026-04-04

This guide covers deploying MarkWrite to production environments.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Web Application Deployment](#web-application-deployment)
6. [Sync Server Deployment](#sync-server-deployment)
7. [Post-Deployment](#post-deployment)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Overview

MarkWrite consists of three deployable components:

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart LR
    subgraph Production
        Web["Web Application<br/>(Vercel)"]
        Sync["Sync Server<br/>(Railway)"]
        DB[("PostgreSQL<br/>(Railway/Neon)")]
    end

    Users["Users"] --> Web
    Users --> Sync
    Web --> DB
    Sync --> DB

    style Web fill:#2563eb,color:#fff
    style Sync fill:#8b5cf6,color:#fff
    style DB fill:#059669,color:#fff
```

| Component       | Recommended Platform | Purpose                                      |
| --------------- | -------------------- | -------------------------------------------- |
| Web Application | Vercel               | Frontend, REST API, authentication           |
| Sync Server     | Railway              | WebSocket server for real-time collaboration |
| Database        | Railway or Neon      | PostgreSQL data storage                      |

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account with admin access to the repository
- [ ] Vercel account (free tier works)
- [ ] Railway account (or alternative for sync server)
- [ ] GitHub OAuth application created
- [ ] Domain name (optional, for custom domain)

### Creating GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - **Application name:** MarkWrite
   - **Homepage URL:** `https://your-domain.com`
   - **Authorization callback URL:** `https://your-domain.com/auth/github/callback`
4. Save the **Client ID** and generate a **Client Secret**

---

## Environment Configuration

### Web Application Environment Variables

Create these environment variables in your deployment platform:

| Variable                 | Required | Description                  | Example                                      |
| ------------------------ | -------- | ---------------------------- | -------------------------------------------- |
| `DATABASE_URL`           | Yes      | PostgreSQL connection string | `postgresql://user:pass@host:5432/markwrite` |
| `GITHUB_CLIENT_ID`       | Yes      | GitHub OAuth client ID       | `Iv1.abc123...`                              |
| `GITHUB_CLIENT_SECRET`   | Yes      | GitHub OAuth client secret   | `secret_abc123...`                           |
| `PUBLIC_APP_URL`         | Yes      | Full URL of the web app      | `https://markwrite.app`                      |
| `PUBLIC_SYNC_SERVER_URL` | Yes      | WebSocket URL of sync server | `wss://sync.markwrite.app`                   |
| `VITE_SYNC_SERVER_URL`   | Yes      | Same as above (Vite build)   | `wss://sync.markwrite.app`                   |

### Sync Server Environment Variables

| Variable                       | Required | Default       | Description                        |
| ------------------------------ | -------- | ------------- | ---------------------------------- |
| `DATABASE_URL`                 | Yes      | -             | PostgreSQL connection string       |
| `PORT`                         | No       | `1234`        | Server port                        |
| `HOST`                         | No       | `0.0.0.0`     | Server host                        |
| `CORS_ORIGINS`                 | Yes      | -             | Comma-separated allowed origins    |
| `WEB_APP_URL`                  | Yes      | -             | URL of web app for auth validation |
| `MAX_CONNECTIONS_PER_IP`       | No       | `10`          | Rate limiting                      |
| `MAX_CONNECTIONS_PER_DOCUMENT` | No       | `50`          | Rate limiting                      |
| `DEBOUNCE_MS`                  | No       | `2000`        | Persistence debounce               |
| `MAX_DEBOUNCE_MS`              | No       | `10000`       | Max persistence delay              |
| `NODE_ENV`                     | No       | `development` | Set to `production`                |

---

## Database Setup

### Option A: Railway PostgreSQL

1. Create a new project in [Railway](https://railway.app)
2. Add a PostgreSQL service
3. Copy the `DATABASE_URL` from the service variables
4. The URL format is: `postgresql://postgres:password@host:port/railway`

### Option B: Neon Serverless PostgreSQL

1. Create an account at [Neon](https://neon.tech)
2. Create a new project and database
3. Copy the connection string (use the pooled connection for serverless)
4. Enable connection pooling for better performance

### Running Migrations

After setting up the database, run migrations:

```bash
# Local development
pnpm --filter web db:push

# Or generate and run migrations
pnpm --filter web db:generate
pnpm --filter web db:migrate
```

For production, migrations run automatically on build or can be triggered manually.

---

## Web Application Deployment

### Deploying to Vercel

#### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your GitHub repository
4. Select the `markwrite` monorepo

#### 2. Configure Build Settings

| Setting              | Value          |
| -------------------- | -------------- |
| **Framework Preset** | SvelteKit      |
| **Root Directory**   | `apps/web`     |
| **Build Command**    | `pnpm build`   |
| **Output Directory** | `.svelte-kit`  |
| **Install Command**  | `pnpm install` |

#### 3. Set Environment Variables

Add all web application environment variables in **Settings > Environment Variables**.

#### 4. Deploy

Click **Deploy** and wait for the build to complete.

### Vercel Configuration File

The repository includes a `vercel.json` (if needed):

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "sveltekit"
}
```

### Custom Domain

1. Go to **Settings > Domains**
2. Add your domain (e.g., `markwrite.app`)
3. Configure DNS records as instructed
4. SSL certificates are automatically provisioned

---

## Sync Server Deployment

### Deploying to Railway

#### 1. Create Service

1. In your Railway project, click **New Service**
2. Select **Deploy from GitHub repo**
3. Choose the `markwrite` repository

#### 2. Configure Build

| Setting            | Value              |
| ------------------ | ------------------ |
| **Root Directory** | `apps/sync-server` |
| **Build Command**  | `pnpm build`       |
| **Start Command**  | `pnpm start`       |

#### 3. Set Environment Variables

Add all sync server environment variables.

#### 4. Generate Domain

1. Go to **Settings > Networking**
2. Click **Generate Domain**
3. Note the URL (e.g., `markwrite-sync.up.railway.app`)
4. Update the web app's `PUBLIC_SYNC_SERVER_URL` to use `wss://` with this domain

### Railway Configuration File

Create `railway.toml` in `apps/sync-server/`:

```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm build"

[deploy]
startCommand = "pnpm start"
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### WebSocket Considerations

- Railway supports WebSocket connections natively
- Ensure the domain uses `wss://` (not `ws://`) in production
- Configure appropriate timeout values for long-lived connections

---

## Post-Deployment

### Verification Checklist

After deployment, verify each component:

#### Web Application

- [ ] Home page loads correctly
- [ ] GitHub OAuth login works
- [ ] Redirects to `/documents` after login
- [ ] Can create a new document
- [ ] Editor loads without errors

#### Sync Server

- [ ] Health check endpoint responds (`GET /`)
- [ ] WebSocket connection establishes
- [ ] Real-time sync works between two browsers
- [ ] Presence awareness shows other users

#### Database

- [ ] Users are created on first login
- [ ] Documents persist across page reloads
- [ ] Version history is saved

### Initial Data (Optional)

If you want to seed initial data:

```bash
# Requires DATABASE_URL to be set
pnpm --filter web db:seed
```

---

## Monitoring

### Vercel Analytics

Enable Vercel Analytics for:

- Page load performance
- Web Vitals metrics
- Error tracking

### Railway Metrics

Railway provides:

- CPU and memory usage
- Network traffic
- Build and deploy logs

### Recommended External Tools

| Tool            | Purpose                     |
| --------------- | --------------------------- |
| **Sentry**      | Error tracking and alerting |
| **Codecov**     | Code coverage reporting     |
| **UptimeRobot** | Uptime monitoring           |

### Setting Up Sentry (Optional)

1. Create a project at [Sentry](https://sentry.io)
2. Add the Sentry DSN to environment variables:
   ```
   SENTRY_DSN=https://xxx@sentry.io/xxx
   ```
3. Configure Sentry in the SvelteKit hooks

---

## Troubleshooting

### Common Issues

#### WebSocket Connection Fails

**Symptoms:** Editor loads but shows "Disconnected" or sync doesn't work.

**Solutions:**

1. Verify `PUBLIC_SYNC_SERVER_URL` uses `wss://` protocol
2. Check CORS configuration includes the web app origin
3. Ensure sync server is running and accessible
4. Check browser console for WebSocket errors

#### OAuth Callback Error

**Symptoms:** Login fails with "invalid_request" or similar.

**Solutions:**

1. Verify callback URL matches exactly in GitHub OAuth settings
2. Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct
3. Ensure `PUBLIC_APP_URL` matches the deployment URL

#### Database Connection Timeout

**Symptoms:** API requests timeout or fail with connection errors.

**Solutions:**

1. Verify `DATABASE_URL` is correct
2. Check database service is running
3. For Neon, use the pooled connection string
4. Check if IP allowlist is required

#### Build Fails on Vercel

**Symptoms:** Deployment fails during build step.

**Solutions:**

1. Check build logs for specific errors
2. Ensure all environment variables are set
3. Verify `pnpm-lock.yaml` is committed
4. Try clearing cache: **Settings > General > Clear Cache**

### Log Access

#### Vercel Logs

- **Functions:** Deployment > Functions tab
- **Runtime:** Deployment > Logs tab

#### Railway Logs

- Click on the service
- View logs in real-time or historical

### Health Checks

**Web Application:**

```bash
curl https://your-domain.com
# Should return 200 OK with HTML
```

**Sync Server:**

```bash
curl https://your-sync-server.com
# Should return 200 OK
```

**Database:**

```bash
# From a machine with psql access
psql $DATABASE_URL -c "SELECT 1"
```

---

## Security Checklist

Before going live:

- [ ] All secrets are in environment variables (not committed)
- [ ] `NODE_ENV=production` is set
- [ ] HTTPS is enforced (automatic on Vercel/Railway)
- [ ] CORS origins are restricted to your domains
- [ ] Rate limiting is configured
- [ ] Database has restricted access (not public)
- [ ] GitHub OAuth callback URL is exact match
- [ ] Session cookies are httpOnly and secure

---

## Updating Deployments

### Automatic Deployments

Both Vercel and Railway support automatic deployments:

- Push to `main` branch triggers production deploy
- Push to `develop` branch triggers preview/staging deploy

### Manual Deployments

**Vercel:**

```bash
vercel --prod
```

**Railway:**

- Trigger from dashboard or CLI
- Or push to the connected branch

### Rolling Back

**Vercel:**

1. Go to **Deployments**
2. Find the previous working deployment
3. Click **Promote to Production**

**Railway:**

1. Go to **Deployments**
2. Click on the previous deployment
3. Select **Redeploy**
