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

const INDAIATUBA_LANDMARKS: SearchPlace[] = [
  { id: 'ind-centro', label: 'Centro, Indaiatuba - SP (Praça Prudente de Moraes)', point: { latitude: -23.0891, longitude: -47.2044 } },
  { id: 'ind-parque', label: 'Parque Ecológico - Av. Eng. Fábio Roberto Barnabé', point: { latitude: -23.0982, longitude: -47.2185 } },
  { id: 'ind-morumbi', label: 'Jardim Morumbi, Indaiatuba - SP', point: { latitude: -23.0908, longitude: -47.2113 } },
  { id: 'ind-paupreto', label: 'Jardim Pau Preto, Indaiatuba - SP (Museu da Água)', point: { latitude: -23.0974, longitude: -47.2189 } },
  { id: 'ind-cecap', label: 'Núcleo Habitacional Brigadeiro Faria Lima (CECAP)', point: { latitude: -23.1025, longitude: -47.2341 } },
  { id: 'ind-itaici', label: 'Itaici, Indaiatuba - SP (Estação Itaici)', point: { latitude: -23.0612, longitude: -47.1685 } },
  { id: 'ind-cidadenova', label: 'Cidade Nova, Indaiatuba - SP', point: { latitude: -23.0828, longitude: -47.2141 } },
  { id: 'ind-poloshopping', label: 'Polo Shopping Indaiatuba - Alameda Filtros Mann', point: { latitude: -23.1162, longitude: -47.2385 } },
  { id: 'ind-candelaria', label: 'Rua Candelária, Centro - Indaiatuba', point: { latitude: -23.0879, longitude: -47.2081 } },
]

function normalizeSearchText(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

export function LocationPicker({
  reports,
  location,
  recenterPoint,
  locationState,
  locationError,
  onLocationChange,
  onMapCenterChange,
  onRequestLocation,
  onUseSuggestedLocation,
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
  onUseSuggestedLocation: () => void
  onContinue: () => void
}) {
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState<SearchPlace[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const searchAbortRef = useRef<AbortController | undefined>(undefined)

  const searchPlaces = async (event: FormEvent) => {
    event.preventDefault()
    const normalizedQuery = normalizeSearchText(query)
    if (normalizedQuery.length < 2) {
      setSearchError('Digite pelo menos 2 caracteres para pesquisar.')
      setPlaces([])
      return
    }

    const localMatches = INDAIATUBA_LANDMARKS.filter((item) =>
      normalizeSearchText(item.label).includes(normalizedQuery),
    )

    if (localMatches.length > 0) {
      setPlaces(localMatches)
      setSearchError('')
    }

    searchAbortRef.current?.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller
    setIsSearching(true)
    setSearchError('')
    const timeoutId = window.setTimeout(() => controller.abort(), 4000)
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'br',
        q: `${query.trim()}, Indaiatuba, SP, Brasil`,
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Falha no serviço online')
      const data = await response.json() as Array<{ place_id: number; display_name: string; lat: string; lon: string }>
      const remotePlaces = data
        .map((place) => ({
          id: String(place.place_id),
          label: place.display_name,
          point: { latitude: Number(place.lat), longitude: Number(place.lon) },
        }))
        .filter((place) => Number.isFinite(place.point.latitude) && Number.isFinite(place.point.longitude))

      const merged = [...localMatches]
      for (const remote of remotePlaces) {
        if (!merged.some((m) => Math.abs(m.point.latitude - remote.point.latitude) < 0.001 && Math.abs(m.point.longitude - remote.point.longitude) < 0.001)) {
          merged.push(remote)
        }
      }

      setPlaces(merged)
      if (!merged.length) setSearchError('Nenhum endereço encontrado em Indaiatuba.')
    } catch {
      if (searchAbortRef.current !== controller) return
      if (localMatches.length > 0) {
        setPlaces(localMatches)
        setSearchError('')
      } else {
        setPlaces([])
        setSearchError('Endereço não localizado. Toque em um dos pontos sugeridos ou posicione o mapa.')
      }
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
        zoom={16}
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
        {!places.length && !searchError && !query ? (
          <div className="location-picker-quick-chips" aria-label="Sugestões de locais">
            <span>Locais rápidos:</span>
            {INDAIATUBA_LANDMARKS.slice(0, 3).map((landmark) => (
              <button
                key={landmark.id}
                type="button"
                className="location-picker-quick-chip"
                onClick={() => selectPlace(landmark)}
              >
                {landmark.label.split(' - ')[0].split(',')[0]}
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
        <div className="location-picker-choice">
          <strong>Escolha como prefere localizar</strong>
          <span>Use sua posição, busque um endereço ou ajuste o ponto no mapa.</span>
        </div>
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
            Usar minha localização
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
          <button type="button" className="demo-location-button location-picker-demo-button" onClick={onUseSuggestedLocation}>Usar ponto indicado no mapa</button>
        ) : null}
      </div>
    </div>
  )
}
