-- Add a column to store the commission rate for each engineer
ALTER TABLE public.engineers
ADD COLUMN commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.10;

-- Add a constraint to ensure the rate is valid (between 0% and 100%)
ALTER TABLE public.engineers
ADD CONSTRAINT commission_rate_check CHECK (commission_rate >= 0 AND commission_rate <= 1);