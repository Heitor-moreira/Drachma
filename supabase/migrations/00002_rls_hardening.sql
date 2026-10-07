-- Migration: 00002_rls_hardening.sql
-- Description: Idempotent RLS hardening (adding WITH CHECK on UPDATE policies to prevent ownership reassignment)
--              and creating indexes for foreign keys and RLS performance.

-- 1. Hardening RLS policies with WITH CHECK for UPDATE

-- user_settings
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" 
  ON public.user_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- credit_cards
DROP POLICY IF EXISTS "Users can update their own cards" ON public.credit_cards;
CREATE POLICY "Users can update their own cards" 
  ON public.credit_cards 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- subscriptions
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update their own subscriptions" 
  ON public.subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- initial_balances
DROP POLICY IF EXISTS "Users can update their own initial balances" ON public.initial_balances;
CREATE POLICY "Users can update their own initial balances" 
  ON public.initial_balances 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- salary_info
DROP POLICY IF EXISTS "Users can update their own salary info" ON public.salary_info;
CREATE POLICY "Users can update their own salary info" 
  ON public.salary_info 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- transactions
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions" 
  ON public.transactions 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- 2. Indexes for performance and RLS filtering
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_initial_balances_user_id ON public.initial_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_info_user_id ON public.salary_info(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON public.transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
