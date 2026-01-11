const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// Encryption key for storing SMTP password (derived from Firebase project ID for simplicity)
// In production, consider using Google Cloud Secret Manager
const ENCRYPTION_KEY = crypto.createHash('sha256')
    .update(process.env.GCLOUD_PROJECT || 'default-project')
    .digest('base64')
    .substr(0, 32);

// Helper function to decrypt password
function decryptPassword(encryptedPassword) {
    try {
        const parts = encryptedPassword.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = Buffer.from(parts[1], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Error decrypting password:', error);
        return null;
    }
}

// Get SMTP transporter from Firestore configuration
async function getTransporter() {
    try {
        const configDoc = await db.collection('adminSettings').doc('emailConfig').get();
        
        if (!configDoc.exists) {
            console.warn('SMTP configuration not found in Firestore');
            return null;
        }
        
        const config = configDoc.data();
        
        if (!config.isConfigured || !config.smtpHost || !config.senderEmail || !config.senderPassword) {
            console.warn('SMTP configuration incomplete');
            return null;
        }
        
        // Decrypt password
        const password = decryptPassword(config.senderPassword);
        if (!password) {
            console.error('Failed to decrypt SMTP password');
            return null;
        }
        
        // Create transporter based on configuration
        const transportConfig = {
            host: config.smtpHost,
            port: config.smtpPort || 587,
            secure: (config.smtpPort === 465), // true for 465, false for other ports
            auth: {
                user: config.senderEmail,
                pass: password
            }
        };
        
        const transporter = nodemailer.createTransport(transportConfig);
        console.log(`SMTP transporter initialized for ${config.smtpHost}`);
        return transporter;
    } catch (error) {
        console.error('Error creating SMTP transporter:', error);
        return null;
    }
}

// Helper function to get user's current progress
async function getUserProgress(userId) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const intakeDoc = await db.collection('users').doc(userId).collection('waterIntake').doc(today).get();
        
        if (intakeDoc.exists) {
            const data = intakeDoc.data();
            return {
                amount: data.intake || 0,
                goal: data.goal || 2000,
                percentage: Math.round(((data.intake || 0) / (data.goal || 2000)) * 100)
            };
        }
        
        // Get default goal from user settings
        const userDoc = await db.collection('users').doc(userId).get();
        const defaultGoal = userDoc.exists ? (userDoc.data().defaultDailyGoal || 2000) : 2000;
        
        return {
            amount: 0,
            goal: defaultGoal,
            percentage: 0
        };
    } catch (error) {
        console.error('Error getting user progress:', error);
        return { amount: 0, goal: 2000, percentage: 0 };
    }
}

// Email sending function using Nodemailer
async function sendReminderEmail(userEmail, progress, websiteUrl, timeLabel, isTest = false) {
    const transporter = await getTransporter();
    
    if (!transporter) {
        throw new Error('SMTP not configured');
    }

    const { amount, goal, percentage } = progress;
    
    // Get sender email from config
    const configDoc = await db.collection('adminSettings').doc('emailConfig').get();
    const senderEmail = configDoc.exists ? configDoc.data().senderEmail : 'noreply@watertracker.com';
    
    let emoji = '💧';
    let message = 'Time for a water break!';
    let subject = 'Time to Hydrate!';
    
    if (isTest) {
        emoji = '🧪';
        message = 'This is a TEST email!';
        subject = '🧪 TEST - Water Intake Reminder';
    } else if (timeLabel) {
        subject = `💧 ${timeLabel} - Water Reminder`;
        message = `Your ${timeLabel.toLowerCase()} hydration reminder`;
    }
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { margin: 0; font-size: 28px; }
                .test-badge { background: #ffc107; color: #333; padding: 8px 16px; border-radius: 5px; display: inline-block; margin-top: 10px; font-weight: bold; font-size: 14px; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .progress-bar { width: 100%; height: 30px; background: #e0e0e0; border-radius: 15px; overflow: hidden; margin: 20px 0; }
                .progress-fill { height: 100%; background: linear-gradient(90deg, #4A90E2, #50C878); transition: width 0.3s; }
                .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                .stat { text-align: center; padding: 15px; background: white; border-radius: 8px; flex: 1; margin: 0 5px; }
                .stat-value { font-size: 24px; font-weight: bold; color: #4A90E2; }
                .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
                .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                .cta-button:hover { opacity: 0.9; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
                .footer a { color: #999; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${emoji} Time to Hydrate!</h1>
                    <p>${message}</p>
                    ${isTest ? '<div class="test-badge">🧪 THIS IS A TEST EMAIL</div>' : ''}
                </div>
                <div class="content">
                    <p>Hi there! 👋</p>
                    ${isTest ? '<p><strong>This is a test email to verify your notification system is working correctly.</strong></p>' : ''}
                    <p>Here's your progress today:</p>
                    
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    
                    <div class="stats">
                        <div class="stat">
                            <div class="stat-value">${amount}</div>
                            <div class="stat-label">Current (ml)</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${goal}</div>
                            <div class="stat-label">Goal (ml)</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${percentage}%</div>
                            <div class="stat-label">Progress</div>
                        </div>
                    </div>
                    
                    ${percentage < 100 ? `
                        <p><strong>Remember to:</strong></p>
                        <ul>
                            <li>✅ Drink a glass of water</li>
                            <li>✅ Update your intake</li>
                        </ul>
                    ` : `
                        <p><strong>🎉 Congratulations!</strong> You've already met your goal for today! Keep it up!</p>
                    `}
                    
                    <center>
                        <a href="${websiteUrl}" class="cta-button">👉 Update Now</a>
                    </center>
                    
                    <p>Keep up the great work! 💪</p>
                    
                    ${isTest ? '<p><em style="color: #28a745;">✅ If you received this email, your notification system is configured correctly!</em></p>' : ''}
                </div>
                <div class="footer">
                    <p>Water Intake Tracker</p>
                    <p><a href="${websiteUrl}">Manage notification settings</a></p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    try {
        await transporter.sendMail({
            from: `Water Tracker <${senderEmail}>`,
            to: userEmail,
            subject: subject,
            html: htmlContent
        });
        console.log(`Email sent to ${userEmail}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${userEmail}:`, error);
        return false;
    }
}

// Helper function to convert time string to hour and minute
function parseTimeString(timeStr) {
    if (!timeStr) return null;
    const [hour, minute] = timeStr.split(':').map(num => parseInt(num, 10));
    return { hour, minute };
}

// Helper function to check if current time matches reminder time in user's timezone
function shouldSendReminder(reminder, currentHour, userTimezone) {
    if (!reminder || !reminder.enabled) return false;
    
    let timeToCheck = null;
    
    // Get time from preset or custom
    if (reminder.preset && reminder.preset !== 'custom') {
        timeToCheck = parseTimeString(reminder.preset);
    } else if (reminder.custom) {
        timeToCheck = parseTimeString(reminder.custom);
    }
    
    if (!timeToCheck) return false;
    
    // Check if current hour matches (we run hourly, so we check on the hour)
    // For now, simplified: just check if hour matches
    return timeToCheck.hour === currentHour;
}

// Scheduled function - runs every hour to check reminders
exports.checkEmailReminders = functions.pubsub
    .schedule('0 * * * *') // Every hour on the hour
    .timeZone('UTC')
    .onRun(async (context) => {
        try {
            console.log('Checking email reminders...');
            
            // Get all users with notifications enabled and power user verified
            const usersSnapshot = await db.collection('users')
                .where('notificationsEnabled', '==', true)
                .where('powerUserVerified', '==', true)
                .get();
            
            if (usersSnapshot.empty) {
                console.log('No users with notifications enabled');
                return null;
            }
            
            const promises = [];
            
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                const userTimezone = user.timezone || 'America/New_York';
                
                // Get current hour in user's timezone
                const now = new Date();
                const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
                const currentHour = userTime.getHours();
                
                // Check each of the 5 reminder slots
                for (let i = 1; i <= 5; i++) {
                    const reminder = user[`reminder${i}`];
                    if (shouldSendReminder(reminder, currentHour, userTimezone)) {
                        console.log(`Sending reminder ${i} to ${user.email} at hour ${currentHour}`);
                        promises.push(
                            sendEmailReminder(user.userId, user.email, `Reminder ${i}`)
                        );
                    }
                }
            });
            
            await Promise.all(promises);
            console.log(`Processed ${promises.length} reminder emails`);
            
            return null;
        } catch (error) {
            console.error('Error in checkEmailReminders:', error);
            return null;
        }
    });

// Helper function to send reminder email
async function sendEmailReminder(userId, userEmail, timeLabel) {
    try {
        const progress = await getUserProgress(userId);
        const websiteUrl = 'https://kartikmehta15.github.io/goal-water-intake/';
        
        await sendReminderEmail(userEmail, progress, websiteUrl, timeLabel, false);
        console.log(`Reminder sent to ${userEmail}`);
    } catch (error) {
        console.error(`Error sending reminder to ${userEmail}:`, error);
    }
}

// HTTP CALLABLE FUNCTION - Verify Power User Code
exports.verifyPowerUserCode = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }
    
    const { code } = data;
    const powerUserCode = functions.config().poweruser?.code;
    
    if (!powerUserCode) {
        throw new functions.https.HttpsError('failed-precondition', 'Power user code not configured');
    }
    
    // Verify the code
    const verified = code === powerUserCode;
    
    console.log(`Power user verification attempt by ${context.auth.uid}: ${verified ? 'SUCCESS' : 'FAILED'}`);
    
    return { verified: verified };
});

// HTTP CALLABLE FUNCTION - Send Test Email
exports.sendTestEmail = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to send test email');
    }
    
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;
    
    // Verify power user status
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists || !userDoc.data().powerUserVerified) {
        throw new functions.https.HttpsError('permission-denied', 'Power user verification required');
    }
    
    console.log(`Test email requested by ${userEmail}`);
    
    try {
        // Get user's current progress
        const progress = await getUserProgress(userId);
        
        // Send test email
        const success = await sendReminderEmail(
            userEmail,
            progress,
            'https://kartikmehta15.github.io/goal-water-intake/',
            'Test Email',
            true
        );
        
        if (success) {
            return { 
                message: 'Test email sent successfully!',
                sentTo: userEmail
            };
        } else {
            throw new functions.https.HttpsError('internal', 'Failed to send email via SMTP');
        }
    } catch (error) {
        console.error('Error sending test email:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send test email: ' + error.message);
    }
});

// HTTP CALLABLE FUNCTION - Encrypt SMTP Password (Admin only)
exports.encryptSmtpPassword = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }
    
    const userEmail = context.auth.token.email;
    
    // Check if user is admin (hardcoded for simplicity)
    const adminEmail = 'kartikmehta15@gmail.com';
    if (userEmail !== adminEmail) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    
    const { password } = data;
    
    if (!password) {
        throw new functions.https.HttpsError('invalid-argument', 'Password is required');
    }
    
    try {
        // Encrypt the password
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(password);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        // Return IV and encrypted data as hex strings
        const encryptedPassword = iv.toString('hex') + ':' + encrypted.toString('hex');
        
        return { encryptedPassword: encryptedPassword };
    } catch (error) {
        console.error('Error encrypting password:', error);
        throw new functions.https.HttpsError('internal', 'Failed to encrypt password: ' + error.message);
    }
});

// HTTP CALLABLE FUNCTION - Test Admin SMTP Configuration
exports.testAdminSmtpConfig = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }
    
    const userEmail = context.auth.token.email;
    
    // Check if user is admin
    const adminEmail = 'kartikmehta15@gmail.com';
    if (userEmail !== adminEmail) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    
    console.log(`Admin SMTP test requested by ${userEmail}`);
    
    try {
        // Get transporter from Firestore config
        const transporter = await getTransporter();
        
        if (!transporter) {
            throw new functions.https.HttpsError('failed-precondition', 'SMTP not configured');
        }
        
        // Test progress data
        const progress = {
            amount: 1500,
            goal: 2000,
            percentage: 75
        };
        
        // Send test email to admin
        const success = await sendReminderEmail(
            userEmail,
            progress,
            'https://kartikmehta15.github.io/goal-water-intake/',
            'Admin Test',
            true
        );
        
        if (success) {
            return { 
                message: 'Test email sent successfully! Check your inbox.',
                sentTo: userEmail
            };
        } else {
            throw new functions.https.HttpsError('internal', 'Failed to send test email');
        }
    } catch (error) {
        console.error('Error testing SMTP config:', error);
        throw new functions.https.HttpsError('internal', 'SMTP test failed: ' + error.message);
    }
});
