-- Migration: Add lote and product relationship to participacao_itens
-- Add lote (string) and product reference (UUID)
ALTER TABLE public.participacao_itens ADD COLUMN IF NOT EXISTS lote TEXT;
ALTER TABLE public.participacao_itens ADD COLUMN IF NOT EXISTS produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL;

-- Ensure produtos table has basic structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'sku') THEN
        ALTER TABLE public.produtos ADD COLUMN sku TEXT;
    END IF;
END $$;

-- Insert fictional stock
-- Using ON CONFLICT to avoid errors on multiple runs
INSERT INTO public.produtos (nome, sku, estoque, preco_custo, updated_at)
VALUES 
    ('Notebook HighEnd Pro', 'NB-001', 50, 4500.00, now()),
    ('Cadeira Ergonômica Office', 'CH-002', 120, 850.00, now()),
    ('Impressora Laser Jet Business', 'PR-003', 30, 1200.00, now()),
    ('Monitor 27" 4K HDR', 'MN-004', 85, 1800.00, now()),
    ('Teclado Mecânico RGB', 'KB-005', 200, 250.00, now()),
    ('Mouse Gamer Wireless', 'MS-006', 300, 150.00, now()),
    ('Projetor Full HD 4000 Lumens', 'PJ-007', 15, 3200.00, now())
ON CONFLICT DO NOTHING;
