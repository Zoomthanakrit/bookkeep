-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'savings', 'withdraw')),
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  fund_source TEXT DEFAULT 'income' CHECK (fund_source IN ('income', 'savings')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all via service key" ON transactions
  FOR ALL USING (true) WITH CHECK (true);
