-- Mengaktifkan RLS pada tabel transaction_items
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Menghapus policy lama jika ada untuk menghindari konflik
DROP POLICY IF EXISTS "Enable read access for all users" ON transaction_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON transaction_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON transaction_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON transaction_items;

-- Membuat policy baru yang mengizinkan akses penuh (public)
-- Ini penting karena aplikasi menggunakan auth client-side sederhana
CREATE POLICY "Enable read access for all users" ON transaction_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON transaction_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON transaction_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON transaction_items FOR DELETE USING (true);
