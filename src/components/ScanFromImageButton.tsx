import { useRef, useState } from 'react'
import type { OcrEngine } from '../ocr/OcrEngine'

/**
 * Link-style row to match "Add location on map": no box/border, same icon + text treatment.
 */
const linkRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 14,
  color: 'var(--amazon-link, #007185)',
  fontSize: 14,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
}

const iconStyle: React.CSSProperties = { width: 18, height: 18, flexShrink: 0 }

const errorStyle: React.CSSProperties = { fontSize: 13, color: '#c45500', marginTop: 4 }

const spinnerStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  border: '2px solid #eee',
  borderTopColor: 'var(--amazon-link, #007185)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
  flexShrink: 0,
}

function ImageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--amazon-orange-icon, #c45500)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

export interface ScanFromImageButtonProps {
  ocrEngine: OcrEngine
  onScanResult: (rawText: string) => void | Promise<void>
  onError?: (message: string) => void
}

/**
 * One tap opens system picker (camera or photo library). Styled like "Add location on map" link.
 */
export function ScanFromImageButton({ ocrEngine, onScanResult, onError }: ScanFromImageButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const processFile = async (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('Please select an image.')
      return
    }
    setErrorMessage(null)
    setLoading(true)
    try {
      const text = await ocrEngine.recognize(file)
      const trimmed = text.trim()
      if (!trimmed) {
        setErrorMessage('No text found in the image.')
        onError?.('No text found')
        return
      }
      await onScanResult(trimmed)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OCR failed'
      setErrorMessage(msg)
      onError?.(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    processFile(file ?? null)
    e.target.value = ''
  }

  const handleClick = () => {
    setErrorMessage(null)
    fileInputRef.current?.click()
  }

  return (
    <div style={{ marginBottom: 2 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden
      />
      <button
        type="button"
        style={linkRowStyle}
        onClick={handleClick}
        disabled={loading}
        aria-label="Scan from image or camera"
      >
        {loading ? <span style={spinnerStyle} aria-hidden /> : <ImageIcon />}
        <span>Scan from image</span>
      </button>
      {errorMessage && (
        <p style={errorStyle} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
