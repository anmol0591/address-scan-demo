import { useState, useCallback } from 'react'
import { RealOcrEngine } from '../ocr/OcrEngine'
import { parseAddressWithGemini } from '../parser/geminiAddressParser'
import type { ParsedAddress } from '../parser/types'
import { useAddressForm } from '../hooks/useAddressForm'
import { ScanFromImageButton } from '../components/ScanFromImageButton'
import { ReviewAddressModal } from '../components/ReviewAddressModal'
import { IN_STATES, US_STATE_ABBREV } from '../parser/stateLists'

const formStyles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 480,
    margin: '0 auto',
    padding: 16,
    paddingBottom: 32,
    background: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 16,
    color: '#111',
  },
  field: { marginBottom: 14 },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
    color: '#111',
  },
  hint: { fontSize: 12, color: '#565959', marginTop: 2 },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #a2a6ac',
    borderRadius: 4,
    background: '#fff',
    color: '#111',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #a2a6ac',
    borderRadius: 4,
    background: '#fff',
    color: '#111',
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    color: '#007185',
    fontSize: 14,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
  },
  linkIcon: { width: 18, height: 18, flexShrink: 0 },
  scanBlock: { marginBottom: 0 },
  row: { display: 'flex', gap: 12 },
  half: { flex: 1 },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
  checkbox: { width: 18, height: 18 },
  submit: {
    width: '100%',
    padding: 14,
    fontSize: 15,
    fontWeight: 600,
    border: '1px solid #f0c14b',
    borderRadius: 4,
    background: '#ffd814',
    color: '#111',
    cursor: 'pointer',
  },
  toast: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 20px',
    borderRadius: 8,
    background: '#232f3e',
    color: '#fff',
    fontSize: 14,
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  deliveryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    cursor: 'pointer',
  },
  deliveryTitle: { fontSize: 14, color: '#007185', fontWeight: 600 },
  deliverySub: { fontSize: 12, color: '#565959', fontWeight: 400, marginTop: 2 },
}

export default function AddressFormScreen() {
  const { form, setField, dirty, applyParsed } = useAddressForm()
  const [reviewData, setReviewData] = useState<{
    fields: ParsedAddress
    confidence: Record<keyof ParsedAddress, number>
  } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const ocrEngine = new RealOcrEngine()

  const handleScanResult = useCallback(async (rawText: string) => {
    try {
      const result = await parseAddressWithGemini(rawText)
      setReviewData({ fields: result.fields, confidence: result.confidence })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse address'
      console.error(msg, err)
      setToast(msg)
      setTimeout(() => setToast(null), 4000)
    }
  }, [])

  const handleReviewApply = useCallback(
    (editedFields: ParsedAddress, replaceExisting: boolean) => {
      applyParsed(editedFields, replaceExisting)
      setReviewData(null)
      setToast('Address filled — please verify')
      setTimeout(() => setToast(null), 3000)
    },
    [applyParsed]
  )

  const handleReviewCancel = useCallback(() => {
    setReviewData(null)
  }, [])

  return (
    <div style={formStyles.page}>
      <h1 style={formStyles.title}>Add a new address.</h1>

      <div style={formStyles.field}>
        <label style={formStyles.label} htmlFor="country">
          Country/Region
        </label>
        <select
          id="country"
          style={formStyles.select}
          value={form.country}
          onChange={(e) => setField('country', e.target.value)}
        >
          <option value="India">India</option>
          <option value="United States">United States</option>
        </select>
      </div>

      <div style={formStyles.field}>
        <label style={formStyles.label} htmlFor="fullName">
          Full name (First and Last name)
        </label>
        <input
          id="fullName"
          type="text"
          style={formStyles.input}
          value={form.fullName}
          onChange={(e) => setField('fullName', e.target.value)}
          placeholder="Full name"
        />
      </div>

      <div style={formStyles.field}>
        <label style={formStyles.label} htmlFor="phone">
          Mobile number
        </label>
        <input
          id="phone"
          type="tel"
          style={formStyles.input}
          value={form.phone}
          onChange={(e) => setField('phone', e.target.value)}
          placeholder="10-digit mobile"
        />
        <span style={formStyles.hint}>May be used to assist delivery.</span>
      </div>

      <div style={formStyles.scanBlock}>
        <ScanFromImageButton ocrEngine={ocrEngine} onScanResult={handleScanResult} />
        <div
          style={formStyles.linkRow}
          role="button"
          tabIndex={0}
          onClick={() => {}}
          onKeyDown={(e) => e.key === 'Enter' && (() => {})()}
        >
          <svg style={formStyles.linkIcon} viewBox="0 0 24 24" fill="none" stroke="#c45500" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>Add location on map</span>
        </div>
      </div>

      <div style={formStyles.field}>
        <label style={formStyles.label} htmlFor="addressLine1">
          Flat, House no., Building, Company, Apartment
        </label>
        <input
          id="addressLine1"
          type="text"
          style={formStyles.input}
          value={form.addressLine1}
          onChange={(e) => setField('addressLine1', e.target.value)}
          placeholder=""
        />
      </div>

      <div style={formStyles.field}>
        <label style={formStyles.label} htmlFor="addressLine2">
          Area, Street, Sector, Village
        </label>
        <input
          id="addressLine2"
          type="text"
          style={formStyles.input}
          value={form.addressLine2}
          onChange={(e) => setField('addressLine2', e.target.value)}
          placeholder=""
        />
      </div>

      <div style={formStyles.field}>
        <label style={formStyles.label} htmlFor="landmark">
          Landmark
        </label>
        <input
          id="landmark"
          type="text"
          style={formStyles.input}
          value={form.landmark}
          onChange={(e) => setField('landmark', e.target.value)}
          placeholder="E.g. near apollo hospital"
        />
      </div>

      <div style={formStyles.row}>
        <div style={{ ...formStyles.field, ...formStyles.half }}>
          <label style={formStyles.label} htmlFor="postalCode">
            Pincode
          </label>
          <input
            id="postalCode"
            type="text"
            style={formStyles.input}
            value={form.postalCode}
            onChange={(e) => setField('postalCode', e.target.value)}
            placeholder="6-digit Pincode"
          />
        </div>
        <div style={{ ...formStyles.field, ...formStyles.half }}>
          <label style={formStyles.label} htmlFor="city">
            Town/City
          </label>
          <input
            id="city"
            type="text"
            style={formStyles.input}
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
            placeholder=""
          />
        </div>
      </div>

      <div style={formStyles.field}>
        <label style={formStyles.label} htmlFor="state">
          State
        </label>
        <select
          id="state"
          style={formStyles.select}
          value={form.stateOrProvince}
          onChange={(e) => setField('stateOrProvince', e.target.value)}
        >
          <option value="">Select</option>
          {form.country.includes('United States')
            ? US_STATE_ABBREV.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))
            : IN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
        </select>
      </div>

      <div style={formStyles.checkboxRow}>
        <input
          id="defaultAddress"
          type="checkbox"
          style={formStyles.checkbox}
          checked={form.defaultAddress}
          onChange={(e) => setField('defaultAddress', e.target.checked)}
        />
        <label htmlFor="defaultAddress" style={{ ...formStyles.label, marginBottom: 0 }}>
          Make this my default address
        </label>
      </div>

      <div style={formStyles.deliveryRow}>
        <div>
          <div style={formStyles.deliveryTitle}>Delivery instructions (optional)</div>
          <div style={formStyles.deliverySub}>Notes, preferences and more</div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#007185" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>

      <button type="button" style={formStyles.submit} onClick={() => {}}>
        Add address
      </button>

      {reviewData && (
        <ReviewAddressModal
          fields={reviewData.fields}
          confidence={reviewData.confidence}
          existingDirty={dirty}
          onApply={handleReviewApply}
          onCancel={handleReviewCancel}
        />
      )}

      {toast && <div style={formStyles.toast} role="status">{toast}</div>}
    </div>
  )
}
