# Migration Guide: Cloud Functions → Backend Server

This document explains the changes made to remove Firebase Cloud Functions dependency and what users/developers need to know.

## What Changed?

### Before (Old Architecture)
```
Frontend (GitHub Pages)
    ↓
Firebase Cloud Functions (requires Blaze plan 💳)
    ↓
Firebase Auth + Firestore
    ↓
Email via SMTP
```

### After (New Architecture)
```
Frontend (GitHub Pages)
    ↓
Backend Server (free hosting ✓)
    ↓
Firebase Auth + Firestore
    ↓
Email via SMTP
```

## Why This Change?

1. **Cost**: Firebase Cloud Functions requires the Blaze (pay-as-you-go) plan. The new backend runs on completely free hosting.
2. **Flexibility**: More control over email scheduling and configuration.
3. **Development**: Easier local testing without Firebase emulators.
4. **Deployment**: Multiple free hosting options available.

## For End Users

### What Stays the Same
- ✅ All existing features work exactly the same
- ✅ No data loss - all your water intake data is preserved
- ✅ Same login experience
- ✅ Same user interface
- ✅ Email notifications still work

### What's Different
- The backend is now a separate service (you won't notice this)
- Email reminders are checked every 5 minutes (instead of hourly)
- More reliable email delivery

### Do I Need to Do Anything?
**No!** If you're just using the app:
- Your existing account and data will continue to work
- No action required on your part
- Just keep using the app as normal

## For Administrators

### What You Need to Do

1. **Deploy the Backend** (one-time setup, ~15 minutes)
   - Follow [BACKEND_SETUP.md](BACKEND_SETUP.md)
   - Deploy to Render.com, Railway.app, or Fly.io (all free)
   - Configure environment variables

2. **Reconfigure SMTP** (one-time)
   - Log in to the app as admin
   - Go to Settings → Email SMTP Configuration
   - Re-enter your SMTP credentials
   - Click "Save & Test Email"

3. **Update Frontend**
   - Edit `script.js` line 7 with your backend URL
   - Deploy updated frontend

### Migration Steps (Detailed)

#### Step 1: Deploy Backend
```bash
# See BACKEND_SETUP.md for complete instructions
cd backend
npm install
cp .env.example .env
# Edit .env with your Firebase credentials
npm start
```

Deploy to one of:
- [Render.com](https://render.com) (Recommended)
- [Railway.app](https://railway.app)
- [Fly.io](https://fly.io)

#### Step 2: Update Frontend
Edit `script.js`:
```javascript
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://your-backend.onrender.com'; // UPDATE THIS
```

#### Step 3: Reconfigure Email
1. Sign in as admin
2. Settings → Email SMTP Configuration
3. Enter:
   - SMTP Host: `smtp.gmail.com`
   - SMTP Port: `587`
   - Sender Email: Your Gmail
   - Password: Gmail App Password
   - ✓ Enable email system
4. Click "Save & Test Email"

#### Step 4: Verify
- Check test email arrives
- Save a reminder preference
- Wait 5 minutes and check if reminder email arrives

## For Developers

### Code Changes

#### Removed
- `functions/` directory
- Firebase Functions SDK (`firebase-functions-compat.js`)
- All `firebase.functions().httpsCallable()` calls
- `functions` section in `firebase.json`

#### Added
- `backend/` directory with Express server
- `backend/server.js` - Main API server
- `backend/emailService.js` - Nodemailer integration
- `backend/scheduler.js` - Node-cron for reminders
- `backend/firebaseAdmin.js` - Firebase Admin SDK
- `backend/middleware/` - Authentication & authorization
- `BACKEND_SETUP.md` - Deployment guide
- Updated `DEPLOYMENT_GUIDE.md`

#### Modified
- `script.js` - Added `callBackendAPI()` helper
- `script.js` - Updated all email functions to use REST API
- `index.html` - Removed Functions SDK import
- `firebase.json` - Removed functions configuration
- `README.md` - Updated architecture documentation

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/health` | GET | None | Health check |
| `/api/admin/email-config` | POST | Admin | Save SMTP config |
| `/api/admin/email-config` | GET | Admin | Get SMTP config |
| `/api/email/test` | POST | User | Send test email |
| `/api/email/reminders` | POST | User | Update reminders |
| `/api/email/reminders` | GET | User | Get reminders |

### Data Structure Changes

#### Firestore Path Changes
- Old: `adminSettings/emailConfig`
- New: `config/smtp`

#### Reminder Format Changes
**Old Format:**
```javascript
{
  reminder1: { enabled: true, preset: "09:00", custom: "" },
  reminder2: { enabled: true, preset: "custom", custom: "14:30" },
  // ... up to reminder5
}
```

**New Format:**
```javascript
{
  reminders: [
    { time: "09:00", type: "preset" },
    { time: "14:30", type: "custom" }
  ]
}
```

### Local Development

```bash
# Terminal 1 - Backend
cd backend
npm install
cp .env.example .env
# Edit .env
npm run dev

# Terminal 2 - Frontend
python -m http.server 8080
# Or use any static server
```

Then open http://localhost:8080

### Testing

```bash
# Test backend structure
cd backend
npm install
node -c server.js
node -c emailService.js

# Test API
curl http://localhost:3000/api/health
```

## Troubleshooting

### Backend not starting
- Check `.env` file has all required variables
- Verify Firebase credentials are correct
- Check port 3000 is not already in use

### Emails not sending
- Verify SMTP configuration in admin panel
- Check backend logs for errors
- Ensure Gmail App Password is correct
- Test with `/api/email/test` endpoint

### Frontend can't connect to backend
- Check `BACKEND_URL` in `script.js` is correct
- Verify backend is running and accessible
- Check CORS configuration in backend
- Test backend health endpoint directly

### Reminders not triggering
- Check backend logs show "Checking reminders..." every 5 minutes
- Verify users have `notificationsEnabled: true`
- Check reminder times are in HH:MM format
- Ensure backend is deployed and running continuously

## Rollback (if needed)

If you need to rollback to Cloud Functions:

1. Checkout the previous commit:
   ```bash
   git checkout <previous-commit-sha>
   ```

2. Redeploy Cloud Functions:
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

3. Note: This requires Firebase Blaze plan

## Support

- **Setup Issues**: See [BACKEND_SETUP.md](BACKEND_SETUP.md)
- **Deployment**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Code Issues**: Open a GitHub issue
- **Questions**: Check documentation first, then ask in GitHub Discussions

## Benefits Summary

| Aspect | Before (Cloud Functions) | After (Backend) |
|--------|-------------------------|-----------------|
| **Cost** | Requires Blaze plan | 100% free |
| **Hosting** | Firebase only | Multiple options |
| **Development** | Firebase emulator needed | Standard Node.js |
| **Testing** | Complex setup | Simple local testing |
| **Scheduling** | Hourly checks | Every 5 minutes |
| **Control** | Limited by Firebase | Full control |
| **Credit Card** | Required | Not required |

## Timeline

If you're migrating an existing deployment:

1. **Deploy backend**: 15 minutes
2. **Update frontend**: 5 minutes
3. **Reconfigure SMTP**: 5 minutes
4. **Test thoroughly**: 10 minutes
5. **Total**: ~35 minutes

## Questions?

- Read [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed setup
- Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for deployment options
- Check GitHub Issues for known problems
- Open a new issue if you're stuck

---

**Last Updated**: January 2024  
**Version**: 2.0.0 (Backend Architecture)
