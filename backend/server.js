const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { db } = require('./firebaseAdmin');
const { sendReminderEmail, encryptPassword } = require('./emailService');
const { initializeScheduler } = require('./scheduler');
const verifyFirebaseToken = require('./middleware/auth');
const verifyAdmin = require('./middleware/adminCheck');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'Water Intake Tracker Backend'
    });
});

// ============================================================================
// ADMIN ENDPOINTS - Email Configuration
// ============================================================================

/**
 * POST /api/admin/email-config
 * Save SMTP configuration to Firestore (Admin only)
 */
app.post('/api/admin/email-config', verifyFirebaseToken, verifyAdmin, async (req, res) => {
    try {
        const { smtpHost, smtpPort, senderEmail, senderPassword, enabled } = req.body;
        
        // Validate required fields
        if (!smtpHost || !senderEmail || !senderPassword) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'smtpHost, senderEmail, and senderPassword are required'
            });
        }
        
        // Encrypt the password before storing
        const encryptedPassword = encryptPassword(senderPassword);
        
        if (!encryptedPassword) {
            return res.status(500).json({ 
                error: 'Encryption failed',
                message: 'Failed to encrypt SMTP password'
            });
        }
        
        // Save to Firestore
        const config = {
            smtpHost,
            smtpPort: parseInt(smtpPort) || 587,
            senderEmail,
            senderPassword: encryptedPassword,
            enabled: enabled !== false, // Default to true if not specified
            configuredBy: req.user.email,
            updatedAt: new Date().toISOString()
        };
        
        await db.collection('config').doc('smtp').set(config);
        
        res.json({ 
            success: true,
            message: 'SMTP configuration saved successfully',
            config: {
                smtpHost: config.smtpHost,
                smtpPort: config.smtpPort,
                senderEmail: config.senderEmail,
                enabled: config.enabled,
                configuredBy: config.configuredBy,
                updatedAt: config.updatedAt
            }
        });
    } catch (error) {
        console.error('Error saving SMTP config:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/email-config
 * Get current SMTP configuration (Admin only)
 */
app.get('/api/admin/email-config', verifyFirebaseToken, verifyAdmin, async (req, res) => {
    try {
        const configDoc = await db.collection('config').doc('smtp').get();
        
        if (!configDoc.exists) {
            return res.json({ 
                configured: false,
                message: 'SMTP not configured yet'
            });
        }
        
        const config = configDoc.data();
        
        // Return config without the encrypted password
        res.json({
            configured: true,
            config: {
                smtpHost: config.smtpHost,
                smtpPort: config.smtpPort,
                senderEmail: config.senderEmail,
                enabled: config.enabled,
                configuredBy: config.configuredBy,
                updatedAt: config.updatedAt
            }
        });
    } catch (error) {
        console.error('Error fetching SMTP config:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
});

// ============================================================================
// USER ENDPOINTS - Email & Reminders
// ============================================================================

/**
 * POST /api/email/test
 * Send test email to authenticated user
 */
app.post('/api/email/test', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const userEmail = req.user.email;
        
        // Get user's current progress
        const today = new Date().toISOString().split('T')[0];
        const intakeDoc = await db.collection('users').doc(userId).collection('waterIntake').doc(today).get();
        
        let progress = { amount: 0, goal: 2000, percentage: 0 };
        if (intakeDoc.exists) {
            const data = intakeDoc.data();
            progress = {
                amount: data.intake || 0,
                goal: data.goal || 2000,
                percentage: Math.round(((data.intake || 0) / (data.goal || 2000)) * 100)
            };
        }
        
        // Send test email
        const websiteUrl = process.env.FRONTEND_URL || 'https://kartikmehta15.github.io/goal-water-intake/';
        await sendReminderEmail(userEmail, progress, websiteUrl, 'Test Email', true);
        
        res.json({ 
            success: true,
            message: 'Test email sent successfully!',
            sentTo: userEmail
        });
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({ 
            error: 'Failed to send test email',
            message: error.message
        });
    }
});

/**
 * POST /api/email/reminders
 * Update user's reminder preferences
 */
app.post('/api/email/reminders', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { reminders, notificationsEnabled } = req.body;
        
        // Validate reminders array
        if (reminders && !Array.isArray(reminders)) {
            return res.status(400).json({ 
                error: 'Invalid data',
                message: 'Reminders must be an array'
            });
        }
        
        // Limit to 5 reminders
        if (reminders && reminders.length > 5) {
            return res.status(400).json({ 
                error: 'Too many reminders',
                message: 'Maximum 5 reminders allowed'
            });
        }
        
        // Update user document in Firestore
        const updateData = {
            updatedAt: new Date().toISOString()
        };
        
        if (reminders !== undefined) {
            updateData.reminders = reminders;
        }
        
        if (notificationsEnabled !== undefined) {
            updateData.notificationsEnabled = notificationsEnabled;
        }
        
        await db.collection('users').doc(userId).set(updateData, { merge: true });
        
        res.json({ 
            success: true,
            message: 'Reminder preferences updated successfully'
        });
    } catch (error) {
        console.error('Error updating reminders:', error);
        res.status(500).json({ 
            error: 'Failed to update reminders',
            message: error.message
        });
    }
});

/**
 * GET /api/email/reminders
 * Get user's reminder preferences
 */
app.get('/api/email/reminders', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.json({ 
                reminders: [],
                notificationsEnabled: false
            });
        }
        
        const userData = userDoc.data();
        
        res.json({
            reminders: userData.reminders || [],
            notificationsEnabled: userData.notificationsEnabled || false
        });
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ 
            error: 'Failed to fetch reminders',
            message: error.message
        });
    }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message
    });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
    console.log(`👨‍💼 Admin Email: ${process.env.ADMIN_EMAIL || 'Not configured'}`);
    
    // Initialize email scheduler
    initializeScheduler();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

module.exports = app;
