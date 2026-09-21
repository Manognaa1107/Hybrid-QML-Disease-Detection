import { doc, getDoc, setDoc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Safely generates a unique Patient ID (P101, P102, P103, ...)
 * using an atomic Firestore transaction on counters/patientId.
 */
export async function getNextPatientId() {
  const counterRef = doc(db, 'counters', 'patientId');
  const formattedId = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let count = 1;
    if (counterSnap.exists()) {
      count = (counterSnap.data().count || 0) + 1;
    }
    transaction.set(counterRef, { count }, { merge: true });
    return 'P' + (100 + count);
  });
  return formattedId;
}

/**
 * Ensures a patient document exists in Firestore with a unique patientId.
 * Automatically handles:
 * - New patient profile creation with patientId (P101, P102, ...)
 * - Migration of old-format Patient IDs (P000001 -> P101, P000002 -> P102)
 * - Existing patient loading (returns existing P101 format patientId)
 * - Migration for existing patient documents missing patientId
 */
export async function ensurePatientProfile(user, optionalName = null) {
  if (!user || !user.uid) return null;

  const userDocRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    if (data.patientId) {
      // Check if patientId is in old format (e.g., P000001, P000002) and migrate it to P101, P102
      if (/^P0+\d+$/.test(data.patientId) || (data.patientId.startsWith('P') && data.patientId.length > 5)) {
        const oldNum = parseInt(data.patientId.replace(/^P0*/, ''), 10) || 1;
        const migratedPatientId = 'P' + (100 + oldNum);
        await updateDoc(userDocRef, {
          patientId: migratedPatientId
        });
        console.log("Patient ID migrated:", migratedPatientId);
        console.log("Firestore patient profile ready");
        return migratedPatientId;
      }

      console.log("Existing Patient ID:", data.patientId);
      console.log("Firestore patient profile ready");
      return data.patientId;
    } else {
      // Migration: Add patientId to existing patient without overwriting fields
      const newPatientId = await getNextPatientId();
      await updateDoc(userDocRef, {
        patientId: newPatientId
      });
      console.log("Patient ID migrated:", newPatientId);
      console.log("Firestore patient profile ready");
      return newPatientId;
    }
  } else {
    // New patient registration profile
    const newPatientId = await getNextPatientId();
    console.log("Patient ID generated:", newPatientId);
    await setDoc(userDocRef, {
      name: optionalName || user.displayName || 'Patient',
      email: user.email || '',
      role: 'patient',
      patientId: newPatientId,
      createdAt: serverTimestamp()
    });
    console.log("Firestore patient profile ready");
    return newPatientId;
  }
}
