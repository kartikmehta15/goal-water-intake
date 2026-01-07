# 💧 Water Intake Tracker

A beautiful, interactive website to track your daily water consumption and stay hydrated!

## Features

- **📅 Calendar View**: Visual calendar showing your water intake history with color-coded days
- **🎨 Daily Companion**: Each day features a unique animal, plant, or nature emoji that fills proportionally to your water intake goal
- **📊 Progress Tracking**: Visual progress bar and percentage display showing how close you are to your daily goal
- **✏️ Edit Historical Data**: Click any past day in the calendar to view and edit your water intake
- **📈 Summary Statistics**: Track your overall performance with statistics showing:
  - Days you reached 100%+ of your goal
  - Days you reached 75-99% of your goal
  - Days you reached 50-74% of your goal
  - Days you reached 25-49% of your goal
  - Days below 25% of your goal
- **💾 Local Storage**: All data is stored locally in your browser - no server required
- **🎯 Customizable Daily Goal**: Set your own daily water intake goal (default: 2000ml)
- **📱 Responsive Design**: Works beautifully on desktop, tablet, and mobile devices

## How to Use

### Getting Started

1. Open `index.html` in your web browser
2. The app will automatically load with today's date selected

### Logging Water Intake

1. **For Today**: The current date is automatically selected
   - Enter the amount of water you've consumed in milliliters in the "Water Intake (ml)" field
   - Click the "Save" button
   - Watch your daily companion fill up with water! 🌊

2. **For Past Days**: 
   - Click on any date in the calendar view, or
   - Use the date selector at the top to choose a specific date
   - Enter the water intake amount and click "Save"

### Editing Existing Entries

1. Click on any day in the calendar that already has data
2. The form will populate with the existing values
3. Modify the water intake amount
4. Click "Save" to update

### Viewing Different Months

- Use the "← Previous" and "Next →" buttons above the calendar to navigate between months
- Your data persists across all months

### Understanding the Visual Feedback

- **Creature Fill**: The daily companion (animal/plant) has a blue gradient that fills from bottom to top based on your percentage of the daily goal
- **Progress Bar**: Shows your completion percentage with a gradient from green to blue
- **Calendar Colors**:
  - 🟢 **Green**: 100%+ goal achieved
  - 🟢 **Light Green**: 75-99% of goal
  - 🟡 **Yellow**: 50-74% of goal
  - 🟡 **Light Yellow**: 25-49% of goal
  - 🔴 **Light Red**: Below 25% of goal

### Daily Companions

The app features 31 different creatures and plants that rotate daily:
- 🌵 Cactus, 🌻 Sunflower, 🌲 Pine Tree, 🐠 Fish, 🐳 Whale, 🐸 Frog, 🦭 Seal
- 🌺 Hibiscus, 🌴 Palm Tree, 🦢 Swan, 🪴 Potted Plant, 🌿 Herb, 🍀 Clover
- 🌾 Sheaf of Rice, 🌱 Seedling, 🐢 Turtle, 🦆 Duck, 🦦 Otter, 🐊 Crocodile
- 🦈 Shark, 🐙 Octopus, 🌊 Wave, 🪷 Lotus, 🦩 Flamingo, 🌷 Tulip
- 🌹 Rose, 🌸 Cherry Blossom, 🪻 Hyacinth, 🌼 Blossom, 🪸 Coral, 🦑 Squid

## Technical Details

- **Pure HTML/CSS/JavaScript**: No frameworks or build tools required
- **LocalStorage API**: Data persists in the browser
- **Responsive Design**: CSS Grid and Flexbox for adaptive layouts
- **No Dependencies**: Works completely offline after initial load

## Files

- `index.html` - Main HTML structure
- `styles.css` - All styling and responsive design
- `script.js` - Application logic and data management

## Browser Compatibility

Works on all modern browsers that support:
- ES6 JavaScript
- CSS Grid and Flexbox
- LocalStorage API

## Screenshots

### Initial View
![Water Tracker Initial View](https://github.com/user-attachments/assets/23133c87-abb8-4029-bd34-a10d193d564d)

### With Data Logged (75% Goal)
![Water Tracker with 75% Progress](https://github.com/user-attachments/assets/4fb9abd1-8bfd-44e0-81c2-d72a1a44dc21)

### Edited Data (50% Goal)
![Water Tracker Showing Edited Data](https://github.com/user-attachments/assets/7d789032-530a-450f-8aa9-3c7aea99c49e)

### Complete View with Multiple Days
![Water Tracker Complete View](https://github.com/user-attachments/assets/a1852e81-b044-4915-ad45-c4720436267a)

## Tips for Staying Hydrated

- Set reminders throughout the day to log your water intake
- Aim to drink water consistently throughout the day rather than all at once
- Adjust your daily goal based on your activity level and climate
- Use the visual feedback as motivation to reach your goal every day!

## License

This project is open source and available for personal use.
