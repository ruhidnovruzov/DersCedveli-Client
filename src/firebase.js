// client/src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase konfiqurasyonu
const firebaseConfig = {
    apiKey: "AIzaSyCo0YN34HyCMW68Nurz1QIKGkYZTfEQE_M",
    authDomain: "schedule-db8db.firebaseapp.com",
    projectId: "schedule-db8db",
    storageBucket: "schedule-db8db.firebasestorage.app",
    messagingSenderId: "835623045739",
    appId: "1:835623045739:web:3bc7cef4974c33e2897f2e",
    measurementId: "G-7FF1CF130Y"
  };

// Firebase-i inicializasiya et
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Bildiriş icazəsini istəmək və token almaq
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // VAPID key - Firebase konsolundan əldə edin
      const token = await getToken(messaging, {
        vapidKey: "BDhfXvFfJaernWIiuFTiJdvBc4ap9I4NuyivlRXPdSYzC6ztNy8UiCKyNrSwPrsfeO09eaapf0-_xZakAM0fHtM"
      });
      
      console.log("Notification token:", token);
      return token;
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
};

// Ön plandakı bildirişləri dinləmək
export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      resolve(payload);
    });
  });
};

export default app;