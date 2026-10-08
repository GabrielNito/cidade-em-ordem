# Cidade em Ordem — Especificação Técnica e Estado do Projeto (SPEC.md)

**Versão:** 1.0.0 (Pós-iteração: Intervenções Programadas e Roteamento Viário Real)  
**Ambiente:** Hackathon Fatec Indaiatuba 2026  
**Status do Projeto:** MVP frontend-only funcional, mobile-first, com simulação local em memória/localStorage e roteamento georreferenciado via OpenStreetMap/OSRM.

---

## 1. Visão Geral e Propósito

O **Cidade em Ordem** é um aplicativo cívico e operacional voltado à zeladoria urbana do município de **Indaiatuba/SP**. O sistema unifica três pontas fundamentais da administração pública:
1. **Cidadão (`CITIZEN`):** Relato colaborativo de ocorrências (buracos, iluminação, limpeza, podas, sinalização), acompanhamento em tempo real, confirmação comunitária de problemas e consulta a **intervenções programadas** (obras e interdições de trânsito) antes de chegar aos locais.
2. **Equipe de Campo (`FIELD_AGENT`):** Visualização de ordens de serviço distribuídas, roteiro diário traçado sobre vias públicas reais, atendimento passo a passo, registro fotográfico de conclusão e consulta a bloqueios de trânsito ativos.
3. **Gestão Municipal (`MANAGER`):** Torre de controle e despacho logístico, indicadores executivos de atendimento, planejamento otimizado de itinerários de viaturas por vizinho mais próximo, e central de cadastro, edição e cancelamento de **intervenções programadas e comunicados preventivos**.

> **Nota de Arquitetura:** O projeto opera atualmente como MVP frontend-only. Não há banco de dados SQL ou backend externo obrigatório; o estado é orquestrado via `AppContext` React com persistência determinística no `localStorage` do navegador e endpoint proxy Next.js em memória para geometrias viárias.

---

## 2. Stack Tecnológica e Ferramental

- **Framework Web:** Next.js 16.4.0 (Turbopack, App Router, React Server / Client Components)
- **Biblioteca de Interface:** React 19.3.0 & React DOM 19.3.0
- **Linguagem:** TypeScript 5.7.2 (tipagem estrita, `--noEmit` verificado)
- **Estilização e Design System:** Tailwind CSS 4.0 / 4.1 (`@tailwindcss/postcss`) + `src/styles.css` (design tokens, temas de alto contraste, variáveis CSS institucionais, suporte a `prefers-reduced-motion`)
- **Mapas e Georreferenciamento:**
  - Leaflet 1.9.4 & React-Leaflet 5.0.0
  - Camada base: OpenStreetMap padrão (`tile.openstreetmap.org`)
  - Roteamento viário: OSRM (Open Source Routing Machine) via rota proxy interna Next.js (`/api/route-path`) com fallback em cascata
- **Componentes Acessíveis:**
  - Radix UI (`@radix-ui/react-select`)
  - Vaul 1.1.2 (Bottom Sheets e Drawers no padrão mobile)
  - Lucide React 0.468.0 (iconografia vetorial institucional)
- **Testes e Qualidade:**
  - Vitest 2.1.8 & JSDOM 25.0.1 (26 testes unitários e de integração passando)
  - ESLint 9.17.0 com regras de React Hooks e TypeScript
  - Playwright (testes automatizados de jornada visual em Chromium headless)

---

## 3. Estrutura de Diretórios e Arquivos

```
/home/local/www/projeto/
├── app/
│   ├── api/
│   │   └── route-path/route.ts      # Endpoint proxy com cache em memória para roteamento viário OSRM
│   ├── app/                         # Rotas do Cidadão (layout com AppShell e bottom-nav)
│   │   ├── chamados/                # Listagem e detalhe de ocorrências
│   │   ├── mapa/                    # Mapa interativo principal com camadas de ocorrências e intervenções
│   │   ├── nova-ocorrencia/         # Fluxo guiado em 3 etapas para criar chamado
│   │   └── perfil/                  # Perfil do cidadão e seletor de contexto
│   ├── campo/                       # Rotas da Equipe Operacional de Campo
│   │   ├── ordens/                  # Lista de ordens e visualizador da rota do dia da viatura
│   │   └── perfil/                  # Perfil do operador
│   ├── gestao/                      # Rotas da Gestão Municipal
│   │   ├── dashboard/               # Painel com 4 abas (Visão Geral, Rotas, Intervenções, Equipes)
│   │   └── perfil/                  # Perfil do gestor
│   ├── design-system/               # Design sheet interno com tokens visuais e componentes
│   ├── login/                       # Tela de autenticação simulada com gov.br
│   ├── layout.tsx                   # Root layout com AppProvider e viewport
│   └── page.tsx                     # Redirecionamento inicial baseado em sessão ativa
├── src/
│   ├── components/
│   │   ├── interventions/           # Módulo de intervenções programadas
│   │   │   ├── InterventionDrawer.tsx            # Bottom sheet de detalhes da intervenção para o cidadão
│   │   │   └── InterventionManagementSection.tsx # Painel de cadastro, edição, mapa e cancelamento para a gestão
│   │   ├── maps/                    # Componentes de mapa
│   │   │   ├── IssueMap.tsx         # Wrapper dinâmico SSR:false para Leaflet
│   │   │   ├── IssueMapClient.tsx   # Renderizador Leaflet com polylines, marcadores e camadas
│   │   │   ├── OccurrenceDrawer.tsx # Drawer de ocorrência do cidadão
│   │   │   └── MapFilterAccordion.tsx# Acordeão de filtros
│   │   ├── notifications/
│   │   │   └── NotificationDrawer.tsx# Central de notificações e avisos municipais
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Shell responsivo (Sidebar no desktop, Topbar e BottomNav no mobile)
│   │   │   └── BottomNavigation.tsx  # Barra de navegação inferior mobile com botão de ação central
│   │   ├── reports/                 # Formulários, cartões e timeline de ocorrências
│   │   └── ui/                      # Badges, frames de fotos e ícones
│   ├── context/
│   │   └── AppContext.tsx           # Contexto compartilhado (sessão, reports, intervenções, notificações)
│   ├── data/
│   │   ├── crew.ts                  # Equipes de campo e viaturas de Indaiatuba
│   │   ├── mockInterventions.ts     # Dados demonstrativos de intervenções (obras e interdições)
│   │   ├── mockNotifications.ts     # Avisos oficiais e notificações do app
│   │   └── mockReports.ts           # Ocorrências iniciais e fotos mockadas
│   ├── navigation.tsx               # Adaptador de navegação compatível com App Router
│   ├── services/
│   │   ├── reportRepository.ts      # Repositório de ocorrências (chamados) com persistência local
│   │   ├── reportRepository.test.ts # Testes unitários do repositório de ocorrências
│   │   ├── interventionRepository.ts# Repositório de intervenções programadas com validações
│   │   └── interventionRepository.test.ts # Testes unitários do repositório de intervenções
│   ├── types/
│   │   └── domain.ts                # Modelos de domínio TypeScript estritos
│   ├── utils/
│   │   ├── access.ts                # Regras de acesso e papéis de usuário
│   │   ├── geo.ts                   # Cálculo de distâncias (Haversine e vias reais via OSRM) e TSP
│   │   ├── geo.test.ts              # Testes unitários de geo helpers
│   │   ├── intervention.ts          # Utilitários de data/hora (fuso SP), status, impacto e validação
│   │   ├── intervention.test.ts     # Testes unitários dos utilitários de intervenção
│   │   ├── report.ts                # Formatação de chamados, prazos e categorias
│   │   └── report.test.ts           # Testes unitários de helpers de chamados
│   └── styles.css                   # Folha de estilos central e design system
├── GATES.md                         # Contratos de qualidade, regressão e acessibilidade
├── package.json                     # Scripts e dependências
└── README.md                        # Guia de execução
```

---

## 4. Modelos de Domínio e Separação de Conceitos

### 4.1 Ocorrência de Zeladoria (`Report`) vs Intervenção Programada (`ScheduledIntervention`)

> ⚠️ **Princípio Fundamental:** Uma Ocorrência (`Report`) **NUNCA** deve ser misturada com uma Intervenção (`ScheduledIntervention`). São entidades com modelos, repositórios, ciclos de vida e impactos operacionais completamente distintos.

| Atributo / Aspecto | Ocorrência (`Report`) | Intervenção Programada (`ScheduledIntervention`) |
| :--- | :--- | :--- |
| **Origem** | Cidadão ou balcão presencial | Gestão Municipal exclusivamente |
| **Ciclo de Estados** | `Aberto` → `Em atendimento` → `Finalizado` | `Programada` → `Em andamento` → `Encerrada` → `Cancelada` |
| **Geometria** | Ponto único (`latitude`, `longitude`) | Sequência de pontos (`GeoPoint[]`, mín. 2 pontos formando `Polyline`) |
| **Horários** | Data de abertura (`createdAt`) e conclusão | Intervalo previsto (`startsAt` e `endsAt`) |
| **Independência do Relógio** | Conclusão manual com foto | Fim do prazo previsto **NÃO** encerra a obra automaticamente |
| **Representação no Mapa** | Marcador em gota colorido com ícone da categoria | Linha destacada âmbar/laranja + escudo de aviso de trânsito |
| **Chave de Armazenamento** | `cidade-em-ordem:reports:v1` | `cidade-em-ordem:interventions:v1` |

### 4.2 Definições de Tipos (`src/types/domain.ts`)

```typescript
// Papéis de Usuário
export type UserRole = 'CITIZEN' | 'FIELD_AGENT' | 'MANAGER'

// Ocorrências de Zeladoria
export type ReportStatus = 'Aberto' | 'Em atendimento' | 'Finalizado'
export type ReportCategory = 'Buraco na via' | 'Iluminação' | 'Limpeza' | 'Sinalização' | 'Poda'

export interface Report {
  id: string
  protocol: string
  category: ReportCategory
  description: string
  latitude: number
  longitude: number
  region: string
  address?: string
  createdAt: string
  status: ReportStatus
  citizen: DemoUser
  confirmations: string[]
  photo?: string
  assignedTo?: string
  startedAt?: string
  finishedAt?: string
  completionPhoto?: string
}

// Intervenções Programadas
export type InterventionStatus = 'Programada' | 'Em andamento' | 'Encerrada' | 'Cancelada'
export type InterventionType = 'Manutenção viária' | 'Interdição' | 'Sinalização' | 'Infraestrutura' | 'Outros'
export type InterventionImpact = 'Interdição total' | 'Interdição parcial' | 'Restrição de acesso' | 'Possível lentidão'

export interface ScheduledIntervention {
  id: string
  title: string
  description: string
  type: InterventionType
  affectedLocation: string
  geometry: GeoPoint[]
  startsAt: string
  endsAt: string
  impact: InterventionImpact
  guidance?: string
  status: InterventionStatus
  createdAt: string
  updatedAt: string
  createdBy?: string
}

// Central de Notificações
export type NotificationType = 'STATUS_UPDATE' | 'COMMUNITY_SUPPORT' | 'SERVICE_COMPLETED' | 'OFFICIAL_ALERT'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  protocol?: string
  reportId?: string
  interventionId?: string
  affectedLocation?: string
  startsAt?: string
  endsAt?: string
  impact?: InterventionImpact
  read: boolean
  createdAt: string
}
```

---

## 5. Módulos e Fluxos Principais

### 5.1 Cidadão (`CITIZEN`)
- **Login:** Acesso simulado via gov.br com delay natural de 700ms.
- **Mapa Interativo (`/app/mapa`):**
  - Exibe marcadores de ocorrências e trechos de obras/intervenções.
  - Controle de Camadas discreto: `[x] Ocorrências`, `[x] Intervenções programadas`.
  - Filtros de Categoria e Status para chamados.
  - Geoposicionamento do dispositivo com fallback gracioso.
  - Ao tocar em um trecho de intervenção: abre o `InterventionDrawer` com dados de trânsito, período e desvios.
- **Central de Notificações (Sino no topo):**
  - Notifica chamados atualizados e comunicados oficiais de intervenção urbana.
  - Cards enriquecidos com trecho afetado, período previsto e impacto viário.
  - Ao clicar no aviso: navega ao mapa, centraliza no trecho e abre o drawer correspondente.
- **Novo Chamado (`/app/nova-ocorrencia`):**
  - Fluxo em 3 etapas com indicador de progresso e barra de acessibilidade (ajuste de texto).

### 5.2 Gestão Municipal (`MANAGER`)
- **Centro Integrado de Zeladoria Urbana (`/gestao/dashboard`):**
  - **Aba 1: Visão Geral & Mapa:** KPIs de atendimento, taxa de resolução SLA (92%+), distribuição por bairro e mapa consolidado com ocorrências e intervenções ativas.
  - **Aba 2: Planejador de Rotas de Campo:** Seleção de ordens pendentes, otimização automática de rota (algoritmo TSP vizinho mais próximo), traçado geométrico real pelas ruas de Indaiatuba via OSRM, cálculo de distância viária real (`~3.7 km`) e despacho operacional para viaturas.
  - **Aba 3: Intervenções Programadas e Obras:**
    - Indicadores: Total, Programadas, Em andamento, Encerradas, Canceladas.
    - Subfiltros rápidos por situação administrativa.
    - Mapa municipal interativo com todos os trechos demarcados.
    - Formulário de cadastro/edição com seletor de pontos interativo no mapa (mínimo 2 pontos), atalhos de vias de Indaiatuba (Av. Conceição, Av. Pres. Kennedy, Marginal) e validações cronológicas.
    - Alteração de situação em 1 clique (`Programada` ↔ `Em andamento` ↔ `Encerrada` ↔ `Cancelada`) e cancelamento com registro de justificativa.
  - **Aba 4: Equipes & Colaboradores:** Quadro operacional de viaturas e responsáveis técnicos.

### 5.3 Operação de Campo (`FIELD_AGENT`)
- **Ordens de Serviço (`/campo/ordens`):**
  - Alternância entre Lista de Ordens e **Execução da Rota de Hoje**.
  - A rota do dia segue o itinerário despachado pela Gestão Central, desenhado com geometria viária real nas ruas e camadas de interdições visíveis para prevenir bloqueios.
  - Execução passo a passo (iniciar atendimento → concluir com registro fotográfico).

---

## 6. Persistência Local e Chaves de `localStorage`

Todas as transições persistem localmente permitindo demonstração sem servidor backend:
- `cidade-em-ordem:session:v1` — Sessão do usuário autenticado e contexto (`role`).
- `cidade-em-ordem:reports:v1` — Coleção de ocorrências de zeladoria.
- `cidade-em-ordem:interventions:v1` — Coleção de intervenções programadas e obras.
- `cidade-em-ordem:notifications:v1` — Histórico de notificações lidas e não lidas.
- `cidade-em-ordem:active-route:v1` — Roteiro de viatura despachado pela gestão.
- `cidade-em-ordem:large-text` — Preferência de acessibilidade de tamanho de leitura.

---

## 7. Roteamento Viário Real e Geometria de Vias

O cálculo de rotas no mapa não utiliza linhas retas secantes euclidianas:
- **Motor:** Open Source Routing Machine (OSRM) com mapa OpenStreetMap.
- **Endpoint interno:** `/api/route-path?points=lat1,lng1;lat2,lng2...`
  - Cache em memória no servidor Next.js para resposta instantânea em rotas já calculadas.
  - Timeout de 4000ms com fallback gracioso.
- **Fallback tiering:** Proxy Next.js → Consulta direta OSRM client-side com CORS aberto → Interpolação euclidiana caso offline.
- **Estilo Leaflet:** Dupla camada visual (`#0d5257` outer glow com `lineJoin: 'round'` + `#185a4e` inner road core).

---

## 8. Contratos de Qualidade e Governança (`GATES.md`)

O projeto segue 14 regras rígidas de conformidade (Gates G0 a G13):
- **G0–G4:** Validação do ledger, toolchain Next.js, verificação de tipos (`tsc --noEmit`), linter (`eslint`) e build de produção (`next build`).
- **G6:** Contrato do mapa base (requer estritamente `'tile.openstreetmap.org'` e `'OpenStreetMap contributors'`; proíbe qualquer dependência de chaves de API pagas ou serviços quebrados).
- **G7:** Navegação móvel preservando ação primária de relatório isolada das abas.
- **G10:** Copy institucional verossímil: proíbe textos com termos como "Acesso simulado para demonstração" ou "Modo de demonstração" nas telas do cidadão; exige termos cidadãos como "Bem-vinda" e "Solicitação enviada".
- **G11:** Acessibilidade: alvos de toque com altura mínima de 44px (`min-height: 44px`), conformidade com `prefers-reduced-motion: reduce`.

---

## 9. Comandos Úteis

```bash
# Instalação
npm install

# Desenvolvimento local
npm run dev

# Checagem de tipagem estrita
npm run typecheck

# Análise estática (ESLint)
npm run lint

# Execução dos 26 testes unitários e de integração
npm test

# Compilação de produção
npm run build
```

---

## 10. Status Atual de Entrega

- ✅ Traçado de rotas por vias reais implementado e verificado (OSRM).
- ✅ Modelo `ScheduledIntervention` criado e desacoplado de `Report`.
- ✅ Painel de Gestão de Intervenções com mapa interativo, formulário, validações e cancelamento implementado.
- ✅ Camada de intervenções destacada no mapa do cidadão com badges distintas e controle de camadas.
- ✅ `InterventionDrawer` e Central de Notificações com navegação direta ao mapa funcionando perfeitamente.
- ✅ 26 testes passando em `vitest`, static checks 100% limpos, `next build` bem-sucedido.
- ✅ E2E Playwright verificado e comprovado com capturas visuais em `scratch/`.
