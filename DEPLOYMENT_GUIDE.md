# Email Notifications Deployment Guide

## Prerequisites
- Firebase project already set up
- Firebase CLI installed (`npm install -g firebase-tools`)

## Step 1: Upgrade to Firebase Blaze Plan

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `water-intake-tracker-6d9c1`
3. Click on "Upgrade" in the bottom left
4. Select "Blaze Plan" (Pay as you go)
5. **Don't worry**: With 10 users × 3 emails/day = 30 emails/day, you'll stay within FREE quotas

**Free Quotas:**
- Cloud Functions: 2M invocations/month (we use 90/month)
- Firestore: 50K reads, 20K writes/day (we use ~100/day)
- **Cost estimate: $0/month**

## Step 2: Set up SendGrid (FREE)

1. Go to [SendGrid](https://sendgrid.com/pricing/)
2. Sign up for FREE plan (100 emails/day)
3. Complete sender verification:
   - Go to Settings > Sender Authentication
   - Verify your email address or domain
   - Use this verified email in `functions/index.js` line 190

4. Create API Key:
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Name it "Water Intake Tracker"
   - Select "Full Access"
   - **Copy the API key** (you won't see it again!)

## Step 3: Deploy Cloud Functions

### Install dependencies:
```bash
cd functions
npm install
cd ..
```

### Set SendGrid API key:
```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

### Deploy Firestore rules:
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
