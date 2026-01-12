# Water Intake Tracker - Backend Server

This is the backend server for the Water Intake Tracker application. It handles email notifications and reminder scheduling without requiring Firebase Cloud Functions (which requires a paid plan).

## Features

- **Express.js REST API** - Lightweight and fast
- **Email Notifications** - Gmail SMTP integration via Nodemailer
- **Scheduled Reminders** - Node-cron for automatic email reminders
- **Firebase Integration** - Uses Firebase Admin SDK to read user data
- **Admin Configuration** - One-time SMTP setup by admin
- **Secure** - JWT token verification, encrypted passwords, admin-only endpoints

## Prerequisites

- Node.js 16 or higher
- Firebase project with Firestore
- Gmail account with App Password (or other SMTP provider)
- Firebase Admin SDK service account JSON

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

**Security Note**: This project uses nodemailer ^7.0.12 which includes patches for:
- CVE for email domain interpretation conflict (< 7.0.7)
- DoS vulnerabilities in addressparser (< 7.0.11)

Always run `npm audit` after installation to ensure no vulnerabilities.

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Admin Configuration
ADMIN_EMAIL=kartikmehta.iitd@gmail.com
```

### 3. Get Firebase Admin SDK Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the JSON file securely
6. Extract these values for your `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server status and timestamp.

### Admin Endpoints (Requires Admin Authentication)

#### Save SMTP Configuration
```
POST /api/admin/email-config
Authorization: Bearer <firebase-id-token>

Body:
{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "senderEmail": "your-email@gmail.com",
  "senderPassword": "your-app-password",
  "enabled": true
}
```

#### Get SMTP Configuration
```
GET /api/admin/email-config
Authorization: Bearer <firebase-id-token>
```

### User Endpoints (Requires Authentication)

#### Send Test Email
```
POST /api/email/test
Authorization: Bearer <firebase-id-token>
```

#### Update Reminder Preferences
```
POST /api/email/reminders
Authorization: Bearer <firebase-id-token>

Body:
{
  "notificationsEnabled": true,
  "reminders": [
    { "time": "09:00", "type": "preset" },
    { "time": "14:30", "type": "custom" }
  ]
}
```

#### Get Reminder Preferences
```
GET /api/email/reminders
Authorization: Bearer <firebase-id-token>
```

## Gmail SMTP Setup

### Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Complete the setup process

### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **"Mail"** as the app
3. Select **"Other"** as the device and name it "Water Tracker"
4. Click **Generate**
5. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)
6. Use this as your `senderPassword` in the admin configuration

### Gmail SMTP Settings

- **SMTP Host**: `smtp.gmail.com`
- **SMTP Port**: `587` (TLS) or `465` (SSL)
- **Email**: Your Gmail address
- **Password**: Your App Password (not your regular Gmail password)

## Email Scheduler

The backend runs a cron job every 5 minutes to check for scheduled reminders.

### How It Works

1. Every 5 minutes, the scheduler queries Firestore for users with `notificationsEnabled: true`
2. For each user, it checks their `reminders` array for times matching the current time (±5 minutes)
3. If a match is found, it sends a reminder email with the user's current water intake progress
4. Emails include progress bars, motivational messages, and links back to the app

### Supported Reminder Times

Users can set up to 5 reminders with:
- **Preset times**: 09:00, 11:00, 13:00, 15:00, 19:00
- **Custom times**: Any HH:MM format

## Security

### Authentication

- All API endpoints (except `/api/health`) require Firebase ID token authentication
- Admin endpoints additionally verify the user's email matches `ADMIN_EMAIL`
- Tokens are verified using Firebase Admin SDK

### Password Encryption

- SMTP passwords are encrypted using AES-256-CBC before storing in Firestore
- Encryption key is derived from Firebase project ID
- Only the backend can decrypt passwords (frontend never sees plaintext passwords)

### Rate Limiting

Consider adding rate limiting in production (e.g., using `express-rate-limit`):

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Deployment

### Option 1: Render.com (Free Tier)

1. Create account at [Render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**: Add all variables from `.env`
5. Deploy!

Free tier includes:
- 750 hours/month
- Automatic HTTPS
- Auto-deploy on git push

### Option 2: Railway.app (Free Tier)

1. Create account at [Railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select your repository
4. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all variables from `.env`
5. Deploy!

Free tier includes:
- $5 credit/month
- Automatic HTTPS
- Auto-deploy on git push

### Option 3: Vercel (Serverless)

1. Create account at [Vercel](https://vercel.com)
2. Install Vercel CLI: `npm i -g vercel`
3. In backend directory: `vercel`
4. Follow prompts to deploy

Note: Vercel uses serverless functions, so the cron scheduler won't work as-is. You'll need to use Vercel Cron Jobs instead.

### Environment Variables in Production

Make sure to set these in your hosting provider:

```
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
ADMIN_EMAIL=kartikmehta.iitd@gmail.com
```

## Updating Frontend

After deploying the backend, update the frontend to use the backend URL:

In `script.js`, add:

```javascript
const BACKEND_URL = 'https://your-backend-url.com';
```

Replace all `firebase.functions()` calls with `fetch()` calls to the backend API.

## Troubleshooting

### "SMTP not configured" error

- Make sure admin has saved SMTP configuration via `/api/admin/email-config`
- Check that `enabled: true` in the configuration
- Verify SMTP credentials are correct

### "Failed to decrypt SMTP password"

- The encryption key is derived from `FIREBASE_PROJECT_ID`
- If you change the project ID, you'll need to reconfigure SMTP
- Try deleting and recreating the SMTP configuration

### Emails not sending

- Check Gmail App Password is correct (16 characters, no spaces)
- Verify 2-Step Verification is enabled on Gmail account
- Check server logs for SMTP errors
- Try sending a test email via `/api/email/test`

### Reminders not triggering

- Check server logs - scheduler runs every 5 minutes
- Verify users have `notificationsEnabled: true` in Firestore
- Check reminder times are in HH:MM format
- Scheduler checks for times within ±5 minutes of current time

## Development

### Running Tests

```bash
npm test
```

(Add tests as needed)

### Linting

```bash
npm run lint
```

(Add ESLint configuration as needed)

## License

This project is open source and available for personal use.

## Support

For issues or questions:
1. Check this README
2. Check server logs
3. Check Firebase Console for data issues
4. Open an issue on GitHub
