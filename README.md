# LicitaBusc

Plataforma inteligente para busca, acompanhamento e gestão de licitações públicas no Brasil.

## 🚀 Funcionalidades

- **Busca Unificada** — Consulta simultânea em PNCP, ComprasGov Legado e Pregões Eletrônicos
- **Kanban de Processos** — Acompanhamento visual do fluxo de licitações (triagem → disputa → homologação)
- **Propostas Comerciais** — Gestão de propostas com cálculo de margem e impostos
- **Monitoramentos** — Alertas personalizados para novas oportunidades de licitação
- **Dashboard** — Métricas e prazos críticos em tempo real
- **Calendário** — Visualização de prazos e compromissos semanais
- **Análise com IA** — Análise inteligente de editais e documentos
- **Multi-portal** — Importação automática com detecção de portal (PNCP, Legado 8.666, Pregões)

## 🛠 Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Estilo | Tailwind CSS + shadcn/ui |
| Estado | React Query (TanStack Query) |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| API | ComprasGov (PNCP, Legado, Pregões) |
| Deploy | Vercel |

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/licitabusc.git
cd licitabusc

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:8080`.

## 📁 Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
│   ├── Editais/      # Componentes da busca de editais
│   ├── Processos/    # Kanban board e cards de processos
│   └── ui/           # shadcn/ui components
├── hooks/            # Hooks customizados (React Query)
├── integrations/     # APIs externas (ComprasGov, Supabase)
├── pages/            # Páginas da aplicação
├── services/         # Serviços de negócio
├── types/            # TypeScript types
├── constants/        # Status, labels, configurações
└── lib/              # Utilitários e formatadores
```

## 🧪 Testes

```bash
# Rodar testes
npm test

# Rodar em modo watch
npm run test:watch

# Type-check
npx tsc --noEmit
```

## 🔧 Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima pública do Supabase |

## 📜 Licença

Projeto privado — Todos os direitos reservados.
