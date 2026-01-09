-- Menambahkan kolom untuk menyimpan detail pembayaran tunai
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS change_amount numeric DEFAULT 0;

-- Update keterangan kolom agar jelas
COMMENT ON COLUMN transactions.payment_amount IS 'Jumlah uang tunai yang diserahkan pembeli';
COMMENT ON COLUMN transactions.change_amount IS 'Jumlah kembalian yang diberikan ke pembeli';
