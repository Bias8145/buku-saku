-- Mengaktifkan RLS pada tabel transaction_items
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Membuat policy agar aplikasi bisa membaca dan menulis data (sesuai pola auth sederhana aplikasi ini)
CREATE POLICY "Enable read access for all users" ON transaction_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON transaction_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON transaction_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON transaction_items FOR DELETE USING (true);
