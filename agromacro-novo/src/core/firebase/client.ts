import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { firebaseEnv, isFirebaseConfigured } from '../config/env'

let firebaseApp: FirebaseApp | null = null
let firebaseAuth: Auth | null = null
let firebaseDb: Firestore | null = null

if (isFirebaseConfigured()) {
  firebaseApp = initializeApp({
    apiKey: firebaseEnv.apiKey,
    authDomain: firebaseEnv.authDomain,
    projectId: firebaseEnv.projectId,
    storageBucket: firebaseEnv.storageBucket,
    messagingSenderId: firebaseEnv.messagingSenderId,
    appId: firebaseEnv.appId,
  })

  firebaseAuth = getAuth(firebaseApp)
  firebaseDb = getFirestore(firebaseApp)
}

export { firebaseApp, firebaseAuth, firebaseDb }
