'use client'

import { Check, ChevronDown } from 'lucide-react'

export interface MapFilterOption<Value extends string> {
  value: Value
  label: string
}

interface MapFilterAccordionProps<Value extends string> {
  id: string
  label: string
  value: Value
  options: readonly MapFilterOption<Value>[]
  open: boolean
  onToggle: () => void
  onChange: (value: Value) => void
}

export function MapFilterAccordion<Value extends string>({
  id,
  label,
  value,
  options,
  open,
  onToggle,
  onChange,
}: MapFilterAccordionProps<Value>) {
  const selectedOption = options.find((option) => option.value === value) ?? options[0]

  return (
    <div className={`map-filter-control ${open ? 'map-filter-control-open' : ''}`}>
      <button
        type="button"
        className="map-filter-trigger"
        aria-controls={id}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="map-filter-trigger-copy">
          <span className="map-filter-trigger-label">{label}</span>
          <strong>{selectedOption?.label}</strong>
        </span>
        <ChevronDown className="map-filter-trigger-chevron" size={15} aria-hidden="true" />
      </button>
      <div className="map-filter-options-shell">
        <div id={id} className="map-filter-options" role="group" aria-label={`Opções de ${label.toLowerCase()}`}>
          {options.map((option) => {
            const selected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                className={`map-filter-option ${selected ? 'map-filter-option-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => {
                  onChange(option.value)
                  onToggle()
                }}
              >
                <span>{option.label}</span>
                {selected ? <Check size={15} aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
