# Deployment Guide

## Quick Deployment Steps

### 1. GitHub Setup

The code is ready to push to GitHub. To complete the GitHub integration:

```bash
# Create repository on GitHub (https://github.com/new)
# Then run:
cd /home/ubuntu/muskskito
git remote add origin https://github.com/YOUR_USERNAME/muskskito.git
git branch -M main
git push -u origin main
```

### 2. Environment Configuration

The application requires these environment variables (already configured in Manus):

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_APP_TITLE=Muskskito - Disposable AI Browser
VITE_APP_LOGO=/logo.png
```

### 3. Deploy to Production

#### Option A: Manus Platform (Recommended)
1. Click the **Publish** button in the Manus UI
2. Configure deployment settings
3. Your app will be live!

#### Option B: Manual Deployment

**Vercel/Netlify (Frontend + Backend)**
```bash
pnpm build
# Deploy dist/ folder
```

**Railway/Render (Full Stack)**
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### 4. Database Setup

Ensure your production database is initialized:
```bash
pnpm db:push
```

### 5. Post-Deployment

1. **Seed VPN Locations**: The database already has 24 VPN locations seeded
2. **Test Features**:
   - VPN connection
   - URL scanning
   - Session creation
   - AI chat
   - Settings
   - Pro upgrade
3. **Monitor**: Check logs for any errors

## Features Checklist

✅ **Core Features**
- [x] Disposable browsing sessions
- [x] VPN protection (24 locations)
- [x] AI threat detection
- [x] Sandboxed browsing
- [x] Auto-delete sessions
- [x] Session history

✅ **AI Features**
- [x] Real-time chat assistant
- [x] Contextual security advice
- [x] Threat explanations

✅ **Settings**
- [x] Privacy controls
- [x] Auto-delete configuration
- [x] Tracker/ad blocking
- [x] Threat sensitivity

✅ **Pro Features**
- [x] Subscription system
- [x] Payment integration
- [x] 24 global VPN locations
- [x] Enhanced protection

✅ **UI/UX**
- [x] Cyberpunk theme
- [x] 3D globe visualization
- [x] Responsive design
- [x] Smooth animations

## Pages

- `/` - Home (main browsing interface)
- `/sessions` - Session history
- `/settings` - Privacy & security settings
- `/pro` - Upgrade to Pro

## Support

For deployment issues, refer to:
- [README.md](README.md) - Full documentation
- [GitHub Issues](https://github.com/aaronalexander666/muskskito/issues)

