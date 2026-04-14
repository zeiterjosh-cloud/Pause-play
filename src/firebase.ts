import { initializeApp } from 'firebase/app';
import { get, getDatabase, push, ref, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : undefined;
const database = app ? getDatabase(app) : undefined;

export type BudgetSettings = {
  dailyBudget: number;
  weeklyBudget: number;
  softLimitWarnings: boolean;
  pauseTimerEnabled: boolean;
};

export type Transaction = {
  id: string;
  amount: number;
  category: string;
  timestamp: number;
};

export type Feedback = {
  rating: number;
  type: 'suggestion' | 'bug report' | 'general';
  message: string;
  createdAt: number;
};

export const isFirebaseConfigured = hasFirebaseConfig;

export const loadSettings = async (userId: string): Promise<BudgetSettings | null> => {
  if (!database) {
    return null;
  }

  const snapshot = await get(ref(database, `users/${userId}/settings`));
  return snapshot.exists() ? (snapshot.val() as BudgetSettings) : null;
};

export const loadTransactions = async (userId: string): Promise<Transaction[]> => {
  if (!database) {
    return [];
  }

  const snapshot = await get(ref(database, `users/${userId}/transactions`));
  if (!snapshot.exists()) {
    return [];
  }

  const raw = snapshot.val() as Record<string, Transaction>;
  return Object.values(raw).sort((a, b) => b.timestamp - a.timestamp);
};

export const saveSettings = async (userId: string, settings: BudgetSettings) => {
  if (!database) {
    return;
  }

  await set(ref(database, `users/${userId}/settings`), settings);
};

export const saveTransaction = async (userId: string, transaction: Transaction) => {
  if (!database) {
    return;
  }

  await push(ref(database, `users/${userId}/transactions`), transaction);
};

export const saveFeedback = async (userId: string, feedback: Feedback) => {
  if (!database) {
    return;
  }

  await push(ref(database, `users/${userId}/feedback`), feedback);
};
