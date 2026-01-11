require('dotenv').config();

/**
 * Middleware to verify admin access
 * Checks if the authenticated user's email matches ADMIN_EMAIL
 * Must be used after verifyFirebaseToken middleware
 */
function verifyAdmin(req, res, next) {
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
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
    
    if (req.user.email !== adminEmail) {
        return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Admin access required' 
        });
    }
    
    next();
}

module.exports = verifyAdmin;
