import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type-safe database operations
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          plan: 'free' | 'pro' | 'agency';
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      landing_pages: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: Record<string, any>;
          published: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['landing_pages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['landing_pages']['Insert']>;
      };
    };
  };
};
