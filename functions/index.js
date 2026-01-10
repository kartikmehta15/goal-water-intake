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

// Email template function
function generateEmailHTML(userName, progress, timeOfDay) {
    const { amount, goal, percentage } = progress;
    const websiteUrl = 'https://kartikmehta15.github.io/goal-water-intake/';
    
    let motivationMessage = '';
    let emoji = '💧';
    
    if (percentage >= 100) {
        motivationMessage = "Amazing! You've already reached your goal today! 🎉";
        emoji = '🏆';
    } else if (percentage >= 75) {
        motivationMessage = "Great job! You're almost there! Keep it up! 💪";
        emoji = '🌊';
    } else if (percentage >= 50) {
        motivationMessage = "You're halfway there! Time to drink some water! 💧";
        emoji = '💦';
    } else if (percentage >= 25) {
        motivationMessage = "Don't forget to stay hydrated! Let's catch up! 🥤";
        emoji = '💧';
    } else {
        motivationMessage = "Time to start hydrating! Your body needs water! 🚰";
        emoji = '⚡';
    }
    
    const timeMessages = {
        morning: '☀️ Good Morning',
        afternoon: '🌤️ Good Afternoon',
        evening: '🌙 Good Evening'
    };
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .progress-container { background: #f5f7fa; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
            .progress-bar { background: #e1e4e8; border-radius: 10px; height: 20px; overflow: hidden; margin: 15px 0; }
            .progress-fill { background: linear-gradient(90deg, #4A90E2, #50C878); height: 100%; border-radius: 10px; transition: width 0.3s; }
            .stats { display: flex; justify-content: space-around; margin: 15px 0; }
            .stat { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #4A90E2; }
            .stat-label { font-size: 14px; color: #666; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .cta-button:hover { opacity: 0.9; }
            .motivation { background: #e3f2fd; border-left: 4px solid #4A90E2; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f5f7fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .footer a { color: #4A90E2; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${emoji} ${timeMessages[timeOfDay]}!</h1>
                <p>Time to Stay Hydrated</p>
            </div>
            
            <div class="content">
                <p>Hi there! 👋</p>
                
                <div class="progress-container">
                    <h2>Today's Hydration Progress</h2>
                    <div class="stats">
                        <div class="stat">
                            <div class="stat-value">${amount} ml</div>
                            <div class="stat-label">Current</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${goal} ml</div>
                            <div class="stat-label">Goal</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${percentage}%</div>
                            <div class="stat-label">Complete</div>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                </div>
                
                <div class="motivation">
                    <strong>${motivationMessage}</strong>
                </div>
                
                <p style="text-align: center;">
                    <a href="${websiteUrl}" class="cta-button">💧 Update Your Intake Now</a>
                </p>
                
                <p style="font-size: 14px; color: #666;">
                    Remember: Staying hydrated is essential for your health, energy, and focus throughout the day!
                </p>
            </div>
            
            <div class="footer">
                <p>Water Intake Tracker</p>
                <p><a href="${websiteUrl}">Visit Website</a> | <a href="${websiteUrl}">Manage Settings</a></p>
                <p style="margin-top: 15px;">You're receiving this because you enabled email reminders.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Helper function to send email
async function sendReminderEmail(user, timeOfDay) {
    try {
        const progress = await getUserProgress(user.userId);
        
        // Don't send if already at 100% (optional)
        // if (progress.percentage >= 100) {
        //     console.log(`User ${user.email} already at 100%, skipping email`);
        //     return;
        // }
        
        const emailHTML = generateEmailHTML(user.email, progress, timeOfDay);
        
        const msg = {
            to: user.email,
            from: 'noreply@waterintaketracker.com', // Change to your verified SendGrid sender
            subject: `💧 ${timeOfDay === 'morning' ? 'Morning' : timeOfDay === 'afternoon' ? 'Afternoon' : 'Evening'} Hydration Reminder`,
            html: emailHTML
        };
        
        await sgMail.send(msg);
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
                promises.push(sendReminderEmail(user, 'morning'));
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
                promises.push(sendReminderEmail(user, 'afternoon'));
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
                promises.push(sendReminderEmail(user, 'evening'));
            });
            
            await Promise.all(promises);
            console.log(`Evening reminders sent to ${promises.length} users`);
        } catch (error) {
            console.error('Error in sendEveningReminder:', error);
        }
    });
