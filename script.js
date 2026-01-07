// Water Intake Tracker Application
class WaterIntakeTracker {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.defaultGoal = 2000;
        this.data = {};
        this.unsubscribe = null; // For Firestore listener cleanup
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

    init() {
        this.setupUserProfile();
        this.setupEventListeners();
        this.updateDateSelector();
        this.updateDisplay();
        this.renderCalendar();
        this.updateStatistics();
        this.initializeExportDates();
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

    async checkAndMigrateData() {
        // Check if there's localStorage data to migrate
        const localStorageKey = `waterIntakeData_${this.userEmail}`;
        const localData = localStorage.getItem(localStorageKey);
        
        if (localData) {
            const shouldMigrate = confirm(
                'We found existing data on this device. Would you like to sync it to the cloud? ' +
                'This will merge it with any existing cloud data.'
            );
            
            if (shouldMigrate) {
                try {
                    this.showLoading('Migrating data to cloud...');
                    const dataToMigrate = JSON.parse(localData);
                    await this.migrateToFirestore(dataToMigrate);
                    
                    // Clear localStorage after successful migration
                    localStorage.removeItem(localStorageKey);
                    
                    this.hideLoading();
                    alert('Data successfully migrated to cloud!');
                } catch (error) {
                    this.hideLoading();
                    console.error('Migration error:', error);
                    alert('Failed to migrate data. Your local data is safe and will remain on this device.');
                }
            }
        }
    }

    async migrateToFirestore(localData) {
        const batch = db.batch();
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
                if (count >= 500) {
                    await batch.commit();
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
        // Simple error display - you can enhance this
        alert(message);
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
        const dateKey = this.getDateKey(this.selectedDate);
        const dayData = this.data[dateKey] || { intake: 0, goal: this.defaultGoal };
        const intake = dayData.intake || 0;
        const goal = dayData.goal || this.defaultGoal;
        const percentage = Math.round((intake / goal) * 100);

        // Update form fields
        document.getElementById('water-amount').value = intake;
        document.getElementById('daily-goal').value = goal;
        document.getElementById('current-intake').textContent = intake;
        document.getElementById('goal-display').textContent = goal;
        document.getElementById('percentage-display').textContent = percentage;

        // Update creature display
        const creature = this.getCreatureForDate(this.selectedDate);
        const isToday = this.selectedDate.toDateString() === new Date().toDateString();
        const companionText = isToday ? "Today's companion" : "Day's companion";
        document.getElementById('creature-name').textContent = `${companionText}: ${creature.name}`;
        
        const creatureDisplay = document.getElementById('creature-display');
        creatureDisplay.innerHTML = `<span>${creature.emoji}</span>`;
        
        // Set fill height based on percentage
        creatureDisplay.style.setProperty('--fill-height', `${percentage}%`);

        // Update fill bar
        const fillBar = document.getElementById('fill-bar');
        fillBar.style.width = `${percentage}%`;
        if (percentage > 10) {
            fillBar.textContent = `${percentage}%`;
        } else {
            fillBar.textContent = '';
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
    }

    updateStatistics() {
        const stats = {
            level100: 0,
            level75: 0,
            level50: 0,
            level25: 0,
            level0: 0
        };

        Object.keys(this.data).forEach(dateKey => {
            const dayData = this.data[dateKey];
            if (dayData && dayData.intake > 0) {
                const percentage = (dayData.intake / (dayData.goal || this.defaultGoal)) * 100;
                if (percentage >= 100) {
                    stats.level100++;
                } else if (percentage >= 75) {
                    stats.level75++;
                } else if (percentage >= 50) {
                    stats.level50++;
                } else if (percentage >= 25) {
                    stats.level25++;
                } else {
                    stats.level0++;
                }
            }
        });

        document.getElementById('stat-100').textContent = stats.level100;
        document.getElementById('stat-75').textContent = stats.level75;
        document.getElementById('stat-50').textContent = stats.level50;
        document.getElementById('stat-25').textContent = stats.level25;
        document.getElementById('stat-0').textContent = stats.level0;
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WaterIntakeTracker();
});
