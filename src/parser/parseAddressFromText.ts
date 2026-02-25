import {
  emptyConfidence,
  emptyParsedAddress,
  type ParseAddressResult,
  type ParsedAddress,
  type ParsedAddressConfidence,
} from './types'
import { getAllStatePatterns } from './stateLists'

const LANDMARK_KEYWORDS_EN = ['near', 'opp', 'opposite', 'behind', 'beside', 'landmark', 'next to']
// Hindi/Hinglish: "X ke peeche", "temple ke paas", etc.
const LANDMARK_KEYWORDS_HI = [
  'ke peeche', 'ke saamne', 'ke samne', 'ke paas', 'ke bagal', 'ke niche', 'ke upar', 'ke opposite',
  'peeche', 'saamne', 'samne', 'paas', 'bagal', 'niche', 'upar',
  'mandir', 'temple', 'hospital', 'school', 'market', 'chauraha', 'gali', 'marg', 'nagar', 'colony',
]
const LANDMARK_KEYWORDS = [...LANDMARK_KEYWORDS_EN, ...LANDMARK_KEYWORDS_HI]

/**
 * Normalize a line for matching: trim and collapse spaces.
 */
function normalizeLine(line: string): string {
  return line.trim().replace(/\s+/g, ' ')
}

/**
 * Detect Indian 10-digit mobile (primary); also US 10-digit for compatibility.
 * Strips +91, 91, +1, 1 prefix. Returns digits only or empty.
 */
function extractPhone(line: string): { phone: string; confidence: number } {
  const cleaned = line.replace(/\s+/g, '').replace(/[-()]/g, '')
  const withCountry = cleaned.replace(/^\+91/, '').replace(/^\+1/, '').replace(/^91/, '').replace(/^1/, '')
  const digits = withCountry.replace(/\D/g, '')
  // Indian mobile: 6–9 start, 10 digits (preferred)
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return { phone: digits, confidence: 1 }
  }
  if (digits.length === 10 && /^\d{10}$/.test(digits)) {
    return { phone: digits, confidence: 0.9 }
  }
  if (digits.length >= 10) {
    const ten = digits.slice(-10)
    if (/^[6-9]\d{9}$/.test(ten) || /^\d{10}$/.test(ten)) {
      return { phone: ten, confidence: 0.8 }
    }
  }
  return { phone: '', confidence: 0 }
}

/**
 * Extract 6-digit Indian pincode (primary); 5/9-digit US ZIP for compatibility.
 * When localeHint is missing, treat as India.
 */
function extractPostalCode(line: string, localeHint?: 'IN' | 'US'): { postalCode: string; confidence: number } {
  const sixDigit = line.match(/\b(\d{6})\b/)
  const fiveDigit = line.match(/\b(\d{5})\b/)
  const nineDigit = line.match(/\b(\d{5})[- ]?(\d{4})\b/)
  const isIndia = localeHint !== 'US'
  if (isIndia) {
    if (sixDigit) return { postalCode: sixDigit[1], confidence: 1 }
    if (fiveDigit) return { postalCode: fiveDigit[1], confidence: 0.6 }
    if (nineDigit) return { postalCode: nineDigit[1], confidence: 0.4 }
  }
  if (localeHint === 'US') {
    if (nineDigit) return { postalCode: `${nineDigit[1]}-${nineDigit[2]}`, confidence: 1 }
    if (fiveDigit) return { postalCode: fiveDigit[1], confidence: 1 }
    if (sixDigit) return { postalCode: sixDigit[1], confidence: 0.6 }
  }
  if (sixDigit) return { postalCode: sixDigit[1], confidence: 0.9 }
  if (fiveDigit) return { postalCode: fiveDigit[1], confidence: 0.7 }
  if (nineDigit) return { postalCode: `${nineDigit[1]}-${nineDigit[2]}`, confidence: 0.8 }
  return { postalCode: '', confidence: 0 }
}

/**
 * Match state from text against IN states first, then US (for compatibility).
 */
function matchState(text: string): { state: string; confidence: number } {
  const lower = text.toLowerCase().trim()
  const patterns = getAllStatePatterns()
  for (const { pattern, normalized } of patterns) {
    if (lower === pattern || lower.includes(pattern)) {
      return { state: normalized, confidence: lower === pattern ? 1 : 0.9 }
    }
  }
  return { state: '', confidence: 0 }
}

/**
 * Check if a line looks like a landmark: English or Hindi/Hinglish direction phrases
 * (e.g. "near X", "temple ke peeche", "X ke paas"). Preserves mixed language as-is.
 */
function isLandmarkLine(line: string): boolean {
  const lower = line.toLowerCase().trim()
  return LANDMARK_KEYWORDS.some((k) => lower.includes(k))
}

/**
 * Parse "City, ST 12345" or "City - 560001" style lines.
 */
function parseCityStateZip(
  line: string,
  localeHint?: 'IN' | 'US'
): { city: string; state: string; postalCode: string; confidence: number } {
  const usMatch = line.match(/^([^,]+),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/)
  if (usMatch) {
    return {
      city: usMatch[1].trim(),
      state: usMatch[2].toUpperCase(),
      postalCode: usMatch[3],
      confidence: 1,
    }
  }
  const inMatch = line.match(/^([^-]+)\s*[-–]\s*(\d{6})\s*$/)
  if (inMatch) {
    const city = inMatch[1].trim()
    const stateMatch = matchState(line)
    return {
      city,
      state: stateMatch.state,
      postalCode: inMatch[2],
      confidence: 0.95,
    }
  }
  const zipOnly = extractPostalCode(line, localeHint)
  if (zipOnly.postalCode) {
    const rest = line.replace(zipOnly.postalCode, '').replace(/[-–,]\s*$/, '').trim()
    const stateMatch = matchState(rest)
    const city = stateMatch.state ? rest.replace(new RegExp(stateMatch.state, 'i'), '').trim().replace(/^[,-\s]+|[,-\s]+$/g, '') : rest
    return {
      city,
      state: stateMatch.state,
      postalCode: zipOnly.postalCode,
      confidence: 0.85,
    }
  }
  return { city: '', state: '', postalCode: '', confidence: 0 }
}

/**
 * Heuristic: first line that looks like a name (2+ words, no digits, not too long).
 * Accepts English and Romanized Hindi/Hinglish names.
 */
function guessFullName(lines: string[]): { fullName: string; confidence: number } {
  for (const line of lines) {
    const t = normalizeLine(line)
    if (!t) continue
    if (/\d{5,}/.test(t)) continue
    if (/^[\d\s\-+()]+$/.test(t)) continue
    const parts = t.split(/\s+/).filter(Boolean)
    if (parts.length >= 2 && parts.length <= 4 && t.length <= 50) {
      return { fullName: t, confidence: 0.85 }
    }
  }
  return { fullName: '', confidence: 0 }
}

/**
 * Detect country from text. India-first: default to India when hint is IN or missing.
 */
function detectCountry(lines: string[], localeHint?: 'IN' | 'US'): { country: string; confidence: number } {
  const joined = lines.join(' ').toLowerCase()
  if (joined.includes('india') || joined.includes('bharat')) return { country: 'India', confidence: 1 }
  if (joined.includes('united states') || joined.includes('usa') || joined.includes(' u.s.') || joined.includes('us ')) {
    return { country: 'United States', confidence: 1 }
  }
  // India-first: default to India when no country in text
  if (localeHint !== 'US') return { country: 'India', confidence: 0.5 }
  if (localeHint === 'US') return { country: 'United States', confidence: 0.5 }
  return { country: 'India', confidence: 0.5 }
}

/**
 * Parse raw OCR text into structured address fields with per-field confidence.
 * India-first: localeHint defaults to 'IN'. Handles Indian formats (6-digit pincode,
 * state names, "Near …" / "X ke peeche" style landmarks), Hinglish/Hindi and English.
 */
export function parseAddressFromText(
  rawText: string,
  localeHint: 'IN' | 'US' = 'IN'
): ParseAddressResult {
  const fields = emptyParsedAddress()
  const confidence = emptyConfidence()
  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => normalizeLine(l))
    .filter((l) => l.length > 0)

  if (rawLines.length === 0) {
    return { fields, confidence, rawLines }
  }

  const usedLines = new Set<number>()

  // Phone: find line with 10-digit number
  for (let i = 0; i < rawLines.length; i++) {
    const r = extractPhone(rawLines[i])
    if (r.phone) {
      fields.phone = r.phone
      confidence.phone = r.confidence
      usedLines.add(i)
      break
    }
  }

  // PostalCode, city, state: look for "City, ST 12345" or "City - 560001" or line with just pincode/zip
  for (let i = 0; i < rawLines.length; i++) {
    if (usedLines.has(i)) continue
    const csz = parseCityStateZip(rawLines[i], localeHint)
    if (csz.postalCode || csz.city || csz.state) {
      if (csz.postalCode) {
        fields.postalCode = csz.postalCode
        confidence.postalCode = csz.confidence
      }
      if (csz.city) {
        fields.city = csz.city
        confidence.city = csz.confidence
      }
      if (csz.state) {
        fields.stateOrProvince = csz.state
        confidence.stateOrProvince = csz.confidence
      }
      usedLines.add(i)
      break
    }
  }
  if (!fields.postalCode) {
    for (let i = 0; i < rawLines.length; i++) {
      if (usedLines.has(i)) continue
      const r = extractPostalCode(rawLines[i], localeHint)
      if (r.postalCode) {
        fields.postalCode = r.postalCode
        confidence.postalCode = r.confidence
        usedLines.add(i)
        break
      }
    }
  }
  if (!fields.stateOrProvince) {
    for (let i = 0; i < rawLines.length; i++) {
      if (usedLines.has(i)) continue
      const r = matchState(rawLines[i])
      if (r.state) {
        fields.stateOrProvince = r.state
        confidence.stateOrProvince = r.confidence
        usedLines.add(i)
        break
      }
    }
  }

  // Landmark: lines with "near", "opp", etc.
  const landmarkLines: string[] = []
  for (let i = 0; i < rawLines.length; i++) {
    if (usedLines.has(i)) continue
    if (isLandmarkLine(rawLines[i])) {
      landmarkLines.push(rawLines[i])
      usedLines.add(i)
    }
  }
  if (landmarkLines.length > 0) {
    fields.landmark = landmarkLines.join(' ')
    confidence.landmark = 0.9
  }

  // fullName: first non-used line that looks like a name
  const remainingForName = rawLines.filter((_, i) => !usedLines.has(i))
  const nameResult = guessFullName(remainingForName)
  if (nameResult.fullName) {
    fields.fullName = nameResult.fullName
    confidence.fullName = nameResult.confidence
    const idx = rawLines.findIndex((l) => normalizeLine(l) === nameResult.fullName)
    if (idx >= 0) usedLines.add(idx)
  }

  // Address lines: remaining lines in order (first two -> addressLine1, addressLine2)
  const addressLines = rawLines
    .map((l, i) => ({ line: l, i }))
    .filter(({ i }) => !usedLines.has(i))
    .map(({ line }) => line)
  if (addressLines.length >= 1) {
    fields.addressLine1 = addressLines[0]
    confidence.addressLine1 = 0.85
  }
  if (addressLines.length >= 2) {
    fields.addressLine2 = addressLines[1]
    confidence.addressLine2 = 0.85
  }

  // Country
  const countryResult = detectCountry(rawLines, localeHint)
  fields.country = countryResult.country
  confidence.country = countryResult.confidence

  return { fields, confidence, rawLines }
}
