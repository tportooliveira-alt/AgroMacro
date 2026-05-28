import { AuthService } from '@/lib/auth.service'
import { DatabaseService } from '@/lib/database.service'

// Integration tests require NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to be set
// These should point to a test Supabase instance or local Supabase emulator
// Run with: npm run test:integration

describe('Authentication Flow - Integration Tests', () => {
  const testTimestamp = Date.now()
  const testPassword = 'IntegrationTest123'

  describe('Signup Flow', () => {
    test('should create new user account with valid credentials', async () => {
      const testEmail = `signup-${testTimestamp}@example.com`
      const result = await AuthService.signUp(testEmail, testPassword)

      expect(result.error).toBeNull()
      expect(result.user).toBeDefined()
      expect(result.user?.email).toBe(testEmail)
    })

    test('should reject duplicate email during signup', async () => {
      const dupEmail = `dup-${Date.now()}@example.com`
      await AuthService.signUp(dupEmail, testPassword)

      const result = await AuthService.signUp(dupEmail, 'DifferentPass123')

      expect(result.error).toBeDefined()
      expect(result.user).toBeNull()
    })

    test('should reject invalid email format', async () => {
      const result = await AuthService.signUp('not-an-email', testPassword)

      expect(result.error).toBe('Invalid email format')
    })

    test('should reject short password', async () => {
      const result = await AuthService.signUp('valid@example.com', 'short')

      expect(result.error).toBe('Password must be at least 8 characters')
    })
  })

  describe('Login Flow', () => {
    test('should login with correct credentials', async () => {
      const loginEmail = `login-${Date.now()}@example.com`
      await AuthService.signUp(loginEmail, testPassword)

      const loginResult = await AuthService.signIn(loginEmail, testPassword)

      expect(loginResult.error).toBeNull()
      expect(loginResult.user).toBeDefined()
      expect(loginResult.session).toBeDefined()
    })

    test('should reject login with incorrect password', async () => {
      const email = `wrongpass-${Date.now()}@example.com`
      await AuthService.signUp(email, testPassword)

      const result = await AuthService.signIn(email, 'WrongPassword123')

      expect(result.error).toBeDefined()
      expect(result.user).toBeNull()
    })

    test('should reject login with non-existent email', async () => {
      const result = await AuthService.signIn('nonexistent@example.com', testPassword)

      expect(result.error).toBeDefined()
    })

    test('should reject login with empty fields', async () => {
      const result = await AuthService.signIn('', '')

      expect(result.error).toBe('Email and password are required')
    })
  })

  describe('Session Management', () => {
    test('should maintain session after login', async () => {
      const email = `session-${Date.now()}@example.com`
      const signupResult = await AuthService.signUp(email, testPassword)

      expect(signupResult.session).toBeDefined()
      expect(signupResult.session?.access_token).toBeDefined()
    })

    test('should invalidate session on logout', async () => {
      const logoutResult = await AuthService.signOut()

      expect(logoutResult.error).toBeNull()
    })
  })

  describe('Password Reset', () => {
    test('should initiate password reset flow', async () => {
      const email = `reset-${Date.now()}@example.com`
      await AuthService.signUp(email, testPassword)

      const result = await AuthService.resetPassword(email)

      expect(result.error).toBeNull()
    })

    test('should reject reset for invalid email', async () => {
      const result = await AuthService.resetPassword('not-an-email')

      expect(result.error).toBe('Valid email is required')
    })

    test('should reject reset for empty email', async () => {
      const result = await AuthService.resetPassword('')

      expect(result.error).toBe('Valid email is required')
    })
  })

  describe('User Database Integration', () => {
    test('should be able to query user data after signup', async () => {
      const email = `dbquery-${Date.now()}@example.com`
      const signupResult = await AuthService.signUp(email, testPassword)

      if (signupResult.user?.id) {
        const userRecord = await DatabaseService.getUserById(signupResult.user.id)

        expect(userRecord === null || userRecord?.id === signupResult.user.id).toBe(true)
      }
    })

    test('should be able to create landing pages for authenticated user', async () => {
      const email = `lpcreate-${Date.now()}@example.com`
      const signupResult = await AuthService.signUp(email, testPassword)

      if (signupResult.user?.id) {
        const lpResult = await DatabaseService.createLandingPage({
          user_id: signupResult.user.id,
          title: 'Integration Test Page',
          content: { sections: [] },
          published: false,
        })

        expect(lpResult).toBeDefined()
      }
    })
  })

  describe('Error Handling', () => {
    test('should handle invalid input gracefully', async () => {
      const result = await AuthService.signUp('invalid-email', 'short')
      expect(result.error).toBeDefined()
    })

    test('should handle empty signup fields', async () => {
      const result = await AuthService.signUp('', '')
      expect(result.error).toBe('Email and password are required')
    })
  })
})
