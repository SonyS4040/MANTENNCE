ALTER TABLE public.tickets
ADD COLUMN warranty_status TEXT NOT NULL DEFAULT 'خارج الضمان',
ADD COLUMN visit_date DATE;