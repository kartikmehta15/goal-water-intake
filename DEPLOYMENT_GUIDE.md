# Deployment Guide

This guide covers deploying both the frontend and backend of the Water Intake Tracker application.

## Overview

The application consists of two parts:
1. **Frontend**: Static HTML/CSS/JavaScript (can be hosted on GitHub Pages, Firebase Hosting, or any static host)
2. **Backend** (Optional): Node.js/Express server for email notifications (needs separate hosting)

## Part 1: Frontend Deployment

### Option A: Firebase Hosting (Recommended)

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**:
   ```bash
   firebase init hosting
   ```
   
   Configuration:
   - Use existing project: Select your project
   - Public directory: `.` (current directory)
   - Single-page app: `No`
   - Overwrite existing files: `No`

4. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

5. **Your app is live!**
   - URL: `https://your-project-id.web.app`
   - Or your custom domain if configured

**Free Tier**: 10 GB storage, 360 MB/day bandwidth, free SSL/HTTPS

### Option B: GitHub Pages

1. **Configure Firebase**:
   - Update `auth.js` with your Firebase configuration
   - Update `script.js` with your backend URL (line 7)

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **Enable GitHub Pages**:
   - Go to repository Settings
   - Navigate to Pages section
   - Source: Select your branch (usually `main`)
   - Directory: `/` (root)
   - Click Save

4. **Your app is live!**
   - URL: `https://username.github.io/repository-name`
   - Usually takes 1-2 minutes to deploy

**Free Tier**: Unlimited for public repositories

### Option C: Netlify

1. **Create account** at [Netlify](https://netlify.com)

2. **New site from Git**:
   - Connect your GitHub repository
   - Build command: (leave empty - no build needed)
   - Publish directory: `.` (root)

3. **Deploy**!
   - Automatic deployment on every push
   - Custom domain available

**Free Tier**: 100 GB bandwidth/month, automatic HTTPS

## Part 2: Backend Deployment (For Email Notifications)

### Prerequisites

Before deploying the backend, you need:
- Firebase Admin SDK credentials (service account JSON)
- Gmail App Password (or other SMTP credentials)
- Backend code configured with environment variables

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed setup instructions.

### Option A: Render.com (Recommended)

**Free Tier**: 750 hours/month, automatic HTTPS, auto-deploy

1. **Create account** at [Render.com](https://render.com)

2. **New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure**:
   - **Name**: `water-tracker-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` or your branch
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Environment Variables**:
   Add these variables (get values from BACKEND_SETUP.md):
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.github.io
   ADMIN_EMAIL=kartikmehta15@gmail.com
   PORT=3000
   ```

5. **Deploy**:
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment
   - Copy your backend URL (e.g., `https://water-tracker-backend.onrender.com`)

6. **Update Frontend**:
   - Edit `script.js` line 7 with your backend URL
   - Redeploy frontend

**Note**: Free tier services may spin down after inactivity. First request may take 30-60 seconds.

### Option B: Railway.app

**Free Tier**: $5 credit/month (covers ~500 hours)

1. **Create account** at [Railway.app](https://railway.app)

2. **New Project**:
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository
   - Railway auto-detects Node.js

3. **Configure**:
   - Click on the service
   - Go to Settings → Root Directory: `backend`
   - Start Command: `npm start`

4. **Environment Variables**:
   - Go to Variables tab
   - Add all required variables (same as Render.com above)

5. **Deploy**:
   - Railway deploys automatically
   - Go to Settings → Networking → Generate Domain
   - Copy your backend URL

6. **Update Frontend** with backend URL

**Note**: Railway has automatic sleep for inactive services on free tier.

### Option C: Fly.io

**Free Tier**: 3 shared VMs, 160GB outbound bandwidth/month

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Sign up**:
   ```bash
   flyctl auth signup
   ```

3. **Launch app**:
   ```bash
   cd backend
   flyctl launch
   ```
   
   Follow prompts:
   - App name: Choose or auto-generate
   - Region: Choose closest to users
   - Postgres: No
   - Deploy now: No (we need to set secrets first)

4. **Set secrets**:
   ```bash
   flyctl secrets set FIREBASE_PROJECT_ID="your-project-id"
   flyctl secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   flyctl secrets set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
   flyctl secrets set ADMIN_EMAIL="kartikmehta15@gmail.com"
   flyctl secrets set FRONTEND_URL="https://your-frontend-url.github.io"
   flyctl secrets set NODE_ENV="production"
   ```

5. **Deploy**:
   ```bash
   flyctl deploy
   ```

6. **Get URL**:
   ```bash
   flyctl info
   ```
   Copy the hostname (e.g., `water-tracker.fly.dev`)

7. **Update Frontend** with backend URL

**Advantage**: Always-on services on free tier (no cold starts)

## Part 3: Post-Deployment Configuration

### 1. Configure Email SMTP (Admin Only)

1. **Access your app** at the frontend URL
2. **Sign in** with your admin email
3. **Go to Settings** tab
4. **Scroll to "Email SMTP Configuration"** (Admin Only section)
5. **Fill in SMTP settings**:
   - SMTP Host: `smtp.gmail.com`
   - SMTP Port: `587`
   - Sender Email: Your Gmail address
   - Email Password: Your Gmail App Password (see BACKEND_SETUP.md)
   - Enable email system: ✓
6. **Click "Save & Test Email"**
7. **Check your inbox** for test email

### 2. Enable User Notifications

Now users can:
1. Go to Settings tab
2. Check "Enable email reminders for me"
3. Configure up to 5 reminder times
4. Save settings
5. Receive automatic reminder emails!

## Verification Checklist

### Frontend
- [ ] Frontend loads at deployment URL
- [ ] User can sign up / sign in
- [ ] Water intake can be logged
- [ ] Calendar displays correctly
- [ ] Data syncs to Firestore

### Backend (if deployed)
- [ ] Backend health check works: `curl https://your-backend/api/health`
- [ ] Admin can access SMTP configuration page
- [ ] Test email sends successfully
- [ ] Users can save reminder preferences
- [ ] Scheduled emails are being sent (check logs after 5 minutes)

## Monitoring

### Frontend
- **Firebase Console** → Analytics → See usage
- **GitHub** → Insights → Traffic (for GitHub Pages)

### Backend
- **Render.com** → Logs tab
- **Railway.app** → View Logs
- **Fly.io** → `flyctl logs`

### Email Sending
- Check your SMTP provider dashboard:
  - **Gmail**: [Google Account Activity](https://myaccount.google.com/dashboard)
  - Track emails sent/day
- Monitor Firebase Firestore usage in Firebase Console

## Troubleshooting

### Frontend Issues

**App doesn't load**:
- Check browser console for errors
- Verify Firebase configuration in `auth.js`
- Check Firestore rules are deployed

**Can't sign in**:
- Verify Email/Password and Google Sign-In enabled in Firebase Console
- Check browser allows third-party cookies
- Clear browser cache

### Backend Issues

**Backend unreachable**:
- Check deployment logs for errors
- Verify all environment variables are set
- Test with: `curl https://your-backend/api/health`

**Emails not sending**:
- Check backend logs for SMTP errors
- Verify Gmail App Password is correct
- Check SMTP configuration in admin panel
- Test with "Send Test Email" button

**Reminders not triggering**:
- Check backend logs show "Checking reminders..." every 5 minutes
- Verify users have `notificationsEnabled: true`
- Check reminder times are valid (HH:MM format)
- Backend must be deployed and running continuously

## Cost Breakdown

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| **Frontend** | | |
| GitHub Pages | Unlimited (public repos) | $0/month |
| Firebase Hosting | 10 GB, 360 MB/day | $0/month |
| Netlify | 100 GB bandwidth | $0/month |
| **Backend** | | |
| Render.com | 750 hours/month | $0/month |
| Railway.app | $5 credit/month | $0/month |
| Fly.io | 3 VMs, 160 GB bandwidth | $0/month |
| **Database** | | |
| Firebase Firestore | 50K reads, 20K writes/day | $0/month |
| Firebase Auth | Unlimited | $0/month |
| **Email** | | |
| Gmail SMTP | 500 emails/day | $0/month |
| **Total** | | **$0/month** |

**For <10 users, everything stays FREE!**

## Scaling Considerations

As your app grows:

### 10-100 users
- Free tier should be sufficient
- Monitor Firestore usage
- May need to optimize queries

### 100-1000 users
- Consider Firebase Blaze plan (pay-as-you-go)
- Upgrade backend hosting (Render.com paid plan: $7/month)
- Consider dedicated email service (SendGrid, Mailgun)
- Estimated cost: $10-20/month

### 1000+ users
- Definitely need paid Firebase plan
- Professional hosting for backend
- Dedicated email service with higher limits
- Consider CDN for frontend
- Estimated cost: $50-100/month

## CI/CD (Optional)

### Automatic Deployments

**Frontend (GitHub Pages)**:
- Automatic on every push to main branch

**Frontend (Firebase Hosting)**:
Create `.github/workflows/firebase-hosting.yml`:
```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

**Backend (Render/Railway)**:
- Both support automatic deployment on git push
- Configured in their dashboards

## Next Steps

1. ✅ Frontend deployed and accessible
2. ✅ Backend deployed (if using email notifications)
3. ✅ SMTP configured by admin
4. ✅ Test email working
5. → Share app URL with users!
6. → Monitor usage and costs
7. → Collect feedback and iterate

## Support

For deployment issues:
1. Check this guide's troubleshooting section
2. Check service-specific documentation (Render, Railway, Fly.io)
3. Review backend/frontend logs
4. Verify all environment variables are correct
5. Open an issue on GitHub

Happy hydrating! 💧

```bash
firebase deploy --only firestore:rules
```

### Deploy Cloud Functions:
```bash
firebase deploy --only functions
```

This will deploy:
- `sendMorningReminder` (11 AM EST)
- `sendAfternoonReminder` (3 PM EST)
- `sendEveningReminder` (7 PM EST)

## Step 4: Update SendGrid Sender Email

Edit `functions/index.js` line 190:
```javascript
from: 'noreply@waterintaketracker.com', // Change to YOUR verified SendGrid email
```

Change to your verified email (the one you verified in Step 2).

## Step 5: Test

### Test the functions locally:
```bash
firebase functions:shell
```

Then run:
```javascript
sendMorningReminder()
```

### Test in production:
1. Go to Firebase Console > Functions
2. Click on `sendMorningReminder`
3. Click "Test function"

### Test the full flow:
1. Login to your app
2. Go to Settings section
3. Enable email notifications
4. Select all reminder times
5. Save settings
6. Wait for scheduled time or manually trigger function

## Step 6: Monitor

### Check function logs:
```bash
firebase functions:log
```

### View in Firebase Console:
1. Go to Functions section
2. Check execution logs
3. Monitor email send success/failures

## Troubleshooting

### Emails not sending?
- Check SendGrid API key is set correctly: `firebase functions:config:get`
- Verify sender email in SendGrid
- Check function logs: `firebase functions:log`
- Ensure Firestore rules allow users collection access

### Functions not running?
- Verify they're deployed: Check Firebase Console > Functions
- Check timezone settings
- Ensure users have `emailNotificationsEnabled: true` in Firestore

### Cost concerns?
- Monitor usage in Firebase Console > Usage
- With 10 users, everything stays FREE
- Set up billing alerts just in case

## Cost Breakdown (10 users)

**SendGrid:**
- 10 users × 3 emails/day = 30 emails/day
- Free tier: 100 emails/day ✅
- **Cost: $0/month**

**Firebase Cloud Functions:**
- 3 functions × 1 execution/day = 90 executions/month
- Free tier: 2M invocations/month ✅
- **Cost: $0/month**

**Total: $0/month** 🎉

## Support

If you encounter issues:
1. Check Firebase Console logs
2. Check SendGrid activity feed
3. Verify Firestore security rules
4. Review function configuration: `firebase functions:config:get`

## Testing Email Delivery

### Quick Test (Recommended)

1. Go to your website
2. Navigate to **Settings** tab
3. Enable "Email Notifications"
4. Click **"📨 Send Test Email Now"**
5. Check your inbox (and spam folder!)

**What to expect:**
- Email arrives within 10-30 seconds
- Subject: "🧪 TEST - Water Intake Reminder"
- Shows yellow "THIS IS A TEST EMAIL" badge
- Displays your current water intake progress
- Includes link to website
- ✅ Green message confirms setup is working

### If Test Email Doesn't Arrive

1. **Check spam/junk folder**
2. **Verify SendGrid sender** is verified in SendGrid dashboard
3. **Check Firebase Functions logs:**
   ```bash
   firebase functions:log --only sendTestEmail
   ```
4. **Check SendGrid Activity Feed:**
   - Go to SendGrid Dashboard → Activity Feed
   - Look for recent emails to your address
   - Check delivery status

5. **Common issues:**
   - SendGrid sender not verified → Verify sender in SendGrid
   - API key incorrect → Update Firebase config
   - Function not deployed → Run `firebase deploy --only functions`

### Testing Scheduled Emails

After test email works, test scheduled reminders:

1. Enable notifications in Settings
2. Select desired times (11 AM, 3 PM, 7 PM)
3. Choose your timezone
4. Save settings
5. Wait for next scheduled time
6. Check email

**Note:** Scheduled emails run on the hour in UTC, converted to your timezone.
