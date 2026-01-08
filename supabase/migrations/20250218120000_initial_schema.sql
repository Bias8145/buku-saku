/*
  # Initial Schema for Buku Saku

  ## Query Description:
  Creates tables for Products, Transactions, and Notes to support store management features.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - products: Stores inventory items with buy/sell prices.
  - transactions: Stores income and expense records.
  - notes: Stores general notes.
  
  ## Security Implications:
  - RLS enabled on all tables.
  - Public access policies added for demonstration (should be locked down in production).
*/

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products Table
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sku text,
  buy_price numeric not null default 0,
  sell_price numeric not null default 0,
  stock integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions Table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('income', 'expense')),
  category text not null, -- 'sales', 'capital', 'operational', 'other'
  amount numeric not null,
  description text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notes Table
create table if not exists public.notes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text,
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.notes enable row level security;

-- Create Policies (Allowing public access for this demo context)
create policy "Allow public access to products" on public.products for all using (true);
create policy "Allow public access to transactions" on public.transactions for all using (true);
create policy "Allow public access to notes" on public.notes for all using (true);
