-- Create engineers table
CREATE TABLE public.engineers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for engineers table
ALTER TABLE public.engineers ENABLE ROW LEVEL SECURITY;

-- Policies for engineers table (allowing authenticated users to manage them)
CREATE POLICY "Authenticated users can view engineers" ON public.engineers
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert engineers" ON public.engineers
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update engineers" ON public.engineers
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete engineers" ON public.engineers
FOR DELETE TO authenticated USING (true);

-- Add foreign key to tickets table to link an engineer
ALTER TABLE public.tickets
ADD COLUMN assigned_engineer_id UUID REFERENCES public.engineers(id) ON DELETE SET NULL;

-- Insert some sample engineers to start with
INSERT INTO public.engineers (name) VALUES ('أحمد علي'), ('محمد صالح'), ('خالد عبدالله');