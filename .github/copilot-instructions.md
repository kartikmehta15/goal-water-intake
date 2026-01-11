# GitHub Copilot Instructions for Water Intake Tracker

## Project Overview

This is a water intake tracking web application that helps users monitor their daily water consumption. The application features:
- Visual calendar view with color-coded days based on intake goals
- Daily animated companions (animals/plants) that fill proportionally to goal completion
- User authentication and cloud sync via Firebase
- Real-time data synchronization across devices
- Offline support with automatic sync when back online
- CSV export functionality for data analysis

## Tech Stack

- **Frontend**: Pure HTML, CSS, and vanilla JavaScript (ES6+)
- **No Build Tools**: No bundlers, transpilers, or frameworks required
- **Authentication**: Firebase Authentication (Email/Password and Google Sign-In)
- **Database**: Cloud Firestore
- **Hosting**: Firebase Hosting (primary), compatible with GitHub Pages and static hosts
- **Offline Storage**: LocalStorage API for offline caching
- **Cloud Functions**: Node.js-based Firebase Functions (Node 16)

## Project Structure

```
/
├── index.html           # Main application page
├── auth.html            # Authentication page (login/signup)
├── script.js            # Core application logic and Firestore integration
├── auth.js              # Firebase authentication logic
├── styles.css           # Application styling
├── auth.css             # Authentication page styling
├── firestore.rules      # Firestore security rules
├── firebase.json        # Firebase configuration
├── functions/           # Firebase Cloud Functions
│   ├── index.js         # Email notification functions
│   └── package.json     # Functions dependencies
├── README.md            # Main documentation
├── DEPLOYMENT_GUIDE.md  # Deployment instructions
├── EMAILJS_SETUP.md     # EmailJS configuration guide
└── GMAIL_SMTP_SETUP.md  # Gmail SMTP setup guide
```

## Coding Standards and Conventions

### JavaScript

1. **Use vanilla JavaScript (ES6+)** - No frameworks or libraries except Firebase SDK
2. **Async/Await Preferred** - Use async/await over promises for cleaner code
3. **Error Handling** - Always wrap Firebase operations in try-catch blocks
4. **Console Logging** - Use console.error for errors, console.log for debugging (remove before production)
5. **Variable Naming**:
   - Use camelCase for variables and functions
   - Use UPPERCASE for constants
   - Use descriptive names (e.g., `dailyGoal` not `dg`)
6. **Comments** - Add comments for complex logic, Firebase operations, and user-facing features
7. **Firebase Best Practices**:
   - Always check `auth.currentUser` before Firestore operations
   - Use Firestore batch operations when updating multiple documents
   - Enable offline persistence for better UX
   - Handle connection state changes gracefully

### HTML

1. **Semantic HTML** - Use appropriate semantic tags (header, main, section, article)
2. **Accessibility** - Include proper ARIA labels and alt text
3. **Form Validation** - Use HTML5 validation attributes (required, min, max, pattern)
4. **IDs and Classes** - Use kebab-case for IDs and classes

### CSS

1. **Organization** - Group related styles together with comments
2. **Responsive Design** - Mobile-first approach with media queries
3. **CSS Variables** - Use CSS custom properties for colors and common values
4. **No CSS Preprocessors** - Write pure CSS only
5. **Naming Convention** - Use BEM-like naming where appropriate
6. **Animations** - Keep animations subtle and performant (prefer transform/opacity)

### Firebase Integration

1. **Configuration**:
   - Firebase config is stored in `auth.js` (lines 4-12)
   - **Note**: This repository currently has Firebase API keys committed for demo purposes
   - For production forks: Replace with your own Firebase project credentials
   - Firebase API keys are safe to expose client-side as they're restricted by domain and security rules
2. **Firestore Structure**:
   - Collection: `users/{userId}/waterIntake/{dateId}`
   - Document fields: `date`, `intake`, `goal`, `timestamp`
3. **Security Rules**:
   - Users can only read/write their own data
   - All operations require authentication
   - Validate data structure in rules
4. **Offline Support**:
   - Use Firestore offline persistence
   - Handle online/offline state changes
   - Show user-friendly offline indicators

## Development Workflow

### Setup

1. Clone the repository
2. Configure Firebase project (see README.md for detailed steps)
3. Update `firebaseConfig` in `auth.js` with your Firebase credentials
4. For Cloud Functions development:
   ```bash
   cd functions
   npm install
   ```

### Local Development

1. Use a local web server (no build step required):
   ```bash
   # Option 1: Python
   python -m http.server 8000
   
   # Option 2: Node.js http-server
   npx http-server -p 8000
   
   # Option 3: VS Code Live Server extension
   ```
2. Open http://localhost:8000 in your browser
3. Test with Firebase emulators for safer development:
   ```bash
   firebase emulators:start
   ```

### Testing

- **Manual Testing**: Primary testing method since there's no test framework
- **Test Authentication**: Try email/password and Google Sign-In
- **Test Offline**: Disconnect network and verify offline mode works
- **Test Sync**: Make changes on one device/browser, verify they appear on another
- **Browser Testing**: Test on Chrome, Firefox, Safari, and mobile browsers
- **Firestore Rules Testing**: Use Firebase emulator suite to test security rules

### Deployment

#### Firebase Hosting (Recommended)

```bash
# First time setup
npm install -g firebase-tools
firebase login
firebase init

# Deploy
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions
```

#### GitHub Pages

1. Ensure `auth.js` has correct Firebase config
2. Push to GitHub
3. Enable GitHub Pages in repository settings

## Common Tasks

### Adding a New Feature

1. Update the relevant HTML file (`index.html` or `auth.html`)
2. Add JavaScript logic to `script.js` or `auth.js`
3. Style with CSS in `styles.css` or `auth.css`
4. Test manually in multiple browsers
5. Update README.md if it's a user-facing feature
6. Ensure Firebase sync works correctly

### Modifying Firestore Structure

1. Update the data model in `script.js`
2. Update security rules in `firestore.rules`
3. Test with Firebase emulator
4. Deploy rules: `firebase deploy --only firestore:rules`
5. Consider data migration for existing users

### Adding New Cloud Functions

1. Create function in `functions/index.js`
2. Update dependencies in `functions/package.json` if needed
3. Test locally with Firebase emulator
4. Deploy: `firebase deploy --only functions`

## Security Guidelines

1. **Authentication**:
   - Always check `auth.currentUser` before accessing user data
   - Use Firebase Auth state observer for authentication changes
   - Implement password reset functionality
   - Validate email format before authentication

2. **Data Security**:
   - Enforce Firestore security rules (see `firestore.rules`)
   - Validate all user inputs client-side and in security rules
   - Never expose sensitive data in console logs
   - Use HTTPS for all communication (automatic with Firebase)

3. **XSS Prevention**:
   - Sanitize user inputs when displaying in DOM
   - Use `textContent` instead of `innerHTML` for user data
   - Validate data types and formats

4. **Privacy**:
   - Only collect necessary data (email and water intake)
   - Respect user privacy in all features
   - Provide data export functionality (CSV)

## Troubleshooting

### Common Issues

1. **Firebase Not Initialized**: Check that `firebaseConfig` is correctly set in `auth.js`
2. **Permission Denied**: Verify Firestore security rules and user authentication
3. **Data Not Syncing**: Check internet connection and Firestore console for errors
4. **Offline Mode Issues**: Verify Firestore offline persistence is enabled
5. **Authentication Errors**: Check Firebase Console for enabled sign-in methods

### Debugging

1. Check browser console for errors
2. Use Firebase Console to inspect Firestore data
3. Test with Firebase emulator for local development
4. Use Chrome DevTools Network tab to inspect Firebase requests
5. Check Firebase Console for quota limits and usage

## Documentation Requirements

When adding features or making changes:

1. Update README.md for user-facing changes
2. Update DEPLOYMENT_GUIDE.md for deployment-related changes
3. Add inline comments for complex logic
4. Update this file if development workflow changes
5. Keep Firebase configuration instructions up-to-date

## Best Practices

1. **Keep It Simple**: Maintain the no-build-tools philosophy
2. **Mobile First**: Always consider mobile users
3. **Progressive Enhancement**: Core features should work without JavaScript
4. **Accessibility**: Ensure keyboard navigation and screen reader support
5. **Performance**: Minimize Firebase reads/writes (use batching)
6. **User Experience**: Provide immediate feedback for all actions
7. **Error Messages**: Show user-friendly error messages
8. **Data Validation**: Validate on client and enforce in Firestore rules

## Firebase Specifics

### Firestore Queries

- Use `.where()` with indexed fields for efficient queries
- Limit results with `.limit()` to reduce costs
- Use `.orderBy()` for sorted data
- Consider pagination for large datasets

### Authentication Flow

1. User signs up/signs in via Firebase Authentication
2. Firebase SDK creates and manages authentication token
3. Token stored automatically by Firebase SDK (primarily using IndexedDB for persistence)
4. All Firestore operations authenticate using this managed token
5. Token refreshed automatically by Firebase SDK

### Cloud Functions

- Use for server-side operations (email notifications)
- Keep functions lightweight and fast
- Handle errors gracefully
- Use Firebase Admin SDK for elevated permissions

## Version Compatibility

- **Node.js**: 16.x (for Cloud Functions)
- **Firebase SDK**: 10.7.1 (loaded via CDN in HTML files)
- **Browsers**: Modern browsers supporting ES6+ and CSS Grid
- **Firebase Admin SDK**: ^11.0.0 (for Cloud Functions)
- **Firebase Functions SDK**: ^4.0.0 (for Cloud Functions)

## Support and Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Repository Issues**: Use GitHub Issues for bugs and feature requests
- **README**: Comprehensive user guide and setup instructions
- **Deployment Guide**: Step-by-step deployment instructions
