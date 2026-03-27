import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let firebaseInitialized = false;

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    // Try to load service account credentials
    const serviceAccountPath = path.join(process.cwd(), 'config', 'firebaseServiceAccount.json');
    let serviceAccount;

    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } else {
      // Use environment variables
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      };
    }

    if (!serviceAccount.projectId) {
      console.log('Firebase credentials not configured. Push notifications disabled.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
    console.log('Push notifications will be disabled.');
  }
};

// Send push notification to a single device
export const sendPushNotification = async (token, title, body, data = {}) => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }

  if (!firebaseInitialized) {
    console.log('Firebase not initialized. Skipping push notification.');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      token
    };

    const response = await admin.messaging().send(message);
    console.log('Push notification sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return { success: false, error: error.message };
  }
};

// Send bulk push notifications
export const sendBulkNotification = async (tokens, title, body, data = {}) => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }

  if (!firebaseInitialized) {
    console.log('Firebase not initialized. Skipping bulk notification.');
    return { success: false, error: 'Firebase not initialized' };
  }

  if (!tokens || tokens.length === 0) {
    return { success: false, error: 'No tokens provided' };
  }

  try {
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Bulk notification sent: ${response.successCount} success, ${response.failureCount} failures`);

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };
  } catch (error) {
    console.error('Failed to send bulk notification:', error);
    return { success: false, error: error.message };
  }
};

// Send notification to topic
export const sendTopicNotification = async (topic, title, body, data = {}) => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }

  if (!firebaseInitialized) {
    console.log('Firebase not initialized. Skipping topic notification.');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const message = {
      notification: {
        title,
        body
      },
      data,
      topic
    };

    const response = await admin.messaging().send(message);
    console.log('Topic notification sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Failed to send topic notification:', error);
    return { success: false, error: error.message };
  }
};

// Subscribe tokens to a topic
export const subscribeToTopic = async (tokens, topic) => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }

  if (!firebaseInitialized) {
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    console.log(`Subscribed to topic ${topic}:`, response);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to subscribe to topic:', error);
    return { success: false, error: error.message };
  }
};

// Unsubscribe tokens from a topic
export const unsubscribeFromTopic = async (tokens, topic) => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }

  if (!firebaseInitialized) {
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    console.log(`Unsubscribed from topic ${topic}:`, response);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to unsubscribe from topic:', error);
    return { success: false, error: error.message };
  }
};

export { admin, firebaseInitialized };
