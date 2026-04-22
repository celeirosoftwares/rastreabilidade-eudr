# 🌿 RastreiO — Plataforma de Rastreabilidade EUDR

Sistema SaaS multi-tenant para rastreabilidade de produção agrícola conforme o **Regulamento (UE) 2023/1115** (EUDR — EU Deforestation Regulation).

---

## 🗂️ Estrutura do Projeto

```
eudr-platform/
├── database/
│   └── schema.sql                    # Schema completo do Supabase com RLS
│
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/page.tsx        # Tela de login
│   │   │   └── signup/page.tsx       # Tela de cadastro
│   │   └── dashboard/
│   │       ├── layout.tsx            # Layout com sidebar e topbar
│   │       ├── page.tsx              # Dashboard com métricas
│   │       ├── properties/
│   │       │   ├── page.tsx          # Lista de propriedades
│   │       │   └── new/page.tsx      # Formulário de nova propriedade
│   │       ├── areas/
│   │       │   ├── page.tsx          # Lista de áreas
│   │       │   └── new/page.tsx      # Formulário + mapa Mapbox
│   │       ├── lots/
│   │       │   ├── page.tsx          # Lista de lotes
│   │       │   ├── new/page.tsx      # Formulário dinâmico por cultura
│   │       │   └── [id]/page.tsx     # Detalhe do lote + timeline
│   │       └── reports/
│   │           ├── page.tsx          # Lista de relatórios
│   │           └── [lotId]/page.tsx  # Relatório EUDR individual
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Navegação lateral
│   │   │   └── TopBar.tsx            # Barra superior
│   │   ├── map/
│   │   │   └── AreaMap.tsx           # Mapa Mapbox com draw de polígonos
│   │   └── lots/
│   │       ├── EventTimeline.tsx     # Timeline de eventos do lote
│   │       └── AddEventForm.tsx      # Formulário de adição de evento
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Cliente browser
│   │   │   └── server.ts             # Cliente server (SSR)
│   │   └── actions/
│   │       ├── auth.ts               # Login, signup, logout
│   │       ├── properties.ts         # CRUD propriedades
│   │       ├── areas.ts              # CRUD áreas
│   │       └── lots.ts               # CRUD lotes + eventos + webhook
│   │
│   └── types/
│       └── index.ts                  # Types TypeScript globais
│
├── middleware.ts                      # Proteção de rotas autenticadas
├── tailwind.config.ts
├── package.json
└── .env.local.example
```

---

## 🚀 Como rodar

### 1. Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Token do [Mapbox](https://mapbox.com)

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.local.example .env.local
# Edite o arquivo com suas chaves
```

### 4. Configurar banco de dados
No painel do Supabase, vá em **SQL Editor** e execute o arquivo `database/schema.sql`.

### 5. Rodar o servidor de desenvolvimento
```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 🧩 Funcionalidades implementadas

| Módulo | Status |
|--------|--------|
| Autenticação (login / signup) | ✅ |
| Multi-tenant (RLS por organização) | ✅ |
| Dashboard com métricas | ✅ |
| Cadastro de propriedades | ✅ |
| Áreas com mapa Mapbox + draw de polígono | ✅ |
| Lotes com formulário dinâmico por cultura | ✅ |
| Suporte a café, soja e cana-de-açúcar | ✅ |
| Timeline de eventos por lote | ✅ |
| Relatório EUDR com checklist de conformidade | ✅ |
| Hook de webhook para n8n | ✅ (preparado) |
| Row Level Security no Supabase | ✅ |

---

## 🔭 Próximos passos (roadmap)

- [ ] Integração com API PRODES/MapBiomas para verificação de desmatamento
- [ ] Geração de PDF do relatório EUDR (via Puppeteer ou react-pdf)
- [ ] Score de risco automatizado por área
- [ ] Envio de documentos (Supabase Storage)
- [ ] Dashboard de conformidade multi-propriedade
- [ ] Exportação em formato DDS (Due Diligence Statement) para portal da UE
- [ ] Notificações via WhatsApp (n8n)
- [ ] App mobile (React Native / Expo)

---

## 🛠️ Stack técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router) + TailwindCSS |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Mapas | Mapbox GL JS + MapboxDraw |
| Server Actions | Next.js Server Actions |
| Tipos | TypeScript |
| Ícones | Lucide React |

---

## 🔐 Segurança

- Row Level Security (RLS) ativo em todas as tabelas
- Isolamento de dados por `organization_id`
- Middleware de proteção de rotas autenticadas
- Webhook com secret para integração n8n

---

*RastreiO — Rastreabilidade do campo à União Europeia.*
