import { DatabaseService } from '@/lib/database.service'
import { supabase } from '@/lib/supabase'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

describe('DatabaseService', () => {
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

  beforeEach(() => {
    jest.clearAllMocks()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com', plan: 'free', created_at: '2024-01-01' }

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.createUser({ email: 'test@example.com', plan: 'free' })

      expect(result).toEqual(mockUser)
      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(mockChain.insert).toHaveBeenCalled()
    })

    it('should return null on error', async () => {
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.createUser({ email: 'test@example.com', plan: 'free' })

      expect(result).toBeNull()
      expect(mockConsoleError).toHaveBeenCalled()
    })
  })

  describe('getUserById', () => {
    it('should fetch user by id', async () => {
      const mockUser = { id: '123', email: 'test@example.com', plan: 'free', created_at: '2024-01-01' }

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.getUserById('123')

      expect(result).toEqual(mockUser)
      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(mockChain.eq).toHaveBeenCalledWith('id', '123')
    })

    it('should return null if user not found', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.getUserById('999')

      expect(result).toBeNull()
    })
  })

  describe('getUserByEmail', () => {
    it('should fetch user by email', async () => {
      const mockUser = { id: '123', email: 'test@example.com', plan: 'free', created_at: '2024-01-01' }

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.getUserByEmail('test@example.com')

      expect(result).toEqual(mockUser)
      expect(mockChain.eq).toHaveBeenCalledWith('email', 'test@example.com')
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com', plan: 'pro', created_at: '2024-01-01' }

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.updateUser('123', { plan: 'pro' })

      expect(result).toEqual(mockUser)
      expect(mockChain.update).toHaveBeenCalledWith({ plan: 'pro' })
      expect(mockChain.eq).toHaveBeenCalledWith('id', '123')
    })
  })

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.deleteUser('123')

      expect(result).toBe(true)
      expect(mockChain.delete).toHaveBeenCalled()
      expect(mockChain.eq).toHaveBeenCalledWith('id', '123')
    })

    it('should return false on error', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Error' } }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.deleteUser('123')

      expect(result).toBe(false)
    })
  })

  describe('createLandingPage', () => {
    it('should create landing page successfully', async () => {
      const mockPage = {
        id: 'lp-123',
        user_id: '123',
        title: 'My Landing Page',
        content: {},
        published: false,
        created_at: '2024-01-01',
      }

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockPage, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.createLandingPage({
        user_id: '123',
        title: 'My Landing Page',
        content: {},
        published: false,
      })

      expect(result).toEqual(mockPage)
      expect(supabase.from).toHaveBeenCalledWith('landing_pages')
    })
  })

  describe('getLandingPagesByUser', () => {
    it('should fetch all landing pages for user', async () => {
      const mockPages = [
        { id: 'lp-1', user_id: '123', title: 'Page 1', content: {}, published: false, created_at: '2024-01-01' },
        { id: 'lp-2', user_id: '123', title: 'Page 2', content: {}, published: true, created_at: '2024-01-02' },
      ]

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPages, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.getLandingPagesByUser('123')

      expect(result).toEqual(mockPages)
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', '123')
    })

    it('should return empty array on error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.getLandingPagesByUser('123')

      expect(result).toEqual([])
    })
  })

  describe('countUserLandingPages', () => {
    it('should count user landing pages', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.countUserLandingPages('123')

      expect(result).toBe(5)
    })

    it('should return 0 on error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await DatabaseService.countUserLandingPages('123')

      expect(result).toBe(0)
    })
  })
})
