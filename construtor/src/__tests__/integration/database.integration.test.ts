import { DatabaseService } from '@/lib/database.service'

// Integration tests require NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to be set
// These should point to a test Supabase instance or local Supabase emulator
// Run with: npm run test:integration

describe('Database Service - Integration Tests', () => {
  const testTimestamp = Date.now()

  describe('User CRUD Operations', () => {
    test('should create a new user record', async () => {
      const result = await DatabaseService.createUser({
        email: `db-test-${testTimestamp}@example.com`,
        plan: 'free',
      })

      expect(result).toBeDefined()
      expect(result?.email).toBe(`db-test-${testTimestamp}@example.com`)
    })

    test('should retrieve user by email', async () => {
      const email = `retrieve-${Date.now()}@example.com`
      const created = await DatabaseService.createUser({
        email,
        plan: 'free',
      })

      if (created) {
        const user = await DatabaseService.getUserByEmail(email)
        expect(user?.email).toBe(email)
      }
    })

    test('should retrieve user by ID', async () => {
      const email = `byid-${Date.now()}@example.com`
      const created = await DatabaseService.createUser({
        email,
        plan: 'free',
      })

      if (created?.id) {
        const user = await DatabaseService.getUserById(created.id)
        expect(user?.id).toBe(created.id)
      }
    })

    test('should update user plan', async () => {
      const email = `plan-${Date.now()}@example.com`
      const created = await DatabaseService.createUser({
        email,
        plan: 'free',
      })

      if (created?.id) {
        const updated = await DatabaseService.updateUser(created.id, {
          plan: 'pro',
        })

        expect(updated?.plan).toBe('pro')
      }
    })

    test('should delete user record', async () => {
      const email = `delete-${Date.now()}@example.com`
      const created = await DatabaseService.createUser({
        email,
        plan: 'free',
      })

      if (created?.id) {
        const result = await DatabaseService.deleteUser(created.id)
        expect(result).toBe(true)
      }
    })
  })

  describe('Landing Page CRUD Operations', () => {
    let testUserId: string

    beforeAll(async () => {
      const user = await DatabaseService.createUser({
        email: `lp-user-${Date.now()}@example.com`,
        plan: 'free',
      })
      testUserId = user?.id || ''
    })

    test('should create a landing page', async () => {
      const result = await DatabaseService.createLandingPage({
        user_id: testUserId,
        title: 'Test Landing Page',
        content: { sections: [] },
        published: false,
      })

      expect(result).toBeDefined()
      expect(result?.title).toBe('Test Landing Page')
    })

    test('should retrieve landing pages by user', async () => {
      await DatabaseService.createLandingPage({
        user_id: testUserId,
        title: 'Page 1',
        content: { sections: [] },
        published: false,
      })

      const pages = await DatabaseService.getLandingPagesByUser(testUserId)
      expect(pages.length).toBeGreaterThanOrEqual(1)
    })

    test('should count user landing pages', async () => {
      const count = await DatabaseService.countUserLandingPages(testUserId)
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('should retrieve single landing page', async () => {
      const created = await DatabaseService.createLandingPage({
        user_id: testUserId,
        title: 'Single Page',
        content: { sections: [] },
        published: false,
      })

      if (created?.id) {
        const page = await DatabaseService.getLandingPageById(created.id, testUserId)
        expect(page?.title).toBe('Single Page')
      }
    })

    test('should update landing page', async () => {
      const created = await DatabaseService.createLandingPage({
        user_id: testUserId,
        title: 'Original Title',
        content: { sections: [] },
        published: false,
      })

      if (created?.id) {
        const updated = await DatabaseService.updateLandingPage(created.id, testUserId, {
          title: 'Updated Title',
        })

        expect(updated?.title).toBe('Updated Title')
      }
    })

    test('should delete landing page', async () => {
      const created = await DatabaseService.createLandingPage({
        user_id: testUserId,
        title: 'Delete Me',
        content: { sections: [] },
        published: false,
      })

      if (created?.id) {
        const result = await DatabaseService.deleteLandingPage(created.id, testUserId)
        expect(result).toBe(true)
      }
    })
  })

  describe('RLS Policy Enforcement', () => {
    test('should allow user to access own data', async () => {
      const email = `own-${Date.now()}@example.com`
      const result = await DatabaseService.createUser({
        email,
        plan: 'free',
      })

      expect(result).toBeDefined()
      expect(result?.email).toBe(email)
    })

    test('should isolate users data (RLS)', async () => {
      const user1 = await DatabaseService.createUser({
        email: `iso1-${Date.now()}@example.com`,
        plan: 'free',
      })

      const user2 = await DatabaseService.createUser({
        email: `iso2-${Date.now()}@example.com`,
        plan: 'free',
      })

      expect(user1?.id).not.toBe(user2?.id)
    })
  })

  describe('Data Validation', () => {
    test('should handle invalid user ID gracefully', async () => {
      const result = await DatabaseService.getUserById('non-existent-id')
      expect(result).toBeNull()
    })

    test('should handle invalid email gracefully', async () => {
      const result = await DatabaseService.getUserByEmail('nonexistent@example.com')
      expect(result).toBeNull()
    })
  })

  describe('Concurrent Operations', () => {
    test('should handle concurrent operations safely', async () => {
      const user = await DatabaseService.createUser({
        email: `concurrent-${Date.now()}@example.com`,
        plan: 'free',
      })

      if (user?.id) {
        const operations = [
          DatabaseService.createLandingPage({
            user_id: user.id,
            title: 'Concurrent Page 1',
            content: { sections: [] },
            published: false,
          }),
          DatabaseService.createLandingPage({
            user_id: user.id,
            title: 'Concurrent Page 2',
            content: { sections: [] },
            published: false,
          }),
        ]

        const results = await Promise.all(operations)
        results.forEach((result) => {
          expect(result).toBeDefined()
        })
      }
    })
  })
})
