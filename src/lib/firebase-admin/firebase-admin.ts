import * as admin from "firebase-admin";

export const firebase = admin.apps.length
  ? admin.app()
  : admin.initializeApp({
  credential: admin.credential.cert(require('@/car-part-picker-b6718-firebase-adminsdk-fbsvc-c586d657ad.json')),
});

export const db_admin = admin.firestore();