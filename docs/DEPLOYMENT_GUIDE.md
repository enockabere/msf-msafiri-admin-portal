# MSF Admin Portal - Production Deployment Guide

## 🚀 **Overview**
This guide covers deploying the MSF Admin Portal (Next.js) to production with optimal performance, security, and maintainability.

## 📋 **Pre-Deployment Checklist**

### 1. **Environment Configuration**
- [ ] Production environment variables configured
- [ ] API endpoints updated for production
- [ ] Authentication providers configured
- [ ] Domain/subdomain configured
- [ ] SSL certificates ready

### 2. **Performance Optimization**
- [ ] Build optimization completed
- [ ] Static assets optimized
- [ ] Caching strategies implemented
- [ ] CDN configured (if applicable)

### 3. **Security Hardening**
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Authentication flows tested

## 🗂️ **Files to Clean Up for Production**

### **Development Files to Remove:**
```bash
# Remove development-specific files
rm -rf .next/                    # Build cache (will be regenerated)
rm -rf node_modules/             # Dependencies (will be reinstalled)
rm test-notifications.js         # Development test file
rm -rf docs/                     # Development documentation

# Archive development documentation
mkdir dev-docs
mv CHAT_FIXES_SUMMARY.md dev-docs/
mv CHAT_NOTIFICATION_FIXES.md dev-docs/
mv DASHBOARD_UPDATES.md dev-docs/
mv CALLBACK_URLS.md dev-docs/
mv MICROSOFT_SSO_SETUP.md dev-docs/

# Keep essential files:
# - package.json
# - package-lock.json
# - next.config.ts
# - tailwind.config.ts
# - tsconfig.json
# - .env.local (production version)
# - .gitignore
# - README.md
```

### **Production-Ready File Structure:**
```
msf-admin-portal/
├── app/                    # Next.js app directory
├── components/            # React components
├── context/              # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utility libraries
├── public/               # Static assets
├── types/                # TypeScript types
├── utils/                # Utility functions
├── .env.local           # Production environment variables
├── .gitignore           # Git ignore rules
├── components.json      # shadcn/ui config
├── eslint.config.mjs    # ESLint configuration
├── middleware.ts        # Next.js middleware
├── next.config.ts       # Next.js configuration
├── package.json         # Dependencies
├── postcss.config.mjs   # PostCSS configuration
├── README.md            # Production documentation
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── dev-docs/           # Archived development docs
```

## 🔧 **Production Environment Setup**

### **Environment Variables (.env.local)**
```bash
# Next.js Configuration
NEXTAUTH_URL=https://admin.your-domain.com
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-key-here

# API Configuration
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com

# Microsoft Azure AD Configuration
AZURE_AD_CLIENT_ID=ee68d31d-bf74-48ef-bbdf-51e0a5d1f65d
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=4d9dd1af-83ce-4e9b-b090-b0543ccc2b31

# Production Settings
NODE_ENV=production
NEXTAUTH_DEBUG=false

# Optional: Analytics & Monitoring
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=your-sentry-dsn
```

### **Next.js Production Configuration (next.config.ts)**
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['api.your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.your-domain.com wss://api.your-domain.com;",
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  
  // Output configuration for static export (if needed)
  output: 'standalone', // For Docker deployment
  
  // Experimental features
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
```

## 🐳 **Docker Configuration**

### **Dockerfile**
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

### **docker-compose.yml**
```yaml
version: '3.8'

services:
  admin-portal:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXTAUTH_URL=https://admin.your-domain.com
      - NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
    restart: unless-stopped
    depends_on:
      - api

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - admin-portal
    restart: unless-stopped
```

## 🚀 **Deployment Platforms**

### **Recommended Platforms:**

#### **1. Vercel (Recommended for Next.js)**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXTAUTH_URL": "https://admin.your-domain.com",
    "NEXT_PUBLIC_API_URL": "https://api.your-domain.com/api/v1"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### **2. Netlify**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_ENV = "production"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### **3. Railway**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

## 📊 **Performance Optimization**

### **Build Optimization**
```json
// package.json scripts
{
  "scripts": {
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    "start": "next start",
    "start:prod": "NODE_ENV=production next start -p 3000"
  }
}
```

### **Bundle Analysis**
```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Analyze bundle
npm run build:analyze
```

### **Image Optimization**
```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['api.your-domain.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
};
```

## 🔒 **Security Configuration**

### **Middleware Security (middleware.ts)**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  // HTTPS redirect in production
  if (process.env.NODE_ENV === 'production' && 
      request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    );
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### **Environment Variable Validation**
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_API_URL: z.string().url(),
  AZURE_AD_CLIENT_ID: z.string(),
  AZURE_AD_CLIENT_SECRET: z.string(),
  AZURE_AD_TENANT_ID: z.string(),
});

export const env = envSchema.parse(process.env);
```

## 🔄 **Continuous Deployment**

### **GitHub Actions Workflow (.github/workflows/deploy.yml)**
```yaml
name: Deploy Admin Portal

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm run test
      
    - name: Build application
      run: npm run build
      env:
        NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
        NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
        
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 📈 **Monitoring & Analytics**

### **Health Check API Route (app/api/health/route.ts)**
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check API connectivity
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
    const apiHealthy = apiResponse.ok;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      api: apiHealthy ? 'connected' : 'disconnected',
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'API connection failed' },
      { status: 503 }
    );
  }
}
```

### **Error Tracking with Sentry**
```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

## 🔧 **Production Maintenance**

### **Regular Tasks:**
1. **Dependency updates** (monthly)
2. **Security patches** (as needed)
3. **Performance monitoring** (continuous)
4. **Bundle size analysis** (monthly)
5. **Lighthouse audits** (weekly)

### **Monitoring Checklist:**
- [ ] Application uptime
- [ ] Page load times
- [ ] Core Web Vitals
- [ ] Error rates
- [ ] API response times
- [ ] User authentication flows

## 🚨 **Troubleshooting**

### **Common Issues:**
1. **Build failures** - Check environment variables
2. **Authentication errors** - Verify Azure AD configuration
3. **API connection issues** - Check CORS and network settings
4. **Performance issues** - Analyze bundle size and optimize

### **Debug Commands:**
```bash
# Check build output
npm run build

# Analyze bundle
npm run build:analyze

# Test production build locally
npm run start

# Check environment variables
node -e "console.log(process.env)"
```

## 📞 **Support & Resources**

### **Documentation:**
- Next.js Production Deployment
- Vercel Deployment Guide
- Azure AD Integration
- Performance Optimization

### **Monitoring Tools:**
- Vercel Analytics
- Google Lighthouse
- Sentry Error Tracking
- Uptime monitoring services

This deployment guide ensures a robust, secure, and performant production deployment of the MSF Admin Portal.