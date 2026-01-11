const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
    if (admin.apps.length > 0) {
        return admin.app(); // Return existing app if already initialized
    }

    try {
        // Use service account credentials from environment variables
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        };

        // Only initialize if we have valid-looking credentials
        if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
            console.warn('Firebase Admin SDK not initialized - missing credentials (projectId, clientEmail, or privateKey)');
            return null;
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('Firebase Admin SDK initialized successfully');
        return admin.app();
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error.message);
        return null;
    }
};

// Initialize
initializeFirebaseAdmin();

// Export Firestore database (may be null if not initialized)
const db = admin.apps.length > 0 ? admin.firestore() : null;

module.exports = {
    admin,
    db
};
