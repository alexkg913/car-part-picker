    import { initializeApp } from "firebase/app";
    import { getAuth } from "firebase/auth";
    // Add other Firebase services you need, e.g., firestore, storage

    const firebaseConfig = {
      apiKey: "AIzaSyBTJYdSzIr6HZ_Mj4kl8cLheTOXHtXF4JY",
      authDomain: "car-part-picker-b6718.firebaseapp.com",
      projectId: "car-part-picker-b6718",
      storageBucket: "car-part-picker-b6718.firebasestorage.app",
      messagingSenderId: "79942012823",
      appId: "1:79942012823:web:474258fb11532600093ed2",
      measurementId: "G-9C9RQ76LMT"
    };

    const app = initializeApp(firebaseConfig);
    export const auth = getAuth(app);
    // Export other Firebase services
    export default app;