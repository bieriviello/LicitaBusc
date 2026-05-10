-- Create monitoramentos table for saved keyword searches
CREATE TABLE public.monitoramentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  palavra_chave TEXT NOT NULL,
  filtros JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monitoramentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own monitoramentos" ON public.monitoramentos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monitoramentos" ON public.monitoramentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monitoramentos" ON public.monitoramentos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own monitoramentos" ON public.monitoramentos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_monitoramentos_updated_at BEFORE UPDATE ON public.monitoramentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
