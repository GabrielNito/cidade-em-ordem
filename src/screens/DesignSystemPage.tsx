import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  Info,
  Map,
  MapPin,
  MoreHorizontal,
  Search,
  Settings2,
  UserRound,
} from 'lucide-react'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { ReportCategory, ReportStatus } from '../types/domain'

const colorTokens = [
  { name: 'Brand', variable: '--brand', value: '#1c5bb6', usage: 'Ações principais, links e navegação ativa' },
  { name: 'Brand dark', variable: '--brand-dark', value: '#154995', usage: 'Hover e estados de maior contraste' },
  { name: 'Brand soft', variable: '--brand-soft', value: '#eef3fb', usage: 'Seleção, fundos de apoio e ícones' },
  { name: 'Ink', variable: '--ink', value: '#202124', usage: 'Títulos e informação principal' },
  { name: 'Muted', variable: '--muted', value: '#6f7479', usage: 'Metadados e textos auxiliares' },
  { name: 'Line', variable: '--line', value: '#e2e4e7', usage: 'Divisórias e bordas discretas' },
  { name: 'Success', variable: '--success', value: '#397451', usage: 'Serviço finalizado e confirmação' },
  { name: 'Warning', variable: '--warning', value: '#9b6a23', usage: 'Ocorrência aberta e atenção' },
]

const statusExamples: ReportStatus[] = ['Aberto', 'Em atendimento', 'Finalizado']

const categoryExamples: ReportCategory[] = [
  'Buraco na via',
  'Iluminação',
  'Limpeza',
  'Sinalização',
  'Poda',
]

const tableRows = [
  { protocol: 'P-2026-0001', category: 'Buraco na via' as const, status: 'Aberto' as const, address: 'Av. Fábio Roberto Barnabé · Centro', date: '06/10/2026' },
  { protocol: 'P-2026-0002', category: 'Iluminação' as const, status: 'Em atendimento' as const, address: 'Rua Candelária · Centro', date: '02/10/2026' },
  { protocol: 'P-2026-0003', category: 'Limpeza' as const, status: 'Finalizado' as const, address: 'Rua das Primaveras · Jardim Pau Preto', date: '29/09/2026' },
]

function TokenSwatch({ name, variable, value, usage }: (typeof colorTokens)[number]) {
  return (
    <div className="ds-token-card">
      <span className="ds-color-swatch" style={{ backgroundColor: value }} aria-hidden="true" />
      <div className="ds-token-copy">
        <strong>{name}</strong>
        <code>{variable}</code>
        <small>{value} · {usage}</small>
      </div>
    </div>
  )
}

function MiniMetric({ label, value, icon: Icon, tone = '' }: { label: string; value: string; icon: typeof BarChart3; tone?: string }) {
  return (
    <div className={`ds-mini-metric ${tone}`}>
      <Icon size={17} aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

export function DesignSystemPage() {
  return (
    <main className="design-sheet">
      <div className="design-sheet-inner">
        <header className="ds-hero">
          <div className="ds-hero-brand">
            <img src="/image%208.png" alt="Cidade em Ordem" className="ds-wordmark" />
            <span className="ds-institutional-mark">
              <img src="/logo-minha-indaiatuba%20(1)%201.png" alt="" aria-hidden="true" />
              Prefeitura de Indaiatuba
            </span>
          </div>
          <div className="ds-hero-copy">
            <p className="eyebrow">Design sheet · versão 01</p>
            <h1>Uma linguagem única para cidadão, campo e gestão.</h1>
            <p>Referência visual interna para manter o Cidade em Ordem institucional, claro e consistente em telas móveis e dashboards desktop.</p>
          </div>
          <div className="ds-hero-meta">
            <span>Base: municipal e operacional</span>
            <span>Layout de referência: desktop</span>
            <span>Tokens compartilhados com o produto</span>
          </div>
        </header>

        <section className="ds-section ds-reference-section">
          <div className="ds-section-heading">
            <div>
              <p className="eyebrow">Referência do grupo</p>
              <h2>Dashboard de contexto</h2>
              <p>Usamos esta tela como referência de densidade, mapa e leitura operacional. A prioridade continua sendo o mesmo dado alimentar todos os papéis do produto.</p>
            </div>
            <span className="ds-reference-label">Imagem de contexto</span>
          </div>
          <div className="ds-reference-frame">
            <img src="/Pasted%20image.png" alt="Referência visual de dashboard desktop do projeto" />
          </div>
        </section>

        <section className="ds-section">
          <div className="ds-section-heading">
            <div>
              <p className="eyebrow">Fundação</p>
              <h2>Tokens de cor</h2>
              <p>Azul institucional para ação e navegação; neutros para a leitura; cor de status apenas quando comunica estado do serviço.</p>
            </div>
          </div>
          <div className="ds-token-grid">
            {colorTokens.map((token) => <TokenSwatch key={token.variable} {...token} />)}
          </div>
        </section>

        <section className="ds-section ds-two-columns">
          <div>
            <div className="ds-section-heading ds-section-heading-tight">
              <div>
                <p className="eyebrow">Fundação</p>
                <h2>Tipografia</h2>
              </div>
            </div>
            <div className="ds-type-scale">
              <div><span>Display / H1</span><h1>Estado da cidade</h1></div>
              <div><span>H2 / seção</span><h2>Mapa de chamados</h2></div>
              <div><span>H3 / item</span><h3>Buraco na via</h3></div>
              <div><span>Corpo</span><p>Relatos estruturados para orientar a Prefeitura e dar transparência ao cidadão.</p></div>
              <div><span>Metadado</span><small>P-2026-0001 · atualizado hoje</small></div>
            </div>
          </div>
          <div>
            <div className="ds-section-heading ds-section-heading-tight">
              <div>
                <p className="eyebrow">Fundação</p>
                <h2>Superfícies</h2>
              </div>
            </div>
            <div className="ds-surface-stack">
              <div className="ds-surface-sample ds-surface-canvas"><span>Canvas</span><strong>Fundo branco</strong><small>Conteúdo principal e mapas</small></div>
              <div className="ds-surface-sample ds-surface-panel"><span>Panel</span><strong>Cartão operacional</strong><small>Borda de 1px · raio 10px</small></div>
              <div className="ds-surface-sample ds-surface-selected"><span>Selected</span><strong>Estado selecionado</strong><small>Brand soft · ação contextual</small></div>
            </div>
          </div>
        </section>

        <section className="ds-section">
          <div className="ds-section-heading">
            <div>
              <p className="eyebrow">Vocabulário visual</p>
              <h2>Status e categorias</h2>
              <p>Status comunica o andamento; categoria comunica o tipo de zeladoria. Nenhum dos dois deve depender apenas de cor.</p>
            </div>
          </div>
          <div className="ds-component-grid">
            <div className="ds-showcase-card">
              <span className="ds-showcase-label">StatusBadge</span>
              <div className="ds-inline-examples">
                {statusExamples.map((status) => <StatusBadge key={status} status={status} />)}
              </div>
              <div className="ds-inline-examples">
                {statusExamples.map((status) => <StatusBadge key={status} status={status} compact />)}
              </div>
            </div>
            <div className="ds-showcase-card">
              <span className="ds-showcase-label">CategoryIcon</span>
              <div className="ds-category-grid">
                {categoryExamples.map((category) => <div key={category} className="ds-category-example"><CategoryIcon category={category} /><span>{category}</span></div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="ds-section">
          <div className="ds-section-heading">
            <div>
              <p className="eyebrow">Primitivos</p>
              <h2>Ações e controles</h2>
              <p>Controles compactos no desktop, confortáveis no toque e com estados de foco visíveis.</p>
            </div>
          </div>
          <div className="ds-controls-grid">
            <div className="ds-showcase-card ds-action-showcase">
              <span className="ds-showcase-label">Buttons</span>
              <div className="ds-button-row"><button className="button-primary">Ação principal</button><button className="button-secondary">Ação secundária</button><button className="button-danger">Ação de risco</button></div>
              <div className="ds-button-row"><button className="button-primary button-small"><CheckCircle2 size={15} /> Confirmar</button><button className="icon-button" aria-label="Abrir configurações"><Settings2 size={17} /></button><button className="icon-button" aria-label="Mais opções"><MoreHorizontal size={17} /></button></div>
            </div>
            <div className="ds-showcase-card ds-form-showcase">
              <span className="ds-showcase-label">Form controls</span>
              <label className="ds-demo-field"><span>Categoria</span><select className="select-input" defaultValue="Buraco na via"><option>Buraco na via</option><option>Iluminação</option></select></label>
              <label className="ds-demo-field"><span>Busca</span><span className="ds-input-with-icon"><Search size={15} /><input className="text-input" placeholder="Protocolo, endereço ou região" /></span></label>
            </div>
          </div>
        </section>

        <section className="ds-section">
          <div className="ds-section-heading">
            <div>
              <p className="eyebrow">Composição desktop</p>
              <h2>Shell municipal</h2>
              <p>A estrutura-base para gestão e equipe: navegação persistente, contexto explícito, métricas objetivas e conteúdo em painel.</p>
            </div>
          </div>
          <div className="ds-app-preview">
            <aside className="ds-preview-sidebar">
              <div className="ds-preview-brand"><span className="ds-preview-mark">CO</span><span><strong>Cidade em Ordem</strong><small>Indaiatuba</small></span></div>
              <div className="ds-preview-context"><MapPin size={15} /><span><small>Contexto atual</small><strong>Gestão municipal</strong></span></div>
              <nav className="ds-preview-nav" aria-label="Exemplo de navegação desktop">
                <span className="ds-preview-nav-active"><BarChart3 size={17} />Dashboard</span>
                <span><Map size={17} />Mapa operacional</span>
                <span><ClipboardList size={17} />Ordens de serviço</span>
                <span><FileText size={17} />Relatórios</span>
              </nav>
              <small className="ds-preview-footer">Protótipo de demonstração</small>
            </aside>
            <div className="ds-preview-main">
              <div className="ds-preview-topbar"><span>Gestão municipal</span><span className="ds-preview-user"><span className="avatar">MA</span> Mariana Alves <UserRound size={15} /></span></div>
              <div className="ds-preview-content">
                <div className="ds-preview-heading"><div><p className="eyebrow">Visão geral</p><h3>Dashboard de zeladoria</h3><small>Acompanhe as ocorrências registradas e o andamento dos serviços.</small></div><button className="button-secondary button-small">Dados da demonstração</button></div>
                <div className="ds-mini-metric-grid"><MiniMetric label="Abertos" value="06" icon={ClipboardList} tone="ds-metric-open" /><MiniMetric label="Em atendimento" value="04" icon={Settings2} tone="ds-metric-progress" /><MiniMetric label="Finalizados" value="06" icon={CheckCircle2} tone="ds-metric-done" /><MiniMetric label="Tempo médio" value="2,4 dias" icon={BarChart3} /></div>
                <div className="ds-preview-panel"><div className="ds-preview-panel-heading"><span><p className="eyebrow">Distribuição geográfica</p><strong>Mapa de chamados</strong></span><button className="icon-button" aria-label="Mais opções do mapa"><MoreHorizontal size={17} /></button></div><div className="ds-map-placeholder"><span className="ds-map-road ds-map-road-one" /><span className="ds-map-road ds-map-road-two" /><span className="ds-map-road ds-map-road-three" /><i className="ds-map-pin ds-map-pin-one" /><i className="ds-map-pin ds-map-pin-two" /><i className="ds-map-pin ds-map-pin-three" /><span className="ds-map-label">Indaiatuba</span></div></div>
                <div className="ds-preview-table"><div className="ds-table-heading"><strong>Ordens recentes</strong><button className="text-link">Ver todas</button></div>{tableRows.map((row) => <div className="ds-table-row" key={row.protocol}><span className="ds-table-category"><CategoryIcon category={row.category} size="sm" /><strong>{row.protocol}</strong></span><span>{row.category}</span><StatusBadge status={row.status} compact /><span>{row.address}</span><span>{row.date}</span></div>)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="ds-section ds-guidance-section">
          <div className="ds-guidance-icon"><Info size={18} /></div>
          <div><p className="eyebrow">Regra de uso</p><h2>O design sheet é a fonte visual; o domínio continua sendo a fonte funcional.</h2><p>Esta referência não adiciona prioridade, ranking ou novos status. A imagem de contexto orienta densidade e composição; as regras oficiais de ocorrência, confirmação e atendimento continuam valendo.</p></div>
        </section>
      </div>
    </main>
  )
}
