import { describe, it, expect } from 'vitest'
import { parseAddressFromText } from './parseAddressFromText'

describe('parseAddressFromText', () => {
  it('parses Indian multi-line address with pincode and landmark', () => {
    const raw = `Anmol Srivastava
9916421310
Flat 101, Sunrise Apartments
Sector 5, DLF Phase 2
Near Apollo Hospital
Gurgaon - 122002
Haryana
India`
    const result = parseAddressFromText(raw, 'IN')
    expect(result.fields.fullName).toBe('Anmol Srivastava')
    expect(result.fields.phone).toBe('9916421310')
    expect(result.fields.addressLine1).toContain('Flat 101')
    expect(result.fields.addressLine2).toContain('Sector 5')
    expect(result.fields.landmark).toContain('Near Apollo Hospital')
    expect(result.fields.city).toBe('Gurgaon')
    expect(result.fields.stateOrProvince).toBe('Haryana')
    expect(result.fields.postalCode).toBe('122002')
    expect(result.fields.country).toBe('India')
    expect(result.confidence.fullName).toBeGreaterThan(0)
    expect(result.confidence.phone).toBeGreaterThan(0)
    expect(result.confidence.postalCode).toBeGreaterThan(0)
    expect(result.confidence.landmark).toBeGreaterThan(0)
    expect(result.rawLines.length).toBeGreaterThan(0)
  })

  it('parses US address with City, ST ZIP format', () => {
    const raw = `John Doe
(555) 123-4567
123 Main Street
Apt 4B
San Francisco, CA 94102
United States`
    const result = parseAddressFromText(raw, 'US')
    expect(result.fields.city).toBe('San Francisco')
    expect(result.fields.stateOrProvince).toBe('CA')
    expect(result.fields.postalCode).toBe('94102')
    expect(result.fields.country).toMatch(/United States|America/i)
    expect(result.confidence.city).toBeGreaterThan(0)
    expect(result.confidence.stateOrProvince).toBeGreaterThan(0)
    expect(result.confidence.postalCode).toBeGreaterThan(0)
  })

  it('extracts what it can from messy screenshot text and leaves uncertain fields blank', () => {
    const raw = `Some Header Text
Save
Cancel
Bangalore - 560001
Karnataka
random button
footer`
    const result = parseAddressFromText(raw, 'IN')
    expect(result.fields.postalCode).toBe('560001')
    expect(result.fields.city).toBe('Bangalore')
    expect(result.fields.stateOrProvince).toBe('Karnataka')
    expect(result.confidence.postalCode).toBeGreaterThan(0)
    expect(result.confidence.city).toBeGreaterThan(0)
    expect(result.fields.fullName).toBe('')
    expect(result.fields.phone).toBe('')
    expect(result.rawLines.length).toBeGreaterThan(0)
  })

  it('parses Indian address with Hinglish landmark like "temple ke peeche"', () => {
    const raw = `Rahul Kumar
9876543210
House 42, Gandhi Nagar
temple ke peeche
Lucknow - 226001
Uttar Pradesh
India`
    const result = parseAddressFromText(raw, 'IN')
    expect(result.fields.fullName).toBe('Rahul Kumar')
    expect(result.fields.phone).toBe('9876543210')
    expect(result.fields.addressLine1).toContain('House 42')
    expect(result.fields.landmark).toBe('temple ke peeche')
    expect(result.fields.city).toBe('Lucknow')
    expect(result.fields.stateOrProvince).toBe('Uttar Pradesh')
    expect(result.fields.postalCode).toBe('226001')
    expect(result.fields.country).toBe('India')
    expect(result.confidence.landmark).toBeGreaterThan(0)
  })
})
