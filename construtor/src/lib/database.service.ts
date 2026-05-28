import { supabase } from './supabase'
import type { Database } from './supabase'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

type LandingPage = Database['public']['Tables']['landing_pages']['Row']
type LandingPageInsert = Database['public']['Tables']['landing_pages']['Insert']

export class DatabaseService {
  static async createUser(data: UserInsert): Promise<User | null> {
    const { data: user, error } = await supabase.from('users').insert(data).select().single()

    if (error) {
      console.error('Error creating user:', error)
      return null
    }

    return user as User
  }

  static async getUserById(id: string): Promise<User | null> {
    const { data: user, error } = await supabase.from('users').select('*').eq('id', id).single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return user as User
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single()

    if (error) {
      console.error('Error fetching user by email:', error)
      return null
    }

    return user as User
  }

  static async updateUser(id: string, data: UserUpdate): Promise<User | null> {
    const { data: user, error } = await supabase.from('users').update(data).eq('id', id).select().single()

    if (error) {
      console.error('Error updating user:', error)
      return null
    }

    return user as User
  }

  static async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase.from('users').delete().eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return false
    }

    return true
  }

  static async createLandingPage(data: LandingPageInsert): Promise<LandingPage | null> {
    const { data: page, error } = await supabase
      .from('landing_pages')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Error creating landing page:', error)
      return null
    }

    return page as LandingPage
  }

  static async getLandingPagesByUser(userId: string): Promise<LandingPage[]> {
    const { data: pages, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching landing pages:', error)
      return []
    }

    return (pages || []) as LandingPage[]
  }

  static async getLandingPageById(id: string, userId: string): Promise<LandingPage | null> {
    const { data: page, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching landing page:', error)
      return null
    }

    return page as LandingPage
  }

  static async updateLandingPage(id: string, userId: string, data: Partial<LandingPage>): Promise<LandingPage | null> {
    const { data: page, error } = await supabase
      .from('landing_pages')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating landing page:', error)
      return null
    }

    return page as LandingPage
  }

  static async deleteLandingPage(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase.from('landing_pages').delete().eq('id', id).eq('user_id', userId)

    if (error) {
      console.error('Error deleting landing page:', error)
      return false
    }

    return true
  }

  static async countUserLandingPages(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('landing_pages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      console.error('Error counting landing pages:', error)
      return 0
    }

    return count || 0
  }
}
