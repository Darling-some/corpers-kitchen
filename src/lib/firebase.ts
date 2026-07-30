import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { initializeFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function assertConfigured() {
  const missing = Object.entries(firebaseConfig).filter(([, value]) => !value).map(([key]) => key)
  if (missing.length > 0) {
    console.error(`Firebase is not configured. Missing env vars: ${missing.join(', ')}. Copy .env.example to .env.local and fill in your Firebase project credentials.`)
  }
}
assertConfigured()

export const app: FirebaseApp = initializeApp(firebaseConfig)
export const auth: Auth = getAuth(app)
export const db: Firestore = initializeFirestore(app, { ignoreUndefinedProperties: true })
export const storage: FirebaseStorage = getStorage(app)
