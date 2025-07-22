import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../../firebase-service-account.json';

initializeApp({
  credential: cert(serviceAccount),
});

export const db = getFirestore(); 