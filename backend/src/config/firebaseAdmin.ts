import admin from 'firebase-admin';

// You can use GOOGLE_APPLICATION_CREDENTIALS env var or load from a JSON file
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Optionally, set databaseURL if using Realtime Database
    // databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export default admin; 