import { AuthService } from '@/lib/auth.service'
import { supabase } from '@/lib/supabase'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}))

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signUp', () => {
    it('should create user with valid email and password', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token123' }

      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const result = await AuthService.signUp('test@example.com', 'password123')

      expect(result.user).toEqual({ id: '123', email: 'test@example.com' })
      expect(result.session).toEqual(mockSession)
      expect(result.error).toBeNull()
    })

    it('should return error for duplicate email', async () => {
      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already exists' },
      })

      const result = await AuthService.signUp('test@example.com', 'password123')

      expect(result.user).toBeNull()
      expect(result.error).toBe('User already exists')
    })

    it('should return error for invalid email', async () => {
      const result = await AuthService.signUp('invalid-email', 'password123')

      expect(result.error).toBe('Invalid email format')
      expect(supabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should return error for short password', async () => {
      const result = await AuthService.signUp('test@example.com', 'short')

      expect(result.error).toBe('Password must be at least 8 characters')
      expect(supabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should return error when fields are empty', async () => {
      const result = await AuthService.signUp('', '')

      expect(result.error).toBe('Email and password are required')
    })
  })

  describe('signIn', () => {
    it('should login with correct credentials', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token123' }

      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const result = await AuthService.signIn('test@example.com', 'password123')

      expect(result.user).toEqual({ id: '123', email: 'test@example.com' })
      expect(result.session).toEqual(mockSession)
      expect(result.error).toBeNull()
    })

    it('should return error for incorrect credentials', async () => {
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      })

      const result = await AuthService.signIn('test@example.com', 'wrongpassword')

      expect(result.user).toBeNull()
      expect(result.error).toBe('Invalid credentials')
    })

    it('should return error when fields are empty', async () => {
      const result = await AuthService.signIn('', '')

      expect(result.error).toBe('Email and password are required')
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null })

      const result = await AuthService.signOut()

      expect(result.error).toBeNull()
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('should return error on sign out failure', async () => {
      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: { message: 'Sign out failed' },
      })

      const result = await AuthService.signOut()

      expect(result.error).toBe('Sign out failed')
    })
  })

  describe('resetPassword', () => {
    it('should send reset password email', async () => {
      ;(supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        error: null,
      })

      const result = await AuthService.resetPassword('test@example.com')

      expect(result.error).toBeNull()
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({ redirectTo: expect.any(String) })
      )
    })

    it('should return error for invalid email', async () => {
      const result = await AuthService.resetPassword('invalid-email')

      expect(result.error).toBe('Valid email is required')
      expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled()
    })

    it('should return error for empty email', async () => {
      const result = await AuthService.resetPassword('')

      expect(result.error).toBe('Valid email is required')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(AuthService.isValidEmail('test@example.com')).toBe(true)
      expect(AuthService.isValidEmail('user.name+tag@example.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(AuthService.isValidEmail('invalid')).toBe(false)
      expect(AuthService.isValidEmail('invalid@')).toBe(false)
      expect(AuthService.isValidEmail('@example.com')).toBe(false)
      expect(AuthService.isValidEmail('invalid @example.com')).toBe(false)
    })
  })
})
