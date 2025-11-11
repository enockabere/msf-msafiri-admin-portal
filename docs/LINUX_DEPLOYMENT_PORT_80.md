# MSF Admin Portal - Linux Deployment Guide (Port 80)

## Overview
This guide covers deploying the MSF Admin Portal (Next.js application) on a Linux server to run on port 80 (HTTP) with proper production configuration.

## Prerequisites

### System Requirements
- Ubuntu/Debian Linux server (18.04+ or equivalent)
- Minimum 2GB RAM, 2 CPU cores
- 20GB+ disk space
- Root or sudo access

### Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Install Git
sudo apt install git -y
```

## Deployment Steps

### 1. Clone and Setup Application

```bash
# Create unified msafiri directory
sudo mkdir -p /var/www/msafiri
cd /var/www/msafiri

# Clone portal repository
sudo git clone <your-portal-repo-url> portal

# Set proper ownership
sudo chown -R $USER:$USER /var/www/msafiri

# Install portal dependencies
cd portal
npm install
```

### 2. Environment Configuration

Create production environment file:
```bash
sudo nano .env.production
```

Add the following configuration (adjust IPs/domains as needed):
```env
# Production Environment Variables for MSF Admin Portal

# API Configuration - CRITICAL: Must be accessible from server
NEXT_PUBLIC_API_URL=http://msf.msafiri.org:8000
NEXT_PUBLIC_WS_URL=ws://msf.msafiri.org:8000

# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-key-here-make-this-unique-and-long-production-key
NEXTAUTH_URL=http://msf.msafiri.org

# Microsoft Azure AD Configuration (for SSO)
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id

# Production settings
NEXTAUTH_DEBUG=false
NODE_ENV=production
```

### 3. Build Application

```bash
# Build for production
npm run build

# Test the build
npm start
```

### 4. Configure PM2

Create PM2 ecosystem file:
```bash
sudo nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'msafiri-portal',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/msafiri/portal',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      error_file: '/var/www/msafiri/logs/portal-err.log',
      out_file: '/var/www/msafiri/logs/portal-out.log',
      log_file: '/var/www/msafiri/logs/portal-combined.log',
      time: true
    }
  ]
};
```

### 5. Start Application with PM2

```bash
# Create unified logs directory
cd /var/www/msafiri
mkdir -p logs

# Go back to portal directory
cd portal

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 startup on boot
pm2 startup
# Follow the command it provides (usually requires sudo)

# Check status
pm2 status
pm2 logs msafiri-portal
```

### 6. Configure Nginx Reverse Proxy (Port 80)

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/msafiri-portal
```

```nginx
server {
    listen 80;
    server_name msf.msafiri.org;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support for real-time features
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Favicon and other static assets
    location ~* \.(ico|css|js|gif|jpe?g|png|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/msafiri-portal /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 7. Configure Firewall

```bash
# Allow HTTP and SSH
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443  # For future HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

## Verification

### 1. Check Services
```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check application logs
pm2 logs msf-admin-portal

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Test Application
```bash
# Test local connection
curl http://localhost:3000

# Test through Nginx
curl http://localhost

# Test from external
curl http://msf.msafiri.org
```

## Maintenance Commands

### Application Management
```bash
# Restart application
pm2 restart msf-admin-portal

# Stop application
pm2 stop msf-admin-portal

# View logs
pm2 logs msf-admin-portal

# Monitor resources
pm2 monit
```

### Updates and Deployment
```bash
# Pull latest changes
cd /var/www/msf-admin-portal
git pull origin main

# Install new dependencies
npm install

# Rebuild application
npm run build

# Restart application
pm2 restart msf-admin-portal
```

### Nginx Management
```bash
# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx configuration
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Permission denied errors**
   ```bash
   sudo chown -R $USER:$USER /var/www/msf-admin-portal
   ```

3. **Nginx 502 Bad Gateway**
   - Check if Next.js app is running: `pm2 status`
   - Check Nginx configuration: `sudo nginx -t`
   - Check logs: `pm2 logs` and `sudo tail -f /var/log/nginx/error.log`

4. **Environment variables not loading**
   - Ensure `.env.production` exists and has correct values
   - Restart PM2: `pm2 restart msf-admin-portal`

### Log Locations
- Application logs: `/var/www/msf-admin-portal/logs/`
- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`

## Security Considerations

1. **Firewall**: Only allow necessary ports (22, 80, 443)
2. **SSL/HTTPS**: Consider adding SSL certificate for https://msf.msafiri.org
3. **Environment Variables**: Keep sensitive data in `.env.production`
4. **Updates**: Regularly update system packages and Node.js
5. **Monitoring**: Set up monitoring for application health
6. **DNS**: Ensure msf.msafiri.org points to your server IP

## Performance Optimization

1. **PM2 Clustering**: Increase instances in ecosystem.config.js for multi-core servers
2. **Nginx Caching**: Add caching rules for static assets
3. **CDN**: Consider using a CDN for static assets
4. **Database**: Ensure API backend is optimized

## Future API Deployment

This structure is designed to accommodate the API deployment later:

```bash
/var/www/msafiri/
├── portal/          # Next.js admin portal (port 3000)
├── api/             # FastAPI backend (port 8000) - future
└── logs/            # Unified logs for both services
    ├── portal-*.log
    └── api-*.log    # future
```

To add the API later:
```bash
cd /var/www/msafiri
git clone <your-api-repo-url> api
cd api
# Setup API deployment
```

## SSL/HTTPS Setup (Recommended)

For production, add SSL certificate for https://msf.msafiri.org:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d msf.msafiri.org

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Access Your Application

Once deployed successfully, access your application at:
- **HTTP**: `http://msf.msafiri.org`
- **HTTPS**: `https://msf.msafiri.org` (after SSL setup)
- **Direct**: `http://msf.msafiri.org:3000` (if firewall allows)
- **API (future)**: `http://msf.msafiri.org:8000`

The application should now be running on port 80 and accessible via msf.msafiri.org.