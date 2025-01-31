// importScripts(
//   "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"
// );
// importScripts(
//   "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js"
// );

// const firebaseConfig = {
//   apiKey: "AIzaSyCj8ziF_YZzfJCQAM7oOYIhJDI-c2-fOs8",
//   authDomain: "aingle-ab0b9.firebaseapp.com",
//   projectId: "aingle-ab0b9",
//   storageBucket: "aingle-ab0b9.firebasestorage.app",
//   messagingSenderId: "935748386192",
//   appId: "1:935748386192:web:5daa90f9e20041efb3c715",
//   measurementId: "G-J5271LZYWK",
// };

// firebase.initializeApp(firebaseConfig);

// const messaging = firebase.messaging();

// self.addEventListener("install", (event) => {
//   self.skipWaiting();
// });

// self.addEventListener("activate", (event) => {
//   self.clients.claim();
//   console.log("Service Worker activated");
// });

// // self.addEventListener("fetch", (event) => {
// //   event.respondWith(
// //     fetch(event.request, { mode: "cors", cache: "no-store" }).catch(() => {
// //       return new Response("Network error occurred", { status: 408 });
// //     })
// //   );
// // });

// // 요청 가로채기 이벤트
// self.addEventListener("fetch", (event) => {
//   event.respondWith(fetch(event.request));
// });

// messaging.onBackgroundMessage((payload) => {
//   const notificationTitle = payload.notification.title || "Default Title";
//   const notificationOptions = {
//     body: payload.notification.body || "Default body",
//     icon: payload.notification.icon || "/icon.png",
//   };

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });

importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyCj8ziF_YZzfJCQAM7oOYIhJDI-c2-fOs8",
  authDomain: "aingle-ab0b9.firebaseapp.com",
  projectId: "aingle-ab0b9",
  storageBucket: "aingle-ab0b9.firebasestorage.app",
  messagingSenderId: "935748386192",
  appId: "1:935748386192:web:5daa90f9e20041efb3c715",
  measurementId: "G-J5271LZYWK",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
  console.log("Service Worker activated");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title || "Default Title";
  const notificationOptions = {
    body: payload.notification.body || "Default body",
    icon: payload.notification.icon || "/icon.png",
    data: payload.data, // 데이터 추가
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const postId = event.notification.data.postId; // 알림의 데이터에서 postId 추출

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const urlToOpen = new URL(`/post/${postId}`, self.location.origin);

        for (const client of clientList) {
          if (client.url === urlToOpen.href && "focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(urlToOpen.href);
        }
      })
  );
});
