# 💧 Water Intake Tracker

A beautiful, interactive web application to track your daily water consumption and stay hydrated! Now with cloud sync powered by Firebase.

## Features

### Core Features
- **📅 Calendar View**: Visual calendar showing your water intake history with color-coded days
- **🎨 Daily Companion**: Each day features a unique animal, plant, or nature emoji that fills proportionally to your water intake goal
- **📊 Progress Tracking**: Visual progress bar and percentage display showing how close you are to your daily goal
- **✏️ Edit Historical Data**: Click any past day in the calendar to view and edit your water intake
- **📈 Summary Statistics**: Track your overall performance with statistics showing:
  - Days you reached 100%+ of your goal
  - Days you reached 75-99% of your goal
  - Days you reached 50-74% of your goal
  - Days you reached 25-49% of your goal
  - Days below 25% of your goal
- **🎯 Customizable Daily Goal**: Set your own daily water intake goal (default: 2000ml)
- **📱 Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- **📥 CSV Export**: Export your water intake data to CSV for further analysis

### Cloud Features (Firebase Integration)
- **🔐 User Authentication**: Secure sign-up and login with email/password or Google
- **☁️ Cloud Storage**: All data is synced to Firebase Firestore
- **🔄 Real-time Sync**: Access your data from any device, updates instantly
- **📱 Cross-device Access**: Start on your phone, continue on your computer
- **💾 Automatic Data Migration**: Seamlessly migrate existing local data to the cloud
- **🌐 Offline Support**: Works offline with automatic sync when back online
- **🔒 Secure**: Data is protected with Firebase security rules

## Firebase Setup Instructions

### Prerequisites
1. A Google account
2. Basic knowledge of Firebase Console

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or select an existing project
3. Enter a project name (e.g., "water-intake-tracker")
4. (Optional) Enable Google Analytics if you want usage analytics
5. Click "Create Project"

### Step 2: Enable Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click "Get Started"
3. Go to the "Sign-in method" tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"
5. Enable **Google Sign-In**:
   - Click on "Google"
   - Toggle "Enable"
   - Select a support email
   - Click "Save"

### Step 3: Create Firestore Database

1. In your Firebase project, click on "Firestore Database" in the left sidebar
2. Click "Create Database"
3. Choose a starting mode:
   - Select **"Production mode"** (we'll add rules next)
4. Select a Cloud Firestore location (choose one closest to your users)
5. Click "Enable"

### Step 4: Set Security Rules

1. In Firestore Database, go to the "Rules" tab
2. Replace the existing rules with the contents of `firestore.rules` from this repository
3. Click "Publish"

The security rules ensure:
- Users can only read/write their own data
- All operations require authentication
- Data structure is validated

### Step 5: Get Your Firebase Configuration

1. Go to Project Settings (click the gear icon next to "Project Overview")
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Water Tracker Web")
5. Copy the Firebase configuration object

### Step 6: Configure the Application

1. Open `auth.js` in your code editor
2. Find the `firebaseConfig` object at the top of the file (lines 4-10)
3. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 7: Deploy the Application

You have several options:

#### Option A: Firebase Hosting (Recommended)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase: `firebase init`
   - Select "Hosting"
   - Choose your project
   - Use public directory: `.` (current directory)
   - Configure as single-page app: No
   - Don't overwrite existing files
4. Deploy: `firebase deploy`

#### Option B: GitHub Pages
1. Commit your changes (with `auth.js` properly configured)
2. Push to GitHub
3. Go to repository Settings > Pages
4. Select your branch and save

#### Option C: Local Development
1. Use a local web server (e.g., `python -m http.server` or VS Code Live Server)
2. Open in your browser

### Step 8: Test Your Application

1. Open the deployed or local URL
2. Try signing up with email/password
3. Try signing in with Google
4. Add some water intake data
5. Open the app on another device and verify data syncs

## Data Migration Guide

### Migrating from LocalStorage to Cloud

If you were using the app before Firebase integration, your data is stored locally. Here's how to migrate:

1. **Automatic Migration**: On first login after Firebase setup, the app will detect local data and offer to migrate it
2. **Accept the Migration**: Click "OK" when prompted
3. **Wait for Completion**: The app will show a loading indicator while migrating
4. **Verification**: After migration, verify your data appears correctly

### Manual Migration (if needed)

If automatic migration fails:

1. Export your data using the CSV export feature before upgrading
2. After Firebase setup, manually re-enter important data entries
3. Or contact support with your CSV file

## How to Use

### Getting Started

1. Open the application URL in your web browser
2. Sign up for a new account or sign in with existing credentials
3. Choose email/password or Google Sign-In

### Authentication

- **Sign Up**: Enter your email and a secure password (minimum 6 characters)
- **Sign In**: Use your credentials to access your account
- **Google Sign-In**: Click the "Continue with Google" button for quick access
- **Password Reset**: Click "Forgot Password?" to receive a reset email

### Logging Water Intake

1. **For Today**: The current date is automatically selected
   - Enter the amount of water you've consumed in milliliters in the "Water Intake (ml)" field
   - Click the "Save" button
   - Watch your daily companion fill up with water! 🌊

2. **For Past Days**: 
   - Click on any date in the calendar view, or
   - Use the date selector at the top to choose a specific date
   - Enter the water intake amount and click "Save"

### Editing Existing Entries

1. Click on any day in the calendar that already has data
2. The form will populate with the existing values
3. Modify the water intake amount
4. Click "Save" to update (syncs to cloud automatically)

### Viewing Different Months

- Use the "← Previous" and "Next →" buttons above the calendar to navigate between months
- Your data persists across all months and devices

### Exporting Data

1. Click on the "Export Data" section
2. Select a date range using the start and end date fields
3. Click "📥 Download CSV" to export your data
4. The CSV file includes: Date, Water Intake (ml), Daily Goal (ml), and Percentage

### Understanding Visual Feedback

- **Creature Fill**: The daily companion (animal/plant) has a blue gradient that fills from bottom to top based on your percentage of the daily goal
- **Progress Bar**: Shows your completion percentage with a gradient from green to blue
- **Calendar Colors**:
  - 🟢 **Green**: 100%+ goal achieved
  - 🟢 **Light Green**: 75-99% of goal
  - 🟡 **Yellow**: 50-74% of goal
  - 🟡 **Light Yellow**: 25-49% of goal
  - 🔴 **Light Red**: Below 25% of goal

### Daily Companions

The app features 31 different creatures and plants that rotate daily:
- 🌵 Cactus, 🌻 Sunflower, 🌲 Pine Tree, 🐠 Fish, 🐳 Whale, 🐸 Frog, 🦭 Seal
- 🌺 Hibiscus, 🌴 Palm Tree, 🦢 Swan, 🪴 Potted Plant, 🌿 Herb, 🍀 Clover
- 🌾 Sheaf of Rice, 🌱 Seedling, 🐢 Turtle, 🦆 Duck, 🦦 Otter, 🐊 Crocodile
- 🦈 Shark, 🐙 Octopus, 🌊 Wave, 🪷 Lotus, 🦩 Flamingo, 🌷 Tulip
- 🌹 Rose, 🌸 Cherry Blossom, 🪻 Hyacinth, 🌼 Blossom, 🪸 Coral, 🦑 Squid

## Technical Details

### Stack
- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks or build tools)
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **Hosting**: Firebase Hosting (recommended) or any static host
- **Offline Support**: Firestore offline persistence enabled

### Architecture
- Data Structure: `users/{userId}/waterIntake/{dateId}`
- Real-time sync with Firestore listeners
- Optimistic UI updates for better user experience
- Automatic reconnection and sync when back online

### Browser Compatibility

Works on all modern browsers that support:
- ES6+ JavaScript
- CSS Grid and Flexbox
- Firebase SDK (v10+)
- LocalStorage API (for offline caching)

## Security

### Authentication
- Passwords are securely hashed by Firebase Authentication
- Google Sign-In uses OAuth 2.0
- Password reset via email

### Data Security
- Firestore security rules ensure users can only access their own data
- All communication with Firebase is encrypted (HTTPS)
- No sensitive data is stored client-side except Firebase auth tokens

### Privacy
- Only email addresses are collected
- No personal data is shared with third parties
- Water intake data is private to each user

## Troubleshooting

### Can't Sign In
- Check that you've enabled Email/Password and Google Sign-In in Firebase Console
- Verify your Firebase configuration in `auth.js` is correct
- Clear browser cache and cookies
- Check browser console for error messages

### Data Not Syncing
- Check your internet connection
- Verify Firestore security rules are properly configured
- Check browser console for permission errors
- Try signing out and signing back in

### Migration Failed
- Ensure you're connected to the internet
- Check that Firestore is properly configured
- Try exporting data to CSV before migration
- Contact support if issue persists

### Offline Mode
- The app works offline with cached data
- Changes made offline will sync when you're back online
- You'll see an offline indicator at the bottom of the screen

## Files

- `index.html` - Main application page
- `auth.html` - Authentication page (login/signup)
- `script.js` - Application logic and Firestore integration
- `auth.js` - Firebase authentication logic
- `styles.css` - Application styling
- `auth.css` - Authentication page styling
- `firestore.rules` - Firestore security rules
- `README.md` - This documentation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Firebase Console for configuration issues
3. Check browser console for error messages
4. Open an issue on GitHub

## License

This project is open source and available for personal use.

## Acknowledgments

- Firebase for authentication and database services
- Emoji providers for the daily companion creatures
- The open-source community

## Tips for Staying Hydrated

- Set reminders throughout the day to log your water intake
- Aim to drink water consistently throughout the day rather than all at once
- Adjust your daily goal based on your activity level and climate
- Use the visual feedback as motivation to reach your goal every day!
- Sync across all your devices to track anywhere

---

**Important Security Note**: Never commit your actual Firebase API keys to public repositories. Always use environment variables or configuration management for production deployments.

## License

This project is open source and available for personal use.

## Screenshots

### Initial View
![Water Tracker Initial View](https://github.com/user-attachments/assets/23133c87-abb8-4029-bd34-a10d193d564d)

### With Data Logged (75% Goal)
![Water Tracker with 75% Progress](https://github.com/user-attachments/assets/4fb9abd1-8bfd-44e0-81c2-d72a1a44dc21)

### Edited Data (50% Goal)
![Water Tracker Showing Edited Data](https://github.com/user-attachments/assets/7d789032-530a-450f-8aa9-3c7aea99c49e)

### Complete View with Multiple Days
![Water Tracker Complete View](https://github.com/user-attachments/assets/a1852e81-b044-4915-ad45-c4720436267a)

## Tips for Staying Hydrated

- Set reminders throughout the day to log your water intake
- Aim to drink water consistently throughout the day rather than all at once
- Adjust your daily goal based on your activity level and climate
- Use the visual feedback as motivation to reach your goal every day!
- Sync across all your devices to track anywhere
