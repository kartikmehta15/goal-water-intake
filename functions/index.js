const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
const db = admin.firestore();

// Initialize SendGrid with API key
sgMail.setApiKey(functions.config().sendgrid.key);

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

// Email sending function with new template for test emails
async function sendReminderEmail(userEmail, progress, websiteUrl, timeOfDay) {
    const { amount, goal, percentage } = progress;
    
    let emoji = '💧';
    let message = 'Time for a water break!';
    let subject = 'Time to Hydrate!';
    
    if (timeOfDay === 'morning') {
        emoji = '☀️';
        message = 'Start your day hydrated!';
        subject = '☀️ Morning Hydration Reminder';
    } else if (timeOfDay === 'afternoon') {
        emoji = '🌤️';
        message = 'Afternoon hydration check!';
        subject = '🌤️ Afternoon Hydration Reminder';
    } else if (timeOfDay === 'evening') {
        emoji = '🌙';
        message = 'Evening reminder to stay hydrated!';
        subject = '🌙 Evening Hydration Reminder';
    } else if (timeOfDay === 'test') {
        emoji = '🧪';
        message = 'This is a TEST email!';
        subject = '🧪 TEST - Water Intake Reminder';
    }
    
    const msg = {
        to: userEmail,
        from: 'noreply@watertracker.app', // Must match verified sender
        subject: subject,
        html: `
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
                        ${timeOfDay === 'test' ? '<div class="test-badge">🧪 THIS IS A TEST EMAIL</div>' : ''}
                    </div>
                    <div class="content">
                        <p>Hi there! 👋</p>
                        ${timeOfDay === 'test' ? '<p><strong>This is a test email to verify your notification system is working correctly.</strong></p>' : ''}
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
                        
                        ${timeOfDay === 'test' ? '<p><em style="color: #28a745;">✅ If you received this email, your notification system is configured correctly!</em></p>' : ''}
                    </div>
                    <div class="footer">
                        <p>Water Intake Tracker</p>
                        <p><a href="${websiteUrl}">Manage notification settings</a></p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    
    try {
        await sgMail.send(msg);
        console.log(`Email sent to ${userEmail}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${userEmail}:`, error);
        if (error.response) {
            console.error(error.response.body);
        }
        return false;
    }
}

// Helper function to send reminder email (wrapper for scheduled functions)
async function sendScheduledReminderEmail(user, timeOfDay) {
    try {
        const progress = await getUserProgress(user.userId);
        const websiteUrl = 'https://kartikmehta15.github.io/goal-water-intake/';
        
        // Don't send if already at 100% (optional)
        // if (progress.percentage >= 100) {
        //     console.log(`User ${user.email} already at 100%, skipping email`);
        //     return;
        // }
        
        await sendReminderEmail(user.email, progress, websiteUrl, timeOfDay);
        console.log(`Email sent successfully to ${user.email}`);
    } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error);
    }
}

// Scheduled function for 11 AM reminders
exports.sendMorningReminder = functions.pubsub
    .schedule('0 11 * * *')
    .timeZone('America/New_York') // Default timezone
    .onRun(async (context) => {
        try {
            const usersSnapshot = await db.collection('users')
                .where('emailNotificationsEnabled', '==', true)
                .where('reminder11am', '==', true)
                .get();
            
            const promises = [];
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                promises.push(sendScheduledReminderEmail(user, 'morning'));
            });
            
            await Promise.all(promises);
            console.log(`Morning reminders sent to ${promises.length} users`);
        } catch (error) {
            console.error('Error in sendMorningReminder:', error);
        }
    });

// Scheduled function for 3 PM reminders
exports.sendAfternoonReminder = functions.pubsub
    .schedule('0 15 * * *')
    .timeZone('America/New_York')
    .onRun(async (context) => {
        try {
            const usersSnapshot = await db.collection('users')
                .where('emailNotificationsEnabled', '==', true)
                .where('reminder3pm', '==', true)
                .get();
            
            const promises = [];
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                promises.push(sendScheduledReminderEmail(user, 'afternoon'));
            });
            
            await Promise.all(promises);
            console.log(`Afternoon reminders sent to ${promises.length} users`);
        } catch (error) {
            console.error('Error in sendAfternoonReminder:', error);
        }
    });

// Scheduled function for 7 PM reminders
exports.sendEveningReminder = functions.pubsub
    .schedule('0 19 * * *')
    .timeZone('America/New_York')
    .onRun(async (context) => {
        try {
            const usersSnapshot = await db.collection('users')
                .where('emailNotificationsEnabled', '==', true)
                .where('reminder7pm', '==', true)
                .get();
            
            const promises = [];
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                promises.push(sendScheduledReminderEmail(user, 'evening'));
            });
            
            await Promise.all(promises);
            console.log(`Evening reminders sent to ${promises.length} users`);
        } catch (error) {
            console.error('Error in sendEveningReminder:', error);
        }
    });

// HTTP CALLABLE FUNCTION - Send Test Email
exports.sendTestEmail = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to send test email');
    }
    
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;
    
    console.log(`Test email requested by ${userEmail}`);
    
    try {
        // Get user's current progress
        const progress = await getUserProgress(userId);
        
        // Send test email with 'test' timeOfDay to show TEST badge
        const success = await sendReminderEmail(
            userEmail,
            progress,
            'https://kartikmehta15.github.io/goal-water-intake/',
            'test'
        );
        
        if (success) {
            return { 
                message: 'Test email sent successfully!',
                sentTo: userEmail
            };
        } else {
            throw new functions.https.HttpsError('internal', 'Failed to send email via SendGrid');
        }
    } catch (error) {
        console.error('Error sending test email:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send test email: ' + error.message);
    }
});
