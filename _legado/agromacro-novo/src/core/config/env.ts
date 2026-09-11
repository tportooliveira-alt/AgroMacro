const env = import.meta.env

export const firebaseEnv = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
}

export function isFirebaseConfigured() {
  return Boolean(
    firebaseEnv.apiKey &&
      firebaseEnv.authDomain &&
      firebaseEnv.projectId &&
      firebaseEnv.storageBucket &&
      firebaseEnv.messagingSenderId &&
      firebaseEnv.appId,
  )
}
