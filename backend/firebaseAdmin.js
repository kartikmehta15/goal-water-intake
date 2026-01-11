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

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('Firebase Admin SDK initialized successfully');
        return admin.app();
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        throw error;
    }
};

// Initialize and export
initializeFirebaseAdmin();

// Export Firestore database
const db = admin.firestore();

module.exports = {
    admin,
    db
};
