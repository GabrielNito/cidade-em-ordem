'use client'

import { AlertCircle, ArrowDown, ArrowLeft, Camera, CheckCircle2, MapPin, Play, Save, UserRound, Wrench } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from '../../navigation'
import { IssueMap } from '../../components/maps/IssueMap'
import { StatusTimeline } from '../../components/reports/StatusTimeline'
import { CategoryIcon } from '../../components/ui/CategoryIcon'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingButton } from '../../components/ui/LoadingButton'
import { PageHeader } from '../../components/ui/PageHeader'
import { PhotoFrame } from '../../components/ui/PhotoFrame'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { CREW_MEMBERS, getCrewMember } from '../../data/crew'
import { useApp } from '../../context/AppContext'
import { formatCoordinates, formatDateTime } from '../../utils/report'

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

export function FieldOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { reports, assignReport, startReport, finishReport } = useApp()
  const report = reports.find((item) => item.id === id)
  const completionInputRef = useRef<HTMLInputElement>(null)
  const [selectedAssignee, setSelectedAssignee] = useState(report?.assignedTo ?? '')
  const [completionPhoto, setCompletionPhoto] = useState('')
  const [assignError, setAssignError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [done, setDone] = useState(false)

  if (!report) return <EmptyState icon={Wrench} title="Ordem não encontrada" description="Este registro pode ter sido removido ou o link está incorreto." action={<Link to="/campo/ordens" className="button-secondary button-small">Voltar às ordens</Link>} />

  const assigned = getCrewMember(report.assignedTo)

  const handleAssign = () => {
    setAssignError('')
    try {
      assignReport(report.id, selectedAssignee)
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : 'Não foi possível atribuir o responsável.')
    }
  }

  const handleStart = () => {
    setActionError('')
    try {
      startReport(report.id)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível iniciar o atendimento.')
    }
  }

  const handleCompletionPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setActionError('Escolha um arquivo de imagem para registrar a conclusão.')
      return
    }
    try {
      setCompletionPhoto(await fileToDataUrl(file))
      setActionError('')
    } catch {
      setActionError('Não foi possível carregar a fotografia.')
    }
  }

  const handleFinish = async () => {
    setActionError('')
    if (!completionPhoto) {
      setActionError('Adicione uma fotografia do resultado antes de finalizar.')
      return
    }
    setIsSaving(true)
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    try {
      finishReport(report.id, completionPhoto)
      setDone(true)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível finalizar o serviço.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="content-stack detail-page field-detail-page">
      <PageHeader eyebrow={report.protocol} title={report.category} description={report.region} backTo="/campo/ordens" action={<StatusBadge status={report.status} />} />
      {done ? <div className="inline-success" role="status"><CheckCircle2 size={19} /><div><strong>Serviço finalizado</strong><span>A ocorrência agora está disponível para acompanhamento do cidadão.</span></div></div> : null}
      <section className="field-detail-grid">
        <div>
          <PhotoFrame src={report.photo} category={report.category} alt={`Fotografia enviada para a ordem ${report.protocol}`} className="detail-main-photo" />
          <div className="field-photo-caption"><Camera size={15} /> Fotografia enviada pelo cidadão</div>
        </div>
        <div className="detail-intro-card">
          <div className="detail-category-line"><CategoryIcon category={report.category} /><span>Dados da ordem de serviço</span></div>
          <p>{report.description}</p>
          <div className="detail-info-list">
            <div><MapPin size={16} /><span><small>Localização</small><strong>{report.address || report.region}</strong><em>{formatCoordinates(report.latitude, report.longitude)}</em></span></div>
            <div><UserRound size={16} /><span><small>Responsável</small><strong>{assigned?.name ?? 'Ainda não atribuído'}</strong><em>{assigned?.specialty ?? 'Aguardando atribuição'}</em></span></div>
            <div><Save size={16} /><span><small>Recebido em</small><strong>{formatDateTime(report.createdAt)}</strong></span></div>
          </div>
        </div>
      </section>
      <a className="field-quick-action" href="#field-actions"><span><Wrench size={18} /><small>Próxima ação</small><strong>Atualizar ordem</strong></span><ArrowDown size={19} aria-hidden="true" /></a>
      <section className="detail-section">
        <div className="detail-section-heading"><div><p className="eyebrow">Ponto do atendimento</p><h2>Localização</h2></div></div>
        <IssueMap reports={[report]} selectedId={report.id} className="map-detail" />
      </section>
      <section id="field-actions" className="detail-section field-actions-section">
        <div className="detail-section-heading"><div><p className="eyebrow">Próxima ação</p><h2>Atualizar ordem</h2></div><Wrench size={21} /></div>
        {report.status === 'Aberto' ? (
          <div className="field-action-content">
            <label className="field-label" htmlFor="assignee">Responsável pela execução</label>
            <div className="assign-row">
              <select id="assignee" className="select-input" value={selectedAssignee} onChange={(event) => setSelectedAssignee(event.target.value)}>
                <option value="">Selecione uma equipe ou servidor</option>
                {CREW_MEMBERS.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.specialty}</option>)}
              </select>
              <button className="button-secondary assign-button" onClick={handleAssign} disabled={!selectedAssignee || selectedAssignee === report.assignedTo}><Save size={17} /> Atribuir</button>
            </div>
            {assignError ? <p className="form-error" role="alert">{assignError}</p> : null}
            <div className="action-divider" />
            <p className="action-explanation"><Play size={16} /> Depois de atribuir, inicie o atendimento para registrar o começo da execução.</p>
            <button className="button-primary" onClick={handleStart} disabled={!report.assignedTo}><Play size={17} fill="currentColor" /> Iniciar atendimento</button>
            {!report.assignedTo ? <p className="field-hint">Atribua um responsável antes de iniciar o atendimento.</p> : null}
          </div>
        ) : null}
        {report.status === 'Em atendimento' ? (
          <div className="field-action-content">
            <div className="active-assignee"><span className="avatar avatar-small">{assigned?.initials ?? 'EQ'}</span><span><small>Em atendimento por</small><strong>{assigned?.name ?? 'Equipe responsável'}</strong></span><StatusBadge status={report.status} compact /></div>
            <div className="action-divider" />
            <label className="field-label" htmlFor="completion-photo">Fotografia do resultado <span>obrigatório para finalizar</span></label>
            <input ref={completionInputRef} id="completion-photo" className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={handleCompletionPhoto} />
            {completionPhoto ? <div className="upload-preview-wrap"><PhotoFrame src={completionPhoto} category={report.category} alt="Pré-visualização da fotografia do serviço concluído" className="upload-preview completion-upload-preview" /><button type="button" className="remove-upload" onClick={() => { setCompletionPhoto(''); if (completionInputRef.current) completionInputRef.current.value = '' }}>Remover fotografia</button></div> : <button className="upload-dropzone" onClick={() => completionInputRef.current?.click()}><span className="upload-dropzone-icon"><Camera size={22} /></span><span><strong>Adicionar foto da conclusão</strong><small>Registre o local após a execução do serviço</small></span></button>}
            {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}
            <LoadingButton loading={isSaving} onClick={handleFinish}><CheckCircle2 size={18} /> Confirmar conclusão</LoadingButton>
          </div>
        ) : null}
        {report.status === 'Finalizado' ? <div className="finalized-action"><CheckCircle2 size={25} /><div><strong>Esta ordem foi finalizada</strong><p>O cidadão já pode visualizar a fotografia e a data da conclusão.</p>{report.finishedAt ? <small>Concluída em {formatDateTime(report.finishedAt)}</small> : null}</div></div> : null}
      </section>
      <section className="detail-section detail-progress-section"><div className="detail-section-heading"><div><p className="eyebrow">Histórico</p><h2>Andamento da ordem</h2></div></div><StatusTimeline status={report.status} /></section>
      {report.status === 'Finalizado' && report.completionPhoto ? <section className="detail-section completion-section"><div className="detail-section-heading"><div><p className="eyebrow">Registro da execução</p><h2>Fotografia de conclusão</h2></div></div><PhotoFrame src={report.completionPhoto} category={report.category} alt={`Fotografia de conclusão da ordem ${report.protocol}`} className="completion-photo" /></section> : null}
      {actionError && report.status === 'Aberto' ? <div className="form-alert" role="alert"><AlertCircle size={18} />{actionError}</div> : null}
      <button className="button-secondary detail-back-button" onClick={() => navigate('/campo/ordens')}><ArrowLeft size={17} /> Voltar às ordens</button>
    </div>
  )
}
