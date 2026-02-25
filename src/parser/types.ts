/**
 * Structured address fields extracted from OCR text.
 */
export interface ParsedAddress {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string
  landmark: string
  city: string
  stateOrProvince: string
  postalCode: string
  country: string
}

export const PARSED_ADDRESS_KEYS: (keyof ParsedAddress)[] = [
  'fullName',
  'phone',
  'addressLine1',
  'addressLine2',
  'landmark',
  'city',
  'stateOrProvince',
  'postalCode',
  'country',
]

export type ParsedAddressConfidence = Record<keyof ParsedAddress, number>

export interface ParseAddressResult {
  fields: ParsedAddress
  confidence: ParsedAddressConfidence
  rawLines: string[]
}

export function emptyParsedAddress(): ParsedAddress {
  return {
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    stateOrProvince: '',
    postalCode: '',
    country: '',
  }
}

export function emptyConfidence(): ParsedAddressConfidence {
  return {
    fullName: 0,
    phone: 0,
    addressLine1: 0,
    addressLine2: 0,
    landmark: 0,
    city: 0,
    stateOrProvince: 0,
    postalCode: 0,
    country: 0,
  }
}
