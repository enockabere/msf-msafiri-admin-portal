# MSF Admin Portal - Server Deployment Guide

## Prerequisites
- Server with Ubuntu/Linux
- Node.js 18+ installed
- PM2 process manager
- Nginx web server
- API already deployed on port 8000

## Step 1: Install Node.js and Dependencies

```bash
# Install Node.js 18 (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx (if not already installed)
sudo apt update
sudo apt install nginx -y
```

## Step 2: Clone and Setup Project

```bash
# Navigate to projects directory
cd ~/projects/msafiri

# Clone the admin portal repository
git clone <your-repo-url> msf-admin-portal
cd msf-admin-portal

# Install dependencies
npm install
```

## Step 3: Environment Configuration

Create `.env.local` file:

```bash
nano .env.local
```

Add the following content:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8000/api/v1
NEXT_PUBLIC_API_BASE_URL=http://YOUR_SERVER_IP:8000

# Environment
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production

# Optional: Analytics, monitoring, etc.
# NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
```

Replace `YOUR_SERVER_IP` with your actual server IP address.

## Step 4: Build the Application

```bash
# Build the Next.js application
npm run build

# Test the build locally (optional)
npm start
```

## Step 5: PM2 Configuration

Create PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

Add the following content:

```javascript
module.exports = {
  apps: [
    {
      name: 'msf-admin-portal',
      script: 'npm',
      args: 'start',
      cwd: '/home/leo-server/projects/msafiri/msf-admin-portal',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
```

Create logs directory:

```bash
mkdir logs
```

## Step 6: Start with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

## Step 7: Nginx Configuration

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/msf-admin-portal
```

Add the following content:

```nginx
server {
    # Use port 80 if available, otherwise use alternative port like 8080
    listen 80;  # Change to 8080 if port 80 is occupied
    server_name YOUR_SERVER_IP;

    # Admin Portal (Next.js)
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

    # API Proxy (FastAPI)
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Docs
    location /docs {
        proxy_pass http://localhost:8000/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable the site:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/msf-admin-portal /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 8: Firewall Configuration

```bash
# Allow HTTP and HTTPS traffic (or specific port if using alternative)
sudo ufw allow 'Nginx Full'
# If using alternative port (e.g., 8080):
# sudo ufw allow 8080

# Allow SSH (if not already allowed)
sudo ufw allow ssh

# Enable firewall
sudo ufw enable
```

## Step 9: Verification

Check if services are running:

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check if ports are listening
sudo netstat -tlnp | grep :3000  # Next.js
sudo netstat -tlnp | grep :8000  # FastAPI
sudo netstat -tlnp | grep :80    # Nginx
```

Test the deployment:

```bash
# Test Next.js directly
curl http://localhost:3000

# Test through Nginx
curl http://YOUR_SERVER_IP

# Test API through Nginx
curl http://YOUR_SERVER_IP/api/v1/health
```

## Step 10: Access Your Application

- **Admin Portal**: `http://YOUR_SERVER_IP`
- **API Documentation**: `http://YOUR_SERVER_IP/docs`
- **API Health Check**: `http://YOUR_SERVER_IP/health`

## Useful Commands

```bash
# PM2 Management
pm2 restart msf-admin-portal
pm2 stop msf-admin-portal
pm2 logs msf-admin-portal
pm2 monit

# Nginx Management
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo nginx -t

# View logs
tail -f logs/combined.log
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Common Issues:

1. **Port 3000 already in use**:
   ```bash
   sudo lsof -i :3000
   pm2 delete all
   pm2 start ecosystem.config.js
   ```

2. **Nginx 502 Bad Gateway**:
   - Check if Next.js is running: `pm2 status`
   - Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

3. **API calls failing**:
   - Verify API URL in `.env.local`
   - Check CORS settings in FastAPI
   - Test API directly: `curl http://localhost:8000/health`

4. **Build failures**:
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

## Security Considerations

1. **Add SSL/HTTPS** (recommended for production)
2. **Configure proper CORS** in FastAPI
3. **Set up proper firewall rules**
4. **Regular security updates**
5. **Monitor logs** for suspicious activity

## Updates and Maintenance

To update the application:

```bash
cd ~/projects/msafiri/msf-admin-portal
git pull origin main
npm install
npm run build
pm2 restart msf-admin-portal
```