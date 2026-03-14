import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TimeSession {
  id: string;
  user_id: string;
  domain: string;
  url: string;
  title: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  category: string;
  created_at: string;
}

export interface WebsiteCategory {
  id: string;
  domain: string;
  category: 'productive' | 'unproductive' | 'neutral';
  custom_name: string | null;
  user_id: string | null;
  created_at: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  date: string;
  total_productive_seconds: number;
  total_unproductive_seconds: number;
  total_neutral_seconds: number;
  top_domains: Array<{ domain: string; seconds: number }>;
  created_at: string;
  updated_at: string;
}
