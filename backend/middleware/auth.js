const { admin } = require('../firebaseAdmin');

/**
 * Middleware to verify Firebase ID token from frontend
 * Expects Authorization header with format: "Bearer <token>"
 */
async function verifyFirebaseToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header' 
            });
        }
        
        const token = authHeader.split('Bearer ')[1];
        
        // Verify the token with Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Attach user info to request object
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified
        };
        
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Invalid or expired token' 
        });
    }
}

module.exports = verifyFirebaseToken;
