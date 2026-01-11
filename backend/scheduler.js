const cron = require('node-cron');
const { db } = require('./firebaseAdmin');
const { sendReminderEmail } = require('./emailService');

// Helper function to parse time string to hour and minute
function parseTimeString(timeStr) {
    if (!timeStr) return null;
    const [hour, minute] = timeStr.split(':').map(num => parseInt(num, 10));
    return { hour, minute };
}

// Helper function to get user's current water intake progress
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

// Check if current time matches reminder time (within the same hour)
function shouldSendReminder(reminderTime, currentHour, currentMinute) {
    if (!reminderTime) return false;
    
    const parsed = parseTimeString(reminderTime);
    if (!parsed) return false;
    
    // Check if hour matches and we're within a reasonable window (e.g., ±5 minutes)
    return parsed.hour === currentHour && Math.abs(parsed.minute - currentMinute) <= 5;
}

// Process reminders for all users
async function checkAndSendReminders() {
    try {
        console.log('Checking reminders at', new Date().toISOString());
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Get all users with notifications enabled
        const usersSnapshot = await db.collection('users')
            .where('notificationsEnabled', '==', true)
            .get();
        
        if (usersSnapshot.empty) {
            console.log('No users with notifications enabled');
            return;
        }
        
        const promises = [];
        let remindersSent = 0;
        
        for (const doc of usersSnapshot.docs) {
            const user = doc.data();
            const userId = doc.id;
            
            if (!user.email) {
                console.warn(`User ${userId} has no email address`);
                continue;
            }
            
            // Check if user has reminders array (new format)
            if (user.reminders && Array.isArray(user.reminders)) {
                for (const reminder of user.reminders) {
                    // The reminder.time field contains the actual time (HH:MM)
                    const reminderTime = reminder.time;
                    
                    if (shouldSendReminder(reminderTime, currentHour, currentMinute)) {
                        console.log(`Sending reminder to ${user.email} at ${reminderTime}`);
                        promises.push(
                            sendEmailReminder(userId, user.email, `Reminder at ${reminderTime}`)
                        );
                        remindersSent++;
                    }
                }
            }
        }
        
        await Promise.allSettled(promises);
        console.log(`Processed ${remindersSent} reminder emails`);
    } catch (error) {
        console.error('Error in checkAndSendReminders:', error);
    }
}

// Helper function to send reminder email
async function sendEmailReminder(userId, userEmail, timeLabel) {
    try {
        const progress = await getUserProgress(userId);
        const websiteUrl = process.env.FRONTEND_URL || 'https://kartikmehta15.github.io/goal-water-intake/';
        
        await sendReminderEmail(userEmail, progress, websiteUrl, timeLabel, false);
        console.log(`Reminder sent to ${userEmail}`);
    } catch (error) {
        console.error(`Error sending reminder to ${userEmail}:`, error);
    }
}

// Initialize the scheduler
function initializeScheduler() {
    // Run every 5 minutes to check for reminders
    // This provides better accuracy than hourly checks
    cron.schedule('*/5 * * * *', () => {
        checkAndSendReminders();
    });
    
    console.log('Email reminder scheduler initialized (runs every 5 minutes)');
}

module.exports = {
    initializeScheduler,
    checkAndSendReminders
};
