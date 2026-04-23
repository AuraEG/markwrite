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
        Sync["Sync Server<br/>(Hugging Face Spaces)"]
        DB[("PostgreSQL<br/>(Neon)")]
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
| Sync Server     | Hugging Face Spaces  | WebSocket server for real-time collaboration |
| Database        | Neon                 | PostgreSQL data storage                      |

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account with admin access to the repository
- [ ] Vercel account (free tier works)
- [ ] Hugging Face account (free tier works, no card required)
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

### Neon Serverless PostgreSQL (Recommended)

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

| Setting              | Value                                                |
| -------------------- | ---------------------------------------------------- |
| **Framework Preset** | SvelteKit                                            |
| **Root Directory**   | `apps/web`                                           |
| **Build Command**    | `cd ../.. && pnpm --filter @markwrite/web build`     |
| **Output Directory** | Leave empty (use SvelteKit default output detection) |
| **Install Command**  | `cd ../.. && pnpm install --frozen-lockfile`         |

#### 3. Set Environment Variables

Add all web application environment variables in **Settings > Environment Variables**.

#### 4. Deploy

Click **Deploy** and wait for the build to complete.

### Vercel Configuration File

The repository includes a `vercel.json` (if needed):

```json
{
  "framework": "sveltekit",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter @markwrite/web build"
}
```

### Custom Domain

1. Go to **Settings > Domains**
2. Add your domain (e.g., `markwrite.app`)
3. Configure DNS records as instructed
4. SSL certificates are automatically provisioned

---

## Sync Server Deployment

### Deploying to Hugging Face Spaces (No Card Required)

#### 1. Create Space

1. Go to [Hugging Face Spaces](https://huggingface.co/new-space)
2. Create a new Space with:
   - **SDK:** Docker
   - **Visibility:** Public or Private (your choice)
   - **Name:** `markwrite-sync`

#### 2. Create Hugging Face Access Token

1. Go to [Hugging Face Tokens](https://huggingface.co/settings/tokens)
2. Create a token with **Write** permission
3. Save it as `HF_TOKEN`

#### 3. Configure GitHub Secrets (for automated deploy)

In your GitHub repository settings, add:

| Secret          | Description                                       |
| --------------- | ------------------------------------------------- |
| `HF_TOKEN`      | Hugging Face write token                          |
| `HF_USERNAME`   | Your Hugging Face username                        |
| `HF_SPACE_NAME` | Space repository name (example: `markwrite-sync`) |

#### 4. Set Space Environment Variables

In your Hugging Face Space **Settings → Variables and Secrets**, set:

| Variable                       | Value                                           |
| ------------------------------ | ----------------------------------------------- |
| `DATABASE_URL`                 | Neon PostgreSQL connection string               |
| `NODE_ENV`                     | `production`                                    |
| `PORT`                         | `10000`                                         |
| `HOST`                         | `0.0.0.0`                                       |
| `WEB_APP_URL`                  | Your Vercel URL (`https://your-app.vercel.app`) |
| `CORS_ORIGINS`                 | Same as `WEB_APP_URL`                           |
| `MAX_CONNECTIONS_PER_IP`       | `10`                                            |
| `MAX_CONNECTIONS_PER_DOCUMENT` | `50`                                            |
| `DEBOUNCE_MS`                  | `2000`                                          |
| `MAX_DEBOUNCE_MS`              | `10000`                                         |

#### 5. Deploy Sync Server

Automatic path (recommended):

- Push to `main` (CI deploys to your Hugging Face Space when secrets are configured)

Manual path:

```bash
HF_TOKEN=hf_xxx \
HF_USERNAME=your-hf-username \
HF_SPACE_NAME=markwrite-sync \
./scripts/deploy-sync-to-hf.sh
```

#### 6. Connect Vercel to Sync Server

Set this variable in Vercel project settings:

```env
PUBLIC_SYNC_SERVER_URL=wss://<your-hf-space-subdomain>.hf.space
VITE_SYNC_SERVER_URL=wss://<your-hf-space-subdomain>.hf.space
```

### WebSocket Considerations

- Hugging Face Spaces supports WebSocket traffic for Docker Spaces
- Ensure the domain uses `wss://` (not `ws://`) in production
- Free hardware sleeps after inactivity, so first connection may be cold-started

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

### Hugging Face Space Logs

Hugging Face provides:

- Build logs
- Runtime logs
- Container restart status

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

#### "No Output Directory named \"node\" found"

**Symptoms:** Build succeeds but deployment fails with missing `node` output directory.

**Solutions:**

1. Set **Root Directory** to `apps/web`
2. Set **Framework Preset** to `SvelteKit`
3. Clear **Output Directory** in Vercel project settings (leave it empty)
4. Redeploy after confirming `apps/web/vercel.json` is committed

### Log Access

#### Vercel Logs

- **Functions:** Deployment > Functions tab
- **Runtime:** Deployment > Logs tab

#### Hugging Face Logs

- Open your Space page
- Go to **Logs**
- Check build and runtime output

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
- [ ] HTTPS is enforced (automatic on Vercel/Hugging Face)
- [ ] CORS origins are restricted to your domains
- [ ] Rate limiting is configured
- [ ] Database has restricted access (not public)
- [ ] GitHub OAuth callback URL is exact match
- [ ] Session cookies are httpOnly and secure

---

## Updating Deployments

### Automatic Deployments

Both Vercel and Hugging Face support automatic deployments:

- Push to `main` branch triggers production deploy
- Push to `develop` branch triggers preview/staging deploy

### Manual Deployments

**Vercel:**

```bash
vercel --prod
```

**Hugging Face (sync server):**

```bash
HF_TOKEN=hf_xxx \
HF_USERNAME=your-hf-username \
HF_SPACE_NAME=markwrite-sync \
./scripts/deploy-sync-to-hf.sh
```

### Rolling Back

**Vercel:**

1. Go to **Deployments**
2. Find the previous working deployment
3. Click **Promote to Production**

**Hugging Face:**

1. Open your Space repository
2. Re-run deploy from CI or push an earlier commit via the deploy script
