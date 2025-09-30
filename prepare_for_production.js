#!/usr/bin/env node
/**
 * Production Preparation Script for MSF Admin Portal
 * This script helps prepare the Next.js app for production deployment.
 */

const fs = require('fs');
const path = require('path');

function createDevDocsDirectory() {
    const devDocsDir = 'dev-docs';
    if (!fs.existsSync(devDocsDir)) {
        fs.mkdirSync(devDocsDir);
    }
    console.log(`✅ Created ${devDocsDir} directory`);
    return devDocsDir;
}

function moveDevFiles(devDocsDir) {
    const filesToMove = [
        'CHAT_FIXES_SUMMARY.md',
        'CHAT_NOTIFICATION_FIXES.md', 
        'DASHBOARD_UPDATES.md',
        'CALLBACK_URLS.md',
        'MICROSOFT_SSO_SETUP.md',
        'test-notifications.js'
    ];
    
    const movedFiles = [];
    
    filesToMove.forEach(file => {
        if (fs.existsSync(file)) {
            try {
                const destination = path.join(devDocsDir, file);
                fs.renameSync(file, destination);
                movedFiles.push(file);
                console.log(`📦 Moved ${file} to dev-docs/`);
            } catch (error) {
                console.log(`❌ Error moving ${file}: ${error.message}`);
            }
        }
    });
    
    return movedFiles;
}

function createProductionEnvExample() {
    const envExample = `# Production Environment Configuration

# Next.js Configuration
NEXTAUTH_URL=https://admin.your-domain.com
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-key-here

# API Configuration
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com

# Microsoft Azure AD Configuration
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id

# Production Settings
NODE_ENV=production
NEXTAUTH_DEBUG=false

# Optional: Analytics & Monitoring
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=your-sentry-dsn
`;
    
    fs.writeFileSync('.env.production.example', envExample);
    console.log('📝 Created .env.production.example');
}

function createProductionReadme() {
    const readmeContent = `# MSF Admin Portal - Production

## 🚀 Quick Start

### Environment Setup
1. Copy \`.env.production.example\` to \`.env.local\`
2. Configure production environment variables
3. Update API endpoints

### Build and Deploy
\`\`\`bash
# Install dependencies
npm ci --only=production

# Build for production
npm run build

# Start production server
npm start
\`\`\`

### Health Check
\`\`\`bash
curl https://admin.your-domain.com/api/health
\`\`\`

## 📚 Documentation
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete production deployment guide
- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API

## 🔧 Development Files
Development documentation has been moved to \`dev-docs/\` directory.

## 📞 Support
For production issues, check the deployment guide or contact the development team.
`;
    
    fs.writeFileSync('README_PRODUCTION.md', readmeContent);
    console.log('📝 Created README_PRODUCTION.md');
}

function updatePackageJson() {
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Add production scripts if they don't exist
        if (!packageJson.scripts['build:analyze']) {
            packageJson.scripts['build:analyze'] = 'ANALYZE=true next build';
        }
        
        if (!packageJson.scripts['start:prod']) {
            packageJson.scripts['start:prod'] = 'NODE_ENV=production next start -p 3000';
        }
        
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('📝 Updated package.json with production scripts');
    } catch (error) {
        console.log(`❌ Error updating package.json: ${error.message}`);
    }
}

function createHealthCheckApi() {
    const healthCheckDir = 'app/api/health';
    const healthCheckFile = path.join(healthCheckDir, 'route.ts');
    
    if (!fs.existsSync(healthCheckDir)) {
        fs.mkdirSync(healthCheckDir, { recursive: true });
    }
    
    const healthCheckContent = `import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check API connectivity
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      const apiResponse = await fetch(\`\${apiUrl}/health\`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const apiHealthy = apiResponse.ok;
      
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        api: apiHealthy ? 'connected' : 'disconnected',
        version: process.env.npm_package_version || '1.0.0',
      });
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      api: 'not_configured',
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'API connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
`;
    
    fs.writeFileSync(healthCheckFile, healthCheckContent);
    console.log('📝 Created health check API route');
}

function updateGitignore() {
    const gitignoreAdditions = `
# Development documentation (archived)
dev-docs/

# Production environment files
.env.production
.env.staging

# Build analysis
.next/analyze/

# Deployment artifacts
*.tar.gz
*.zip
deployment/

# Logs
*.log
logs/
`;
    
    try {
        fs.appendFileSync('.gitignore', gitignoreAdditions);
        console.log('📝 Updated .gitignore');
    } catch (error) {
        console.log(`❌ Error updating .gitignore: ${error.message}`);
    }
}

function cleanBuildCache() {
    const buildDirs = ['.next', 'node_modules'];
    
    buildDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            console.log(`🧹 Note: Consider removing ${dir} before deployment`);
        }
    });
}

function main() {
    console.log('🚀 Preparing MSF Admin Portal for Production Deployment');
    console.log('='.repeat(60));
    
    // Create dev-docs directory
    const devDocsDir = createDevDocsDirectory();
    
    // Move development files
    const movedFiles = moveDevFiles(devDocsDir);
    
    // Create production files
    createProductionEnvExample();
    createProductionReadme();
    createHealthCheckApi();
    
    // Update configuration files
    updatePackageJson();
    updateGitignore();
    
    // Clean build cache info
    cleanBuildCache();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Production preparation completed!');
    console.log(`📦 Moved ${movedFiles.length} development files to dev-docs/`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Review DEPLOYMENT_GUIDE.md for complete deployment instructions');
    console.log('2. Configure production environment variables in .env.local');
    console.log('3. Update API endpoints for production');
    console.log('4. Test the build: npm run build');
    console.log('5. Deploy to your chosen platform (Vercel, Netlify, etc.)');
    
    console.log('\n🔧 Essential Files Kept in Root:');
    const essentialFiles = [
        'app/', 'components/', 'lib/', 'public/', 'package.json',
        'next.config.ts', 'tailwind.config.ts', 'tsconfig.json',
        '.env.local', '.gitignore', 'DEPLOYMENT_GUIDE.md'
    ];
    
    essentialFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`  ✅ ${file}`);
        }
    });
    
    console.log(`\n📁 Development files archived in: ${devDocsDir}/`);
    
    console.log('\n⚠️  Remember to:');
    console.log('- Remove .next/ and node_modules/ before deployment');
    console.log('- Configure production environment variables');
    console.log('- Test the production build locally');
    console.log('- Set up monitoring and error tracking');
}

if (require.main === module) {
    main();
}

module.exports = { main };