/*
  # Fix User ID Constraint
  
  Mengubah kolom user_id menjadi nullable (opsional) pada semua tabel.
  Ini diperlukan karena aplikasi menggunakan simple auth (password shared) 
  bukan Supabase Auth user management penuh.

  ## Changes
  - transactions: user_id -> nullable
  - products: user_id -> nullable
  - notes: user_id -> nullable
*/

ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE products ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE notes ALTER COLUMN user_id DROP NOT NULL;
