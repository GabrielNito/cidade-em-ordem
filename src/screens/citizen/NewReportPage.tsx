'use client'

import { ArrowLeft, Check, CircleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '../../navigation'
import { LocationPicker, type LocationPickerState } from '../../components/reports/LocationPicker'
import { ReportDetailsStep } from '../../components/reports/ReportDetailsStep'
import { ReportPhotoStep } from '../../components/reports/ReportPhotoStep'
import { useApp } from '../../context/AppContext'
import type { GeoPoint, ReportCategory } from '../../types/domain'
import { findNearbyReports } from '../../utils/geo'

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
  const [location, setLocation] = useState<GeoPoint>()
  const [recenterPoint, setRecenterPoint] = useState<GeoPoint>()
  const [locationLabel, setLocationLabel] = useState('')
  const [locationState, setLocationState] = useState<LocationPickerState>('idle')
  const [locationError, setLocationError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const useDemoLocation = useCallback(() => {
    const point = { latitude: -23.1162, longitude: -47.2385 }
    setRecenterPoint(point)
    chooseLocation(point, 'Ponto de demonstração')
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
      navigate(`/app/mapa?selectedReportId=${encodeURIComponent(report.id)}`, { replace: true })
    } catch {
      setErrors({ form: 'Não foi possível registrar a ocorrência. Tente novamente.' })
    } finally {
      setIsSubmitting(false)
    }
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
            onUseDemoLocation={useDemoLocation}
            onContinue={goNext}
          />
        ) : null}

        {step === 'photo' ? (
          <>
            <ReportPhotoStep
              photo={photo}
              category={category || 'Buraco na via'}
              error={errors.photo}
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
              location={location}
              locationLabel={locationLabel}
              errors={errors}
              nearbyReports={nearbyReports}
              nearbyDismissed={nearbyDismissed}
              nearbyConfirmedId={nearbyConfirmedId}
              nearbyConfirmingId={nearbyConfirmingId}
              nearbyError={nearbyError}
              user={user}
              onCategoryChange={(value) => { setCategory(value); setErrors((current) => ({ ...current, category: '' })) }}
              onDescriptionChange={(value) => { setDescription(value); setErrors((current) => ({ ...current, description: '' })) }}
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
