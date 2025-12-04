# Production Deployment Fix for /portal Base Path

## Problem Summary
After adding `/portal` as the base path for the Next.js application, the production environment was experiencing 401 errors during login because the API URLs were misconfigured.

## Root Cause
The nginx configuration routes backend API calls through `/portal/api/` which gets rewritten to the backend server, but the environment variables and code were not properly handling this routing structure.

## Solution

### 1. Update Production Environment Variables (.env.production)

```bash
# Backend API Configuration
# IMPORTANT: Include /portal/api/v1 because nginx routes this to the backend
# and include /api/v1 so the code doesn't append it again
NEXT_PUBLIC_API_URL=https://msafiri.msf.org/portal/api/v1
NEXT_PUBLIC_WS_URL=wss://msafiri.msf.org/portal/api/v1

# Frontend Base Path Configuration
NEXT_PUBLIC_BASE_PATH=/portal

# NextAuth Configuration
NEXTAUTH_SECRET=your-production-secret-here
NEXTAUTH_URL=https://msafiri.msf.org/portal

# Base URL for email links
NEXT_PUBLIC_BASE_URL=https://msafiri.msf.org/portal

# Azure AD, Google Maps, etc. (keep existing values)
```

### 2. Update Nginx Configuration

Add a health check route **BEFORE** the other `/portal/api/` routes:

```nginx
# Health check endpoint
location /portal/health {
    rewrite ^/portal/health$ /health break;
    proxy_pass http://41.90.97.253:8005;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 3. Code Changes Already Applied

The following files have been updated to handle the base path correctly:

1. **lib/auth-config.ts** - Updated to handle API URLs that include `/api/v1`
2. **lib/api.ts** - Already handles this with endpoint checks
3. **lib/base-path.ts** - New utility for internal Next.js API routes
4. **lib/token-refresh.ts** - Updated to use base path helper

### 4. How It Works

#### URL Routing Flow:

**For Backend API Calls (Server-Side from NextAuth):**
```
Code calls: https://msafiri.msf.org/portal/api/v1/auth/login
              ↓
Nginx receives: /portal/api/v1/auth/login
              ↓
Nginx matches: location ~ ^/portal/api/(?!auth)
              ↓
Nginx rewrites to: /api/v1/v1/auth/login
              ↓
Proxies to: http://41.90.97.253:8005/api/v1/v1/auth/login
```

**Wait, there's a problem!** The nginx rewrite adds `/api/v1/` but our URL already has `/api/v1/`, causing duplication.

### 5. The Actual Fix Required

Your production `.env` should be:

```bash
# Don't include /api/v1 because nginx adds it in the rewrite
NEXT_PUBLIC_API_URL=https://msafiri.msf.org/portal/api
NEXT_PUBLIC_WS_URL=wss://msafiri.msf.org/portal/api
```

But this will break the code because it expects `/api/v1` to be present!

The cleanest solution is to **fix the nginx rewrite rule** to not add `/api/v1`:

```nginx
# Admin Portal backend API routes
location ~ ^/portal/api/(?!auth) {
    # Changed: Don't add /api/v1/ here since it's already in the URL
    rewrite ^/portal/api/(.*)$ /$1 break;
    proxy_pass http://41.90.97.253:8005;
    # ... rest of config
}
```

Then use:
```bash
NEXT_PUBLIC_API_URL=https://msafiri.msf.org/portal/api/v1
```

## Final Deployment Steps

1. **Update .env.production:**
   ```bash
   NEXT_PUBLIC_API_URL=https://msafiri.msf.org/portal/api/v1
   NEXT_PUBLIC_BASE_PATH=/portal
   NEXTAUTH_URL=https://msafiri.msf.org/portal
   ```

2. **Update nginx config** (choose one approach):

   **Option A: Simple rewrite (recommended)**
   ```nginx
   location ~ ^/portal/api/(?!auth) {
       rewrite ^/portal/api/(.*)$ /$1 break;
       proxy_pass http://41.90.97.253:8005;
       # ... headers
   }
   ```

   **Option B: Keep current rewrite, change .env**
   ```nginx
   location ~ ^/portal/api/(?!auth) {
       rewrite ^/portal/api/(.*)$ /api/v1/$1 break;
       proxy_pass http://41.90.97.253:8005;
       # ... headers
   }
   ```
   And use: `NEXT_PUBLIC_API_URL=https://msafiri.msf.org/portal/api`

3. **Add health check route** to nginx (before other /portal routes)

4. **Rebuild the application:**
   ```bash
   npm run build
   ```

5. **Restart services:**
   ```bash
   sudo systemctl reload nginx
   pm2 restart msafiri-admin-portal
   ```

## Testing

After deployment, test:
1. Login with credentials
2. Microsoft SSO login
3. API calls from dashboard
4. Notifications

## Troubleshooting

If login still fails, check:
1. Browser console for the actual URL being called
2. Nginx error logs: `tail -f /var/log/nginx/msafiri.msf.org_error.log`
3. Backend API logs to see if requests are reaching it
4. NextAuth debug logs (NEXTAUTH_DEBUG=true)
