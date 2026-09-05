import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBJlXEXL54VpeSMqD11M3_IEp1yxf2L6as",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ai-teacher-ad5c2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ai-teacher-ad5c2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ai-teacher-ad5c2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "92515913168",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:92515913168:web:1e783e5703b1e9c8dbbdd5",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-HEDCMF4KRJ"
};

// Initialize Firebase safely (avoid re-initialization in Next.js hot reload)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Saves or updates student profile in Firestore
 */
export async function saveStudentProfile(userId: string, profile: any) {
  try {
    const userRef = doc(db, "students", userId);
    await setDoc(userRef, {
      ...profile,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving student profile to Firestore:", error);
    return false;
  }
}

function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  const cleaned: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      cleaned[k] = cleanUndefined(v);
    }
  }
  return cleaned;
}

/**
 * Saves a completed lesson to the student's Firestore history
 */
export async function saveLessonHistory(userId: string, lessonData: any) {
  try {
    const historyRef = collection(db, "students", userId, "lessons");
    const sanitized = cleanUndefined(lessonData || {});
    await addDoc(historyRef, {
      ...sanitized,
      completedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error saving lesson history to Firestore:", error);
    return false;
  }
}

/**
 * Saves assessment / quiz results
 */
export async function saveAssessmentResult(userId: string, assessmentData: any) {
  try {
    const assessmentsRef = collection(db, "students", userId, "assessments");
    const sanitized = cleanUndefined(assessmentData || {});
    await addDoc(assessmentsRef, {
      ...sanitized,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error saving assessment result to Firestore:", error);
    return false;
  }
}
