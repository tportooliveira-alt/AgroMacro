import { supabase } from './supabase'

export interface SignUpRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: { id: string; email: string } | null
  session: { access_token: string } | null
  error: string | null
}

export class AuthService {
  static async signUp(email: string, password: string): Promise<AuthResponse> {
    if (!email || !password) {
      return { user: null, session: null, error: 'Email and password are required' }
    }

    if (password.length < 8) {
      return { user: null, session: null, error: 'Password must be at least 8 characters' }
    }

    if (!this.isValidEmail(email)) {
      return { user: null, session: null, error: 'Invalid email format' }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { user: null, session: null, error: error.message }
      }

      return {
        user: data.user ? { id: data.user.id, email: data.user.email || '' } : null,
        session: data.session,
        error: null,
      }
    } catch (err) {
      return { user: null, session: null, error: 'Sign up failed' }
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!email || !password) {
      return { user: null, session: null, error: 'Email and password are required' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { user: null, session: null, error: error.message }
      }

      return {
        user: data.user ? { id: data.user.id, email: data.user.email || '' } : null,
        session: data.session,
        error: null,
      }
    } catch (err) {
      return { user: null, session: null, error: 'Sign in failed' }
    }
  }

  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (err) {
      return { error: 'Sign out failed' }
    }
  }

  static async resetPassword(email: string): Promise<{ error: string | null }> {
    if (!email || !this.isValidEmail(email)) {
      return { error: 'Valid email is required' }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      })
      return { error: error?.message || null }
    } catch (err) {
      return { error: 'Password reset failed' }
    }
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}
