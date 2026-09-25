/**
 * Dig In Notification Service
 * Push notifications for meal reminders at customizable times
 */

class NotificationService {
    constructor() {
        this.mealReminders = this.loadMealReminders();
        this.requestPermission();
        this.startNotificationScheduler();
    }

    /**
     * Request notification permission from browser
     */
    requestPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                console.log('✅ Notifications enabled');
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        console.log('✅ Notification permission granted');
                        this.showTestNotification();
                    }
                });
            }
        }
    }

    /**
     * Load meal reminders from storage
     */
    loadMealReminders() {
        const saved = localStorage.getItem('dig_in_meal_times');
        return saved ? JSON.parse(saved) : {
            breakfast: { time: '08:00', enabled: true },
            lunch: { time: '12:30', enabled: true },
            dinner: { time: '18:30', enabled: true },
            snack: { time: '15:00', enabled: false }
        };
    }

    /**
     * Start scheduler that checks for meal times
     */
    startNotificationScheduler() {
        // Check every minute if it's time to notify
        setInterval(() => this.checkMealTimes(), 60000);

        // Also check immediately
        this.checkMealTimes();
    }

    /**
     * Check if it's time for any meal reminders
     */
    checkMealTimes() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        Object.entries(this.mealReminders).forEach(([meal, data]) => {
            if (!data.enabled) return;

            if (data.time === currentTime) {
                this.sendMealReminder(meal);
            }
        });
    }

    /**
     * Send meal reminder notification
     */
    sendMealReminder(mealType) {
        const mealIcons = {
            breakfast: '🌅',
            lunch: '🍽️',
            dinner: '🌙',
            snack: '🍿'
        };

        const mealMessages = {
            breakfast: 'Time for breakfast! 🥞 Scan what you\'re eating',
            lunch: 'Lunch time! 🍜 Take a photo of your meal',
            dinner: 'Dinner time! 🍖 Scan those barcodes',
            snack: 'Snack time! 🍎 Log what you\'re having'
        };

        const title = `${mealIcons[mealType]} ${mealType.toUpperCase()}`;
        const options = {
            body: mealMessages[mealType],
            icon: '🍽️',
            tag: `meal-reminder-${mealType}`,
            requireInteraction: false,
            actions: [
                { action: 'scan', title: '📱 Scan Now' },
                { action: 'dismiss', title: 'Dismiss' }
            ]
        };

        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, options);

            notification.onclick = () => {
                window.focus();
                window.location.href = 'barcode-scanner.html';
                notification.close();
            };

            // Track analytics
            if (window.digInAnalytics) {
                window.digInAnalytics.track('meal_reminder_sent', {
                    meal_type: mealType,
                    time: new Date().toLocaleTimeString()
                });
            }
        }
    }

    /**
     * Show test notification
     */
    showTestNotification() {
        const notification = new Notification('🔔 Dig In Notifications Ready!', {
            body: 'You\'ll get reminders at your meal times',
            icon: '🍽️'
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }

    /**
     * Set custom meal time
     */
    setMealTime(mealType, time, enabled = true) {
        this.mealReminders[mealType] = { time, enabled };
        localStorage.setItem('dig_in_meal_times', JSON.stringify(this.mealReminders));

        if (window.digInAnalytics) {
            window.digInAnalytics.track('meal_time_updated', {
                meal_type: mealType,
                time: time,
                enabled: enabled
            });
        }
    }

    /**
     * Get all meal reminders
     */
    getMealReminders() {
        return this.mealReminders;
    }

    /**
     * Enable/disable all notifications
     */
    setNotificationsEnabled(enabled) {
        if (!enabled) {
            localStorage.setItem('dig_in_notifications_disabled', 'true');
        } else {
            localStorage.removeItem('dig_in_notifications_disabled');
        }
    }

    /**
     * Check if notifications are enabled globally
     */
    areNotificationsEnabled() {
        return !localStorage.getItem('dig_in_notifications_disabled');
    }
}

// Global instance
const notificationService = new NotificationService();

// Expose to window
window.notificationService = notificationService;

// Service Worker registration for offline support and background notifications
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}
