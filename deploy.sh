#!/bin/bash

# MSF Admin Portal - Production Deployment Script

echo "🚀 Starting MSF Admin Portal deployment..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Build the application
echo "🔨 Building application..."
npm run build

# Step 3: Start with PM2
echo "🎯 Starting with PM2..."
pm2 start ecosystem.config.js

# Step 4: Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Step 5: Setup PM2 startup (run this manually)
echo "⚡ To enable auto-start on boot, run:"
echo "pm2 startup"
echo "Then run the command it provides"

# Step 6: Check status
echo "📊 Checking PM2 status..."
pm2 status

echo "✅ Deployment complete!"
echo "🌐 Access your app at: http://192.168.200.66:3000"
echo "📋 View logs with: pm2 logs msf-admin-portal"