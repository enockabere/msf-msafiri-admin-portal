# Microsoft SSO Callback URLs

## Quick Reference

### Local Development
```
http://localhost:3000/api/auth/callback/azure-ad
```

### Production Deployment
```
https://your-domain.com/api/auth/callback/azure-ad
```

## Common Production URLs

### Vercel
```
https://msf-admin-portal.vercel.app/api/auth/callback/azure-ad
```

### Netlify
```
https://msf-admin-portal.netlify.app/api/auth/callback/azure-ad
```

### Custom Domain
```
https://admin.yourdomain.com/api/auth/callback/azure-ad
```

## Environment Variables Needed

```env
# Microsoft Azure AD Configuration
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id

# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-key
NEXTAUTH_URL=http://localhost:3000  # Change to production URL when deployed
```

## Setup Steps

1. **Azure AD App Registration**
   - Go to Azure Portal > Azure Active Directory > App registrations
   - Create new registration
   - Add redirect URIs (callback URLs above)
   - Generate client secret
   - Copy Client ID, Tenant ID, and Client Secret

2. **Update Environment Variables**
   - Add the Azure values to your `.env.local`
   - For production, add them to your hosting platform's environment variables

3. **Test the Setup**
   - Run `npm run dev`
   - Go to `http://localhost:3000/login`
   - Click "Sign in with Microsoft" tab
   - Test the SSO flow

## Current Status

✅ NextAuth.js configured with Azure AD provider
✅ Login component supports both SSO and credentials
✅ Automatic API integration for SSO users
✅ Session management configured

## Next Steps

1. Get Azure AD app registration details
2. Update `.env.local` with real values
3. Test locally
4. Deploy to production
5. Update Azure AD with production callback URL
6. Test production deployment