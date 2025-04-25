// client/public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase konfiqurasyonu - firebase.js faylındakı ilə eyni olmalıdır
const firebaseConfig = {
    apiKey: "AIzaSyCo0YN34HyCMW68Nurz1QIKGkYZTfEQE_M",
    authDomain: "schedule-db8db.firebaseapp.com",
    projectId: "schedule-db8db",
    storageBucket: "schedule-db8db.firebasestorage.app",
    messagingSenderId: "835623045739",
    appId: "1:835623045739:web:3bc7cef4974c33e2897f2e",
    measurementId: "G-7FF1CF130Y"
  };

  
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Arxa planda bildiriş qəbulu
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Push bildirişləri qəbul etmək
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    self.registration.showNotification(data.notification.title, {
      body: data.notification.body,
      icon: '/logo192.png',
      badge: '/badge-icon.png',
      data: data.data
    });
  }
});

// Bildirişə klikləmək
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Tətbiqi açmaq üçün link
  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Baxırıq ki, pəncərəni tapıb aktivləşdirək
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Əgər tətbiq açıq deyilsə, yeni pəncərə açırıq
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});