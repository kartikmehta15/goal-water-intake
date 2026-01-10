// Water Intake Tracker Application

// Admin email - Replace with your actual email address
// NOTE: For production with multiple admins, consider using Firebase custom claims
// or a Firestore collection to manage admin users. This simple approach works for
// single-admin scenarios and zero-cost hosting (GitHub Pages + Firestore free tier).
const ADMIN_EMAIL = 'kartikmehta15@gmail.com';

// Power User Code - Frontend verification only
// NOTE: In a production environment, this should be verified server-side.
// Since we're using a static hosting (GitHub Pages) without backend,
// this is stored client-side as a trade-off for zero-cost hosting.
// The code provides basic access control for email features.
const POWER_USER_CODE = 'WATER-HYDRO-2026-PWR9';

// Email reminder configuration constants
const REMINDER_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const REMINDER_WINDOW_MS = 5 * 60 * 1000; // 5 minute window to catch reminders
const TEST_MESSAGE_TIMEOUT_MS = 8000; // 8 seconds
const CONFIG_MESSAGE_TIMEOUT_MS = 5000; // 5 seconds

class WaterIntakeTracker {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.defaultGoal = 2000;
        this.data = {};
        this.unsubscribe = null; // For Firestore listener cleanup
        this.previousPercentage = 0; // Track previous percentage for confetti
        this.emailjsInitialized = false; // Track EmailJS initialization state
        this.isAdmin = false; // Track if current user is admin
        this.emailConfig = null; // Global email configuration from Firestore
        this.creatures = [
            { emoji: '🌵', name: 'Cactus' },
            { emoji: '🌻', name: 'Sunflower' },
            { emoji: '🌲', name: 'Pine Tree' },
            { emoji: '🐠', name: 'Fish' },
            { emoji: '🐳', name: 'Whale' },
            { emoji: '🐸', name: 'Frog' },
            { emoji: '🦭', name: 'Seal' },
            { emoji: '🌺', name: 'Hibiscus' },
            { emoji: '🌴', name: 'Palm Tree' },
            { emoji: '🦢', name: 'Swan' },
            { emoji: '🪴', name: 'Potted Plant' },
            { emoji: '🌿', name: 'Herb' },
            { emoji: '🍀', name: 'Four Leaf Clover' },
            { emoji: '🌾', name: 'Sheaf of Rice' },
            { emoji: '🌱', name: 'Seedling' },
            { emoji: '🐢', name: 'Turtle' },
            { emoji: '🦆', name: 'Duck' },
            { emoji: '🦦', name: 'Otter' },
            { emoji: '🐊', name: 'Crocodile' },
            { emoji: '🦈', name: 'Shark' },
            { emoji: '🐙', name: 'Octopus' },
            { emoji: '🌊', name: 'Wave' },
            { emoji: '🪷', name: 'Lotus' },
            { emoji: '🦩', name: 'Flamingo' },
            { emoji: '🌷', name: 'Tulip' },
            { emoji: '🌹', name: 'Rose' },
            { emoji: '🌸', name: 'Cherry Blossom' },
            { emoji: '🪻', name: 'Hyacinth' },
            { emoji: '🌼', name: 'Blossom' },
            { emoji: '🪸', name: 'Coral' },
            { emoji: '🦑', name: 'Squid' }
        ];
        
        // Initialize with authentication
        this.initializeWithAuth();
    }

    async initializeWithAuth() {
        // Wait for Firebase Auth to be ready
        if (!auth) {
            console.error('Firebase not initialized');
            window.location.href = 'auth.html';
            return;
        }

        // Wait for authentication state
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'auth.html';
                return;
            }

            this.currentUser = user;
            this.userId = user.uid;
            this.userEmail = user.email;

            // Check for and migrate localStorage data
            await this.checkAndMigrateData();

            // Setup Firestore realtime listener
            this.setupFirestoreListener();

            // Initialize UI
            this.init();
        });
    }

    async init() {
        try {
            this.setupUserProfile();
            this.setupTabNavigation();
            this.setupQuickAddButtons();
            this.setupEventListeners();
            
            // Check if user is admin
            await this.checkAdminStatus();
            
            // Load email configuration from Firestore
            await this.loadEmailConfig();
            
            this.updateDateSelector();
            this.updateDisplay();
            this.renderCalendar();
            this.updateStatistics();
            this.updateMonthSummary();
            this.initializeExportDates();
            await this.initializeSettings();
            
            // Initialize EmailJS if configured
            this.initializeEmailJS();
            
            // Check for scheduled reminders on app load
            this.checkScheduledReminders();
            
            // Check reminders every 5 minutes while app is open
            setInterval(() => this.checkScheduledReminders(), REMINDER_CHECK_INTERVAL_MS);
        } catch (error) {
            console.error('Initialization error:', error);
            this.showToast('error', 'Error', 'Failed to initialize app. Please refresh the page.');
        }
    }
    
    // Admin Methods
    
    // Check if current user is admin
    async checkAdminStatus() {
        if (!this.userEmail) return;
        
        this.isAdmin = (this.userEmail === ADMIN_EMAIL);
        
        const adminSection = document.getElementById('admin-section');
        if (adminSection && this.isAdmin) {
            adminSection.style.display = 'block';
            await this.loadAdminConfig();
        }
    }
    
    // Load global email configuration from Firestore
    async loadEmailConfig() {
        try {
            const configDoc = await db.collection('config').doc('emailjs').get();
            
            if (configDoc.exists) {
                this.emailConfig = configDoc.data();
                
                const statusEl = document.getElementById('email-system-status');
                const userSettingsEl = document.getElementById('user-notification-settings');
                
                if (this.emailConfig.enabled) {
                    if (statusEl) {
                        statusEl.innerHTML = '<p class="status-success">✅ Email system is active. Configure your reminders below.</p>';
                    }
                    if (userSettingsEl) {
                        userSettingsEl.style.display = 'block';
                    }
                } else {
                    if (statusEl) {
                        statusEl.innerHTML = '<p class="status-warning">⚠️ Email system is currently disabled by administrator.</p>';
                    }
                }
            } else {
                const statusEl = document.getElementById('email-system-status');
                if (statusEl) {
                    statusEl.innerHTML = '<p class="status-info">ℹ️ Email system not configured yet. Contact administrator.</p>';
                }
            }
        } catch (error) {
            console.error('Error loading email config:', error);
        }
    }
    
    // Admin: Load admin configuration
    async loadAdminConfig() {
        try {
            const configDoc = await db.collection('config').doc('emailjs').get();
            
            if (configDoc.exists) {
                const config = configDoc.data();
                
                // Populate admin form
                const serviceIdEl = document.getElementById('admin-emailjs-service-id');
                const templateIdEl = document.getElementById('admin-emailjs-template-id');
                const publicKeyEl = document.getElementById('admin-emailjs-public-key');
                const enabledEl = document.getElementById('admin-emailjs-enabled');
                
                if (serviceIdEl) serviceIdEl.value = config.serviceId || '';
                if (templateIdEl) templateIdEl.value = config.templateId || '';
                if (publicKeyEl) publicKeyEl.value = config.publicKey || '';
                if (enabledEl) enabledEl.checked = config.enabled || false;
                
                // Update status display
                const statusEl = document.getElementById('config-status');
                const adminEl = document.getElementById('config-admin');
                const updatedEl = document.getElementById('config-updated');
                
                if (statusEl) statusEl.textContent = config.enabled ? '✅ Enabled' : '❌ Disabled';
                if (adminEl) adminEl.textContent = config.configuredBy || '-';
                if (updatedEl && config.lastUpdated) {
                    updatedEl.textContent = new Date(config.lastUpdated.toDate()).toLocaleString();
                }
            }
        } catch (error) {
            console.error('Error loading admin config:', error);
        }
    }
    
    // Admin: Save admin configuration
    async saveAdminConfig() {
        if (!this.isAdmin) {
            alert('You must be an administrator to change this configuration.');
            return;
        }
        
        const serviceId = document.getElementById('admin-emailjs-service-id').value.trim();
        const templateId = document.getElementById('admin-emailjs-template-id').value.trim();
        const publicKey = document.getElementById('admin-emailjs-public-key').value.trim();
        const enabled = document.getElementById('admin-emailjs-enabled').checked;
        
        if (!serviceId || !templateId || !publicKey) {
            this.showAdminMessage('Please fill in all configuration fields', 'error');
            return;
        }
        
        try {
            await db.collection('config').doc('emailjs').set({
                serviceId: serviceId,
                templateId: templateId,
                publicKey: publicKey,
                enabled: enabled,
                configuredBy: this.userEmail,
                configuredAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showAdminMessage('✅ Configuration saved successfully! All users can now use email reminders.', 'success');
            
            // Reload config
            await this.loadEmailConfig();
            await this.loadAdminConfig();
            
            // Initialize EmailJS with new config
            this.emailjsInitialized = false; // Reset initialization state
            this.initializeEmailJS();
            
        } catch (error) {
            console.error('Error saving admin config:', error);
            this.showAdminMessage('❌ Failed to save configuration: ' + error.message, 'error');
        }
    }
    
    showAdminMessage(message, type) {
        const messageEl = document.getElementById('admin-config-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `admin-config-message ${type}`;
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
    }
    
    // EmailJS Integration Methods
    
    initializeEmailJS() {
        // Prevent duplicate initialization
        if (this.emailjsInitialized) {
            return true;
        }
        
        // Use Firestore config if available, otherwise fall back to localStorage for backward compatibility
        const config = this.emailConfig || this.getEmailJSConfig();
        if (config && config.publicKey) {
            try {
                if (typeof emailjs !== 'undefined') {
                    emailjs.init(config.publicKey);
                    this.emailjsInitialized = true;
                    console.log('EmailJS initialized successfully');
                    return true;
                } else {
                    console.error('EmailJS library not loaded');
                    return false;
                }
            } catch (error) {
                console.error('Failed to initialize EmailJS:', error);
                return false;
            }
        }
        return false;
    }
    
    getEmailJSConfig() {
        // Backward compatibility: check localStorage for old configs
        const configStr = localStorage.getItem('emailjs_config');
        if (configStr) {
            try {
                return JSON.parse(configStr);
            } catch (error) {
                console.error('Failed to parse EmailJS config:', error);
            }
        }
        return null;
    }
    
    getCurrentProgress() {
        const dateKey = this.getDateKey(new Date());
        const dayData = this.data[dateKey] || { intake: 0, goal: this.defaultGoal };
        const intake = dayData.intake || 0;
        const goal = dayData.goal || this.defaultGoal;
        const percentage = Math.round((intake / goal) * 100);
        
        return {
            amount: intake,
            goal: goal,
            percentage: percentage
        };
    }
    
    async sendEmailReminder(reminderTime) {
        // Use Firestore config if available, otherwise fall back to localStorage
        const config = this.emailConfig || this.getEmailJSConfig();
        if (!config || !config.serviceId || !config.templateId || !config.publicKey) {
            console.error('EmailJS not configured');
            return false;
        }
        
        // Check if email system is enabled (for Firestore config)
        if (this.emailConfig && !this.emailConfig.enabled) {
            console.error('Email system is disabled by administrator');
            return false;
        }
        
        // Initialize EmailJS if needed
        this.initializeEmailJS();
        
        const progress = this.getCurrentProgress();
        
        const templateParams = {
            to_email: this.userEmail,
            to_name: this.userEmail.split('@')[0] || 'there',
            reminder_time: reminderTime,
            current_amount: progress.amount,
            goal_amount: progress.goal,
            percentage: progress.percentage,
            website_url: window.location.origin + window.location.pathname
        };
        
        try {
            const response = await emailjs.send(
                config.serviceId,
                config.templateId,
                templateParams
            );
            console.log('Email sent successfully:', response);
            return true;
        } catch (error) {
            console.error('Email error:', error);
            return false;
        }
    }
    
    async checkScheduledReminders() {
        if (!this.userEmail) return;
        
        // Check if EmailJS is configured (Firestore or localStorage)
        const config = this.emailConfig || this.getEmailJSConfig();
        if (!config || !config.serviceId || !config.templateId || !config.publicKey) {
            return;
        }
        
        // Check if email system is enabled (for Firestore config)
        if (this.emailConfig && !this.emailConfig.enabled) {
            return;
        }
        
        try {
            const userDoc = await db.collection('users').doc(this.userId).get();
            if (!userDoc.exists) return;
            
            const settings = userDoc.data();
            if (!settings || !settings.notificationsEnabled) return;
            
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const today = now.toISOString().split('T')[0];
            
            // Get last check time from localStorage
            const lastCheck = localStorage.getItem('lastReminderCheck');
            const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(0);
            
            // Check each reminder (1-5)
            for (let i = 1; i <= 5; i++) {
                const reminderKey = `reminder${i}`;
                const reminder = settings[reminderKey];
                
                if (!reminder || !reminder.enabled) continue;
                
                // Parse reminder time
                let reminderHour, reminderMinute;
                if (reminder.preset === 'custom' && reminder.custom) {
                    const [hour, minute] = reminder.custom.split(':');
                    reminderHour = parseInt(hour);
                    reminderMinute = parseInt(minute);
                } else if (reminder.preset) {
                    const [hour, minute] = reminder.preset.split(':');
                    reminderHour = parseInt(hour);
                    reminderMinute = parseInt(minute) || 0;
                } else {
                    continue;
                }
                
                const reminderTime = new Date(now);
                reminderTime.setHours(reminderHour, reminderMinute, 0, 0);
                
                // If reminder time is between last check and now (or just passed)
                const timeDiff = now - reminderTime;
                if (timeDiff >= 0 && timeDiff < REMINDER_WINDOW_MS && reminderTime > lastCheckDate) {
                    // Check if already sent today
                    const sentKey = `reminder_sent_${reminderHour}_${reminderMinute}`;
                    const sentToday = localStorage.getItem(sentKey);
                    
                    if (sentToday !== today) {
                        // Send reminder
                        const timeLabel = `${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(2, '0')}`;
                        const success = await this.sendEmailReminder(timeLabel);
                        
                        if (success) {
                            // Mark as sent
                            localStorage.setItem(sentKey, today);
                            console.log(`Reminder sent at ${timeLabel}`);
                        }
                    }
                }
            }
            
            // Update last check time
            localStorage.setItem('lastReminderCheck', now.toISOString());
        } catch (error) {
            console.error('Error checking scheduled reminders:', error);
        }
    }

    setupUserProfile() {
        // Display user email
        document.getElementById('user-email').textContent = this.userEmail;

        // Setup logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                AuthSystem.logout();
            }
        });
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                document.getElementById(`tab-${tabName}`).classList.add('active');
                
                // Trigger calendar render if calendar tab is opened
                if (tabName === 'calendar') {
                    this.renderCalendar();
                    this.updateMonthSummary();
                }
            });
        });
    }

    setupQuickAddButtons() {
        const quickAddButtons = document.querySelectorAll('.quick-add-btn:not(.custom)');
        const customBtn = document.getElementById('show-custom-btn');
        const customContainer = document.getElementById('custom-input-container');
        
        quickAddButtons.forEach(button => {
            button.addEventListener('click', () => {
                const amount = parseInt(button.dataset.amount);
                this.quickAddWater(amount);
            });
        });
        
        if (customBtn && customContainer) {
            customBtn.addEventListener('click', () => {
                const isVisible = customContainer.style.display !== 'none';
                customContainer.style.display = isVisible ? 'none' : 'block';
            });
        }
    }

    async quickAddWater(amount) {
        const dateKey = this.getDateKey(this.selectedDate);
        const currentData = this.data[dateKey] || { intake: 0, goal: this.defaultGoal };
        const newAmount = currentData.intake + amount;
        
        try {
            // Update local data immediately
            this.data[dateKey] = {
                intake: newAmount,
                goal: currentData.goal
            };
            
            // Save to Firestore
            await db.collection('users')
                .doc(this.userId)
                .collection('waterIntake')
                .doc(dateKey)
                .set({
                    date: dateKey,
                    intake: newAmount,
                    goal: currentData.goal,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            
            // Update display
            this.updateDisplay();
            this.renderCalendar();
            this.updateStatistics();
            this.updateMonthSummary();
            
            // Show success feedback
            this.showToast('success', 'Added!', `+${amount}ml added successfully`);
            
            // Check for goal achievement
            const percentage = (newAmount / currentData.goal) * 100;
            if (percentage >= 100 && (currentData.intake / currentData.goal * 100) < 100) {
                this.showConfetti();
                this.showToast('success', '🎉 Goal Achieved!', 'You reached your daily goal!');
            }
        } catch (error) {
            console.error('Error adding water:', error);
            this.showError('Failed to add water. Please check your connection.');
        }
    }

    async checkAndMigrateData() {
        // Check if there's localStorage data to migrate
        const localStorageKey = `waterIntakeData_${this.userEmail}`;
        const localData = localStorage.getItem(localStorageKey);
        
        if (localData) {
            try {
                const dataToMigrate = JSON.parse(localData);
                const entryCount = Object.keys(dataToMigrate).length;
                
                if (entryCount > 0) {
                    const shouldMigrate = confirm(
                        `Welcome! We found ${entryCount} day(s) of water intake data on this device.\n\n` +
                        'Would you like to sync this data to the cloud?\n\n' +
                        '• This will merge with any existing cloud data\n' +
                        '• Your data will be accessible from all your devices\n' +
                        '• Local data will be removed after successful sync\n\n' +
                        'Click OK to sync, or Cancel to start fresh.'
                    );
                    
                    if (shouldMigrate) {
                        try {
                            this.showLoading('Migrating data to cloud...');
                            await this.migrateToFirestore(dataToMigrate);
                            
                            // Clear localStorage after successful migration
                            localStorage.removeItem(localStorageKey);
                            
                            this.hideLoading();
                            this.showSuccess(`Successfully migrated ${entryCount} day(s) of data to cloud!`);
                        } catch (error) {
                            this.hideLoading();
                            console.error('Migration error:', error);
                            this.showError('Failed to migrate data. Your local data is safe and will remain on this device.');
                        }
                    } else {
                        // User chose not to migrate - keep localStorage data in case they change their mind
                        this.showInfo('You can export your local data using the Export feature if needed.');
                    }
                }
            } catch (error) {
                console.error('Error checking localStorage data:', error);
            }
        }
    }

    async migrateToFirestore(localData) {
        let batch = db.batch();
        let count = 0;
        
        for (const [dateKey, dayData] of Object.entries(localData)) {
            if (dayData.intake !== undefined) {
                const docRef = db.collection('users')
                    .doc(this.userId)
                    .collection('waterIntake')
                    .doc(dateKey);
                
                batch.set(docRef, {
                    date: dateKey,
                    intake: dayData.intake || 0,
                    goal: dayData.goal || this.defaultGoal,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                count++;
                
                // Firestore batch has a limit of 500 operations
                // Use 490 as safety margin
                if (count >= 490) {
                    await batch.commit();
                    batch = db.batch(); // Create new batch
                    count = 0;
                }
            }
        }
        
        // Commit any remaining operations
        if (count > 0) {
            await batch.commit();
        }
    }

    setupFirestoreListener() {
        // Clean up existing listener if any
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        // Listen to real-time updates from Firestore
        this.unsubscribe = db.collection('users')
            .doc(this.userId)
            .collection('waterIntake')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const data = change.doc.data();
                    const dateKey = change.doc.id;
                    
                    if (change.type === 'added' || change.type === 'modified') {
                        this.data[dateKey] = {
                            intake: data.intake || 0,
                            goal: data.goal || this.defaultGoal
                        };
                    } else if (change.type === 'removed') {
                        delete this.data[dateKey];
                    }
                });
                
                // Update UI after data changes
                this.updateDisplay();
                this.renderCalendar();
                this.updateStatistics();
            }, (error) => {
                console.error('Firestore listener error:', error);
                this.showError('Failed to sync data. Please check your connection.');
            });
    }

    showLoading(text = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.querySelector('.loading-text');
        if (overlay) {
            if (loadingText) loadingText.textContent = text;
            overlay.classList.add('show');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    showError(message) {
        this.showToast('error', 'Error', message);
    }

    showSuccess(message) {
        this.showToast('success', 'Success', message);
    }

    showInfo(message) {
        this.showToast('info', 'Info', message);
    }

    showToast(type, title, message) {
        const toast = document.getElementById('toast-notification');
        const icon = document.getElementById('toast-icon');
        const titleEl = document.getElementById('toast-title');
        const messageEl = document.getElementById('toast-message');
        const closeBtn = document.getElementById('toast-close');

        // Set icon based on type
        const icons = {
            error: '❌',
            success: '✅',
            info: 'ℹ️'
        };
        icon.textContent = icons[type] || 'ℹ️';

        // Set content
        titleEl.textContent = title;
        messageEl.textContent = message;

        // Set type class
        toast.className = 'toast-notification show ' + type;

        // Auto-hide after 5 seconds
        const hideTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);

        // Close button handler
        const closeHandler = () => {
            clearTimeout(hideTimeout);
            toast.classList.remove('show');
            closeBtn.removeEventListener('click', closeHandler);
        };
        closeBtn.addEventListener('click', closeHandler);
    }

    setupEventListeners() {
        // Date selector
        document.getElementById('selected-date').addEventListener('change', (e) => {
            const [year, month, day] = e.target.value.split('-');
            this.selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            this.updateDisplay();
        });

        // Save button
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveIntake();
        });

        // Goal input
        document.getElementById('daily-goal').addEventListener('change', (e) => {
            this.saveGoal(parseInt(e.target.value));
            this.updateDisplay();
        });

        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // CSV Export button
        document.getElementById('download-csv-btn').addEventListener('click', () => {
            this.downloadCSV();
        });
    }

    updateDateSelector() {
        const dateInput = document.getElementById('selected-date');
        const dateStr = this.formatDateForInput(this.selectedDate);
        dateInput.value = dateStr;
        dateInput.max = this.formatDateForInput(new Date());
    }

    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getDateKey(date) {
        return this.formatDateForInput(date);
    }

    async saveIntake() {
        const amount = parseInt(document.getElementById('water-amount').value) || 0;
        const goal = parseInt(document.getElementById('daily-goal').value) || this.defaultGoal;
        const dateKey = this.getDateKey(this.selectedDate);

        try {
            // Update local data immediately for responsiveness
            if (!this.data[dateKey]) {
                this.data[dateKey] = {};
            }
            this.data[dateKey].intake = amount;
            this.data[dateKey].goal = goal;

            // Save to Firestore
            await db.collection('users')
                .doc(this.userId)
                .collection('waterIntake')
                .doc(dateKey)
                .set({
                    date: dateKey,
                    intake: amount,
                    goal: goal,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

            // Show feedback
            this.showSaveFeedback();
        } catch (error) {
            console.error('Error saving intake:', error);
            this.showError('Failed to save data. Please check your connection.');
        }
    }

    async saveGoal(goal) {
        const dateKey = this.getDateKey(this.selectedDate);
        
        try {
            // Update local data immediately
            if (!this.data[dateKey]) {
                this.data[dateKey] = { intake: 0 };
            }
            this.data[dateKey].goal = goal;

            // Save to Firestore
            await db.collection('users')
                .doc(this.userId)
                .collection('waterIntake')
                .doc(dateKey)
                .set({
                    date: dateKey,
                    intake: this.data[dateKey].intake || 0,
                    goal: goal,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
        } catch (error) {
            console.error('Error saving goal:', error);
            this.showError('Failed to save goal. Please check your connection.');
        }
    }

    showSaveFeedback() {
        const btn = document.getElementById('save-btn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved!';
        btn.style.background = '#28a745';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 1500);
    }

    getCreatureForDate(date) {
        const dayOfYear = this.getDayOfYear(date);
        const index = dayOfYear % this.creatures.length;
        return this.creatures[index];
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    updateDisplay() {
        try {
            const dateKey = this.getDateKey(this.selectedDate);
            const dayData = this.data[dateKey] || { intake: 0, goal: this.defaultGoal };
            const intake = dayData.intake || 0;
            const goal = dayData.goal || this.defaultGoal;
            const percentage = Math.round((intake / goal) * 100);

            // Update form fields with null checks
            const waterAmountEl = document.getElementById('water-amount');
            const dailyGoalEl = document.getElementById('daily-goal');
            const currentIntakeEl = document.getElementById('current-intake');
            const goalDisplayEl = document.getElementById('goal-display');
            const percentageDisplayEl = document.getElementById('percentage-display');
            
            if (waterAmountEl) waterAmountEl.value = intake;
            if (dailyGoalEl) dailyGoalEl.value = goal;
            if (currentIntakeEl) currentIntakeEl.textContent = intake;
            if (goalDisplayEl) goalDisplayEl.textContent = goal;
            if (percentageDisplayEl) percentageDisplayEl.textContent = percentage;

            // Update circular progress
            this.updateCircularProgress(percentage);
            
            // Update remaining intake
            const remaining = Math.max(0, goal - intake);
            const remainingEl = document.getElementById('remaining-intake');
            if (remainingEl) {
                remainingEl.textContent = remaining;
            }
            
            // Show confetti if goal reached
            if (percentage >= 100 && this.previousPercentage < 100) {
                this.showConfetti();
            }
            this.previousPercentage = percentage;

            // Update creature display
            const creature = this.getCreatureForDate(this.selectedDate);
            const isToday = this.selectedDate.toDateString() === new Date().toDateString();
            const companionText = isToday ? "Today's companion" : "Day's companion";
            
            const creatureNameEl = document.getElementById('creature-name');
            if (creatureNameEl) {
                creatureNameEl.textContent = `${companionText}: ${creature.name}`;
            }
            
            const creatureDisplay = document.getElementById('creature-display');
            if (creatureDisplay) {
                creatureDisplay.innerHTML = `<span>${creature.emoji}</span>`;
                // Set fill height based on percentage
                creatureDisplay.style.setProperty('--fill-height', `${percentage}%`);
            }

            // Update fill bar
            const fillBar = document.getElementById('fill-bar');
            if (fillBar) {
                fillBar.style.width = `${percentage}%`;
                if (percentage > 10) {
                    fillBar.textContent = `${percentage}%`;
                } else {
                    fillBar.textContent = '';
                }
            }
        } catch (error) {
            console.error('Error updating display:', error);
        }
    }

    updateCircularProgress(percentage) {
        const circle = document.getElementById('progress-circle');
        if (circle) {
            const radius = 52;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (percentage / 100) * circumference;
            circle.style.strokeDashoffset = offset;
            
            // Change color based on percentage
            if (percentage >= 100) {
                circle.style.stroke = '#28a745';
            } else if (percentage >= 75) {
                circle.style.stroke = 'url(#progressGradient)';
            } else if (percentage >= 50) {
                circle.style.stroke = '#ffc107';
            } else {
                circle.style.stroke = '#dc3545';
            }
        }
    }

    showConfetti() {
        const emojis = ['💧', '🌊', '💙', '✨', '⭐'];
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), 3000);
            }, i * 50);
        }
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }

        // Add days of month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = this.getDateKey(date);
            const dayData = this.data[dateKey];

            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';

            // Check if it's today
            if (date.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }

            // Check if it's selected date
            if (date.toDateString() === this.selectedDate.toDateString()) {
                dayElement.classList.add('selected');
            }

            // Add color based on intake level
            if (dayData && dayData.intake > 0) {
                const percentage = (dayData.intake / (dayData.goal || this.defaultGoal)) * 100;
                if (percentage >= 100) {
                    dayElement.classList.add('level-100');
                } else if (percentage >= 75) {
                    dayElement.classList.add('level-75');
                } else if (percentage >= 50) {
                    dayElement.classList.add('level-50');
                } else if (percentage >= 25) {
                    dayElement.classList.add('level-25');
                } else {
                    dayElement.classList.add('level-0');
                }
            }

            dayElement.innerHTML = `
                <div class="date-num">${day}</div>
                ${dayData ? `<div class="intake-indicator">${dayData.intake}ml</div>` : ''}
            `;

            // Only allow clicking on dates up to today
            if (date <= today) {
                dayElement.addEventListener('click', () => {
                    this.selectedDate = new Date(date);
                    this.updateDateSelector();
                    this.updateDisplay();
                    this.renderCalendar();
                });
            } else {
                dayElement.style.opacity = '0.5';
                dayElement.style.cursor = 'not-allowed';
            }

            calendarGrid.appendChild(dayElement);
        }
        
        // Update month summary
        this.updateMonthSummary();
    }

    calculateStatistics() {
        const stats = {
            level_100: 0,
            level_75: 0,
            level_50: 0,
            level_25: 0,
            level_0: 0,
            total: 0
        };

        Object.keys(this.data).forEach(dateKey => {
            const dayData = this.data[dateKey];
            if (dayData && dayData.intake > 0) {
                stats.total++;
                const percentage = (dayData.intake / (dayData.goal || this.defaultGoal)) * 100;
                if (percentage >= 100) {
                    stats.level_100++;
                } else if (percentage >= 75) {
                    stats.level_75++;
                } else if (percentage >= 50) {
                    stats.level_50++;
                } else if (percentage >= 25) {
                    stats.level_25++;
                } else {
                    stats.level_0++;
                }
            }
        });

        return stats;
    }

    updateStatBars() {
        const stats = this.calculateStatistics();
        const total = stats.total || 1; // Avoid division by zero
        
        ['100', '75', '50', '25', '0'].forEach(level => {
            const bar = document.getElementById(`bar-${level}`);
            const count = stats[`level_${level}`] || 0;
            const percentage = (count / total) * 100;
            if (bar) {
                setTimeout(() => {
                    bar.style.width = `${percentage}%`;
                }, 100);
            }
        });
    }

    calculateStreak() {
        const dates = Object.keys(this.data).sort().reverse();
        let streak = 0;
        let currentDate = new Date();
        
        for (let i = 0; i < dates.length; i++) {
            const dateStr = this.getDateKey(currentDate);
            if (dates.includes(dateStr)) {
                const dayData = this.data[dateStr];
                const percentage = (dayData.intake / (dayData.goal || this.defaultGoal)) * 100;
                if (percentage >= 100) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        return streak;
    }

    updateStatistics() {
        const stats = this.calculateStatistics();
        
        // Update stat values
        document.getElementById('stat-100').textContent = stats.level_100 || 0;
        document.getElementById('stat-75').textContent = stats.level_75 || 0;
        document.getElementById('stat-50').textContent = stats.level_50 || 0;
        document.getElementById('stat-25').textContent = stats.level_25 || 0;
        document.getElementById('stat-0').textContent = stats.level_0 || 0;
        
        // Update stat bars
        this.updateStatBars();
        
        // Update streak and total
        const streak = this.calculateStreak();
        const streakEl = document.getElementById('current-streak');
        const totalEl = document.getElementById('total-tracked-days');
        if (streakEl) {
            streakEl.textContent = streak;
        }
        if (totalEl) {
            totalEl.textContent = stats.total || 0;
        }
    }

    initializeExportDates() {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        document.getElementById('export-start-date').value = this.formatDateForInput(thirtyDaysAgo);
        document.getElementById('export-end-date').value = this.formatDateForInput(today);
        document.getElementById('export-end-date').max = this.formatDateForInput(today);
    }

    downloadCSV() {
        let startDate = document.getElementById('export-start-date').value;
        let endDate = document.getElementById('export-end-date').value;
        
        // If no dates are selected, use defaults (30 days ago to today)
        if (!startDate || !endDate) {
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            startDate = this.formatDateForInput(thirtyDaysAgo);
            endDate = this.formatDateForInput(today);
        }
        
        // If start date is after end date, swap them
        if (startDate > endDate) {
            [startDate, endDate] = [endDate, startDate];
            document.getElementById('export-start-date').value = startDate;
            document.getElementById('export-end-date').value = endDate;
        }
        
        // Filter data based on date range
        const filteredData = this.filterDataByDateRange(startDate, endDate);
        
        // Check if there's any data in the selected range
        if (filteredData.length === 0) {
            alert('No data available in the selected date range.');
            return;
        }
        
        // Generate CSV content
        const csvContent = this.generateCSV(filteredData);
        
        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `water-intake-${startDate}-to-${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show feedback
        this.showExportFeedback();
    }

    filterDataByDateRange(startDate, endDate) {
        const filtered = [];
        
        for (const dateKey in this.data) {
            if (dateKey >= startDate && dateKey <= endDate) {
                const dayData = this.data[dateKey];
                const intake = dayData.intake || 0;
                const goal = dayData.goal || this.defaultGoal;
                const percentage = Math.round((intake / goal) * 100);
                
                filtered.push({
                    date: dateKey,
                    intake: intake,
                    goal: goal,
                    percentage: percentage
                });
            }
        }
        
        // Sort by date
        filtered.sort((a, b) => a.date.localeCompare(b.date));
        
        return filtered;
    }

    generateCSV(data) {
        // CSV header
        let csv = 'Date,Water Intake (ml),Daily Goal (ml),Percentage\n';
        
        // Add data rows
        data.forEach(row => {
            // Escape CSV values (though our data is unlikely to have special chars)
            const date = this.escapeCSV(row.date);
            const intake = row.intake;
            const goal = row.goal;
            const percentage = `${row.percentage}%`;
            csv += `${date},${intake},${goal},${percentage}\n`;
        });
        
        return csv;
    }

    /**
     * Escapes a value for safe inclusion in CSV format.
     * Wraps values containing commas, quotes, or newlines in double quotes,
     * and escapes any existing quotes by doubling them.
     * 
     * @param {*} value - The value to escape
     * @returns {string} The escaped CSV value
     */
    escapeCSV(value) {
        // Convert to string
        const str = String(value);
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    showExportFeedback() {
        const btn = document.getElementById('download-csv-btn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Downloaded!';
        btn.classList.add('success-feedback');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('success-feedback');
        }, 2000);
    }

    calculateMonthSummary() {
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        
        let totalDays = 0;
        let goalMetDays = 0;
        
        Object.keys(this.data).forEach(dateStr => {
            const date = new Date(dateStr);
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                totalDays++;
                const dayData = this.data[dateStr];
                const percentage = (dayData.intake / dayData.goal) * 100;
                if (percentage >= 100) {
                    goalMetDays++;
                }
            }
        });
        
        return { totalDays, goalMetDays };
    }

    updateMonthSummary() {
        const summary = this.calculateMonthSummary();
        const totalEl = document.getElementById('month-total-days');
        const goalMetEl = document.getElementById('month-goal-met');
        
        if (totalEl) totalEl.textContent = summary.totalDays;
        if (goalMetEl) goalMetEl.textContent = summary.goalMetDays;
    }

    // Settings functionality
    async initializeSettings() {
        await this.loadUserSettings();
        this.setupSettingsEventListeners();
        this.setupReminderPickers();
        this.populateTimezones();
    }

    populateTimezones() {
        const timezones = [
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'America/Phoenix',
            'America/Anchorage',
            'Pacific/Honolulu',
            'Europe/London',
            'Europe/Paris',
            'Europe/Berlin',
            'Asia/Dubai',
            'Asia/Kolkata',
            'Asia/Bangkok',
            'Asia/Shanghai',
            'Asia/Tokyo',
            'Australia/Sydney',
            'Pacific/Auckland'
        ];

        const select = document.getElementById('user-timezone');
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        timezones.forEach(tz => {
            const option = document.createElement('option');
            option.value = tz;
            option.textContent = tz.replace(/_/g, ' ');
            if (tz === userTimezone) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        // Add user's timezone if not in list
        if (!timezones.includes(userTimezone)) {
            const option = document.createElement('option');
            option.value = userTimezone;
            option.textContent = userTimezone.replace(/_/g, ' ');
            option.selected = true;
            select.insertBefore(option, select.firstChild);
        }
    }

    setupSettingsEventListeners() {
        // Email notifications toggle
        const emailToggle = document.getElementById('email-notifications-enabled');
        const notificationSettings = document.getElementById('notification-settings');
        
        emailToggle.addEventListener('change', (e) => {
            notificationSettings.style.display = e.target.checked ? 'block' : 'none';
        });

        // Save notification settings
        document.getElementById('save-settings-btn').addEventListener('click', () => {
            this.saveUserSettings();
        });

        // Save account settings
        document.getElementById('save-account-settings-btn').addEventListener('click', () => {
            this.saveAccountSettings();
        });

        // Display user email in settings
        document.getElementById('settings-user-email').textContent = this.userEmail;
        
        // Admin config save button
        const saveAdminBtn = document.getElementById('save-admin-config-btn');
        if (saveAdminBtn) {
            saveAdminBtn.addEventListener('click', () => {
                this.saveAdminConfig();
            });
        }
        
        // Test email button
        const testEmailBtn = document.getElementById('send-test-email-btn');
        if (testEmailBtn) {
            testEmailBtn.addEventListener('click', () => {
                this.sendTestEmail();
            });
        }

        // Power user unlock button
        const unlockBtn = document.getElementById('unlock-power-user-btn');
        if (unlockBtn) {
            unlockBtn.addEventListener('click', () => {
                this.unlockPowerUser();
            });
        }

        // Allow Enter key to unlock
        const codeInput = document.getElementById('power-user-code-input');
        if (codeInput) {
            codeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.unlockPowerUser();
                }
            });
        }
        
        // Save EmailJS configuration button (backward compatibility for old UI)
        const saveConfigBtn = document.getElementById('save-emailjs-config');
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', () => {
                this.saveEmailJSConfig();
            });
        }
        
        // Load EmailJS configuration (backward compatibility)
        this.loadEmailJSConfig();
    }

    async loadUserSettings() {
        try {
            const userDoc = await db.collection('users').doc(this.userId).get();
            
            if (userDoc.exists) {
                const settings = userDoc.data();
                
                // Check power user status
                const isPowerUser = settings.powerUserVerified || false;
                this.showPowerUserStatus(isPowerUser);
                
                if (isPowerUser) {
                    // Load notification settings
                    document.getElementById('email-notifications-enabled').checked = settings.notificationsEnabled || false;
                    document.getElementById('notification-settings').style.display = settings.notificationsEnabled ? 'block' : 'none';
                    
                    // Load 5 reminder slots
                    for (let i = 1; i <= 5; i++) {
                        const reminderKey = `reminder${i}`;
                        const reminder = settings[reminderKey];
                        
                        if (reminder) {
                            document.getElementById(`reminder-${i}-enabled`).checked = reminder.enabled || false;
                            
                            if (reminder.preset && reminder.preset !== 'custom') {
                                document.getElementById(`reminder-${i}-preset`).value = reminder.preset;
                                document.getElementById(`reminder-${i}-custom`).disabled = true;
                            } else if (reminder.custom) {
                                document.getElementById(`reminder-${i}-preset`).value = 'custom';
                                document.getElementById(`reminder-${i}-custom`).value = reminder.custom;
                                document.getElementById(`reminder-${i}-custom`).disabled = false;
                            }
                            
                            // Update slot appearance
                            this.updateReminderSlot(i);
                        }
                    }
                    
                    if (settings.timezone) {
                        document.getElementById('user-timezone').value = settings.timezone;
                    }
                }
                
                // Load account settings
                if (settings.defaultDailyGoal) {
                    document.getElementById('daily-goal-setting').value = settings.defaultDailyGoal;
                }
            } else {
                // New user - show power user lock
                this.showPowerUserStatus(false);
            }
            
            // Set test email address
            const testEmailEl = document.getElementById('test-email-address');
            if (testEmailEl) {
                testEmailEl.textContent = this.userEmail;
            }
        } catch (error) {
            console.error('Error loading user settings:', error);
            this.showPowerUserStatus(false);
        }
    }

    async saveUserSettings() {
        try {
            const settings = {
                notificationsEnabled: document.getElementById('email-notifications-enabled').checked,
                timezone: document.getElementById('user-timezone').value,
                email: this.userEmail,
                userId: this.userId,
                updatedAt: new Date()
            };

            // Save all 5 reminder slots
            for (let i = 1; i <= 5; i++) {
                const enabled = document.getElementById(`reminder-${i}-enabled`).checked;
                const preset = document.getElementById(`reminder-${i}-preset`).value;
                const custom = document.getElementById(`reminder-${i}-custom`).value;
                
                settings[`reminder${i}`] = {
                    enabled: enabled,
                    preset: preset === 'custom' ? 'custom' : preset,
                    custom: preset === 'custom' ? custom : ''
                };
            }

            await db.collection('users').doc(this.userId).set(settings, { merge: true });
            
            this.showSuccess('Notification settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showError('Failed to save settings. Please try again.');
        }
    }

    async saveAccountSettings() {
        try {
            const defaultGoal = parseInt(document.getElementById('daily-goal-setting').value);
            
            await db.collection('users').doc(this.userId).set({
                defaultDailyGoal: defaultGoal,
                updatedAt: new Date()
            }, { merge: true });
            
            // Update current goal
            document.getElementById('daily-goal').value = defaultGoal;
            this.defaultGoal = defaultGoal;
            
            this.showSuccess('Account settings saved successfully!');
        } catch (error) {
            console.error('Error saving account settings:', error);
            this.showError('Failed to save account settings. Please try again.');
        }
    }

    // Send test email
    async sendTestEmail() {
        const btn = document.getElementById('send-test-email-btn');
        const messageEl = document.getElementById('test-message');
        const originalText = btn.innerHTML;
        
        // Show loading state
        btn.disabled = true;
        btn.innerHTML = '⏳ Sending...';
        if (messageEl) {
            messageEl.style.display = 'none';
        }
        
        try {
            // Check if EmailJS is configured (Firestore or localStorage)
            const config = this.emailConfig || this.getEmailJSConfig();
            if (!config || !config.serviceId || !config.templateId || !config.publicKey) {
                this.showTestMessage('❌ Please configure EmailJS settings first', 'error');
                return;
            }
            
            // Check if email system is enabled (for Firestore config)
            if (this.emailConfig && !this.emailConfig.enabled) {
                this.showTestMessage('❌ Email system is currently disabled by administrator', 'error');
                return;
            }
            
            // Send test email
            const success = await this.sendEmailReminder('TEST');
            
            if (success) {
                this.showTestMessage(
                    '✅ Test email sent successfully! Check your inbox (and spam folder).',
                    'success'
                );
            } else {
                this.showTestMessage(
                    '❌ Failed to send test email. Please check your EmailJS configuration.',
                    'error'
                );
            }
            
        } catch (error) {
            console.error('Test email error:', error);
            this.showTestMessage(`❌ Error: ${error.message}`, 'error');
            
        } finally {
            // Restore button state
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    showTestMessage(message, type) {
        const messageEl = document.getElementById('test-message');
        messageEl.textContent = message;
        messageEl.className = `test-message ${type}`;
        messageEl.style.display = 'block';
        
        // Auto-hide after configured timeout
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, TEST_MESSAGE_TIMEOUT_MS);
    }

    // Power User Unlock Methods
    async unlockPowerUser() {
        const codeInput = document.getElementById('power-user-code-input');
        const unlockBtn = document.getElementById('unlock-power-user-btn');
        const messageEl = document.getElementById('unlock-message');
        const code = codeInput.value.trim();

        if (!code) {
            this.showUnlockMessage('Please enter an access code', 'error');
            return;
        }

        // Show loading state
        unlockBtn.disabled = true;
        unlockBtn.textContent = '⏳ Verifying...';
        messageEl.style.display = 'none';

        try {
            // Verify code against constant (frontend verification)
            if (code === POWER_USER_CODE) {
                // Save power user status to Firestore
                await db.collection('users').doc(this.userId).set({
                    powerUserVerified: true,
                    powerUserUnlockedAt: new Date()
                }, { merge: true });

                // Show success and update UI
                this.showUnlockMessage('✅ Access granted! You are now a power user.', 'success');
                
                setTimeout(() => {
                    this.showPowerUserStatus(true);
                    this.showSuccess('Power user features unlocked!');
                }, 1500);
            } else {
                this.showUnlockMessage('❌ Invalid access code. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Power user unlock error:', error);
            this.showUnlockMessage('❌ Failed to verify code. Please try again.', 'error');
        } finally {
            // Restore button state
            unlockBtn.disabled = false;
            unlockBtn.textContent = '🔓 Unlock';
            codeInput.value = '';
        }
    }
    
    saveEmailJSConfig() {
        const serviceId = document.getElementById('emailjs-service-id').value.trim();
        const templateId = document.getElementById('emailjs-template-id').value.trim();
        const publicKey = document.getElementById('emailjs-public-key').value.trim();
        
        if (!serviceId || !templateId || !publicKey) {
            this.showConfigMessage('Please fill in all configuration fields', 'error');
            return;
        }
        
        const config = {
            serviceId: serviceId,
            templateId: templateId,
            publicKey: publicKey
        };
        
        try {
            localStorage.setItem('emailjs_config', JSON.stringify(config));
            
            // Initialize EmailJS with new config
            this.initializeEmailJS();
            
            this.showConfigMessage('✅ EmailJS configuration saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save EmailJS config:', error);
            this.showConfigMessage('❌ Failed to save configuration', 'error');
        }
    }
    
    loadEmailJSConfig() {
        const config = this.getEmailJSConfig();
        if (config) {
            if (config.serviceId) {
                document.getElementById('emailjs-service-id').value = config.serviceId;
            }
            if (config.templateId) {
                document.getElementById('emailjs-template-id').value = config.templateId;
            }
            if (config.publicKey) {
                document.getElementById('emailjs-public-key').value = config.publicKey;
            }
        }
    }
    
    showConfigMessage(message, type) {
        const messageEl = document.getElementById('config-message');
        messageEl.textContent = message;
        messageEl.className = `config-message ${type}`;
        
        // Auto-hide after configured timeout
        setTimeout(() => {
            messageEl.className = 'config-message';
        }, CONFIG_MESSAGE_TIMEOUT_MS);
    }

    showUnlockMessage(message, type) {
        const messageEl = document.getElementById('unlock-message');
        messageEl.textContent = message;
        messageEl.className = `unlock-message ${type}`;
        messageEl.style.display = 'block';
    }

    showPowerUserStatus(isPowerUser) {
        const lockSection = document.getElementById('power-user-lock');
        const unlockedSection = document.getElementById('power-user-unlocked');
        const emailSettingsCard = document.getElementById('email-settings-card');

        if (isPowerUser) {
            lockSection.style.display = 'none';
            unlockedSection.style.display = 'block';
            emailSettingsCard.style.display = 'block';
        } else {
            lockSection.style.display = 'block';
            unlockedSection.style.display = 'none';
            emailSettingsCard.style.display = 'none';
        }
    }

    // Setup reminder picker event listeners
    setupReminderPickers() {
        for (let i = 1; i <= 5; i++) {
            const enabledCheckbox = document.getElementById(`reminder-${i}-enabled`);
            const presetSelect = document.getElementById(`reminder-${i}-preset`);
            const customInput = document.getElementById(`reminder-${i}-custom`);

            // Handle enable/disable
            enabledCheckbox.addEventListener('change', () => {
                this.updateReminderSlot(i);
            });

            // Handle preset selection
            presetSelect.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customInput.disabled = false;
                    customInput.focus();
                } else {
                    customInput.disabled = true;
                    customInput.value = '';
                }
            });
        }
    }

    updateReminderSlot(slotNumber) {
        const slot = document.getElementById(`reminder-slot-${slotNumber}`);
        const enabled = document.getElementById(`reminder-${slotNumber}-enabled`).checked;
        const presetSelect = document.getElementById(`reminder-${slotNumber}-preset`);
        const customInput = document.getElementById(`reminder-${slotNumber}-custom`);

        if (enabled) {
            slot.classList.remove('disabled');
            presetSelect.disabled = false;
            if (presetSelect.value === 'custom') {
                customInput.disabled = false;
            }
        } else {
            slot.classList.add('disabled');
            presetSelect.disabled = true;
            customInput.disabled = true;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WaterIntakeTracker();
});
