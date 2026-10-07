'use client'

import { Check, MapPin, UsersRound } from 'lucide-react'
import type { DemoUser, GeoPoint, Report, ReportCategory } from '../../types/domain'
import { REPORT_CATEGORIES } from '../../types/domain'
import { CategoryIcon } from '../ui/CategoryIcon'
import { PhotoFrame } from '../ui/PhotoFrame'
import { StatusBadge } from '../ui/StatusBadge'

type NearbyReportMatch = { report: Report; distance: number }

function formatDistance(distance: number) {
  return distance < 1000 ? `${Math.max(1, Math.round(distance))} m` : `${(distance / 1000).toFixed(1).replace('.', ',')} km`
}

export function ReportDetailsStep({
  category,
  description,
  photo,
  location,
  locationLabel,
  errors,
  nearbyReports,
  nearbyDismissed,
  nearbyConfirmedId,
  nearbyConfirmingId,
  nearbyError,
  user,
  onCategoryChange,
  onDescriptionChange,
  onConfirmNearby,
  onViewNearby,
  onDismissNearby,
}: {
  category: ReportCategory | ''
  description: string
  photo: string
  location?: GeoPoint
  locationLabel: string
  errors: Record<string, string>
  nearbyReports: NearbyReportMatch[]
  nearbyDismissed: boolean
  nearbyConfirmedId: string
  nearbyConfirmingId: string
  nearbyError: string
  user: DemoUser
  onCategoryChange: (category: ReportCategory) => void
  onDescriptionChange: (description: string) => void
  onConfirmNearby: (id: string) => void
  onViewNearby: (id: string) => void
  onDismissNearby: () => void
}) {
  return (
    <section className="guided-form-step guided-details-step" aria-labelledby="details-step-title">
      <div className="guided-step-intro">
        <span className="guided-step-icon"><Check size={23} /></span>
        <div>
          <p className="eyebrow">Etapa 3 de 3</p>
          <h1 id="details-step-title">Conte o que aconteceu</h1>
          <p>Escolha uma categoria e descreva o problema com suas palavras.</p>
        </div>
      </div>

      <div className="guided-report-summary">
        <PhotoFrame src={photo} category={category || 'Buraco na via'} alt="Fotografia anexada à ocorrência" className="guided-report-summary-photo" />
        <div>
          <span className="eyebrow">Local escolhido</span>
          <strong>{locationLabel || 'Ponto escolhido no mapa'}</strong>
          {location ? <small>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</small> : null}
        </div>
      </div>

      <div className="guided-field-group">
        <div className="guided-field-heading">
          <label>Qual é o problema?</label>
          <span>obrigatório</span>
        </div>
        <div className="guided-category-grid" role="radiogroup" aria-label="Categoria da ocorrência">
          {REPORT_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={category === item}
              className={`guided-category-choice ${category === item ? 'guided-category-choice-selected' : ''}`}
              onClick={() => onCategoryChange(item)}
            >
              <CategoryIcon category={item} size="sm" />
              <span>{item}</span>
              {category === item ? <Check size={16} aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
        {errors.category ? <p className="form-error" role="alert">{errors.category}</p> : null}
      </div>

      <div className="guided-field-group">
        <div className="guided-field-heading">
          <label htmlFor="guided-description">Descrição</label>
          <span>obrigatório</span>
        </div>
        <textarea
          id="guided-description"
          className={`text-area guided-description ${errors.description ? 'field-error' : ''}`}
          maxLength={500}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Ex.: há um buraco grande na faixa direita da via..."
          aria-describedby={errors.description ? 'guided-description-error' : undefined}
        />
        <div className="guided-description-footer"><span>{description.length}/500</span>{errors.description ? <span className="form-error" id="guided-description-error">{errors.description}</span> : null}</div>
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
