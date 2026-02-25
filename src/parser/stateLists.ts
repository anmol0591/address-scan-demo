/**
 * Indian states (common names) and US state abbreviations + full names
 * for matching in address parsing.
 */
export const IN_STATES: string[] = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]

export const US_STATE_ABBREV: string[] = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
]

export const US_STATE_NAMES: string[] = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
]

/** Map US state full name to abbreviation for form dropdown compatibility */
export const US_STATE_NAME_TO_CODE: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  US_STATE_NAMES.forEach((name, i) => {
    m[name] = US_STATE_ABBREV[i]
  })
  return m
})()

/** All state strings to match (lowercase). India-first: IN states listed before US. */
export function getAllStatePatterns(): { pattern: string; normalized: string }[] {
  const list: { pattern: string; normalized: string }[] = []
  IN_STATES.forEach((s) => list.push({ pattern: s.toLowerCase(), normalized: s }))
  US_STATE_ABBREV.forEach((s) => list.push({ pattern: s.toLowerCase(), normalized: s }))
  US_STATE_NAMES.forEach((s) =>
    list.push({ pattern: s.toLowerCase(), normalized: US_STATE_NAME_TO_CODE[s] || s })
  )
  return list
}
