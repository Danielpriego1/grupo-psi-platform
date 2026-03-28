
-- Add subcategory and spec_pdf_url columns to inventory
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS spec_pdf_url text;

-- Allow public (unauthenticated) read access to inventory for the public catalog
CREATE POLICY "Public can view inventory" ON public.inventory FOR SELECT TO anon USING (true);
