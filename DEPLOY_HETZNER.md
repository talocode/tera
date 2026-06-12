# Hetzner + Coolify Deployment Guide for teraai.chat

## Step 1: Create Hetzner Account & Server

1. Go to https://www.hetzner.com/cloud and sign up
2. Create a new project (e.g., "tera-production")
3. Add an SSH key (Settings → Security → SSH Keys)
4. Create a server:
   - **Location:** Falkenstein or Nuremberg (cheapest)
   - **Image:** Ubuntu 24.04
   - **Type:** CX22 (2 vCPU, 4GB RAM) — ~€4.50/mo
   - **Networking:** Enable IPv4 + IPv6
   - **Firewall:** Allow ports 22, 80, 443, 8000

## Step 2: Install Coolify on Your Server

```bash
ssh root@YOUR_SERVER_IP

# Install Coolify
curl -fsSL https://cdn.coollabsio/coolify/install.sh | bash
```

After installation, access Coolify at: `http://YOUR_SERVER_IP:8000`

## Step 3: Configure Your Domain (teraai.chat)

1. In Hetzner DNS, create an A record:
   - Name: `@` (or leave blank for root)
   - Value: `YOUR_SERVER_IP`
   - TTL: 60

2. In Coolify Dashboard:
   - Go to **Settings → Domains**
   - Add `teraai.chat`
   - Enable SSL (auto via Let's Encrypt)

## Step 4: Connect CLI to Coolify

```bash
# Set API token in Coolify dashboard (Settings → API Tokens)
coolify context create --name production --fqdn http://YOUR_SERVER_IP:8000 --token YOUR_API_TOKEN

# Verify connection
coolify context list
```

## Step 5: Create Applications in Coolify

### Option A: Using Coolify Dashboard (Recommended)

1. **Create Project:** Projects → New Project → Name: "Tera"
2. **Add tera-web service:**
   - Click "New Resource" → Application
   - Source: Git Repository
   - Repository: `YOUR_GITHUB_REPO/tera`
   - Branch: `main`
   - Build Pack: Dockerfile
   - Dockerfile Location: `/Dockerfile`
   - Port: 3000
   - Domains: `teraai.chat`

3. **Add tera-api service:**
   - Click "New Resource" → Application
   - Source: Git Repository
   - Repository: `YOUR_GITHUB_REPO/tera`
   - Branch: `main`
   - Build Pack: Dockerfile
   - Dockerfile Location: `/backend-server/Dockerfile`
   - Port: 5000
   - Domains: `api.teraai.chat`

### Option B: Using CLI

```bash
# Create project
coolify project create --name "Tera"

# Create web app
coolify app create --name tera-web --project-id YOUR_PROJECT_ID \
  --repository YOUR_GITHUB_REPO/tera --branch main \
  --dockerfile /Dockerfile --port 3000 --domains teraai.chat

# Create API app
coolify app create --name tera-api --project-id YOUR_PROJECT_ID \
  --repository YOUR_GITHUB_REPO/tera --branch main \
  --dockerfile /backend-server/Dockerfile --port 5000 --domains api.teraai.chat
```

## Step 6: Set Environment Variables

In Coolify Dashboard, for each service, go to **Environment Variables** and add:

### tera-web:
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://teraai.chat
AUTH_URL=https://teraai.chat
NEXTAUTH_URL=https://teraai.chat
AUTH_SECRET=your_auth_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MISTRAL_API_KEY=your_mistral_key
TAVILY_API_KEY=your_tavily_key
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret
LEMON_SQUEEZY_PRO_VARIANT_ID=your_pro_variant
LEMON_SQUEEZY_PLUS_VARIANT_ID=your_plus_variant
NEXT_PUBLIC_LEMON_STORE_ID=your_store_id
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=TeraAI <onboarding@resend.dev>
RESEND_REPLY_TO_EMAIL=support@teraai.chat
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
WEB_URL=https://teraai.chat
```

### tera-api:
```
NODE_ENV=production
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
MISTRAL_API_KEY=your_mistral_key
TAVILY_API_KEY=your_tavily_key
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=TeraAI <onboarding@resend.dev>
RESEND_REPLY_TO_EMAIL=support@teraai.chat
WEB_URL=https://teraai.chat
```

## Step 7: Deploy

1. In Coolify Dashboard, click **Deploy** for each service
2. Or use CLI:
```bash
coolify deploy --app tera-web --project-id YOUR_PROJECT_ID
coolify deploy --app tera-api --project-id YOUR_PROJECT_ID
```

## Step 8: Update API URLs in Your Code

Make sure your frontend points to the correct API URL:
```env
# In tera-web environment
NEXT_PUBLIC_API_URL=https://api.teraai.chat
```

## Troubleshooting

- **Build fails:** Check Coolify build logs in dashboard
- **Health check fails:** Ensure `/health` endpoint exists in both services
- **SSL issues:** Wait 5-10 minutes for Let's Encrypt certificate
- **CORS errors:** Update backend CORS to include new domains

## Cost Summary

- Hetzner CX22: ~€4.50/mo (~$5/mo)
- Domain: Already have teraai.chat
- Total: ~$5/mo
