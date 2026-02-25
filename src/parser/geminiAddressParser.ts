/**
 * Use Gemini to parse OCR text into structured address fields.
 * Fills: fullName, phone, addressLine1, addressLine2, landmark, city, stateOrProvince, postalCode, country.
 */
import { GoogleGenAI } from '@google/genai'
import type { ParsedAddress, ParsedAddressConfidence } from './types'
import { emptyParsedAddress, emptyConfidence } from './types'

// Try models in order; v1beta often doesn't have 1.5, so use 2.x first
const MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']

function parseJsonFromResponse(text: string): Record<string, string> {
  const trimmed = text.trim()
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = codeBlock ? codeBlock[1].trim() : trimmed
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    const firstBrace = raw.indexOf('{')
    const lastBrace = raw.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1)) as Record<string, string>
    }
    throw new Error('Gemini returned invalid JSON.')
  }
}

function toParsedAddress(obj: Record<string, string>): ParsedAddress {
  const fields = emptyParsedAddress()
  const keys: (keyof ParsedAddress)[] = [
    'fullName', 'phone', 'addressLine1', 'addressLine2', 'landmark',
    'city', 'stateOrProvince', 'postalCode', 'country',
  ]
  keys.forEach((k) => {
    const v = obj[k]
    if (typeof v === 'string') fields[k] = v.trim()
  })
  return fields
}

function toConfidence(fields: ParsedAddress): ParsedAddressConfidence {
  const c = emptyConfidence()
  const keys = Object.keys(fields) as (keyof ParsedAddress)[]
  keys.forEach((k) => {
    c[k] = fields[k] && fields[k].length > 0 ? 0.95 : 0
  })
  return c
}

export interface GeminiParseResult {
  fields: ParsedAddress
  confidence: ParsedAddressConfidence
  rawLines: string[]
}

/**
 * Call Gemini to extract address fields from OCR text. Requires VITE_GEMINI_API_KEY to be set.
 */
export async function parseAddressWithGemini(rawOcrText: string): Promise<GeminiParseResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Gemini API key not set. Add VITE_GEMINI_API_KEY to your .env file.')
  }

  const ai = new GoogleGenAI({ apiKey })
  const userPrompt = `You are an address parser for India. Extract the delivery address from the text below and return ONLY a valid JSON object (no markdown, no explanation) with these exact keys. Use empty string "" for any missing field.

Rules for India:
- postalCode: 6-digit Indian pincode only.
- stateOrProvince: Indian state name (e.g. Maharashtra, Karnataka, Uttar Pradesh).
- addressLine1: Flat, house no., building, company, apartment.
- addressLine2: Area, street, sector, village.
- landmark: Landmark or direction (e.g. near X, temple ke peeche, opp Y). Keep Hinglish/Hindi as-is.
- city: Town or city name.
- country: Use "India".
- phone: 10-digit Indian mobile number, digits only.
- fullName: Recipient name if present.

JSON keys: fullName, phone, addressLine1, addressLine2, landmark, city, stateOrProvince, postalCode, country.

Text:
${rawOcrText}`

  let lastError: Error | null = null
  for (const model of MODELS_TO_TRY) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
      })

      const text = typeof response.text === 'function' ? response.text() : response.text
      if (!text || typeof text !== 'string') {
        throw new Error('Gemini did not return text.')
      }

      const obj = parseJsonFromResponse(text)
      const fields = toParsedAddress(obj)
      const confidence = toConfidence(fields)
      const rawLines = rawOcrText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

      return { fields, confidence, rawLines }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const is404 = String(lastError.message).includes('404') || String(lastError.message).includes('not found')
      if (!is404) throw lastError
    }
  }
  throw lastError ?? new Error('Gemini request failed.')
}
