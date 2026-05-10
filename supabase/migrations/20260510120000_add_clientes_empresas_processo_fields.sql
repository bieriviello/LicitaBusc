-- Tabela de empresas do usuário (empresa principal e outras CNPJs participantes)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  is_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de clientes (órgãos compradores cadastrados)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tornar edital_id opcional (processos manuais não têm edital vinculado)
ALTER TABLE processos
  ALTER COLUMN edital_id DROP NOT NULL;

-- Adicionar novos campos ao processo
ALTER TABLE processos
  ADD COLUMN IF NOT EXISTS orgao_nome TEXT,
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS data_pregao DATE,
  ADD COLUMN IF NOT EXISTS hora_pregao TIME,
  ADD COLUMN IF NOT EXISTS portal_pregao TEXT,
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL;
