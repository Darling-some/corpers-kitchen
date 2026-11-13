import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { initializeFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions'
import { connectAuthEmulator } from 'firebase/auth'
import { connectFirestoreEmulator } from 'firebase/firestore'
import { connectStorageEmulator } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
const missing = Object.entries(firebaseConfig).filter(([, v]) => !v).map(([k]) => k)
if (missing.length > 0) console.error(`Firebase is not configured. Missing env vars: ${missing.join(', ')}. Copy .env.example to .env.local and fill it in.`)

export const app: FirebaseApp = initializeApp(firebaseConfig)
export const auth: Auth = getAuth(app)
export const db: Firestore = initializeFirestore(app, { ignoreUndefinedProperties: true })
export const storage: FirebaseStorage = getStorage(app)
export const functions: Functions = getFunctions(app, 'europe-west1')

if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}
