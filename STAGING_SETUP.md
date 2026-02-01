# Staging Environment Setup

This document provides instructions for setting up a staging environment for the DevPlan MCP Server on Cloudflare Workers.

## Overview

Cloudflare Workers supports native environments via `[env.<name>]` sections in `wrangler.toml`. When you deploy with `--env staging`, Cloudflare creates a separate worker named `devplan-mcp-server-staging` with its own:
- KV namespace (isolated data)
- Durable Objects instances (isolated sessions)
- Workers.dev subdomain (no risk to production traffic)

## Prerequisites

- `wrangler` CLI authenticated with Cloudflare (`wrangler login`)
- Access to deploy the `devplan-mcp-server` worker
- Current production deployment working

## Setup Steps

### Step 1: Create Staging KV Namespace

Run this command to create an isolated KV namespace for staging:

```bash
wrangler kv:namespace create DEVPLAN_KV --env staging
```

This will output something like:
```
🌀 Creating namespace with title "devplan-mcp-server-staging-DEVPLAN_KV"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
[[kv_namespaces]]
binding = "DEVPLAN_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Save the `id` value** — you'll need it for Step 2.

### Step 2: Add Staging Environment to wrangler.toml

Add the following section at the end of `wrangler.toml`. Replace `<STAGING_KV_ID>` with the ID from Step 1:

```toml
# =============================================================================
# Staging Environment
# =============================================================================
[env.staging]
workers_dev = true  # Deploy to workers.dev subdomain only (no custom domain)

[env.staging.vars]
AUTH_ENABLED = "false"
FREE_TIER_LIMIT = "100"
SESSION_INACTIVITY_TTL_DAYS = "1"
SESSION_ABSOLUTE_TTL_DAYS = "7"
CLEANUP_CHECK_HOURS = "1"

[[env.staging.kv_namespaces]]
binding = "DEVPLAN_KV"
id = "<STAGING_KV_ID>"

[[env.staging.durable_objects.bindings]]
name = "MCP_OBJECT"
class_name = "DevPlanMCP"
```

### Step 3: Copy Secrets to Staging Environment

If the worker uses secrets, they must be added separately for each environment. Check the bottom of `wrangler.toml` for the list of secrets used.

For each secret:
```bash
wrangler secret put CF_ANALYTICS_TOKEN --env staging
wrangler secret put CF_ZONE_ID --env staging
wrangler secret put CF_ACCOUNT_ID --env staging
```

You'll be prompted to enter the value for each. Use the same values as production, or skip if they're optional.

**Note:** If you don't have the secret values, you can skip this step — the worker will still deploy, but analytics features may not work in staging.

### Step 4: Deploy to Staging

```bash
wrangler deploy --env staging
```

Expected output:
```
Uploaded devplan-mcp-server-staging
Published devplan-mcp-server-staging
  https://devplan-mcp-server-staging.<subdomain>.workers.dev
```

Note the staging URL from the output.

### Step 5: Verify Staging Deployment

Test the staging endpoint:

```bash
# Check SSE endpoint responds
curl -I https://devplan-mcp-server-staging.<subdomain>.workers.dev/sse

# Or test with a simple MCP tool call if you have a test client
```

The staging environment should behave identically to production but with isolated data.

## Usage Workflow

### Before deploying new features to production:

1. **Deploy to staging first:**
   ```bash
   wrangler deploy --env staging
   ```

2. **Test on staging:**
   - SSE endpoint: `https://devplan-mcp-server-staging.<subdomain>.workers.dev/sse`
   - Run smoke tests against staging URL
   - Verify new features work as expected

3. **If staging passes, deploy to production:**
   ```bash
   wrangler deploy
   ```

4. **If something breaks in production, rollback:**
   ```bash
   git checkout <last-known-good-tag>
   wrangler deploy
   ```

## Environment Comparison

| Aspect | Production | Staging |
|--------|------------|---------|
| Worker name | `devplan-mcp-server` | `devplan-mcp-server-staging` |
| URL | `mcp.devplanmcp.store/sse` | `devplan-mcp-server-staging.<subdomain>.workers.dev/sse` |
| KV namespace | Production ID | Staging ID (isolated) |
| Durable Objects | Production instances | Staging instances (isolated) |
| Custom domain | Yes | No (workers.dev only) |

## Troubleshooting

### "binding not found" errors
Ensure the `[[env.staging.kv_namespaces]]` and `[[env.staging.durable_objects.bindings]]` sections are correctly formatted with double brackets.

### Secrets missing
Secrets are not inherited between environments. You must run `wrangler secret put <NAME> --env staging` for each secret.

### Durable Objects migration errors
The migrations in the main config apply to all environments using the same class. If you see migration issues, ensure the migration tags are consistent.

## Notes

- Staging data is completely isolated from production
- You can safely test destructive operations in staging
- The staging worker has its own usage limits and billing
- Consider adding a staging-specific var like `ENVIRONMENT = "staging"` if you need runtime environment detection
