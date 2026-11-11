import { signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebase'
export const signIn = (e: string, p: string) => signInWithEmailAndPassword(auth, e, p)
export const signOut = () => fbSignOut(auth)
export const watchAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb)
