# EmailJS Setup Guide for Water Intake Tracker

This guide will help you set up EmailJS for free email notifications in your Water Intake Tracker app. **No credit card required!**

## Why EmailJS?

- ✅ **FREE** - 200 emails/month (perfect for personal use or small groups)
- ✅ **No credit card required**
- ✅ **No backend needed** - works on GitHub Pages
- ✅ **5 minute setup**
- ✅ **$0 cost forever**

## Prerequisites

- A Gmail account (or other email provider)
- Access to your deployed Water Intake Tracker app

## Step 1: Create EmailJS Account (2 minutes)

1. Go to [EmailJS.com](https://www.emailjs.com)
2. Click **Sign Up** (you can use Google login for faster signup)
3. Verify your email address if required

## Step 2: Add Email Service (2 minutes)

1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose **Gmail** (or your preferred email provider)
4. Click **Connect Account**
5. Authorize EmailJS to send emails from your Gmail account
6. Copy your **Service ID** (looks like `service_abc123xyz`)
   - Keep this handy - you'll need it later!

## Step 3: Create Email Template (3 minutes)

1. In your EmailJS dashboard, go to **Email Templates**
2. Click **Create New Template**
3. Set the **Template Name**: `Water Reminder`

### Template Configuration

**Subject:**
```
{{reminder_time}} - Time to Hydrate! 💧
```

**Body (HTML):**
```html
<p>Hi {{to_name}}! 👋</p>

<p>This is your <strong>{{reminder_time}}</strong> reminder to drink water!</p>

<h3>Today's Progress:</h3>
<ul>
  <li>🚰 <strong>Current:</strong> {{current_amount}} ml</li>
  <li>🎯 <strong>Goal:</strong> {{goal_amount}} ml</li>
  <li>📊 <strong>Progress:</strong> {{percentage}}%</li>
</ul>

<p>Stay hydrated! 💪</p>

<p><a href="{{website_url}}" style="background-color: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Update your intake</a></p>
```

**Important Variables to Include:**
- `{{to_name}}` - Recipient's name (extracted from email)
- `{{reminder_time}}` - Time label (e.g., "9:00 AM" or "TEST")
- `{{current_amount}}` - Current water intake in ml
- `{{goal_amount}}` - Daily goal in ml
- `{{percentage}}` - Progress percentage
- `{{website_url}}` - Link back to your app

4. Click **Save**
5. Copy your **Template ID** (looks like `template_xyz789`)

## Step 4: Get Your Public Key (30 seconds)

1. In your EmailJS dashboard, go to **Account** → **General**
2. Find your **Public Key** (looks like `public_abc123xyz`)
3. Copy it

## Step 5: Configure Your App (2 minutes)

1. Open your Water Intake Tracker app
2. Go to the **Settings** tab
3. Enter the **Power User Code**: `WATER-HYDRO-2026-PWR9`
4. Click **Unlock**
5. Scroll to the **EmailJS Configuration** section
6. Enter:
   - **Service ID** (from Step 2)
   - **Template ID** (from Step 3)
   - **Public Key** (from Step 4)
7. Click **Save EmailJS Configuration**

## Step 6: Test Your Setup (1 minute)

1. In the Settings tab, scroll to **Test Email Delivery**
2. Click **Send Test Email Now**
3. Wait a few seconds
4. Check your email inbox (and spam folder if needed)
5. You should receive a test email with your current progress!

## Step 7: Set Up Reminders (2 minutes)

1. In the Settings tab, enable **Enable Email Reminders**
2. Configure up to 5 reminder times:
   - Use preset times (7 AM, 9 AM, 12 PM, 3 PM, 7 PM, 9 PM, etc.)
   - Or select **Custom Time** to enter your own time
3. Enable/disable each reminder as needed
4. Click **Save Settings**

## How It Works

### Reminder Delivery

- **Reminders are checked when you open the app**
- If a reminder time has passed since your last visit, the email will be sent
- Reminders are also checked every 5 minutes while the app is open
- Each reminder is sent only once per day

### Example Timeline

```
9:00 AM - Reminder time set
10:30 AM - You open the app → Reminder email sent!
3:00 PM - Reminder time set  
3:02 PM - You have the app open → Reminder email sent!
```

## Troubleshooting

### "Failed to send test email"

1. **Check your EmailJS configuration**
   - Make sure Service ID, Template ID, and Public Key are correct
   - No extra spaces in the fields

2. **Verify your email template**
   - Make sure all variables are included: `{{to_name}}`, `{{reminder_time}}`, etc.
   - Template must be active in EmailJS dashboard

3. **Check your email service**
   - Make sure your Gmail account is still connected
   - Try disconnecting and reconnecting in EmailJS dashboard

### "Email not received"

1. **Check spam folder**
   - First emails often go to spam
   - Mark as "Not Spam" to receive future emails

2. **Check EmailJS dashboard**
   - Go to EmailJS → Email History
   - See if the email was sent successfully

3. **Verify email address**
   - Make sure you're logged in with the correct email

### "Reminders not sending"

1. **Open the app regularly**
   - Reminders only send when the app is open
   - Open at least once every few hours

2. **Check reminder settings**
   - Make sure reminders are enabled
   - Verify reminder times are set correctly

3. **Check browser console**
   - Open Developer Tools (F12)
   - Look for any error messages

## Limitations

### Free Tier Limits

- **200 emails per month**
- For personal use: ~6-7 emails per day
- For 5 reminders: Works for about 1 month
- For 3 reminders: Works for 2+ months

### App Must Be Open

- Reminders only send when you open the app
- This is a limitation of static hosting (GitHub Pages)
- **Solution**: Open the app at least 2-3 times per day

## Upgrading (Optional)

If you need more emails, EmailJS offers paid plans:

- **Personal Plan**: $7/month for 1,000 emails
- **Professional Plan**: $15/month for 10,000 emails

But for personal use, the free tier should be plenty!

## Security Note

Your EmailJS Public Key is safe to include in your app because:
- It only allows **sending** emails, not reading them
- It's rate-limited by EmailJS
- It's tied to your specific domain
- You can regenerate it anytime

## Support

If you need help:

1. Check [EmailJS Documentation](https://www.emailjs.com/docs/)
2. Visit [EmailJS Support](https://www.emailjs.com/docs/faq/)
3. Open an issue on the GitHub repository

## Summary

**Total Setup Time**: ~10 minutes  
**Total Cost**: $0  
**Credit Card Required**: No ❌  
**Monthly Emails**: 200 (free tier)  
**Perfect For**: Personal use, small teams  

Enjoy your free email reminders! 💧🎉
