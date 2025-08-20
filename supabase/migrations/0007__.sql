-- Create the table to store itemized maintenance costs
CREATE TABLE public.maintenance_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (IMPORTANT FOR SECURITY)
ALTER TABLE public.maintenance_costs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow authenticated users (engineers/staff) to manage costs
CREATE POLICY "Allow authenticated users to view costs"
ON public.maintenance_costs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert costs"
ON public.maintenance_costs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update costs"
ON public.maintenance_costs FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete costs"
ON public.maintenance_costs FOR DELETE
TO authenticated
USING (true);

-- Also, remove the old single cost column from the tickets table
ALTER TABLE public.tickets
DROP COLUMN maintenance_cost;