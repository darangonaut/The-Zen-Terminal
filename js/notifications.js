// BROWSER NOTIFICATIONS MODULE

let notificationsEnabled = false;

// Check if notifications are supported and get saved preference
export function initNotifications() {
    if (!('Notification' in window)) {
        return false;
    }
    // Load saved preference
    notificationsEnabled = localStorage.getItem('zen_notifications') === 'true';
    return true;
}

// Request permission and enable notifications
export async function enableNotifications() {
    if (!('Notification' in window)) {
        return { success: false, message: 'Browser does not support notifications.' };
    }

    if (Notification.permission === 'granted') {
        notificationsEnabled = true;
        localStorage.setItem('zen_notifications', 'true');
        return { success: true, message: 'Notifications enabled.' };
    }

    if (Notification.permission === 'denied') {
        return { success: false, message: 'Notifications blocked. Enable in browser settings.' };
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        notificationsEnabled = true;
        localStorage.setItem('zen_notifications', 'true');
        return { success: true, message: 'Notifications enabled.' };
    } else {
        return { success: false, message: 'Notification permission denied.' };
    }
}

// Disable notifications
export function disableNotifications() {
    notificationsEnabled = false;
    localStorage.setItem('zen_notifications', 'false');
    return { success: true, message: 'Notifications disabled.' };
}

// Toggle notifications
export async function toggleNotifications(arg) {
    if (arg === 'on') {
        return await enableNotifications();
    } else if (arg === 'off') {
        return disableNotifications();
    } else {
        // Toggle
        if (notificationsEnabled) {
            return disableNotifications();
        } else {
            return await enableNotifications();
        }
    }
}

// Check if notifications are enabled
export function areNotificationsEnabled() {
    return notificationsEnabled && 'Notification' in window && Notification.permission === 'granted';
}

// Send a notification
export function sendNotification(title, body, tag = 'zen-terminal') {
    if (!areNotificationsEnabled()) return;

    try {
        const notification = new Notification(title, {
            body: body,
            icon: './icons/icon-192x192.png',
            tag: tag,
            requireInteraction: false
        });

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Focus window on click
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    } catch (e) {
        console.warn('Notification failed:', e);
    }
}

// Specific notifications for focus/break
export function notifyFocusComplete(taskName) {
    sendNotification(
        'Focus Complete!',
        `Great work on: ${taskName}`,
        'focus-complete'
    );
}

export function notifyBreakComplete() {
    sendNotification(
        'Break Over',
        'Ready to get back to work?',
        'break-complete'
    );
}
