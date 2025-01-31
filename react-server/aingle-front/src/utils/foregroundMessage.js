// src/service/foregroundMessage.js
import { getMessaging, onMessage } from "firebase/messaging";
import { app } from "../utils/firebase-init";

const messaging = getMessaging(app);
// console.log(messaging);

onMessage(messaging, (payload) => {
  // console.log("알림 도착 ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  if (Notification.permission === "granted") {
    new Notification(notificationTitle, notificationOptions);
  }
});
