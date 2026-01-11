const nodemailer = require('nodemailer');
const { db } = require('./firebaseAdmin');
const crypto = require('crypto');

// Encryption key for SMTP password (derived from Firebase project ID)
const ENCRYPTION_KEY = crypto.createHash('sha256')
    .update(process.env.FIREBASE_PROJECT_ID || 'default-project')
    .digest()
    .slice(0, 32); // AES-256 requires exactly 32 bytes

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

// Helper function to encrypt password
function encryptPassword(password) {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(password);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Error encrypting password:', error);
        return null;
    }
}

// Get SMTP transporter from Firestore configuration
async function getTransporter() {
    try {
        const configDoc = await db.collection('config').doc('smtp').get();
        
        if (!configDoc.exists) {
            console.warn('SMTP configuration not found in Firestore');
            return null;
        }
        
        const config = configDoc.data();
        
        if (!config.enabled || !config.smtpHost || !config.senderEmail || !config.senderPassword) {
            console.warn('SMTP configuration incomplete or disabled');
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

// Send reminder email
async function sendReminderEmail(userEmail, progress, websiteUrl, timeLabel, isTest = false) {
    const transporter = await getTransporter();
    
    if (!transporter) {
        throw new Error('SMTP not configured or disabled');
    }

    const { amount, goal, percentage } = progress;
    
    // Get sender email from config
    const configDoc = await db.collection('config').doc('smtp').get();
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
        throw error;
    }
}

module.exports = {
    getTransporter,
    sendReminderEmail,
    encryptPassword,
    decryptPassword
};
