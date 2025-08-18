-- Create a sequence for the human-readable ticket reference number
CREATE SEQUENCE public.ticket_ref_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create the main table to store maintenance tickets
CREATE TABLE public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ticket_ref TEXT NOT NULL UNIQUE DEFAULT ('TICKET-' || nextval('public.ticket_ref_seq')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  device_type TEXT NOT NULL,
  serial_number TEXT,
  fault_description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'عادي',
  status TEXT NOT NULL DEFAULT 'مفتوح',
  attachment_url TEXT
);

-- Enable Row Level Security (RLS) for the table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create Policies for data access:
-- 1. Allow anyone to create a new ticket (for the public form)
CREATE POLICY "Public can create tickets" ON public.tickets
FOR INSERT WITH CHECK (true);

-- 2. Allow authenticated users (staff) to view all tickets
CREATE POLICY "Authenticated users can view tickets" ON public.tickets
FOR SELECT TO authenticated USING (true);

-- 3. Allow authenticated users (staff) to update tickets
CREATE POLICY "Authenticated users can update tickets" ON public.tickets
FOR UPDATE TO authenticated USING (true);

-- Note: Deleting tickets is restricted to admin roles by default (no policy for DELETE)