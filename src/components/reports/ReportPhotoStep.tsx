'use client'

import { Camera, ImagePlus, RefreshCw, X } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import type { ReportCategory } from '../../types/domain'
import { PhotoFrame } from '../ui/PhotoFrame'

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

export function ReportPhotoStep({
  photo,
  category,
  error,
  onPhotoChange,
  onError,
  onRemove,
}: {
  photo: string
  category: ReportCategory
  error?: string
  onPhotoChange: (photo: string) => void
  onError: (message: string) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onError('Escolha um arquivo de imagem.')
      return
    }
    try {
      onPhotoChange(await fileToDataUrl(file))
      onError('')
    } catch {
      onError('Não foi possível carregar esta imagem.')
    }
  }

  const clearPhoto = () => {
    onRemove()
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className="guided-form-step guided-photo-step" aria-labelledby="photo-step-title">
      <div className="guided-step-intro">
        <span className="guided-step-icon"><Camera size={23} /></span>
        <div>
          <p className="eyebrow">Etapa 2 de 3</p>
          <h1 id="photo-step-title">Mostre o problema</h1>
          <p>Uma fotografia ajuda a equipe a entender a situação antes de chegar ao local.</p>
        </div>
      </div>

      <input ref={inputRef} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={handleChange} />
      {photo ? (
        <div className="guided-photo-preview-wrap">
          <PhotoFrame src={photo} category={category} alt="Pré-visualização da fotografia da ocorrência" className="guided-photo-preview" />
          <div className="guided-photo-preview-actions">
            <button type="button" className="button-secondary" onClick={() => inputRef.current?.click()}><RefreshCw size={17} /> Trocar fotografia</button>
            <button type="button" className="text-button guided-photo-remove" onClick={clearPhoto}><X size={16} /> Remover</button>
          </div>
        </div>
      ) : (
        <button type="button" className={`guided-photo-dropzone ${error ? 'field-error' : ''}`} onClick={() => inputRef.current?.click()}>
          <span className="guided-photo-dropzone-icon"><ImagePlus size={30} /></span>
          <strong>Adicionar fotografia</strong>
          <span>Use a câmera ou escolha uma imagem do aparelho.</span>
          <small>Formato JPG ou PNG</small>
        </button>
      )}
      {error ? <p className="form-error guided-step-error" role="alert">{error}</p> : null}
      <p className="guided-accessibility-note"><Camera size={16} aria-hidden="true" /> A fotografia é obrigatória para registrar a ocorrência.</p>
    </section>
  )
}
