'use client'

import { useRef, useState } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface Props {
  src: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

function initCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
    width,
    height,
  )
}

export default function LogoCropModal({ src, onConfirm, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget
    setCrop(initCrop(naturalWidth, naturalHeight))
  }

  function handleConfirm() {
    const img = imgRef.current
    if (!img || !crop) return

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height

    const px = crop.unit === '%' ? (crop.x / 100) * img.width : crop.x
    const py = crop.unit === '%' ? (crop.y / 100) * img.height : crop.y
    const pw = crop.unit === '%' ? (crop.width / 100) * img.width : crop.width
    const ph = crop.unit === '%' ? (crop.height / 100) * img.height : crop.height

    ctx.drawImage(img, px * scaleX, py * scaleY, pw * scaleX, ph * scaleY, 0, 0, 256, 256)

    canvas.toBlob(blob => { if (blob) onConfirm(blob) }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4">
        <h3 className="font-display text-lg font-bold text-cream">Recortar logo</h3>

        <div className="flex justify-center">
          <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={1} minWidth={40}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={src} alt="crop preview" onLoad={onImageLoad} className="max-h-72 object-contain" />
          </ReactCrop>
        </div>

        <p className="text-xs text-muted text-center">Arrastra las esquinas para ajustar el recorte cuadrado · se guardará a 256×256 px</p>

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-border text-cream rounded-xl py-3 text-sm hover:border-gold/50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleConfirm}
            className="flex-1 bg-gold hover:bg-gold-dark text-bg font-semibold rounded-xl py-3 text-sm transition-colors">
            Recortar y subir
          </button>
        </div>
      </div>
    </div>
  )
}
