'use client'

import { ArrowLeft, Check, CircleAlert, Copy } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '../../navigation'
import { LocationPicker, type LocationPickerState } from '../../components/reports/LocationPicker'
import { ReportDetailsStep } from '../../components/reports/ReportDetailsStep'
import { ReportPhotoStep } from '../../components/reports/ReportPhotoStep'
import { useApp } from '../../context/AppContext'
import type { GeoPoint, Report, ReportCategory } from '../../types/domain'
import { findNearbyReports } from '../../utils/geo'
import { formatDateTime } from '../../utils/report'

type ReportStep = 'location' | 'photo' | 'details'

const STEP_COPY: Record<ReportStep, { label: string; title: string }> = {
  location: { label: 'Localização', title: 'Onde está o problema?' },
  photo: { label: 'Fotografia', title: 'Mostre o problema' },
  details: { label: 'Informações', title: 'Conte o que aconteceu' },
}

const STEP_ORDER: ReportStep[] = ['location', 'photo', 'details']

export function NewReportPage() {
  const navigate = useNavigate()
  const { createReport, reports, confirmReport, user } = useApp()
  const [step, setStep] = useState<ReportStep>('location')
  const [category, setCategory] = useState<ReportCategory | ''>('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState('')
  const [audio, setAudio] = useState<string | null>(null)
  const [location, setLocation] = useState<GeoPoint>()
  const [recenterPoint, setRecenterPoint] = useState<GeoPoint>()
  const [locationLabel, setLocationLabel] = useState('')
  const [locationState, setLocationState] = useState<LocationPickerState>('idle')
  const [locationError, setLocationError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdReport, setCreatedReport] = useState<Report | null>(null)
  const [copiedProtocol, setCopiedProtocol] = useState(false)
  const [nearbyDismissed, setNearbyDismissed] = useState(false)
  const [nearbyConfirmedId, setNearbyConfirmedId] = useState('')
  const [nearbyConfirmingId, setNearbyConfirmingId] = useState('')
  const [nearbyError, setNearbyError] = useState('')
  const contentRef = useRef<HTMLElement>(null)

  const currentStepIndex = STEP_ORDER.indexOf(step)
  const currentStep = STEP_COPY[step]

  const chooseLocation = useCallback((point: GeoPoint, label: string) => {
    setLocation(point)
    setLocationLabel(label)
    setLocationState('success')
    setLocationError('')
    setErrors((current) => ({ ...current, location: '' }))
  }, [])

  const requestLocation = useCallback(() => {
    setLocationState('loading')
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationState('error')
      setLocationError('Seu navegador não oferece acesso à localização.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { latitude: position.coords.latitude, longitude: position.coords.longitude }
        setRecenterPoint(point)
        chooseLocation(point, 'Minha localização')
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationState('denied')
          setLocationError('A permissão de localização foi negada. Autorize o acesso no navegador e tente novamente.')
        } else {
          setLocationState('error')
          setLocationError('Não foi possível obter sua posição agora. Tente novamente em alguns instantes.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 },
    )
  }, [chooseLocation])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  const handleMapCenterChange = useCallback((point: GeoPoint) => {
    chooseLocation(point, 'Ponto escolhido no mapa')
  }, [chooseLocation])

  const handleSearchLocationChange = useCallback((point: GeoPoint, label?: string) => {
    setRecenterPoint(point)
    chooseLocation(point, label ?? 'Endereço pesquisado')
  }, [chooseLocation])

  const useSuggestedLocation = useCallback(() => {
    const point = { latitude: -23.1162, longitude: -47.2385 }
    setRecenterPoint(point)
    chooseLocation(point, 'Ponto indicado no mapa')
  }, [chooseLocation])

  useEffect(() => {
    setNearbyDismissed(false)
    setNearbyConfirmedId('')
    setNearbyError('')
  }, [category, location?.latitude, location?.longitude])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0, left: 0 })
  }, [step])

  const nearbyReports = useMemo(() => {
    if (!location || !category) return []
    return findNearbyReports(reports, location, category).slice(0, 3)
  }, [category, location, reports])

  const handleConfirmNearby = (id: string) => {
    setNearbyConfirmingId(id)
    setNearbyError('')
    try {
      confirmReport(id)
      setNearbyConfirmedId(id)
    } catch (error) {
      setNearbyError(error instanceof Error ? error.message : 'Não foi possível confirmar a ocorrência.')
    } finally {
      setNearbyConfirmingId('')
    }
  }

  const validateDetails = () => {
    const nextErrors: Record<string, string> = {}
    if (!category) nextErrors.category = 'Selecione uma categoria.'
    if (description.trim().length < 10) nextErrors.description = 'Descreva a situação com pelo menos 10 caracteres.'
    if (!photo) nextErrors.photo = 'Adicione uma fotografia para registrar a ocorrência.'
    if (!location) nextErrors.location = 'A localização é necessária para enviar a ocorrência.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goNext = () => {
    if (step === 'location') {
      if (!location) {
        setLocationError('Mova o mapa até o local da ocorrência antes de continuar.')
        setLocationState('error')
        return
      }
      setStep('photo')
      return
    }
    if (!category) {
      setErrors((current) => ({ ...current, category: 'Escolha o tipo do problema antes de continuar.' }))
      return
    }
    if (!photo) {
      setErrors((current) => ({ ...current, photo: 'Adicione uma fotografia para continuar.' }))
      return
    }
    setStep('details')
  }

  const goBack = () => {
    if (step === 'location') {
      navigate('/app/mapa')
      return
    }
    setStep(STEP_ORDER[currentStepIndex - 1])
  }

  const handleSubmit = async () => {
    if (!validateDetails() || !category || !location || !photo) return
    setIsSubmitting(true)
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    try {
      const report = createReport({
        category,
        description,
        latitude: location.latitude,
        longitude: location.longitude,
        region: locationLabel || 'Localização informada',
        address: locationLabel || 'Coordenadas do mapa',
        photo,
      })
      setCreatedReport(report)
    } catch {
      setErrors({ form: 'Não foi possível registrar a ocorrência. Tente novamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (createdReport) {
    return (
      <div className="protocol-receipt-page" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
        <div className="protocol-receipt-card">
          <div className="protocol-receipt-badge" aria-hidden="true">
            <span className="receipt-check-icon"><Check size={36} strokeWidth={2.6} /></span>
          </div>

          <div className="protocol-receipt-heading">
            <span className="eyebrow">Prefeitura de Indaiatuba · Zeladoria</span>
            <h1 id="receipt-title">Solicitação Registrada!</h1>
            <p>Seu chamado foi protocolado e encaminhado para a equipe de atendimento.</p>
          </div>

          <div className="protocol-number-box">
            <span className="protocol-number-label">Número do Protocolo</span>
            <div className="protocol-number-row">
              <strong className="protocol-number-value">{createdReport.protocol}</strong>
              <button
                type="button"
                className="button-secondary protocol-copy-button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(createdReport.protocol).catch(() => {})
                  }
                  setCopiedProtocol(true)
                  setTimeout(() => setCopiedProtocol(false), 2500)
                }}
                aria-label="Copiar número do protocolo"
              >
                {copiedProtocol ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedProtocol ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <small>Guarde este número para consultas e acompanhamento.</small>
          </div>

          <div className="protocol-receipt-summary">
            <div className="protocol-receipt-row">
              <span>Problema</span>
              <strong>{createdReport.category}</strong>
            </div>
            <div className="protocol-receipt-row">
              <span>Localização</span>
              <strong>{createdReport.address || createdReport.region}</strong>
            </div>
            <div className="protocol-receipt-row">
              <span>Data e horário</span>
              <strong>{formatDateTime(createdReport.createdAt)}</strong>
            </div>
            <div className="protocol-receipt-row">
              <span>Status inicial</span>
              <span className="receipt-status-pill">Aberto · Na fila</span>
            </div>
            {audio ? (
              <div className="protocol-receipt-row">
                <span>Relato por voz</span>
                <strong>Áudio gravado anexado</strong>
              </div>
            ) : null}
          </div>

          <p className="protocol-receipt-tip">
            Você pode acompanhar cada etapa do serviço diretamente no mapa ou na aba <strong>Chamados</strong>.
          </p>

          <div className="protocol-receipt-actions">
            <button
              type="button"
              className="button-primary protocol-action-primary"
              onClick={() => navigate(`/app/mapa?selectedReportId=${encodeURIComponent(createdReport.id)}&created=1`)}
            >
              Ver chamado no mapa
            </button>
            <button
              type="button"
              className="button-secondary protocol-action-secondary"
              onClick={() => navigate('/app/chamados')}
            >
              Ir para Meus Chamados
            </button>
            <button
              type="button"
              className="text-button protocol-action-reset"
              onClick={() => {
                setCreatedReport(null)
                setStep('location')
                setCategory('')
                setDescription('')
                setPhoto('')
                setAudio(null)
              }}
            >
              Registrar outra ocorrência
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`guided-report-page guided-report-page-${step}`}>
      <header className="guided-report-header">
        <button type="button" className="guided-report-back" onClick={goBack} aria-label={step === 'location' ? 'Voltar ao mapa' : 'Voltar à etapa anterior'}>
          <ArrowLeft size={20} />
        </button>
        <div className="guided-report-header-copy">
          <p className="eyebrow">Nova ocorrência</p>
          <strong>{currentStep.title}</strong>
        </div>
        <span className="guided-report-step-count">{currentStepIndex + 1} de {STEP_ORDER.length}</span>
      </header>
      <div className="guided-report-progress" aria-label={`Etapa ${currentStepIndex + 1} de ${STEP_ORDER.length}`}>
        {STEP_ORDER.map((stepName, index) => <span key={stepName} className={index <= currentStepIndex ? 'guided-report-progress-active' : ''} />)}
      </div>

      <main ref={contentRef} className="guided-report-content">
        {step === 'location' ? (
          <LocationPicker
            reports={reports.filter((report) => report.status !== 'Finalizado')}
            location={location}
            recenterPoint={recenterPoint}
            locationState={locationState}
            locationError={locationError}
            onLocationChange={handleSearchLocationChange}
            onMapCenterChange={handleMapCenterChange}
            onRequestLocation={requestLocation}
            onUseSuggestedLocation={useSuggestedLocation}
            onContinue={goNext}
          />
        ) : null}

        {step === 'photo' ? (
          <>
            <ReportPhotoStep
              photo={photo}
              category={category}
              categoryError={errors.category}
              error={errors.photo}
              onCategoryChange={(value) => { setCategory(value); setErrors((current) => ({ ...current, category: '' })) }}
              onPhotoChange={(value) => { setPhoto(value); setErrors((current) => ({ ...current, photo: '' })) }}
              onError={(message) => setErrors((current) => ({ ...current, photo: message }))}
              onRemove={() => setPhoto('')}
            />
            <div className="guided-step-actions">
              <button type="button" className="button-secondary" onClick={goBack}>Voltar</button>
              <button type="button" className="button-primary" onClick={goNext}>Continuar</button>
            </div>
          </>
        ) : null}

        {step === 'details' ? (
          <>
            <ReportDetailsStep
              category={category}
              description={description}
              photo={photo}
              audio={audio}
              location={location}
              locationLabel={locationLabel}
              errors={errors}
              nearbyReports={nearbyReports}
              nearbyDismissed={nearbyDismissed}
              nearbyConfirmedId={nearbyConfirmedId}
              nearbyConfirmingId={nearbyConfirmingId}
              nearbyError={nearbyError}
              user={user}
              onDescriptionChange={(value) => { setDescription(value); setErrors((current) => ({ ...current, description: '' })) }}
              onAudioChange={setAudio}
              onConfirmNearby={handleConfirmNearby}
              onViewNearby={(id) => navigate(`/app/mapa?selectedReportId=${encodeURIComponent(id)}`)}
              onDismissNearby={() => setNearbyDismissed(true)}
            />
            {errors.form ? <div className="form-alert guided-form-alert" role="alert"><CircleAlert size={18} />{errors.form}</div> : null}
            <div className="guided-step-actions">
              <button type="button" className="button-secondary" onClick={goBack}>Voltar</button>
              <button type="button" className="button-primary" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : <><Check size={17} /> Enviar ocorrência</>}
              </button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
