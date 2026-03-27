import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import api from './api.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app = null;
let messaging = null;

// Initialize Firebase
export const initializeFirebase = () => {
  if (!firebaseConfig.apiKey) {
    console.log('Firebase config not found. Push notifications disabled.');
    return null;
  }

  try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('Firebase initialized successfully');
    return messaging;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (userId) => {
  try {
    if (!messaging) {
      initializeFirebase();
    }

    if (!messaging) {
      console.log('Firebase messaging not available');
      return null;
    }

    // Check if permission is already granted
    const permission = Notification.permission;
    if (permission === 'denied') {
      console.log('Notification permission denied');
      return null;
    }

    if (permission === 'default') {
      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        console.log('Notification permission not granted');
        return null;
      }
    }

    // Get FCM token
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey || undefined
    });

    if (currentToken) {
      console.log('FCM Token received');
      
      // Send token to backend
      if (userId) {
        try {
          await api.put(`/notifications/fcm-token/${userId}`, {
            fcmToken: currentToken
          });
          console.log('FCM token saved to backend');
        } catch (error) {
          console.error('Failed to save FCM token:', error);
        }
      }
      
      return currentToken;
    } else {
      console.log('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback) => {
  if (!messaging) {
    console.log('Firebase messaging not initialized');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

// Unsubscribe from notifications
export const unsubscribeFromNotifications = async () => {
  // This would delete the token from the backend
  // Implementation depends on your backend API
  console.log('Unsubscribed from push notifications');
};

// Check notification permission status
export const getNotificationPermissionStatus = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

export { messaging };
