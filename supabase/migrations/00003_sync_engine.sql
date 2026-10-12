-- Migration: 00003_sync_engine.sql
-- Description: Triggers updated_at, UNIQUE(user_id) constraints for singleton tables,
--              schema alignment for subscriptions/user_settings/transactions, and text ID support.

-- 1. Helper function for updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.updated_at IS NULL OR NEW.updated_at = OLD.updated_at THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Setup updated_at triggers on all tables
DROP TRIGGER IF EXISTS set_updated_at_user_settings ON public.user_settings;
CREATE TRIGGER set_updated_at_user_settings
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_credit_cards ON public.credit_cards;
CREATE TRIGGER set_updated_at_credit_cards
    BEFORE UPDATE ON public.credit_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON public.subscriptions;
CREATE TRIGGER set_updated_at_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_initial_balances ON public.initial_balances;
CREATE TRIGGER set_updated_at_initial_balances
    BEFORE UPDATE ON public.initial_balances
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_salary_info ON public.salary_info;
CREATE TRIGGER set_updated_at_salary_info
    BEFORE UPDATE ON public.salary_info
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_transactions ON public.transactions;
CREATE TRIGGER set_updated_at_transactions
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. UNIQUE(user_id) constraint on singleton tables
-- Deduplicate singletons keeping the most recently updated row before adding constraint
DELETE FROM public.user_settings a USING public.user_settings b
WHERE a.user_id = b.user_id 
  AND (
    COALESCE(a.updated_at, a.created_at, '1970-01-01'::timestamptz) < COALESCE(b.updated_at, b.created_at, '1970-01-01'::timestamptz)
    OR (
      COALESCE(a.updated_at, a.created_at, '1970-01-01'::timestamptz) = COALESCE(b.updated_at, b.created_at, '1970-01-01'::timestamptz)
      AND a.ctid < b.ctid
    )
  );

DELETE FROM public.salary_info a USING public.salary_info b
WHERE a.user_id = b.user_id 
  AND (
    COALESCE(a.updated_at, a.created_at, '1970-01-01'::timestamptz) < COALESCE(b.updated_at, b.created_at, '1970-01-01'::timestamptz)
    OR (
      COALESCE(a.updated_at, a.created_at, '1970-01-01'::timestamptz) = COALESCE(b.updated_at, b.created_at, '1970-01-01'::timestamptz)
      AND a.ctid < b.ctid
    )
  );

DELETE FROM public.initial_balances a USING public.initial_balances b
WHERE a.user_id = b.user_id 
  AND (
    COALESCE(a.updated_at, a.created_at, '1970-01-01'::timestamptz) < COALESCE(b.updated_at, b.created_at, '1970-01-01'::timestamptz)
    OR (
      COALESCE(a.updated_at, a.created_at, '1970-01-01'::timestamptz) = COALESCE(b.updated_at, b.created_at, '1970-01-01'::timestamptz)
      AND a.ctid < b.ctid
    )
  );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_user_id_key'
    ) THEN
        ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'salary_info_user_id_key'
    ) THEN
        ALTER TABLE public.salary_info ADD CONSTRAINT salary_info_user_id_key UNIQUE (user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'initial_balances_user_id_key'
    ) THEN
        ALTER TABLE public.initial_balances ADD CONSTRAINT initial_balances_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 4. Schema enhancements and text ID migration (supporting client-generated and deterministic string IDs)
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_card_id_fkey;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_card_id_fkey;

ALTER TABLE public.credit_cards ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.subscriptions ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.transactions ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.transactions ALTER COLUMN card_id TYPE TEXT;

-- Align columns for subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS due_day INTEGER DEFAULT 1;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cycle TEXT DEFAULT 'MONTHLY';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'DIRECT_DEBIT';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS card_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_month INTEGER;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_generated_date TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS service_key TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS category TEXT;

-- Align columns for user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS savings_target NUMERIC;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS base_salary NUMERIC;

-- Align columns for transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- Re-establish foreign keys idempotently
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'transactions_card_id_fkey'
    ) THEN
        ALTER TABLE public.transactions 
            ADD CONSTRAINT transactions_card_id_fkey 
            FOREIGN KEY (card_id) REFERENCES public.credit_cards(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_card_id_fkey'
    ) THEN
        ALTER TABLE public.subscriptions 
            ADD CONSTRAINT subscriptions_card_id_fkey 
            FOREIGN KEY (card_id) REFERENCES public.credit_cards(id) ON DELETE SET NULL;
    END IF;
END $$;
