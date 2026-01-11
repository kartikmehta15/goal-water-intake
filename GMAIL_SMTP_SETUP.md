# Gmail SMTP Setup Guide

This guide will help you set up Gmail SMTP for sending email notifications from your Water Intake Tracker. **No credit card required!**

---

## Why Gmail SMTP?

- ✅ **100% Free** - No payment information needed
- ✅ **500 emails/day** - More than enough for personal use
- ✅ **Works on Firebase Spark Plan** - No need to upgrade
- ✅ **Simple Setup** - Just 5 minutes
- ✅ **Reliable** - Gmail's infrastructure
- ✅ **Admin-Only Configuration** - Set up once, works for all users

---

## Prerequisites

- A Gmail account
- Firebase CLI installed (`npm install -g firebase-tools`)
- Access to your Firebase project
- Admin access to the Water Tracker application

---

## Setup Overview

The new system uses **admin-configured SMTP** stored securely in Firestore:
1. **Admin** configures SMTP settings once (encrypted in Firestore)
2. **Cloud Functions** read the configuration and send emails
3. **Users** simply enable notifications and set reminder times

**No more Firebase environment config needed!** Everything is managed through the web UI.

---

## Step 1: Create Gmail App Password (2 minutes)

1. **Enable 2-Step Verification** (if not already enabled):
   - Visit: https://myaccount.google.com/security
   - Find "2-Step Verification"
   - Click "Get Started" and follow the instructions

2. **Create an App Password**:
   - Visit: https://myaccount.google.com/apppasswords
   - Or go to Security → 2-Step Verification → App passwords
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: **Water Tracker**
   - Click **Generate**

3. **Copy the 16-character password**:
   - It will look like: `abcd efgh ijkl mnop`
   - Remove spaces when using: `abcdefghijklmnop`
   - Save it securely - you'll need it in the next step

---

## Step 2: Deploy Cloud Functions (2 minutes)

First, install dependencies and deploy the Cloud Functions:

```bash
cd /path/to/goal-water-intake

# Install dependencies
cd functions
npm install
cd ..

# Deploy functions
firebase deploy --only functions
```

Wait for deployment to complete. You should see:

```
✔  functions: Finished running predeploy script.
✔  functions[checkEmailReminders(us-central1)]: Successful create operation.
✔  functions[verifyPowerUserCode(us-central1)]: Successful create operation.
✔  functions[sendTestEmail(us-central1)]: Successful create operation.
✔  functions[encryptSmtpPassword(us-central1)]: Successful create operation.
✔  functions[testAdminSmtpConfig(us-central1)]: Successful create operation.

✔  Deploy complete!
```

**Note:** If you want to change the admin email from the default (`kartikmehta15@gmail.com`), update:
- `ADMIN_EMAIL` constant in `script.js` (line 7)
- `ADMIN_EMAIL` constant in `functions/index.js` (line 10)

Make sure both files have the **same email address**!

---

## Step 3: Configure SMTP via Admin Panel (2 minutes)

1. **Open your Water Tracker website**
2. **Log in as admin** (default: `kartikmehta15@gmail.com` - change if you modified the constants)
3. **Go to Settings tab**
4. **You should see "Administrator Controls" section** at the top

5. **Fill in SMTP Configuration**:
   - **SMTP Host:** `smtp.gmail.com`
   - **SMTP Port:** `587`
   - **Sender Email Address:** `your-email@gmail.com`
   - **Email Password / App Password:** Paste the 16-character App Password (no spaces)
   - **Check:** "Enable email system for all users"

6. **Click "Save & Test Email"**
   - This will encrypt your password and save it to Firestore
   - A test email will be sent to verify the configuration
   - Wait 10-30 seconds
   - Check your inbox (and spam folder)

7. **Success!**
   - You should receive a test email with 🧪 badge
   - Configuration status will show "✅ Configured"
   - All users can now enable email notifications

---

## Step 4: User Setup (1 minute per user)

Regular users can now enable email notifications:

1. **Log in to Water Tracker**
2. **Go to Settings tab**
3. **Scroll to "Email Notifications"**
4. **If you see "Power User" lock:**
   - Enter code: `WATER-HYDRO-2026-PWR9`
   - Click "Unlock"
5. **Enable Email Reminders:**
   - Toggle "Enable Email Reminders"
   - Configure up to 5 reminder times
   - Click "Save Settings"
6. **Test it:**
   - Click "Send Test Email Now"
   - Check your inbox

---

## How It Works

### Architecture

```
┌─────────────────┐
│  Admin Panel    │
│  (Web UI)       │
└────────┬────────┘
         │ Saves encrypted config
         ▼
┌─────────────────────┐
│  Firestore          │
│  /adminSettings/    │
│   emailConfig       │
└────────┬────────────┘
         │ Reads config
         ▼
┌─────────────────────┐
│  Cloud Functions    │
│  - Hourly scheduler │
│  - Email sender     │
└────────┬────────────┘
         │ Sends emails
         ▼
┌─────────────────────┐
│  Gmail SMTP         │
│  (500/day free)     │
└─────────────────────┘
```

### Security

1. **Password Encryption**: SMTP password is encrypted using AES-256-CBC before storing in Firestore
2. **Admin-Only Access**: Only the admin email can configure SMTP settings
3. **Firestore Rules**: Security rules prevent non-admin users from reading/writing SMTP config
4. **Cloud Functions**: Decrypt password at runtime in secure environment

### Cloud Functions

**1. `checkEmailReminders`** (Scheduled - Hourly)
- Runs every hour (on the hour)
- Queries users with `notificationsEnabled: true`
- Checks each user's 5 reminder slots
- Converts times to user's timezone
- Sends email if hour matches

**2. `encryptSmtpPassword`** (HTTP Callable - Admin only)
- Encrypts SMTP password using AES-256-CBC
- Returns encrypted string for Firestore storage
- Only accessible by admin

**3. `testAdminSmtpConfig`** (HTTP Callable - Admin only)
- Tests SMTP configuration
- Sends test email to admin
- Verifies connection and credentials

**4. `sendTestEmail`** (HTTP Callable - Power users)
- Sends test email to the requesting user
- Requires power user verification
- Shows current progress

**5. `verifyPowerUserCode`** (HTTP Callable)
- Verifies power user access code
- Client-side verification for zero-cost hosting

### Email Reminders

You can configure up to **5 custom reminders**:

**Preset Times:**
- 7:00 AM, 9:00 AM, 11:00 AM, 12:00 PM (Noon)
- 2:00 PM, 3:00 PM, 5:00 PM, 7:00 PM, 9:00 PM

**Or Custom Time:**
- Enter any time in HH:MM format (e.g., 10:30 AM)

**Each reminder has:**
- Enable/disable checkbox
- Preset dropdown OR custom time input
- Checked every hour by Cloud Function

---

## Troubleshooting

### Problem: Gmail App Password doesn't work

**Solution:**
1. Make sure 2-Step Verification is enabled
2. Generate a new App Password
3. Remove all spaces from the password
4. Update Firebase config: `firebase functions:config:set gmail.pass="newpassword"`
5. Redeploy: `firebase deploy --only functions`

### Problem: Test email not received

**Solution:**
1. Check your spam/junk folder
2. Verify Gmail credentials: `firebase functions:config:get`
3. Check Firebase Functions logs: `firebase functions:log`
4. Make sure you unlocked power user features
5. Try sending another test email after 1 minute

### Problem: "Gmail SMTP not configured" error

**Solution:**
1. Set Gmail credentials in Firebase config (see Step 2)
2. Redeploy functions: `firebase deploy --only functions`
3. Wait 1-2 minutes for deployment to complete
4. Try again

### Problem: Scheduled reminders not working

**Solution:**
1. Make sure you saved your settings after configuring reminders
2. Check that notifications are enabled
3. Verify your timezone is correct
4. Check Firebase Functions logs for errors
5. Remember: emails are sent on the hour (e.g., 9:00, 10:00, 11:00)
6. Custom times are rounded to the nearest hour

### Problem: "Power user verification required" error

**Solution:**
1. Go to Settings tab
2. Enter the power user code
3. Click "Unlock"
4. Wait for success message
5. Try sending test email again

---

## Security Best Practices

### ✅ DO:
- Keep your Gmail App Password secure
- Use a strong power user code
- Change the default power user code
- Never commit Firebase config to Git
- Use environment-specific configs for dev/prod

### ❌ DON'T:
- Share your Gmail App Password
- Commit sensitive credentials to repository
- Use your main Gmail password (always use App Password)
- Share power user code publicly

---

## Changing the Power User Code

To change the power user access code:

```bash
# Set new code
firebase functions:config:set poweruser.code="YOUR-NEW-CODE-HERE"

# Redeploy functions
firebase deploy --only functions
```

**Note:** Existing users will need to re-unlock with the new code.

---

## Cost Analysis

| Service | Cost |
|---------|------|
| Gmail SMTP | $0 (free, 500 emails/day) |
| Firebase Spark Plan | $0 (free tier) |
| Cloud Functions Invocations | $0 (under free tier limit) |
| Cloud Scheduler | $0 (3 jobs free) |
| Firestore Reads/Writes | $0 (under free tier limit) |
| **TOTAL** | **$0.00/month** ✅ |

**Example Usage:**
- 10 users
- 3 reminders/day each = 30 emails/day
- 30 days × 30 emails = 900 emails/month
- Well under 500/day limit ✅

---

## Alternative: Using a Different Email Service

If you prefer not to use Gmail, you can configure Nodemailer with other SMTP services:

### Outlook/Hotmail
```bash
firebase functions:config:set smtp.host="smtp-mail.outlook.com"
firebase functions:config:set smtp.port="587"
firebase functions:config:set smtp.user="your-email@outlook.com"
firebase functions:config:set smtp.pass="your-password"
```

### Custom SMTP
```bash
firebase functions:config:set smtp.host="smtp.yourhost.com"
firebase functions:config:set smtp.port="587"
firebase functions:config:set smtp.user="your-email@example.com"
firebase functions:config:set smtp.pass="your-password"
```

**Note:** You'll need to modify `functions/index.js` to use these settings.

---

## Support

If you encounter issues:

1. **Check Firebase Logs:**
   ```bash
   firebase functions:log
   ```

2. **Check Function Status:**
   ```bash
   firebase functions:list
   ```

3. **Test Configuration:**
   ```bash
   firebase functions:config:get
   ```

4. **Redeploy Functions:**
   ```bash
   firebase deploy --only functions
   ```

---

## Summary

✅ **No credit card required**  
✅ **5 minutes setup time**  
✅ **100% free forever**  
✅ **Up to 5 custom reminders**  
✅ **Power user protection**  
✅ **Beautiful HTML emails**  
✅ **Test button included**  

**You're all set! Enjoy your hydration reminders! 💧**
