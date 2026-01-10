# Gmail SMTP Setup Guide

This guide will help you set up Gmail SMTP for sending email notifications from your Water Intake Tracker. **No credit card required!**

---

## Why Gmail SMTP?

- ✅ **100% Free** - No payment information needed
- ✅ **500 emails/day** - More than enough for personal use
- ✅ **Works on Firebase Spark Plan** - No need to upgrade
- ✅ **Simple Setup** - Just 5 minutes
- ✅ **Reliable** - Gmail's infrastructure

---

## Prerequisites

- A Gmail account
- Firebase CLI installed (`npm install -g firebase-tools`)
- Access to your Firebase project

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

## Step 2: Configure Firebase Functions (2 minutes)

Open your terminal and navigate to your project directory:

```bash
cd /path/to/goal-water-intake
```

Set the Gmail SMTP configuration:

```bash
# Set your Gmail address
firebase functions:config:set gmail.user="your-email@gmail.com"

# Set your Gmail App Password (no spaces)
firebase functions:config:set gmail.pass="abcdefghijklmnop"

# Set the power user access code
firebase functions:config:set poweruser.code="WATER-HYDRO-2026-PWR9"
```

**Important Notes:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with your actual App Password (no spaces)
- The power user code can be changed to any value you want
- **Never commit these values to Git** - they're stored securely in Firebase

Verify your configuration:

```bash
firebase functions:config:get
```

You should see:

```json
{
  "gmail": {
    "user": "your-email@gmail.com",
    "pass": "abcdefghijklmnop"
  },
  "poweruser": {
    "code": "WATER-HYDRO-2026-PWR9"
  }
}
```

---

## Step 3: Install Dependencies (1 minute)

Install the required npm packages for Cloud Functions:

```bash
cd functions
npm install
cd ..
```

This will install:
- `firebase-admin` - Firebase Admin SDK
- `firebase-functions` - Cloud Functions SDK
- `nodemailer` - Email sending library (replaces SendGrid)

---

## Step 4: Deploy Functions (2 minutes)

Deploy the Cloud Functions to Firebase:

```bash
firebase deploy --only functions
```

Wait for deployment to complete. You should see:

```
✔  functions: Finished running predeploy script.
✔  functions[checkEmailReminders(us-central1)]: Successful create operation.
✔  functions[verifyPowerUserCode(us-central1)]: Successful create operation.
✔  functions[sendTestEmail(us-central1)]: Successful create operation.

✔  Deploy complete!
```

---

## Step 5: Test Email Delivery (1 minute)

1. **Open your Water Tracker website**
2. **Go to Settings tab**
3. **Unlock Power User Features**:
   - Enter code: `WATER-HYDRO-2026-PWR9`
   - Click "Unlock"
   - You should see "✅ Power User Unlocked"

4. **Enable Email Notifications**:
   - Toggle "Enable Email Reminders"
   - Configure your reminder times
   - Click "Save Settings"

5. **Send Test Email**:
   - Scroll to "Test Email Delivery" section
   - Click "Send Test Email Now"
   - Wait 10-30 seconds
   - Check your inbox (and spam folder)

6. **Success!**
   - You should receive a test email with 🧪 badge
   - Email shows your current water intake progress
   - Includes a link back to the website

---

## How It Works

### Cloud Functions

**1. `checkEmailReminders`** (Scheduled - Hourly)
- Runs every hour (on the hour)
- Queries users with `notificationsEnabled: true`
- Checks each user's 5 reminder slots
- Converts times to user's timezone
- Sends email if hour matches

**2. `verifyPowerUserCode`** (HTTP Callable)
- Verifies user-entered access code
- Compares against Firebase config value
- Returns success/failure
- Client stores result in Firestore

**3. `sendTestEmail`** (HTTP Callable)
- Requires authentication
- Requires power user verification
- Sends immediate test email
- Shows current progress
- Marked as "TEST EMAIL" with yellow badge

### Email Reminders

You can configure up to **5 custom reminders**:

**Preset Times:**
- 7:00 AM
- 9:00 AM
- 11:00 AM
- 12:00 PM (Noon)
- 2:00 PM
- 3:00 PM
- 5:00 PM
- 7:00 PM
- 9:00 PM

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
