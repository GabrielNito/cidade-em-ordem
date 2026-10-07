'use client'

import { Check, MapPin, Mic, Pause, Play, Sparkles, Square, Trash2, UsersRound, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DemoUser, GeoPoint, Report, ReportCategory } from '../../types/domain'
import { CategoryIcon } from '../ui/CategoryIcon'
import { PhotoFrame } from '../ui/PhotoFrame'
import { StatusBadge } from '../ui/StatusBadge'

type NearbyReportMatch = { report: Report; distance: number }

function formatDistance(distance: number) {
  return distance < 1000 ? `${Math.max(1, Math.round(distance))} m` : `${(distance / 1000).toFixed(1).replace('.', ',')} km`
}

const CATEGORY_SUGGESTIONS: Record<ReportCategory, string[]> = {
  'Buraco na via': [
    'Buraco grande na via gerando risco de acidentes para carros e pedestres',
    'Afundamento no asfalto próximo ao meio-fio acumulando água e lama',
    'Desnível perigoso na pista que necessita de recapeamento urgente',
  ],
  'Iluminação': [
    'Poste de luz totalmente apagado à noite, deixando a rua insegura',
    'Lâmpada do poste piscando sem parar há vários dias',
    'Luminária pública danificada com fiação exposta na calçada',
  ],
  'Limpeza': [
    'Grande acúmulo de entulho e lixo descartado irregularmente',
    'Mato muito alto e vegetação invadindo o passeio público',
    'Necessidade de varrição e limpeza de folhas e galhos acumulados',
  ],
  'Sinalização': [
    'Placa de trânsito derrubada ou com poste inclinado na calçada',
    'Pintura de faixa de pedestres apagada com risco aos pedestres',
    'Placa de Pare encoberta por vegetação na esquina',
  ],
  'Poda': [
    'Galhos de árvore grandes encostando na rede elétrica pública',
    'Galhos caídos obstruindo a calçada e a passagem de pedestres',
    'Árvore antiga com galhos secos e risco iminente de queda na via',
  ],
}

export function ReportDetailsStep({
  category,
  description,
  photo,
  audio,
  location,
  locationLabel,
  errors,
  nearbyReports,
  nearbyDismissed,
  nearbyConfirmedId,
  nearbyConfirmingId,
  nearbyError,
  user,
  onDescriptionChange,
  onAudioChange,
  onConfirmNearby,
  onViewNearby,
  onDismissNearby,
}: {
  category: ReportCategory | ''
  description: string
  photo: string
  audio?: string | null
  location?: GeoPoint
  locationLabel: string
  errors: Record<string, string>
  nearbyReports: NearbyReportMatch[]
  nearbyDismissed: boolean
  nearbyConfirmedId: string
  nearbyConfirmingId: string
  nearbyError: string
  user: DemoUser
  onDescriptionChange: (description: string) => void
  onAudioChange?: (audio: string | null) => void
  onConfirmNearby: (id: string) => void
  onViewNearby: (id: string) => void
  onDismissNearby: () => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioFeedback, setAudioFeedback] = useState('')
  const timerIntervalRef = useRef<number | undefined>(undefined)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const suggestions = category ? CATEGORY_SUGGESTIONS[category] ?? [] : []

  const handleAddSuggestion = (suggestionText: string) => {
    const current = description.trim()
    const next = current ? `${current}. ${suggestionText}` : suggestionText
    onDescriptionChange(next)
    textareaRef.current?.focus()
  }

  const startRecording = async () => {
    setAudioFeedback('')
    setIsRecording(true)
    setRecordSeconds(0)
    audioChunksRef.current = []

    timerIntervalRef.current = window.setInterval(() => {
      setRecordSeconds((s) => s + 1)
    }, 1000)

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        mediaRecorderRef.current = recorder
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data)
        }
        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const audioUrl = URL.createObjectURL(blob)
          onAudioChange?.(audioUrl)
          stream.getTracks().forEach((track) => track.stop())
        }
        recorder.start()
      } else {
        // Fallback simulation for unsupported browsers/sandbox
        window.setTimeout(() => {
          onAudioChange?.('simulated-audio-recording')
        }, 300)
      }
    } catch {
      // Permission denied or simulated audio fallback
      onAudioChange?.('simulated-audio-recording')
    }
  }

  const stopRecording = () => {
    window.clearInterval(timerIntervalRef.current)
    setIsRecording(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    } else {
      onAudioChange?.('simulated-audio-recording')
    }
    setAudioFeedback('Áudio do relato gravado com sucesso.')
  }

  const handleRemoveAudio = () => {
    onAudioChange?.(null)
    setIsPlaying(false)
    setAudioFeedback('')
  }

  const handlePlayToggle = () => {
    setIsPlaying((prev) => !prev)
    if (!isPlaying) {
      window.setTimeout(() => setIsPlaying(false), 4000)
    }
  }

  const handleTranscribeAudio = () => {
    const speechSummary = category
      ? `Relato em áudio gravado: Solicito atendimento da Prefeitura para ocorrência de ${category.toLowerCase()} no local indicado.`
      : 'Relato em áudio gravado: Solicito atendimento da equipe municipal para manutenção no local indicado.'
    handleAddSuggestion(speechSummary)
    setAudioFeedback('Transcrição adicionada à descrição!')
  }

  useEffect(() => {
    return () => {
      window.clearInterval(timerIntervalRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])
  return (
    <section className="guided-form-step guided-details-step" aria-labelledby="details-step-title">
      <div className="guided-step-intro">
        <span className="guided-step-icon"><Check size={23} /></span>
        <div>
          <p className="eyebrow">Etapa 3 de 3</p>
          <h1 id="details-step-title">Conte o que aconteceu</h1>
          <p>Confira a categoria e descreva o problema com suas palavras.</p>
        </div>
      </div>

      <div className="guided-report-summary">
        <PhotoFrame src={photo} category={category || 'Buraco na via'} alt="Fotografia anexada à ocorrência" className="guided-report-summary-photo" />
        <div>
          <span className="eyebrow">Local escolhido</span>
          <strong>{category || 'Ocorrência'} · {locationLabel || 'Ponto escolhido no mapa'}</strong>
          {location ? <small>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</small> : null}
        </div>
      </div>

      <div className="guided-field-group">
        <div className="guided-field-heading">
          <label htmlFor="guided-description">Descrição</label>
          <span>obrigatório</span>
        </div>

        {suggestions.length > 0 ? (
          <div className="guided-suggestions-block">
            <span className="guided-suggestions-label">💡 Ideias de relato rápido (toque para incluir e edite à vontade):</span>
            <div className="guided-suggestions-chips" role="group" aria-label="Sugestões de texto">
              {suggestions.map((text, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="guided-suggestion-chip"
                  onClick={() => handleAddSuggestion(text)}
                >
                  <span>+ {text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <textarea
          ref={textareaRef}
          id="guided-description"
          className={`text-area guided-description ${errors.description ? 'field-error' : ''}`}
          maxLength={500}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Ex.: há um buraco grande na faixa direita da via..."
          aria-describedby={errors.description ? 'guided-description-error' : undefined}
        />
        <div className="guided-description-footer">
          <span>{description.length}/500</span>
          {errors.description ? <span className="form-error" id="guided-description-error">{errors.description}</span> : null}
        </div>
      </div>

      <div className="guided-audio-section" aria-label="Gravador de áudio do relato">
        <div className="guided-audio-header">
          <div className="guided-audio-title">
            <Volume2 size={18} className="guided-audio-icon" />
            <div>
              <strong>Prefere falar? Grave um áudio</strong>
              <small>Você pode relatar o problema com sua voz.</small>
            </div>
          </div>
          {!isRecording && !audio ? (
            <button
              type="button"
              className="button-secondary guided-audio-record-btn"
              onClick={startRecording}
            >
              <Mic size={17} /> Gravar áudio
            </button>
          ) : null}
        </div>

        {isRecording ? (
          <div className="guided-audio-recording-state" role="status" aria-live="polite">
            <div className="guided-audio-pulse-indicator">
              <span className="pulse-dot" />
              <span>Gravando relato... <strong>00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}</strong></span>
            </div>
            <button type="button" className="button-secondary guided-audio-stop-btn" onClick={stopRecording}>
              <Square size={16} /> Parar gravação
            </button>
          </div>
        ) : null}

        {audio && !isRecording ? (
          <div className="guided-audio-player-card">
            <div className="guided-audio-player-info">
              <button
                type="button"
                className="guided-audio-play-btn"
                onClick={handlePlayToggle}
                aria-label={isPlaying ? 'Pausar áudio' : 'Ouvir áudio gravado'}
              >
                {isPlaying ? <Pause size={17} /> : <Play size={17} />}
              </button>
              <div className="guided-audio-track">
                <span className="guided-audio-label">Áudio gravado anexado</span>
                <div className={`guided-audio-waveform ${isPlaying ? 'waveform-active' : ''}`}>
                  <span /><span /><span /><span /><span /><span /><span />
                </div>
              </div>
              <button
                type="button"
                className="guided-audio-remove-btn"
                onClick={handleRemoveAudio}
                aria-label="Excluir áudio gravado"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <button
              type="button"
              className="guided-audio-transcribe-btn"
              onClick={handleTranscribeAudio}
            >
              <Sparkles size={15} /> Incluir fala na descrição acima
            </button>
          </div>
        ) : null}

        {audioFeedback ? (
          <p className="guided-audio-feedback" role="status"><Check size={14} /> {audioFeedback}</p>
        ) : null}
      </div>

      {nearbyReports.length > 0 && !nearbyDismissed ? (
        <section className="guided-nearby-section" aria-live="polite">
          <div className="guided-nearby-heading">
            <div><p className="eyebrow">Antes de enviar</p><h2>Encontramos ocorrências próximas</h2></div>
            <MapPin size={20} aria-hidden="true" />
          </div>
          <p className="guided-nearby-intro">Talvez o problema já esteja no mapa. Confirmar uma ocorrência evita registros duplicados.</p>
          <div className="guided-nearby-list">
            {nearbyReports.map(({ report, distance }) => {
              const isOwner = report.citizen.id === user.id
              const hasConfirmed = report.confirmations.includes(user.id)
              const isConfirmedNow = nearbyConfirmedId === report.id
              const isDisabled = nearbyConfirmingId === report.id || isOwner || hasConfirmed || isConfirmedNow
              return (
                <div className="guided-nearby-row" key={report.id}>
                  <CategoryIcon category={report.category} size="sm" />
                  <div className="guided-nearby-copy"><strong>{report.category}</strong><span>{formatDistance(distance)} · {report.confirmations.length} {report.confirmations.length === 1 ? 'confirmação' : 'confirmações'}</span></div>
                  <StatusBadge status={report.status} compact />
                  <div className="guided-nearby-actions">
                    <button type="button" className="button-secondary button-small" disabled={isDisabled} onClick={() => onConfirmNearby(report.id)}>
                      {nearbyConfirmingId === report.id ? 'Confirmando...' : isConfirmedNow ? <><Check size={15} /> Ocorrência confirmada</> : isOwner ? 'Você registrou' : hasConfirmed ? 'Já confirmada' : 'É este problema'}
                    </button>
                    {isConfirmedNow ? <button type="button" className="text-button" onClick={() => onViewNearby(report.id)}>Ver ocorrência</button> : null}
                  </div>
                </div>
              )
            })}
          </div>
          {nearbyError ? <p className="form-error" role="alert">{nearbyError}</p> : null}
          <button type="button" className="guided-nearby-dismiss" onClick={onDismissNearby}>Continuar com novo chamado</button>
        </section>
      ) : null}
      <p className="guided-accessibility-note"><UsersRound size={16} aria-hidden="true" /> A ocorrência será compartilhada com a Prefeitura para acompanhamento.</p>
    </section>
  )
}
