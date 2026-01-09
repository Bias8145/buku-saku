import { createClient } from '@supabase/supabase-js';

// Gunakan fallback value untuk mencegah crash saat inisialisasi jika env belum terbaca
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('Supabase URL belum terdeteksi di environment variables.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export type Product = {
  id: string;
  name: string;
  sku?: string;
  buy_price: number;
  sell_price: number;
  stock: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  category: 'sales' | 'capital' | 'operational' | 'other';
  amount: number;
  payment_amount?: number; // Baru: Uang Tunai
  change_amount?: number;  // Baru: Kembalian
  description?: string;
  date: string;
  created_at: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
};
