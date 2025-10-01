# Direct Port Deployment (No Nginx)

If you want to run the Next.js app directly on port 3000 without Nginx:

## Configuration

### Environment Variables (.env.local)
```env
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8000
NEXT_PUBLIC_WS_URL=ws://YOUR_SERVER_IP:8000
NEXTAUTH_URL=http://YOUR_SERVER_IP:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
NODE_ENV=production
```

### PM2 Configuration (ecosystem.config.js)
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
      }
    }
  ]
};
```

## Firewall Configuration
```bash
# Allow port 3000 for Next.js
sudo ufw allow 3000

# Allow port 8000 for API (if not already allowed)
sudo ufw allow 8000
```

## Access URLs
- **Admin Portal**: `http://YOUR_SERVER_IP:3000`
- **API**: `http://YOUR_SERVER_IP:8000/api/v1`
- **API Docs**: `http://YOUR_SERVER_IP:8000/docs`

## Advantages
- **Simpler setup** - no Nginx configuration needed
- **Direct access** - fewer moving parts
- **Easier debugging** - direct port access

## Considerations
- **CORS**: Ensure FastAPI allows `http://YOUR_SERVER_IP:3000` in CORS origins
- **Production**: Consider using Nginx for SSL/HTTPS in production
- **Load balancing**: Nginx provides better load balancing for multiple instances