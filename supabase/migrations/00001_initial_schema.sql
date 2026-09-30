-- Initial Schema for Drachma
-- Generated automatically

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    
    currency TEXT NOT NULL DEFAULT 'BRL',
    user_name TEXT NOT NULL,
    user_photo TEXT,
    theme TEXT NOT NULL DEFAULT 'light'
);

-- Table: credit_cards
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    
    name TEXT NOT NULL,
    bank TEXT NOT NULL,
    type TEXT NOT NULL,
    brand TEXT,
    last_four TEXT,
    color TEXT,
    "limit" NUMERIC,
    closing_day INTEGER,
    due_day INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Table: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Table: initial_balances
CREATE TABLE IF NOT EXISTS public.initial_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    
    amount NUMERIC NOT NULL,
    date TEXT NOT NULL
);

-- Table: salary_info
CREATE TABLE IF NOT EXISTS public.salary_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    
    gross NUMERIC NOT NULL,
    discounts JSONB
);

-- Table: transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    entry_type TEXT NOT NULL,
    tags JSONB,
    type TEXT,
    financial_group TEXT,
    payment_method TEXT,
    card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    comment TEXT,
    is_fixed BOOLEAN,
    recurrence_frequency TEXT,
    recurrence_end_mode TEXT,
    recurrence_count INTEGER,
    recurrence_excluded_dates JSONB,
    is_installment BOOLEAN,
    installment_info JSONB,
    batch_id TEXT,
    batch_name TEXT,
    import_date TEXT,
    recurrence_index INTEGER,
    recurrence_total INTEGER
);

-- RLS Configuration
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initial_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies for user_settings
CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON public.user_settings FOR DELETE USING (auth.uid() = user_id);

-- Policies for credit_cards
CREATE POLICY "Users can view their own cards" ON public.credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cards" ON public.credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cards" ON public.credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cards" ON public.credit_cards FOR DELETE USING (auth.uid() = user_id);

-- Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Policies for initial_balances
CREATE POLICY "Users can view their own initial balances" ON public.initial_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own initial balances" ON public.initial_balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own initial balances" ON public.initial_balances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own initial balances" ON public.initial_balances FOR DELETE USING (auth.uid() = user_id);

-- Policies for salary_info
CREATE POLICY "Users can view their own salary info" ON public.salary_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own salary info" ON public.salary_info FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own salary info" ON public.salary_info FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own salary info" ON public.salary_info FOR DELETE USING (auth.uid() = user_id);

-- Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);
