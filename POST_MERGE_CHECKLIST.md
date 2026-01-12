# Post-Merge Deployment Checklist

## Admin Email Configuration Update

This checklist ensures the admin email changes are fully deployed and functional.

### Code Changes (Completed ✅)
- [x] Update `firestore.rules` with new admin email
- [x] Update `script.js` ADMIN_EMAIL constant
- [x] Update `backend/.env.example` ADMIN_EMAIL value
- [x] Verify old email removed from codebase
- [x] Commit and push changes

### Deployment Steps (TODO ⚠️)
- [ ] **CRITICAL**: Run `firebase deploy --only firestore:rules`
- [ ] Verify rules deployed in Firebase Console
- [ ] Test sign-in with `kartikmehta.iitd@gmail.com`
- [ ] Verify Email Notifications section loads correctly
- [ ] Confirm no "Missing or insufficient permissions" errors
- [ ] Delete `DEPLOYMENT_REQUIRED.md` after successful deployment
- [ ] Delete this checklist after all steps complete

### Testing Verification
- [ ] Sign in with admin email: `kartikmehta.iitd@gmail.com`
- [ ] Navigate to Email Notifications section
- [ ] Verify page loads (no indefinite "Loading email system status...")
- [ ] Check browser console for no permission errors
- [ ] Test SMTP configuration access (if applicable)

### Rollback Plan (If Issues Occur)
If deployment causes issues:
1. Revert Firestore rules in Firebase Console
2. Or redeploy previous rules version
3. Report issue in GitHub repository

---

**Date Completed**: _____________
**Deployed By**: _____________
**Verified By**: _____________
