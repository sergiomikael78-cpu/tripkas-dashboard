-- =============================================================================
-- Multi-Currency Support for Expenses
-- =============================================================================

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IDR';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS foreign_amount numeric;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS khr_to_usd_rate_snapshot numeric;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS usd_to_idr_rate_snapshot numeric;
