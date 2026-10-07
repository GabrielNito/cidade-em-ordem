'use client'

import { LocateFixed, LoaderCircle, MapPin, Search, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { IssueMap } from '../maps/IssueMap'
import type { GeoPoint, Report } from '../../types/domain'

interface SearchPlace {
  id: string
  label: string
  point: GeoPoint
}

export type LocationPickerState = 'idle' | 'loading' | 'success' | 'denied' | 'error'

export function LocationPicker({
  reports,
  location,
  recenterPoint,
  locationState,
  locationError,
  onLocationChange,
  onMapCenterChange,
  onRequestLocation,
  onUseDemoLocation,
  onContinue,
}: {
  reports: Report[]
  location?: GeoPoint
  recenterPoint?: GeoPoint
  locationState: LocationPickerState
  locationError: string
  onLocationChange: (point: GeoPoint, label?: string) => void
  onMapCenterChange: (point: GeoPoint) => void
  onRequestLocation: () => void
  onUseDemoLocation: () => void
  onContinue: () => void
}) {
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState<SearchPlace[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const searchAbortRef = useRef<AbortController | undefined>(undefined)

  const searchPlaces = async (event: FormEvent) => {
    event.preventDefault()
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 3) {
      setSearchError('Digite pelo menos 3 caracteres para pesquisar.')
      setPlaces([])
      return
    }

    searchAbortRef.current?.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller
    setIsSearching(true)
    setSearchError('')
    const timeoutId = window.setTimeout(() => controller.abort(), 6000)
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'br',
        q: `${normalizedQuery}, Indaiatuba, SP, Brasil`,
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Não foi possível consultar endereços agora.')
      const data = await response.json() as Array<{ place_id: number; display_name: string; lat: string; lon: string }>
      const nextPlaces = data
        .map((place) => ({
          id: String(place.place_id),
          label: place.display_name,
          point: { latitude: Number(place.lat), longitude: Number(place.lon) },
        }))
        .filter((place) => Number.isFinite(place.point.latitude) && Number.isFinite(place.point.longitude))
      setPlaces(nextPlaces)
      if (!nextPlaces.length) setSearchError('Nenhum endereço encontrado em Indaiatuba.')
    } catch (error) {
      if (searchAbortRef.current !== controller) return
      if (error instanceof DOMException && error.name === 'AbortError') {
        setPlaces([])
        setSearchError('A busca demorou mais que o esperado. Mova o mapa ou tente novamente.')
        return
      }
      setPlaces([])
      setSearchError(error instanceof Error ? error.message : 'Não foi possível pesquisar este endereço.')
    } finally {
      window.clearTimeout(timeoutId)
      if (searchAbortRef.current === controller) {
        searchAbortRef.current = undefined
        setIsSearching(false)
      }
    }
  }

  const selectPlace = (place: SearchPlace) => {
    setQuery(place.label)
    setPlaces([])
    setSearchError('')
    onLocationChange(place.point, place.label)
  }

  return (
    <div className="location-picker">
      <IssueMap
        reports={reports}
        initialCenter={location}
        focusPoint={recenterPoint}
        onCenterChange={onMapCenterChange}
        showCenterMarker
        scrollWheelZoom
        className="location-picker-map"
      />

      <div className="location-picker-search-wrap">
        <form className="location-picker-search" onSubmit={searchPlaces} role="search">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setSearchError('') }}
            placeholder="Pesquisar rua ou ponto de referência"
            aria-label="Pesquisar endereço em Indaiatuba"
          />
          {query ? (
            <button type="button" className="location-picker-clear" onClick={() => { setQuery(''); setPlaces([]); setSearchError('') }} aria-label="Limpar pesquisa">
              <X size={16} />
            </button>
          ) : null}
          <button type="submit" className="location-picker-search-button" disabled={isSearching}>
            {isSearching ? <LoaderCircle size={17} className="button-spinner" aria-hidden="true" /> : 'Buscar'}
          </button>
        </form>
        {places.length ? (
          <div className="location-picker-results" role="listbox" aria-label="Endereços encontrados">
            {places.map((place) => (
              <button key={place.id} type="button" role="option" className="location-picker-result" onClick={() => selectPlace(place)}>
                <MapPin size={17} aria-hidden="true" />
                <span>{place.label}</span>
              </button>
            ))}
          </div>
        ) : null}
        {searchError ? <p className="location-picker-error" role="alert">{searchError}</p> : null}
      </div>

      <div className="location-picker-center-caption" aria-hidden="true">
        <span>Posicione o mapa</span>
      </div>

      <div className="location-picker-bottom-card">
        <div className="location-picker-instruction">
          <span className="location-picker-instruction-icon"><MapPin size={19} /></span>
          <div>
            <strong>{location ? 'Confira o ponto da ocorrência' : 'Mova o mapa até o local'}</strong>
            <p>O ponto fixo no centro será usado como localização do chamado.</p>
          </div>
        </div>
        <div className="location-picker-actions">
          <button type="button" className="button-secondary location-picker-location-button" onClick={onRequestLocation} disabled={locationState === 'loading'}>
            {locationState === 'loading' ? <LoaderCircle size={17} className="button-spinner" /> : <LocateFixed size={17} />}
            Minha localização
          </button>
          <div className="location-picker-selected-point" aria-live="polite">
            {location ? (
              <span>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
            ) : (
              <span>Selecione uma localização para continuar</span>
            )}
          </div>
        </div>
        <button type="button" className="button-primary location-picker-continue" onClick={onContinue} disabled={!location}>
          Continuar
        </button>
        {locationError ? <p className="location-picker-location-error" role="alert">{locationError}</p> : null}
        {(locationState === 'denied' || locationState === 'error') && !location ? (
          <button type="button" className="demo-location-button location-picker-demo-button" onClick={onUseDemoLocation}>Usar ponto de demonstração</button>
        ) : null}
      </div>
    </div>
  )
}
