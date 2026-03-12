-- Create participacao_itens table
CREATE TABLE public.participacao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID REFERENCES public.processos(id) ON DELETE CASCADE NOT NULL,
  numero_item INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  valor_estimado NUMERIC(12,2),
  valor_proposta NUMERIC(12,2),
  quantidade NUMERIC(12,2),
  unidade TEXT,
  ganhou BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(processo_id, numero_item)
);

-- Enable RLS
ALTER TABLE public.participacao_itens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated can view participacao_itens" ON public.participacao_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Comercial can manage participacao_itens" ON public.participacao_itens FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial'));

-- Updated_at trigger
CREATE TRIGGER update_participacao_itens_updated_at BEFORE UPDATE ON public.participacao_itens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
