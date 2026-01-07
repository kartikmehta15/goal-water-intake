// Water Intake Tracker - Main JavaScript

// Array of creatures (animals, trees, etc.) for visual representation
const creatures = [
    { name: "🌱 Sprouting Seedling", icon: "🌱" },
    { name: "🌿 Growing Plant", icon: "🌿" },
    { name: "🌳 Mighty Tree", icon: "🌳" },
    { name: "🐠 Colorful Fish", icon: "🐠" },
    { name: "🐳 Happy Whale", icon: "🐳" },
    { name: "🐢 Sea Turtle", icon: "🐢" },
    { name: "🦋 Beautiful Butterfly", icon: "🦋" },
    { name: "🌸 Cherry Blossom", icon: "🌸" },
    { name: "🌻 Sunflower", icon: "🌻" },
    { name: "🌺 Hibiscus", icon: "🌺" },
    { name: "🦎 Lizard", icon: "🦎" },
    { name: "🐸 Happy Frog", icon: "🐸" },
    { name: "🦆 Duck", icon: "🦆" },
    { name: "🦢 Swan", icon: "🦢" },
    { name: "🐙 Octopus", icon: "🐙" },
    { name: "🦈 Shark", icon: "🦈" },
    { name: "🌵 Cactus", icon: "🌵" },
    { name: "🍀 Four Leaf Clover", icon: "🍀" },
    { name: "🌴 Palm Tree", icon: "🌴" },
    { name: "🌾 Rice Plant", icon: "🌾" },
    { name: "🦩 Flamingo", icon: "🦩" },
    { name: "🦚 Peacock", icon: "🦚" },
    { name: "🌹 Rose", icon: "🌹" },
    { name: "🥀 Wilted Flower", icon: "🥀" },
    { name: "🦔 Hedgehog", icon: "🦔" },
    { name: "🐌 Snail", icon: "🐌" },
    { name: "🦎 Gecko", icon: "🦎" },
    { name: "🐊 Crocodile", icon: "🐊" },
    { name: "🦕 Dinosaur", icon: "🦕" },
    { name: "🐛 Caterpillar", icon: "🐛" },
    { name: "🐝 Bee", icon: "🐝" }
];

// Data storage
let waterData = {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeForm();
    updateVisualDisplay();
    updateCalendar();
    updateStatistics();
    setupEventListeners();
    setTodayAsDefault();
});

// Load data from localStorage
function loadData() {
    const storedData = localStorage.getItem('waterIntakeData');
    if (storedData) {
        waterData = JSON.parse(storedData);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('waterIntakeData', JSON.stringify(waterData));
}

// Set today's date as default
function setTodayAsDefault() {
    const today = new Date();
    const dateInput = document.getElementById('date');
    dateInput.value = formatDateForInput(today);
    dateInput.max = formatDateForInput(today); // Prevent future dates
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for storage (YYYY-MM-DD)
function formatDateKey(date) {
    return formatDateForInput(date);
}

// Initialize form
function initializeForm() {
    const form = document.getElementById('waterForm');
    form.addEventListener('submit', handleFormSubmit);
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const dateInput = document.getElementById('date').value;
    const amount = parseInt(document.getElementById('amount').value);
    const goal = parseInt(document.getElementById('goal').value);
    
    if (!dateInput || isNaN(amount) || isNaN(goal)) {
        alert('Please fill in all fields correctly.');
        return;
    }
    
    // Store the data
    waterData[dateInput] = { amount, goal };
    saveData();
    
    // Update UI
    updateVisualDisplay();
    updateCalendar();
    updateStatistics();
    
    // Reset form
    document.getElementById('amount').value = '';
    
    alert('Water intake saved successfully!');
}

// Get creature for a specific date
function getCreatureForDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    return creatures[dayOfYear % creatures.length];
}

// Update visual display for today
function updateVisualDisplay() {
    const today = formatDateForInput(new Date());
    const todayData = waterData[today];
    
    const creature = getCreatureForDate(today);
    document.getElementById('creatureName').textContent = creature.name;
    document.getElementById('creatureIcon').textContent = creature.icon;
    
    if (todayData) {
        const percentage = Math.min(100, Math.round((todayData.amount / todayData.goal) * 100));
        document.getElementById('progressBar').style.width = percentage + '%';
        document.getElementById('progressText').textContent = percentage + '%';
    } else {
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressText').textContent = '0%';
    }
}

// Update calendar
function updateCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const numDays = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendar.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= numDays; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateKey = formatDateKey(date);
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if it's today
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Add creature icon and percentage if data exists
        if (waterData[dateKey]) {
            const data = waterData[dateKey];
            const percentage = Math.round((data.amount / data.goal) * 100);
            
            // Add creature icon
            const creature = getCreatureForDate(dateKey);
            const icon = document.createElement('div');
            icon.className = 'day-icon';
            icon.textContent = creature.icon;
            // Scale icon based on percentage (opacity)
            icon.style.opacity = Math.min(1, percentage / 100);
            dayElement.appendChild(icon);
            
            // Add percentage
            const percentageDiv = document.createElement('div');
            percentageDiv.className = 'day-percentage';
            percentageDiv.textContent = `${percentage}%`;
            dayElement.appendChild(percentageDiv);
            
            // Add achievement class
            if (percentage >= 100) {
                dayElement.classList.add('achievement-100');
            } else if (percentage >= 75) {
                dayElement.classList.add('achievement-75');
            } else if (percentage >= 50) {
                dayElement.classList.add('achievement-50');
            } else if (percentage >= 25) {
                dayElement.classList.add('achievement-25');
            } else {
                dayElement.classList.add('achievement-0');
            }
        }
        
        // Add click handler to edit entry
        dayElement.addEventListener('click', () => {
            openEditModal(dateKey);
        });
        
        calendar.appendChild(dayElement);
    }
}

// Update statistics
function updateStatistics() {
    let stat100 = 0, stat75 = 0, stat50 = 0, stat25 = 0, stat0 = 0;
    
    for (const dateKey in waterData) {
        const data = waterData[dateKey];
        const percentage = (data.amount / data.goal) * 100;
        
        if (percentage >= 100) {
            stat100++;
        } else if (percentage >= 75) {
            stat75++;
        } else if (percentage >= 50) {
            stat50++;
        } else if (percentage >= 25) {
            stat25++;
        } else {
            stat0++;
        }
    }
    
    document.getElementById('stat100').textContent = stat100;
    document.getElementById('stat75').textContent = stat75;
    document.getElementById('stat50').textContent = stat50;
    document.getElementById('stat25').textContent = stat25;
    document.getElementById('stat0').textContent = stat0;
}

// Setup event listeners
function setupEventListeners() {
    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendar();
    });
    
    // Export to CSV
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    
    // Modal
    const modal = document.getElementById('editModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Edit form
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    document.getElementById('deleteBtn').addEventListener('click', handleDelete);
}

// Open edit modal
function openEditModal(dateKey) {
    const modal = document.getElementById('editModal');
    const data = waterData[dateKey];
    
    document.getElementById('editDate').value = dateKey;
    
    if (data) {
        document.getElementById('editAmount').value = data.amount;
        document.getElementById('editGoal').value = data.goal;
    } else {
        document.getElementById('editAmount').value = '';
        document.getElementById('editGoal').value = '2000';
    }
    
    modal.style.display = 'block';
}

// Handle edit form submission
function handleEditSubmit(e) {
    e.preventDefault();
    
    const dateKey = document.getElementById('editDate').value;
    const amount = parseInt(document.getElementById('editAmount').value);
    const goal = parseInt(document.getElementById('editGoal').value);
    
    if (isNaN(amount) || isNaN(goal)) {
        alert('Please enter valid numbers.');
        return;
    }
    
    waterData[dateKey] = { amount, goal };
    saveData();
    
    // Update UI
    updateVisualDisplay();
    updateCalendar();
    updateStatistics();
    
    // Close modal
    document.getElementById('editModal').style.display = 'none';
    
    alert('Entry updated successfully!');
}

// Handle delete
function handleDelete() {
    const dateKey = document.getElementById('editDate').value;
    
    if (confirm('Are you sure you want to delete this entry?')) {
        delete waterData[dateKey];
        saveData();
        
        // Update UI
        updateVisualDisplay();
        updateCalendar();
        updateStatistics();
        
        // Close modal
        document.getElementById('editModal').style.display = 'none';
        
        alert('Entry deleted successfully!');
    }
}

// Export to CSV
function exportToCSV() {
    if (Object.keys(waterData).length === 0) {
        alert('No data to export!');
        return;
    }
    
    // Create CSV content
    let csv = 'Date,Water Drunk (ml),Daily Goal (ml),Percentage\n';
    
    // Sort dates
    const sortedDates = Object.keys(waterData).sort();
    
    sortedDates.forEach(dateKey => {
        const data = waterData[dateKey];
        const percentage = Math.round((data.amount / data.goal) * 100);
        csv += `${dateKey},${data.amount},${data.goal},${percentage}%\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `water-intake-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    alert('Data exported successfully!');
}
