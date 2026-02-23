import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Transaction {
  id: number;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  account: string;
  recurring: 'no' | 'weekly' | 'monthly' | 'yearly';
}
