# Email Feature Testing Guide

This guide helps you test all email-related features that were implemented/fixed.

## Prerequisites

Before testing, ensure:
1. Firebase Functions deployed with Gmail SMTP configured
2. EmailJS configured (optional, for client-side reminders)
3. Admin account set up (configured via Firebase Functions config or default in script.js)
   - To set custom admin email: `firebase functions:config:set admin.email="your-admin@example.com"`
   - Default admin email is set in `script.js` ADMIN_EMAIL constant and `functions/index.js`

---

## Feature 1: Admin-Only Test Email ✅

### What Was Fixed
- Test email now calls Firebase Cloud Functions instead of client-side EmailJS
- Test email restricted to administrator only
- Test email uses Gmail SMTP via Firebase Functions

### Testing Steps

1. **Login as Admin**
   - Navigate to `auth.html`
   - Sign in with the admin email configured in Firebase

2. **Verify Admin UI Appears**
   - Go to Settings tab
   - Verify "👨‍💼 Administrator Controls" section is visible
   - Verify "🧪 Test Email Delivery (Admin Only)" section is visible

3. **Send Test Email**
   - Click "📨 Send Test Email Now" button
   - Should show "⏳ Sending..." loading state
   - Should receive test email within 1-2 minutes
   - Email subject: "🧪 TEST - Water Intake Reminder"
   - Email should have yellow TEST badge

4. **Verify Non-Admin Cannot Send**
   - Login as a different user (non-admin)
   - Go to Settings tab
   - Admin section should NOT be visible
   - Test email button should NOT be visible

### Expected Results
- ✅ Admin sees test email section
- ✅ Admin can send test emails successfully
- ✅ Non-admin does not see test email section
- ✅ Email arrives with TEST badge
- ✅ Email shows current water intake progress

### Troubleshooting
- If test email fails: Check Firebase Functions logs
- If "permission-denied" error: Verify you're logged in as admin
- If email doesn't arrive: Check spam folder and Gmail SMTP configuration

---

## Feature 2: Power User System ✅

### What Was Verified
- Power user unlock code: `WATER-HYDRO-2026-PWR9`
- Status saved to Firestore
- UI properly shows locked/unlocked states

### Testing Steps

1. **Login as Regular User**
   - Sign in with any email
   - Go to Settings tab

2. **Verify Power User Lock Appears**
   - Should see "🔒 Email Notifications (Power Users Only)"
   - Should see unlock form with code input

3. **Enter Wrong Code**
   - Enter incorrect code
   - Click "🔓 Unlock" button
   - Should show error: "❌ Invalid access code"

4. **Enter Correct Code**
   - Enter: `WATER-HYDRO-2026-PWR9`
   - Click "🔓 Unlock" button
   - Should show success: "✅ Access granted! You are now a power user."
   - Lock section should disappear
   - "✅ Power User Unlocked" badge should appear
   - Email notification settings should become visible

5. **Verify Persistence**
   - Refresh the page
   - Go to Settings tab
   - Should still show as unlocked (status persisted in Firestore)

### Expected Results
- ✅ Lock appears for new users
- ✅ Wrong code shows error
- ✅ Correct code unlocks features
- ✅ Status persists across sessions
- ✅ Email settings become visible after unlock

---

## Feature 3: Email Reminders (5 Slots) ✅

### What Was Verified
- 5 reminder slots available
- Preset times include: 7AM, 9AM, **11AM**, 12PM, **2PM**, 3PM, **5PM**, **7PM**, 9PM
- Custom time option available
- Individual enable/disable per reminder

### Testing Steps

1. **Unlock Power User Features**
   - Follow Feature 2 steps to unlock

2. **Enable Email Notifications**
   - Check "Enable email reminders for me"
   - Notification settings section should appear

3. **Configure Reminder 1**
   - Check "Enabled" for Reminder 1
   - Select preset time: "11:00 AM"
   - Verify custom time input is disabled

4. **Configure Reminder 2**
   - Check "Enabled" for Reminder 2
   - Select preset time: "2:00 PM"

5. **Configure Reminder 3**
   - Check "Enabled" for Reminder 3
   - Select preset time: "5:00 PM"

6. **Configure Reminder 4**
   - Check "Enabled" for Reminder 4
   - Select preset time: "7:00 PM"

7. **Configure Reminder 5 (Custom)**
   - Check "Enabled" for Reminder 5
   - Select "Custom Time" from dropdown
   - Enter custom time: "20:30" (8:30 PM)
   - Verify custom time input becomes enabled

8. **Set Timezone**
   - Select your timezone from dropdown
   - Should auto-select system timezone

9. **Save Settings**
   - Click "💾 Save Settings"
   - Should show success toast: "Notification settings saved successfully!"

10. **Test Client-Side Reminder**
    - Keep the app open
    - Wait for next scheduled reminder time
    - Email should be sent (if EmailJS configured)

11. **Test Server-Side Reminder**
    - Close the app
    - Wait for next scheduled reminder time (on the hour)
    - Firebase Functions should send email via Gmail SMTP

### Expected Results
- ✅ All 5 reminder slots work
- ✅ Preset times include required times (11AM, 2PM, 5PM, 7PM)
- ✅ Custom time option works
- ✅ Individual enable/disable works
- ✅ Settings persist in Firestore
- ✅ Reminders sent at correct times

### Troubleshooting
- If reminders don't send: Check EmailJS or Gmail SMTP configuration
- If timing is off: Verify timezone setting
- If custom time doesn't work: Ensure time format is HH:MM

---

## Feature 4: Admin EmailJS Configuration ✅

### What Was Verified
- Admin can configure EmailJS for all users
- Configuration saved to Firestore
- All users can use reminders after admin configures

### Testing Steps

1. **Login as Admin**
   - Sign in with admin email

2. **Configure EmailJS**
   - Go to Settings tab
   - Find "⚙️ EmailJS Configuration (Admin Only)"
   - Enter Service ID, Template ID, Public Key
   - Check "Enable email system for all users"
   - Click "💾 Save Admin Configuration"
   - Should show success: "✅ Configuration saved successfully!"

3. **Verify All Users Can Use**
   - Login as regular user (power user unlocked)
   - Go to Settings tab
   - Should see: "✅ Email system is active. Configure your reminders below."
   - Should be able to configure reminders

4. **Test Admin Disable**
   - Login as admin
   - Uncheck "Enable email system for all users"
   - Click "💾 Save Admin Configuration"
   - Login as regular user
   - Should see: "⚠️ Email system is currently disabled by administrator."
   - Reminder settings should be hidden

### Expected Results
- ✅ Admin can configure EmailJS once
- ✅ Configuration applies to all users
- ✅ Admin can enable/disable system-wide
- ✅ Users see appropriate status messages

---

## Integration Testing

### Complete User Flow

1. **New User Journey**
   - Sign up with new account
   - Go to Settings
   - See power user lock
   - Enter unlock code
   - See email notifications appear
   - Configure 3 reminders
   - Save settings
   - Receive emails at scheduled times

2. **Admin Journey**
   - Login as admin
   - Configure EmailJS for all users
   - Send test email
   - Verify test email arrives
   - Enable email system
   - Verify users can use reminders

---

## Common Issues & Solutions

### Test Email Not Working
- **Check**: Firebase Functions deployed?
- **Check**: Gmail SMTP configured? (`firebase functions:config:get`)
- **Check**: Logged in as admin?
- **Solution**: Deploy functions and configure Gmail

### Power User Unlock Not Working
- **Check**: Correct code entered?
- **Check**: Firestore security rules allow write?
- **Solution**: Verify code and rules

### Reminders Not Sending
- **Check**: EmailJS configured by admin?
- **Check**: Email system enabled by admin?
- **Check**: Reminders enabled and times set?
- **Solution**: Configure EmailJS and enable system

### Wrong Timezone
- **Check**: Timezone selected in settings?
- **Solution**: Select correct timezone and save

---

## Success Criteria

All features pass when:
- ✅ Admin-only test email works via Firebase Functions
- ✅ Power user unlock works with correct code
- ✅ 5 reminder slots all functional
- ✅ Preset times include 11AM, 2PM, 5PM, 7PM
- ✅ Custom time option works
- ✅ Admin can configure EmailJS for all users
- ✅ Reminders sent at correct times
- ✅ Status persists across sessions
- ✅ Security rules properly enforced

---

## Additional Notes

### Email System Architecture

The app uses TWO email systems:

1. **EmailJS (Client-Side)**
   - Runs when app is open
   - Checks every 5 minutes
   - Good for active users
   - Configured by admin in UI

2. **Firebase Functions + Gmail SMTP (Server-Side)**
   - Runs hourly on schedule
   - Always running (app closed or open)
   - More reliable for daily reminders
   - Configured via Firebase CLI

Both systems work together for maximum reliability.

### Security

- Test email: Admin only (both UI and Functions)
- Email configuration: Admin only (Firestore rules)
- Reminder settings: Power users only (UI enforcement)
- Power user code: Frontend validation (acceptable for zero-cost hosting)

---

## Contact

For issues or questions, check:
- Firebase Console → Functions → Logs
- Browser Console → Errors
- Firestore Console → Database
- `GMAIL_SMTP_SETUP.md` for Gmail configuration
- `EMAILJS_SETUP.md` for EmailJS configuration
