import { useState, useCallback } from 'react'
import type { ParsedAddress, ParsedAddressConfidence } from '../parser/types'
import { PARSED_ADDRESS_KEYS } from '../parser/types'
import type { DirtyFields } from '../hooks/useAddressForm'

const FIELD_LABELS: Record<keyof ParsedAddress, string> = {
  fullName: 'Full name',
  phone: 'Phone',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  landmark: 'Landmark',
  city: 'City',
  stateOrProvince: 'State',
  postalCode: 'Postal code',
  country: 'Country',
}

function confidenceLabel(c: number): string {
  if (c >= 0.8) return 'High'
  if (c >= 0.5) return 'Medium'
  if (c > 0) return 'Low'
  return '—'
}

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  box: {
    background: '#fff',
    borderRadius: 8,
    maxWidth: 440,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  header: {
    padding: 16,
    borderBottom: '1px solid #eee',
    fontSize: 18,
    fontWeight: 600,
  },
  body: { padding: 16 },
  field: { marginBottom: 12 },
  fieldRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  label: { fontSize: 12, color: '#666', marginBottom: 2 },
  input: {
    flex: 1,
    padding: '8px 10px',
    fontSize: 14,
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  confidence: {
    fontSize: 11,
    color: '#888',
    minWidth: 48,
    paddingTop: 8,
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  footer: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    padding: 16,
    borderTop: '1px solid #eee',
  },
  button: {
    padding: '10px 20px',
    fontSize: 14,
    borderRadius: 4,
    cursor: 'pointer',
    border: '1px solid #ccc',
    background: '#fff',
  },
  primary: {
    background: '#ffd814',
    borderColor: '#f0c14b',
    fontWeight: 600,
  },
}

export interface ReviewAddressModalProps {
  fields: ParsedAddress
  confidence: ParsedAddressConfidence
  existingDirty: DirtyFields
  onApply: (editedFields: ParsedAddress, replaceExisting: boolean) => void
  onCancel: () => void
}

export function ReviewAddressModal({
  fields,
  confidence,
  existingDirty,
  onApply,
  onCancel,
}: ReviewAddressModalProps) {
  const [edited, setEdited] = useState<ParsedAddress>({ ...fields })
  const [replaceExisting, setReplaceExisting] = useState(false)

  const setField = useCallback((key: keyof ParsedAddress, value: string) => {
    setEdited((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleApply = () => {
    onApply(edited, replaceExisting)
  }

  const hasDirty = Object.values(existingDirty).some(Boolean)

  return (
    <div style={modalStyles.overlay} role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
      <div style={modalStyles.box}>
        <div id="review-modal-title" style={modalStyles.header}>
          Review & edit address
        </div>
        <div style={modalStyles.body}>
          {PARSED_ADDRESS_KEYS.map((key) => (
            <div key={key} style={modalStyles.field}>
              <div style={modalStyles.label}>{FIELD_LABELS[key]}</div>
              <div style={modalStyles.fieldRow}>
                <input
                  type="text"
                  style={modalStyles.input}
                  value={edited[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  placeholder={`${FIELD_LABELS[key]}…`}
                />
                <span style={modalStyles.confidence}>{confidenceLabel(confidence[key])}</span>
              </div>
            </div>
          ))}
          {hasDirty && (
            <div style={modalStyles.checkboxRow}>
              <input
                id="replace-existing"
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
              />
              <label htmlFor="replace-existing">Replace existing values</label>
            </div>
          )}
        </div>
        <div style={modalStyles.footer}>
          <button type="button" style={modalStyles.button} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" style={{ ...modalStyles.button, ...modalStyles.primary }} onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
