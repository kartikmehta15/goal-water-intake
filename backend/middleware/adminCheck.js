require('dotenv').config();

// Cache admin email and validate at startup
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// Validate admin email at startup
if (!ADMIN_EMAIL) {
    console.error('FATAL: ADMIN_EMAIL not configured in environment variables');
} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL)) {
    console.error('FATAL: ADMIN_EMAIL is not a valid email format');
}

/**
 * Middleware to verify admin access
 * Checks if the authenticated user's email matches ADMIN_EMAIL
 * Must be used after verifyFirebaseToken middleware
 */
function verifyAdmin(req, res, next) {
    if (!ADMIN_EMAIL) {
        console.error('ADMIN_EMAIL not configured in environment variables');
        return res.status(500).json({ 
            error: 'Server configuration error',
            message: 'Admin email not configured' 
        });
    }
    
    if (!req.user || !req.user.email) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'User authentication required' 
        });
    }
    
    if (req.user.email !== ADMIN_EMAIL) {
        return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Admin access required' 
        });
    }
    
    next();
}

module.exports = verifyAdmin;
