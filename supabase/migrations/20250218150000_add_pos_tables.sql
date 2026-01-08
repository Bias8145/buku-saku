-- Membuat tabel untuk menyimpan detail item per transaksi
-- Ini agar kita tahu: Transaksi A isinya beli Beras 2kg dan Gula 1kg
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_time NUMERIC NOT NULL, -- Harga saat transaksi (penting jika harga produk berubah nanti)
    subtotal NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menambahkan index agar pencarian cepat
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);

-- Opsional: Menambahkan kolom SKU di products jika belum ada (untuk barcode)
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
