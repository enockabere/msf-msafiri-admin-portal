# Microsoft SSO Setup Guide

## Overview
Your Next.js admin portal is already configured for Microsoft SSO using NextAuth.js with Azure AD provider. Follow this guide to complete the setup.

## Callback URLs

### For Local Development (localhost:3000)
```
http://localhost:3000/api/auth/callback/azure-ad
```

### For Production Hosting
```
https://your-domain.com/api/auth/callback/azure-ad
```

**Example for Vercel deployment:**
```
https://msf-admin-portal.vercel.app/api/auth/callback/azure-ad
```

## Azure AD App Registration Setup

### 1. Create Azure AD App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `MSF Admin Portal`
   - **Supported account types**: Choose based on your needs
   - **Redirect URI**: Add the callback URLs above

### 2. Configure Authentication
1. In your app registration, go to **Authentication**
2. Add **Web** platform if not already added
3. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/azure-ad` (for development)
   - `https://your-production-domain.com/api/auth/callback/azure-ad` (for production)
4. Enable **ID tokens** under **Implicit grant and hybrid flows**

### 3. Get Required Values
1. **Application (client) ID**: Copy from the **Overview** page
2. **Directory (tenant) ID**: Copy from the **Overview** page
3. **Client Secret**: 
   - Go to **Certificates & secrets**
   - Click **New client secret**
   - Copy the **Value** (not the Secret ID)

### 4. Configure API Permissions
1. Go to **API permissions**
2. Add the following Microsoft Graph permissions:
   - `User.Read` (Delegated)
   - `profile` (Delegated)
   - `email` (Delegated)
   - `openid` (Delegated)

## Environment Configuration

Update your `.env.local` file with the values from Azure:

```env
# Microsoft Azure AD Configuration
AZURE_AD_CLIENT_ID=your-actual-client-id-from-azure
AZURE_AD_CLIENT_SECRET=your-actual-client-secret-from-azure
AZURE_AD_TENANT_ID=your-actual-tenant-id-from-azure

# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-key-here-make-this-unique-and-long
NEXTAUTH_URL=http://localhost:3000

# For production, update NEXTAUTH_URL to your domain
# NEXTAUTH_URL=https://your-production-domain.com
```

## Production Deployment URLs

When you deploy to production, you'll need to:

1. **Update environment variables** in your hosting platform:
   - Vercel: Project Settings > Environment Variables
   - Netlify: Site Settings > Environment Variables
   - Other platforms: Check their documentation

2. **Update Azure AD redirect URIs** to include your production domain:
   ```
   https://your-production-domain.com/api/auth/callback/azure-ad
   ```

3. **Common production domains**:
   - Vercel: `https://your-app-name.vercel.app`
   - Netlify: `https://your-app-name.netlify.app`
   - Custom domain: `https://admin.yourdomain.com`

## Testing the Setup

### 1. Local Testing
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. You should see a "Sign in with Microsoft" option
4. Click it to test the SSO flow

### 2. Production Testing
1. Deploy your app to your hosting platform
2. Update the Azure AD redirect URIs with your production URL
3. Test the login flow on your production domain

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure the redirect URI in Azure AD exactly matches your callback URL
   - Check for trailing slashes or typos

2. **"Client secret expired"**
   - Generate a new client secret in Azure AD
   - Update your environment variables

3. **"Insufficient privileges"**
   - Ensure proper API permissions are granted in Azure AD
   - Admin consent might be required for some permissions

4. **"NEXTAUTH_URL mismatch"**
   - Ensure NEXTAUTH_URL matches your actual domain
   - For production, it should be your live domain, not localhost

### Debug Mode
Enable debug mode in development by setting:
```env
NEXTAUTH_DEBUG=true
```

## Security Notes

1. **Never commit secrets**: Keep `.env.local` in your `.gitignore`
2. **Use strong secrets**: Generate a strong NEXTAUTH_SECRET
3. **Rotate secrets**: Regularly rotate your client secrets
4. **Limit permissions**: Only request necessary Microsoft Graph permissions

## Integration with Your API

The current setup automatically syncs Microsoft SSO users with your FastAPI backend via the `/auth/sso/microsoft` endpoint. Ensure your API has this endpoint implemented to handle SSO user creation/authentication.