# Backend Setup Guide

This guide will walk you through setting up the backend server for the Water Intake Tracker application. The backend handles email notifications and reminder scheduling without requiring Firebase Cloud Functions.

## Overview

The backend is a Node.js/Express server that provides:
- Email notifications via Gmail SMTP (or any SMTP provider)
- Scheduled reminder emails using node-cron
- Firebase Admin SDK integration for reading user data
- Admin-only configuration endpoints
- Secure authentication via Firebase ID tokens

## Prerequisites

Before you begin, you'll need:
- Node.js 16 or higher installed
- A Firebase project with Firestore
- A Gmail account (or other SMTP provider)
- Basic knowledge of command line/terminal

## Step 1: Firebase Admin SDK Setup

### 1.1 Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **"Generate New Private Key"**
6. Click **"Generate Key"** to download the JSON file
7. **Save this file securely** - it contains sensitive credentials

### 1.2 Extract Credentials

Open the downloaded JSON file and extract these values:
- `project_id` → You'll use this as `FIREBASE_PROJECT_ID`
- `private_key` → You'll use this as `FIREBASE_PRIVATE_KEY`
- `client_email` → You'll use this as `FIREBASE_CLIENT_EMAIL`

**Important**: The `private_key` field contains `\n` characters - keep them as-is!

## Step 2: Gmail SMTP Setup

### 2.1 Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Find **"2-Step Verification"**
3. Click **"Get Started"** and follow the prompts
4. Complete the setup process

### 2.2 Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - If you don't see this option, make sure 2-Step Verification is enabled
2. Select app: **"Mail"**
3. Select device: **"Other (Custom name)"**
4. Enter a name: **"Water Tracker"**
5. Click **"Generate"**
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
   - Remove spaces when using: `abcdefghijklmnop`
7. **Save this password** - you'll need it for the admin configuration

**Note**: This is NOT your regular Gmail password. It's a special app-specific password.

## Step 3: Local Development Setup

### 3.1 Install Dependencies

```bash
cd backend
npm install
```

### 3.2 Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-actual-private-key-here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Admin Configuration
ADMIN_EMAIL=kartikmehta.iitd@gmail.com
```

**Important Notes**:
- The `FIREBASE_PRIVATE_KEY` must include the quotes and `\n` characters
- Replace `kartikmehta.iitd@gmail.com` with your actual admin email
- For local development, `FRONTEND_URL` can be `http://localhost:8080`

### 3.3 Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

You should see:
```
✅ Server running on port 3000
🌍 Environment: development
🔗 Frontend URL: http://localhost:8080
👨‍💼 Admin Email: kartikmehta.iitd@gmail.com
Email reminder scheduler initialized (runs every 5 minutes)
```

### 3.4 Test the Server

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-01-11T...",
  "service": "Water Intake Tracker Backend"
}
```

## Step 4: Configure SMTP via Admin Panel

Now that the backend is running, configure email settings through the web interface:

1. Start your frontend (in a separate terminal):
   ```bash
   # In the root directory
   python -m http.server 8080
   # Or use any local web server
   ```

2. Open http://localhost:8080 in your browser
3. Sign in with your admin email (`kartikmehta.iitd@gmail.com`)
4. Go to **Settings** tab
5. Scroll to the **"Email SMTP Configuration (Admin Only)"** section
6. Fill in the form:
   - **SMTP Host**: `smtp.gmail.com`
   - **SMTP Port**: `587`
   - **Sender Email**: Your Gmail address
   - **Email Password**: Your Gmail App Password (from Step 2.2)
   - **Enable email system**: ✓ Check this box
7. Click **"Save & Test Email"**
8. Check your inbox for the test email

If successful, you'll see "✅ Test email sent successfully!"

## Step 5: Production Deployment

Choose one of these free hosting options for your backend:

### Option 1: Render.com (Recommended)

**Free Tier**: 750 hours/month, automatic HTTPS, auto-deploy

1. Create account at [Render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `water-tracker-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your branch name)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables (click "Add Environment Variable"):
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.github.io
   ADMIN_EMAIL=kartikmehta.iitd@gmail.com
   ```
6. Click **"Create Web Service"**
7. Wait for deployment (usually 2-3 minutes)
8. Copy your backend URL (e.g., `https://water-tracker-backend.onrender.com`)

### Option 2: Railway.app

**Free Tier**: $5 credit/month, automatic HTTPS

1. Create account at [Railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select your repository
4. Click on the service → **Settings**
5. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
6. Go to **Variables** tab and add all environment variables
7. Deploy!
8. Copy your backend URL from the **Settings** → **Domains** section

### Option 3: Fly.io

**Free Tier**: 3 shared VMs, auto-suspend when idle

1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Sign up: `flyctl auth signup`
3. In the `backend` directory:
   ```bash
   cd backend
   flyctl launch
   ```
4. Follow the prompts
5. Set secrets:
   ```bash
   flyctl secrets set FIREBASE_PROJECT_ID="your-project-id"
   flyctl secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   flyctl secrets set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
   flyctl secrets set ADMIN_EMAIL="kartikmehta.iitd@gmail.com"
   flyctl secrets set FRONTEND_URL="https://your-frontend-url.github.io"
   ```
6. Deploy: `flyctl deploy`

## Step 6: Update Frontend Configuration

After deploying the backend, update your frontend to use the backend URL:

Edit `script.js` (around line 6):

```javascript
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://your-backend-url.onrender.com'; // UPDATE THIS LINE
```

Replace `https://your-backend-url.onrender.com` with your actual deployed backend URL.

Then deploy your updated frontend (e.g., push to GitHub Pages or Firebase Hosting).

## Troubleshooting

### Backend won't start

**Error**: "Firebase Admin SDK initialization failed"
- **Solution**: Check that your `FIREBASE_PRIVATE_KEY` includes `\n` characters and is wrapped in quotes
- **Solution**: Verify the service account JSON file is correct

**Error**: "ADMIN_EMAIL not configured"
- **Solution**: Add `ADMIN_EMAIL=your-email@gmail.com` to your `.env` file

### Emails not sending

**Error**: "SMTP not configured or disabled"
- **Solution**: Make sure admin has configured SMTP via the admin panel
- **Solution**: Check that `enabled: true` in Firestore `config/smtp` document

**Error**: "Invalid login: 535-5.7.8 Username and Password not accepted"
- **Solution**: Make sure you're using an App Password, not your regular Gmail password
- **Solution**: Verify 2-Step Verification is enabled on your Google account

**Error**: "Connection timeout"
- **Solution**: Check if your hosting provider blocks outbound SMTP connections on port 587
- **Solution**: Try using port 465 with SSL instead

### Reminders not triggering

**Issue**: Scheduled emails not being sent
- **Check**: Server logs show "Checking reminders at..." every 5 minutes
- **Check**: Users have `notificationsEnabled: true` in Firestore
- **Check**: Reminder times are in HH:MM format (e.g., "09:00", "14:30")
- **Check**: Server timezone matches your expectations (scheduler runs every 5 minutes and checks for times within ±5 minutes)

### CORS errors in browser

**Error**: "CORS policy: No 'Access-Control-Allow-Origin' header"
- **Solution**: Make sure `FRONTEND_URL` in `.env` matches your actual frontend URL
- **Solution**: For development, you can temporarily set `FRONTEND_URL=*` (not recommended for production)

### Backend not receiving requests

**Issue**: Frontend can't connect to backend
- **Check**: Backend URL in `script.js` is correct
- **Check**: Backend is running and accessible (test with curl or browser)
- **Check**: Firewall/security group allows incoming HTTPS traffic
- **Check**: HTTPS is enabled (most hosting providers handle this automatically)

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use environment variables** for all sensitive data
3. **Rotate App Passwords** periodically
4. **Limit admin access** - Only trusted admins should have the admin email
5. **Monitor usage** - Check Firebase and SMTP provider dashboards regularly
6. **Use HTTPS** - All production deployments should use HTTPS
7. **Keep dependencies updated** - Run `npm audit` regularly

## Monitoring & Maintenance

### Check Backend Status

```bash
curl https://your-backend-url.com/api/health
```

### View Server Logs

**Render.com**: Dashboard → Your service → Logs
**Railway.app**: Dashboard → Your service → View Logs
**Fly.io**: `flyctl logs` in your terminal

### Email Sending Limits

- **Gmail**: 500 emails/day (free)
- **Sendinblue**: 300 emails/day (free tier)
- **AWS SES**: 62,000 emails/month (free tier with verified domain)

Monitor your usage to stay within limits.

## Cost Estimate

With the recommended free tier services:

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Firebase Firestore | 50K reads, 20K writes/day | $0/month |
| Firebase Authentication | Unlimited | $0/month |
| Render.com | 750 hours/month | $0/month |
| Gmail SMTP | 500 emails/day | $0/month |
| **Total** | | **$0/month** |

**For a small app with <10 users, you should stay completely free!**

## Next Steps

1. ✅ Backend deployed and running
2. ✅ Admin configured SMTP settings
3. ✅ Test email working
4. → Configure user reminders
5. → Monitor email delivery
6. → Enjoy automated hydration reminders!

## Support

For issues or questions:
1. Check this guide and troubleshooting section
2. Check backend logs for error messages
3. Verify Firebase Console for data issues
4. Test with curl to isolate frontend vs backend issues
5. Open an issue on GitHub

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Node-cron Documentation](https://www.npmjs.com/package/node-cron)
- [Gmail App Passwords Help](https://support.google.com/accounts/answer/185833)
