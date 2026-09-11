import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { isFirebaseConfigured } from '../config/env'
import { firebaseAuth } from '../firebase/client'

export interface AppUser {
  id: string
  email: string
  provider: 'firebase' | 'local'
}

const LOCAL_KEY = 'agromacro:user'

function getLocalUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) {
      return null
    }
    return JSON.parse(raw) as AppUser
  } catch {
    return null
  }
}

function setLocalUser(user: AppUser | null) {
  if (!user) {
    localStorage.removeItem(LOCAL_KEY)
    return
  }
  localStorage.setItem(LOCAL_KEY, JSON.stringify(user))
}

function fromFirebaseUser(user: User): AppUser {
  return {
    id: user.uid,
    email: user.email || 'sem-email',
    provider: 'firebase',
  }
}

export const authService = {
  isFirebaseMode() {
    return isFirebaseConfigured() && Boolean(firebaseAuth)
  },

  observeAuth(callback: (user: AppUser | null) => void) {
    if (this.isFirebaseMode() && firebaseAuth) {
      return onAuthStateChanged(firebaseAuth, (user) => {
        callback(user ? fromFirebaseUser(user) : null)
      })
    }

    callback(getLocalUser())
    return () => {
      return
    }
  },

  async login(email: string, password: string) {
    if (this.isFirebaseMode() && firebaseAuth) {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
      return fromFirebaseUser(cred.user)
    }

    const user: AppUser = {
      id: crypto.randomUUID(),
      email,
      provider: 'local',
    }
    setLocalUser(user)
    return user
  },

  async register(email: string, password: string) {
    if (this.isFirebaseMode() && firebaseAuth) {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)
      return fromFirebaseUser(cred.user)
    }

    const user: AppUser = {
      id: crypto.randomUUID(),
      email,
      provider: 'local',
    }
    setLocalUser(user)
    return user
  },

  async logout() {
    if (this.isFirebaseMode() && firebaseAuth) {
      await signOut(firebaseAuth)
      return
    }

    setLocalUser(null)
  },
}
