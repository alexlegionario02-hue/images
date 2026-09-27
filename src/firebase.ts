import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  getDocFromServer,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection as required by Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.warn('Firebase client is currently offline or unreachable.');
    }
  }
}
testConnection();

export interface UserProfileData {
  id: string;
  displayName: string;
  currentLevel: number;
  currentMode: 'zen' | 'challenging' | 'master';
  soundEnabled: boolean;
  completedLevels: string[];
  totalSolved: number;
  createdAt: string;
  updatedAt: string;
}

export interface HarmonyRecordData {
  id: string;
  userId: string;
  userDisplayName: string;
  mode: 'zen' | 'challenging' | 'master';
  level: number;
  coverage: number;
  createdAt: string;
}

// Auth Helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Firestore User Profile Sync
export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const docPath = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function saveUserProfile(profile: UserProfileData): Promise<void> {
  const docPath = `users/${profile.id}`;
  try {
    const userRef = doc(db, 'users', profile.id);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, profile);
    } else {
      await updateDoc(userRef, {
        displayName: profile.displayName,
        currentLevel: profile.currentLevel,
        currentMode: profile.currentMode,
        soundEnabled: profile.soundEnabled,
        completedLevels: profile.completedLevels.slice(0, 500),
        totalSolved: profile.totalSolved,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// Public Harmonies Feed
export async function submitHarmonyRecord(record: HarmonyRecordData): Promise<void> {
  const docPath = `harmonies/${record.id}`;
  try {
    await setDoc(doc(db, 'harmonies', record.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export function subscribeToRecentHarmonies(
  onUpdate: (records: HarmonyRecordData[]) => void,
  limitCount = 15
) {
  const colPath = 'harmonies';
  const q = query(collection(db, colPath), orderBy('createdAt', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: HarmonyRecordData[] = [];
      snapshot.forEach((d) => {
        records.push(d.data() as HarmonyRecordData);
      });
      onUpdate(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  );
}
