import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../../firebase-service-account.json';

// Initialize Firebase only once, even if this file gets imported multiple times
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// Shared Firestore database connection, used across all route files
export const db = getFirestore();

export default admin;
