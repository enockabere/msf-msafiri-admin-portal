# Debugging Nginx Routing for /portal Deployment

## The Problem

Your original nginx config had:
```nginx
location ~ ^/portal/api/(?!auth) {
    # This EXCLUDES any URL containing "auth"
}
```

This meant:
- ✅ `/portal/api/v1/users` → Goes to backend (matches, no "auth")
- ✅ `/portal/api/auth/callback` → Goes to Next.js (doesn't match because of `(?!auth)`)
- ❌ `/portal/api/v1/auth/login` → Falls through, goes to Next.js → 401 ERROR!

## The Solution

Change the nginx location blocks to be more specific:

### Step 1: Update Nginx Config

Replace your current `/portal/api/` blocks with:

```nginx
# NextAuth API routes - ONLY NextAuth-specific endpoints
location ~ ^/portal/api/auth/(callback|session|signin|signout|csrf|providers) {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Backend API routes - ALL other /portal/api/* routes
location ~ ^/portal/api/ {
    rewrite ^/portal/api/(.*)$ /$1 break;
    proxy_pass http://41.90.97.253:8005;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    client_max_body_size 100m;
    proxy_connect_timeout 90;
    proxy_send_timeout 90;
    proxy_read_timeout 90;
}
```

### Step 2: Verify Your .env.production

Make sure the top of your `.env.production` has:

```bash
NEXT_PUBLIC_API_URL=https://msafiri.msf.org/portal/api/v1
NEXT_PUBLIC_WS_URL=wss://msafiri.msf.org/portal/api/v1
NEXT_PUBLIC_BASE_PATH=/portal
NEXTAUTH_URL=https://msafiri.msf.org/portal
NEXT_PUBLIC_BASE_URL=https://msafiri.msf.org/portal
NEXTAUTH_SECRET=your-actual-secret-here
```

### Step 3: Test and Reload

```bash
# Test nginx config
sudo nginx -t

# If OK, reload nginx
sudo systemctl reload nginx

# Rebuild Next.js app
cd /path/to/msf-admin-portal
npm run build

# Restart PM2 process
pm2 restart msafiri-admin-portal
```

## How to Debug

### 1. Check what URL is being called

In browser console, when you try to login, check the Network tab:
- What URL is being requested?
- What's the response?

### 2. Check Nginx logs

```bash
# Watch error log
tail -f /var/log/nginx/msafiri.msf.org_error.log

# Watch access log
tail -f /var/log/nginx/msafiri.msf.org_access.log
```

### 3. Check if backend API is accessible

```bash
# Test backend health directly
curl http://41.90.97.253:8005/health

# Test backend login directly
curl -X POST http://41.90.97.253:8005/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpass"
```

### 4. Check if routes are configured correctly

```bash
# Test through nginx - should reach backend
curl https://msafiri.msf.org/portal/api/v1/health

# Test through nginx - should reach Next.js
curl https://msafiri.msf.org/portal/api/auth/providers
```

## Request Flow Examples

### Example 1: User Login (Backend API)
```
User submits login form
  ↓
NextAuth calls: https://msafiri.msf.org/portal/api/v1/auth/login
  ↓
Nginx receives: /portal/api/v1/auth/login
  ↓
Matches: location ~ ^/portal/api/
  ↓
Rewrites to: /v1/auth/login
  ↓
Proxies to: http://41.90.97.253:8005/v1/auth/login
  ↓
Backend API receives: POST /v1/auth/login
  ↓
Returns JWT token
  ↓
NextAuth receives token and creates session
  ↓
User redirected to dashboard
```

### Example 2: NextAuth Callback
```
OAuth provider redirects user
  ↓
Browser requests: https://msafiri.msf.org/portal/api/auth/callback/credentials
  ↓
Nginx receives: /portal/api/auth/callback/credentials
  ↓
Matches: location ~ ^/portal/api/auth/(callback|session|...)
  ↓
Proxies to: http://localhost:3000/portal/api/auth/callback/credentials
  ↓
Next.js receives and NextAuth handles callback
  ↓
Session created, user redirected to callbackUrl
```

### Example 3: Internal Next.js API Route (Notifications)
```
Client JavaScript calls: fetch('/api/notifications/stats')
  ↓
Our helper adds base path: /portal/api/notifications/stats
  ↓
Browser requests: https://msafiri.msf.org/portal/api/notifications/stats
  ↓
Nginx receives: /portal/api/notifications/stats
  ↓
Matches: location ~ ^/portal/api/
  ↓
Rewrites to: /notifications/stats
  ↓
Proxies to: http://41.90.97.253:8005/notifications/stats
  ↓
Backend API receives: GET /notifications/stats
```

## Common Issues

### Issue: "Backend /api/v1/... routes not found"

**Symptom:** Nginx forwards `/v1/...` but backend expects `/api/v1/...`

**Fix:** Your backend needs to accept requests at `/v1/...` OR change nginx rewrite:
```nginx
# If backend needs /api/v1 prefix
rewrite ^/portal/api/(.*)$ /api/$1 break;
```

### Issue: "NextAuth callbacks going to backend"

**Symptom:** NextAuth callback URLs (like /callback/credentials) return 404

**Fix:** Make the NextAuth location block MORE specific (which we did above)

### Issue: "CORS errors"

**Symptom:** Browser shows CORS policy errors

**Fix:** Ensure backend has CORS configured for `https://msafiri.msf.org`

## Next Steps

1. Apply the nginx config changes from `nginx-config-CORRECT.conf`
2. Verify your `.env.production` has the correct API URL
3. Test nginx config: `sudo nginx -t`
4. Reload nginx: `sudo systemctl reload nginx`
5. Rebuild app: `npm run build`
6. Restart app: `pm2 restart msafiri-admin-portal`
7. Test login
8. Check logs if it still fails

## Questions to Answer

To help debug further, please check:

1. **What URL is being called when you try to login?**
   - Check browser Network tab

2. **What does nginx access log show?**
   - `tail -20 /var/log/nginx/msafiri.msf.org_access.log`

3. **What does your backend expect?**
   - Does it expect requests at `/api/v1/auth/login` or `/v1/auth/login`?

4. **Is the backend reachable?**
   - `curl http://41.90.97.253:8005/health`
