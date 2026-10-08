'use client'

import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle2,
  Cone,
  Edit3,
  MapPin,
  Plus,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import type {
  CreateInterventionInput,
  GeoPoint,
  InterventionImpact,
  InterventionStatus,
  InterventionType,
  ScheduledIntervention,
} from '../../types/domain'
import {
  formatInterventionDateRange,
  interventionImpactStyles,
  interventionStatusStyles,
  isPendingManagementUpdate,
} from '../../utils/intervention'
import { IssueMap } from '../maps/IssueMap'

const INTERVENTION_TYPES_OPTIONS: readonly InterventionType[] = [
  'Manutenção viária',
  'Interdição',
  'Sinalização',
  'Infraestrutura',
  'Outros',
]

const INTERVENTION_IMPACTS_OPTIONS: readonly InterventionImpact[] = [
  'Interdição total',
  'Interdição parcial',
  'Restrição de acesso',
  'Possível lentidão',
]

const DEMO_INDAIATUBA_PRESETS = [
  {
    name: 'Av. Conceição (Vila Maria / Centro)',
    location: 'Av. Conceição, entre Rua dos Indaiás e Av. Presidente Vargas',
    points: [
      { latitude: -23.0815, longitude: -47.205 },
      { latitude: -23.0832, longitude: -47.2085 },
      { latitude: -23.0855, longitude: -47.212 },
    ],
  },
  {
    name: 'Av. Pres. Kennedy (Cidade Nova)',
    location: 'Av. Presidente Kennedy, proximidades do cruzamento com Rua Tuiuti',
    points: [
      { latitude: -23.0825, longitude: -47.214 },
      { latitude: -23.0848, longitude: -47.2165 },
    ],
  },
  {
    name: 'Av. Eng. Fábio Roberto Barnabé (Marginal)',
    location: 'Av. Eng. Fábio Roberto Barnabé, trecho Jardim Morumbi sentido Centro',
    points: [
      { latitude: -23.091, longitude: -47.2115 },
      { latitude: -23.095, longitude: -47.2138 },
      { latitude: -23.0985, longitude: -47.2158 },
    ],
  },
]

export function InterventionManagementSection() {
  const {
    interventions,
    createIntervention,
    updateIntervention,
    changeInterventionStatus,
    cancelIntervention,
    role,
  } = useApp()

  const [activeSubFilter, setActiveSubFilter] = useState<'todas' | InterventionStatus>('todas')
  const [focusedInterventionId, setFocusedInterventionId] = useState<string | undefined>()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingIntervention, setEditingIntervention] = useState<ScheduledIntervention | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState<InterventionType>('Interdição')
  const [formDescription, setFormDescription] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formStartsAt, setFormStartsAt] = useState('')
  const [formEndsAt, setFormEndsAt] = useState('')
  const [formImpact, setFormImpact] = useState<InterventionImpact>('Interdição parcial')
  const [formGuidance, setFormGuidance] = useState('')
  const [draftPoints, setDraftPoints] = useState<GeoPoint[]>([])
  const [formError, setFormError] = useState('')

  // Cancel Modal State
  const [cancelModalIntervention, setCancelModalIntervention] = useState<ScheduledIntervention | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const filteredInterventions = useMemo(() => {
    if (activeSubFilter === 'todas') return interventions
    return interventions.filter((item) => item.status === activeSubFilter)
  }, [activeSubFilter, interventions])

  const counts = useMemo(
    () => ({
      todas: interventions.length,
      programadas: interventions.filter((i) => i.status === 'Programada').length,
      emAndamento: interventions.filter((i) => i.status === 'Em andamento').length,
      encerradas: interventions.filter((i) => i.status === 'Encerrada').length,
      canceladas: interventions.filter((i) => i.status === 'Cancelada').length,
    }),
    [interventions],
  )

  const handleOpenCreate = () => {
    const now = new Date()
    const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    tomorrowStart.setHours(8, 0, 0, 0)
    const tomorrowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    tomorrowEnd.setHours(12, 0, 0, 0)

    const toLocalIso = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    setEditingIntervention(null)
    setFormTitle('')
    setFormType('Interdição')
    setFormDescription('')
    setFormLocation('')
    setFormStartsAt(toLocalIso(tomorrowStart))
    setFormEndsAt(toLocalIso(tomorrowEnd))
    setFormImpact('Interdição parcial')
    setFormGuidance('Planeje o deslocamento com antecedência e observe a sinalização no local.')
    setDraftPoints([])
    setFormError('')
    setIsFormOpen(true)
  }

  const handleOpenEdit = (intervention: ScheduledIntervention) => {
    const toInputVal = (iso: string) => {
      try {
        const d = new Date(iso)
        if (isNaN(d.getTime())) return iso
        const pad = (n: number) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      } catch {
        return iso
      }
    }

    setEditingIntervention(intervention)
    setFormTitle(intervention.title)
    setFormType(intervention.type)
    setFormDescription(intervention.description)
    setFormLocation(intervention.affectedLocation)
    setFormStartsAt(toInputVal(intervention.startsAt))
    setFormEndsAt(toInputVal(intervention.endsAt))
    setFormImpact(intervention.impact)
    setFormGuidance(intervention.guidance || '')
    setDraftPoints(intervention.geometry)
    setFormError('')
    setIsFormOpen(true)
  }

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formTitle.trim()) {
      setFormError('Informe o título da intervenção.')
      return
    }
    if (!formDescription.trim()) {
      setFormError('Informe a descrição com os detalhes da intervenção.')
      return
    }
    if (!formLocation.trim()) {
      setFormError('Informe o trecho afetado (rua, avenida ou cruzamento).')
      return
    }
    if (!formStartsAt || !formEndsAt) {
      setFormError('As datas e horários de início e término são obrigatórios.')
      return
    }

    const startDate = new Date(formStartsAt)
    const endDate = new Date(formEndsAt)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setFormError('Datas fornecidas são inválidas.')
      return
    }
    if (endDate.getTime() <= startDate.getTime()) {
      setFormError('O término previsto deve ser posterior ao início previsto.')
      return
    }
    if (draftPoints.length < 2) {
      setFormError('Defina no mapa interativo o trecho afetado (mínimo 2 pontos).')
      return
    }

    try {
      if (editingIntervention) {
        updateIntervention(editingIntervention.id, {
          title: formTitle,
          type: formType,
          description: formDescription,
          affectedLocation: formLocation,
          startsAt: startDate.toISOString(),
          endsAt: endDate.toISOString(),
          impact: formImpact,
          guidance: formGuidance.trim() || undefined,
          geometry: draftPoints,
        })
        setSuccessMessage(`Intervenção "${formTitle}" atualizada com sucesso! Comunicado sincronizado.`)
      } else {
        const input: CreateInterventionInput = {
          title: formTitle,
          type: formType,
          description: formDescription,
          affectedLocation: formLocation,
          startsAt: startDate.toISOString(),
          endsAt: endDate.toISOString(),
          impact: formImpact,
          guidance: formGuidance.trim() || undefined,
          geometry: draftPoints,
        }
        createIntervention(input)
        setSuccessMessage(`Intervenção "${formTitle}" cadastrada! Aviso municipal emitido aos cidadãos.`)
      }

      setIsFormOpen(false)
      setTimeout(() => setSuccessMessage(null), 6000)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar intervenção.')
    }
  }

  const handleConfirmCancel = () => {
    if (!cancelModalIntervention) return
    try {
      cancelIntervention(cancelModalIntervention.id, cancelReason)
      setSuccessMessage(
        `Intervenção "${cancelModalIntervention.title}" cancelada. Justificativa registrada e comunicada aos cidadãos.`,
      )
      setCancelModalIntervention(null)
      setCancelReason('')
      setTimeout(() => setSuccessMessage(null), 6000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao cancelar intervenção.')
    }
  }

  const focusedIntervention = interventions.find((i) => i.id === focusedInterventionId)

  return (
    <div className="intervention-management-container">
      {/* Mensagem de sucesso */}
      {successMessage ? (
        <div className="intervention-alert-success" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{successMessage}</span>
          <button
            type="button"
            className="ml-auto text-emerald-800"
            onClick={() => setSuccessMessage(null)}
            aria-label="Fechar mensagem de sucesso"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {/* Header bar */}
      <div className="intervention-hero-header">
        <div>
          <span className="intervention-eyebrow">
            <Cone size={14} aria-hidden="true" /> Planejamento e Comunicação Preventiva
          </span>
          <h2 className="intervention-hero-title">Intervenções Programadas e Obras</h2>
          <p className="intervention-hero-sub">
            Cadastre interdições viárias, obras de infraestrutura e serviços de zeladoria com previsão
            antecipada. O cidadão é comunicado antes de chegar ao trecho.
          </p>
        </div>
        {role === 'MANAGER' ? (
          <button
            type="button"
            className="button-primary intervention-create-btn"
            onClick={handleOpenCreate}
            aria-label="Cadastrar nova intervenção programada"
          >
            <Plus size={17} strokeWidth={2.2} />
            <span>Nova intervenção programada</span>
          </button>
        ) : null}
      </div>

      {/* Métricas rápidas */}
      <div className="intervention-kpi-row">
        <div className="intervention-kpi-card">
          <span>Total cadastradas</span>
          <strong>{counts.todas}</strong>
        </div>
        <div className="intervention-kpi-card kpi-programada">
          <span>Programadas</span>
          <strong>{counts.programadas}</strong>
        </div>
        <div className="intervention-kpi-card kpi-andamento">
          <span>Em andamento</span>
          <strong>{counts.emAndamento}</strong>
        </div>
        <div className="intervention-kpi-card kpi-encerrada">
          <span>Encerradas</span>
          <strong>{counts.encerradas}</strong>
        </div>
        <div className="intervention-kpi-card kpi-cancelada">
          <span>Canceladas</span>
          <strong>{counts.canceladas}</strong>
        </div>
      </div>

      {/* Subfiltros por situação */}
      <div className="intervention-filter-tabs" role="tablist" aria-label="Filtrar por situação">
        <button
          type="button"
          role="tab"
          aria-selected={activeSubFilter === 'todas'}
          className={`notif-tab ${activeSubFilter === 'todas' ? 'notif-tab-active' : ''}`}
          onClick={() => setActiveSubFilter('todas')}
        >
          Todas ({counts.todas})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSubFilter === 'Programada'}
          className={`notif-tab ${activeSubFilter === 'Programada' ? 'notif-tab-active' : ''}`}
          onClick={() => setActiveSubFilter('Programada')}
        >
          Programadas ({counts.programadas})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSubFilter === 'Em andamento'}
          className={`notif-tab ${activeSubFilter === 'Em andamento' ? 'notif-tab-active' : ''}`}
          onClick={() => setActiveSubFilter('Em andamento')}
        >
          Em andamento ({counts.emAndamento})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSubFilter === 'Encerrada'}
          className={`notif-tab ${activeSubFilter === 'Encerrada' ? 'notif-tab-active' : ''}`}
          onClick={() => setActiveSubFilter('Encerrada')}
        >
          Encerradas ({counts.encerradas})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSubFilter === 'Cancelada'}
          className={`notif-tab ${activeSubFilter === 'Cancelada' ? 'notif-tab-active' : ''}`}
          onClick={() => setActiveSubFilter('Cancelada')}
        >
          Canceladas ({counts.canceladas})
        </button>
      </div>

      {/* Mapa Geral de Visualização das Intervenções */}
      <div className="intervention-map-preview-shell">
        <div className="intervention-map-preview-header">
          <div>
            <strong>Mapa Municipal de Trechos e Interdições</strong>
            <p>
              Exibe os trechos com intervenções ativas em Indaiatuba. Clique em um traçado para focar os dados.
            </p>
          </div>
          {focusedIntervention ? (
            <button
              type="button"
              className="text-xs text-blue-700 underline font-semibold"
              onClick={() => setFocusedInterventionId(undefined)}
            >
              Limpar foco ({focusedIntervention.title})
            </button>
          ) : null}
        </div>
        <div className="intervention-map-box">
          <IssueMap
            reports={[]}
            interventions={interventions}
            selectedInterventionId={focusedInterventionId}
            onSelectIntervention={(i) => setFocusedInterventionId(i.id)}
            showReportsLayer={false}
            showInterventionsLayer={true}
            zoom={13}
            scrollWheelZoom
            className="w-full h-full min-h-[320px] rounded-b-xl"
          />
        </div>
      </div>

      {/* Lista de Intervenções */}
      <div className="intervention-list-section">
        <div className="intervention-list-header">
          <h3>Intervenções Registradas ({filteredInterventions.length})</h3>
        </div>

        {filteredInterventions.length === 0 ? (
          <div className="intervention-empty-card">
            <Cone size={32} aria-hidden="true" />
            <p>Nenhuma intervenção encontrada para a situação selecionada.</p>
          </div>
        ) : (
          <div className="intervention-cards-grid">
            {filteredInterventions.map((item) => {
              const statusStyle = interventionStatusStyles[item.status]
              const impactStyle = interventionImpactStyles[item.impact]
              const needsUpdate = isPendingManagementUpdate(item)
              const isSelected = item.id === focusedInterventionId

              return (
                <article
                  key={item.id}
                  className={`intervention-card ${isSelected ? 'intervention-card-focused' : ''}`}
                >
                  <div className="intervention-card-topbar">
                    <span className="intervention-type-tag">{item.type}</span>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="intervention-status-tag"
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          borderColor: statusStyle.border,
                        }}
                      >
                        <span
                          className="intervention-status-dot"
                          style={{ backgroundColor: statusStyle.color }}
                        />
                        {statusStyle.label}
                      </span>

                      <span
                        className="intervention-impact-tag"
                        style={{
                          backgroundColor: impactStyle.bg,
                          color: impactStyle.color,
                          borderColor: impactStyle.border,
                        }}
                      >
                        {impactStyle.label}
                      </span>
                    </div>
                  </div>

                  <h4 className="intervention-card-title">{item.title}</h4>

                  <div className="intervention-card-meta-line">
                    <MapPin size={14} className="text-amber-700 shrink-0" aria-hidden="true" />
                    <span>
                      <strong>Trecho:</strong> {item.affectedLocation}
                    </span>
                  </div>

                  <div className="intervention-card-meta-line">
                    <Calendar size={14} className="text-amber-700 shrink-0" aria-hidden="true" />
                    <span>
                      <strong>Período:</strong> {formatInterventionDateRange(item.startsAt, item.endsAt)}
                    </span>
                  </div>

                  {/* Alerta de expiração sem encerramento */}
                  {needsUpdate ? (
                    <div className="intervention-card-alert-warning" role="alert">
                      <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
                      <span>
                        Previsão expirada — aguardando atualização da gestão (via não liberada automaticamente).
                      </span>
                    </div>
                  ) : null}

                  {item.status === 'Cancelada' ? (
                    <div className="intervention-card-alert-cancelled" role="alert">
                      <Ban size={15} className="shrink-0" aria-hidden="true" />
                      <span>Intervenção cancelada pela administração municipal.</span>
                    </div>
                  ) : null}

                  <p className="intervention-card-description">{item.description}</p>

                  {item.guidance ? (
                    <div className="intervention-card-guidance">
                      <strong>Orientação ao munícipe:</strong> {item.guidance}
                    </div>
                  ) : null}

                  <div className="intervention-card-footer-info">
                    <span>{item.geometry.length} pontos no traçado</span>
                    <span>Criado por {item.createdBy || 'Gestão'}</span>
                  </div>

                  {/* Controles de Gestão */}
                  {role === 'MANAGER' ? (
                    <div className="intervention-card-actions">
                      <div className="intervention-status-select-wrapper">
                        <label htmlFor={`status-select-${item.id}`} className="sr-only">
                          Alterar situação
                        </label>
                        <select
                          id={`status-select-${item.id}`}
                          value={item.status}
                          onChange={(e) =>
                            changeInterventionStatus(item.id, e.target.value as InterventionStatus)
                          }
                          className="intervention-status-select"
                        >
                          <option value="Programada">Programada</option>
                          <option value="Em andamento">Em andamento</option>
                          <option value="Encerrada">Encerrada</option>
                          <option value="Cancelada">Cancelada</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        className="intervention-action-btn"
                        onClick={() => handleOpenEdit(item)}
                        aria-label={`Editar ${item.title}`}
                      >
                        <Edit3 size={14} />
                        <span>Editar</span>
                      </button>

                      {item.status !== 'Cancelada' ? (
                        <button
                          type="button"
                          className="intervention-action-btn text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setCancelModalIntervention(item)
                            setCancelReason('')
                          }}
                          aria-label={`Cancelar intervenção ${item.title}`}
                        >
                          <Ban size={14} />
                          <span>Cancelar</span>
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className="intervention-action-btn"
                        onClick={() => {
                          setFocusedInterventionId(item.id)
                          window.scrollTo({ top: 300, behavior: 'smooth' })
                        }}
                      >
                        <MapPin size={14} />
                        <span>Ver no mapa</span>
                      </button>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal / Formulário de Cadastro e Edição */}
      {isFormOpen ? (
        <div
          className="intervention-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={editingIntervention ? 'Editar intervenção programada' : 'Nova intervenção programada'}
        >
          <div className="intervention-modal-content">
            <header className="intervention-modal-header">
              <div>
                <h3>
                  {editingIntervention ? 'Editar Intervenção Programada' : 'Cadastrar Intervenção Programada'}
                </h3>
                <p>
                  Comunique intervenções, manutenções e bloqueios viários com antecedência aos cidadãos de
                  Indaiatuba.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsFormOpen(false)}
                aria-label="Fechar formulário"
              >
                <X size={20} />
              </button>
            </header>

            {formError ? (
              <div className="intervention-modal-error" role="alert">
                <AlertCircle size={17} aria-hidden="true" />
                <span>{formError}</span>
              </div>
            ) : null}

            <form onSubmit={handleSaveForm} className="intervention-form-body">
              <div className="form-group">
                <label htmlFor="interv-title">Título da intervenção *</label>
                <input
                  id="interv-title"
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Interdição parcial na Av. Conceição"
                  className="input-text"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="interv-type">Tipo de intervenção *</label>
                  <select
                    id="interv-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as InterventionType)}
                    className="input-select"
                  >
                    {INTERVENTION_TYPES_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="interv-impact">Natureza do impacto *</label>
                  <select
                    id="interv-impact"
                    value={formImpact}
                    onChange={(e) => setFormImpact(e.target.value as InterventionImpact)}
                    className="input-select"
                  >
                    {INTERVENTION_IMPACTS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="interv-location">Trecho afetado (endereço / cruzamento) *</label>
                <input
                  id="interv-location"
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Ex: Av. Conceição, entre Rua dos Indaiás e Av. Presidente Vargas"
                  className="input-text"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="interv-starts">Início previsto *</label>
                  <input
                    id="interv-starts"
                    type="datetime-local"
                    required
                    value={formStartsAt}
                    onChange={(e) => setFormStartsAt(e.target.value)}
                    className="input-text"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="interv-ends">Término previsto *</label>
                  <input
                    id="interv-ends"
                    type="datetime-local"
                    required
                    value={formEndsAt}
                    onChange={(e) => setFormEndsAt(e.target.value)}
                    className="input-text"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="interv-desc">Descrição e detalhes operacionais *</label>
                <textarea
                  id="interv-desc"
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descreva o serviço a ser realizado e o motivo da intervenção..."
                  className="input-textarea"
                />
              </div>

              <div className="form-group">
                <label htmlFor="interv-guidance">Orientações aos cidadãos (opcional)</label>
                <textarea
                  id="interv-guidance"
                  rows={2}
                  value={formGuidance}
                  onChange={(e) => setFormGuidance(e.target.value)}
                  placeholder="Ex: Trânsito em meia pista. Recomenda-se utilizar vias adjacentes como rota alternativa."
                  className="input-textarea"
                />
              </div>

              {/* Seletor geográfico interativo de pontos */}
              <div className="intervention-geo-picker">
                <div className="intervention-geo-picker-header">
                  <div>
                    <strong>Mapeamento do trecho afetado no mapa *</strong>
                    <p>
                      Clique no mapa para adicionar pontos sequenciais (mínimo 2 pontos). O traçado exibido é
                      indicativo e aproximado.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {draftPoints.length > 0 ? (
                      <button
                        type="button"
                        className="geo-btn-outline"
                        onClick={() => setDraftPoints((p) => p.slice(0, -1))}
                      >
                        <Undo2 size={14} /> Desfazer último
                      </button>
                    ) : null}
                    {draftPoints.length > 0 ? (
                      <button
                        type="button"
                        className="geo-btn-outline text-red-600"
                        onClick={() => setDraftPoints([])}
                      >
                        <Trash2 size={14} /> Limpar
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Predefinições de Indaiatuba para facilidade da demo */}
                <div className="intervention-presets-bar">
                  <span className="text-xs font-semibold text-slate-500">Atalhos demonstrativos:</span>
                  {DEMO_INDAIATUBA_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className="preset-pill-btn"
                      onClick={() => {
                        setDraftPoints(preset.points)
                        if (!formLocation) setFormLocation(preset.location)
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className="intervention-draft-map-wrapper">
                  <IssueMap
                    reports={[]}
                    showReportsLayer={false}
                    showInterventionsLayer={false}
                    isInteractiveDrawing={true}
                    interactivePoints={draftPoints}
                    onAddInteractivePoint={(pt) => setDraftPoints((prev) => [...prev, pt])}
                    zoom={14}
                    scrollWheelZoom
                    className="w-full h-[260px] rounded-lg"
                  />
                </div>

                <div className="intervention-draft-points-summary">
                  <span className="text-xs font-medium text-slate-600">
                    {draftPoints.length === 0
                      ? 'Nenhum ponto marcado ainda. Clique no mapa acima para iniciar o trecho.'
                      : `${draftPoints.length} pontos marcados no traçado.`}
                  </span>
                  <span className="text-xs text-amber-700 font-semibold">
                    Traçado indicativo aproximado do trecho afetado.
                  </span>
                </div>
              </div>

              <footer className="intervention-modal-footer">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="button-primary">
                  {editingIntervention ? 'Salvar alterações' : 'Publicar intervenção programada'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal de confirmação de cancelamento */}
      {cancelModalIntervention ? (
        <div
          className="intervention-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar cancelamento da intervenção"
        >
          <div className="intervention-modal-content max-w-md">
            <header className="intervention-modal-header">
              <div>
                <h3 className="text-red-700">Cancelar Intervenção Programada</h3>
                <p>O comunicado será atualizado como Cancelado com a justificativa administrativa informada.</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setCancelModalIntervention(null)}
                aria-label="Fechar modal de cancelamento"
              >
                <X size={20} />
              </button>
            </header>

            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-700">
                Tem certeza que deseja cancelar a intervenção{' '}
                <strong>&quot;{cancelModalIntervention.title}&quot;</strong> em{' '}
                <strong>{cancelModalIntervention.affectedLocation}</strong>?
              </p>

              <div>
                <label htmlFor="cancel-reason" className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo do cancelamento (visível aos munícipes)
                </label>
                <textarea
                  id="cancel-reason"
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Condições climáticas desfavoráveis / Reprogramação técnica."
                  className="input-textarea text-sm"
                />
              </div>
            </div>

            <footer className="intervention-modal-footer">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCancelModalIntervention(null)}
              >
                Voltar
              </button>
              <button
                type="button"
                className="button-danger bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
                onClick={handleConfirmCancel}
              >
                Confirmar cancelamento
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  )
}
