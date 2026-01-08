/* 
# Fix Database Constraints Safely
Make user_id nullable for transactions and notes tables to support simple password auth.
Checks if columns exist before altering to prevent errors.
*/

DO $$
BEGIN
    -- 1. Fix Transactions Table (Critical for saving transactions)
    -- This fixes the "null value in column user_id" error
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id') THEN
        ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL;
    END IF;

    -- 2. Fix Notes Table (If exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'user_id') THEN
        ALTER TABLE notes ALTER COLUMN user_id DROP NOT NULL;
    END IF;

    -- 3. Fix Products Table (If exists)
    -- This prevents the "column does not exist" error you saw earlier
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_id') THEN
        ALTER TABLE products ALTER COLUMN user_id DROP NOT NULL;
    END IF;
END $$;
