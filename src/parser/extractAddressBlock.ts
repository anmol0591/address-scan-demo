/**
 * From OCR text that may contain multiple chat messages (e.g. WhatsApp screenshot),
 * find the block that most likely contains the address and return only that text.
 * That way we parse just the address message instead of the whole conversation.
 */
import { IN_STATES } from './stateLists'

const LANDMARK_HINTS = [
  'near', 'opp', 'opposite', 'behind', 'beside', 'landmark', 'ke peeche', 'ke paas', 'ke saamne',
  'mandir', 'temple', 'hospital', 'school', 'market', 'chauraha', 'gali', 'marg', 'nagar', 'colony',
]
const CHAT_PREFIXES = /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}:\d{2}\s*(am|pm)?|me:|you:|sent|delivered|read|\u2713|\u2714)\s*/i
const CHAT_ONLY = /\b(ok|okay|thanks|thank you|hi|hello|hey|yes|no|sure|done|sent|received)\b/i
const PINCODE_IN = /\b\d{6}\b/
const PINCODE_US = /\b\d{5}(-\d{4})?\b/
const PHONE_10 = /\b[6-9]\d{9}\b|\b\d{10}\b/

function normalize(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

/**
 * Split text into candidate blocks. Uses double newlines first; then single newlines
 * where we detect a new "message". If text is one long block, use sliding windows.
 */
function getCandidateBlocks(rawText: string): string[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  if (lines.length <= 10) return [lines.join('\n')]

  const byMessage: string[][] = []
  let current: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isShort = line.length < 25
    const looksLikeNewMessage = CHAT_PREFIXES.test(line) || (isShort && current.length > 3)
    if (looksLikeNewMessage && current.length >= 2) {
      if (current.length > 0) byMessage.push([...current])
      current = [line.replace(CHAT_PREFIXES, '').trim()].filter(Boolean)
    } else {
      current.push(line)
    }
  }
  if (current.length > 0) byMessage.push(current)

  if (byMessage.length > 1) {
    return byMessage.map((b) => b.join('\n'))
  }

  if (lines.length <= 12) return [lines.join('\n')]

  const windows: string[] = []
  const minLines = 4
  const maxLines = 12
  const maxCandidates = 50
  for (let start = 0; start <= lines.length - minLines && windows.length < maxCandidates; start += 2) {
    for (let len = maxLines; len >= minLines; len--) {
      if (start + len > lines.length) continue
      const chunk = lines.slice(start, start + len).join('\n')
      if (PINCODE_IN.test(chunk) || PINCODE_US.test(chunk) || IN_STATES.some((s) => chunk.toLowerCase().includes(s.toLowerCase()))) {
        windows.push(chunk)
        break
      }
    }
  }
  return windows.length > 0 ? windows : [lines.join('\n')]
}

/**
 * Score a block for "this looks like an address" (0 = not address, higher = more likely).
 */
function scoreBlock(block: string, localeHint: 'IN' | 'US'): number {
  const text = block.toLowerCase()
  const lines = block.split(/\r?\n/).map(normalize).filter(Boolean)
  let score = 0

  if (lines.length < 2) score -= 20
  if (lines.length >= 3 && lines.length <= 12) score += 12
  if (lines.length > 12) score -= 10

  if (localeHint === 'IN' && PINCODE_IN.test(block)) score += 35
  else if (localeHint === 'US' && PINCODE_US.test(block)) score += 35
  else if (PINCODE_IN.test(block)) score += 28
  else if (PINCODE_US.test(block)) score += 25

  const hasState = IN_STATES.some((s) => text.includes(s.toLowerCase()))
  if (hasState) score += 25

  const hasLandmark = LANDMARK_HINTS.some((k) => text.includes(k))
  if (hasLandmark) score += 15

  if (PHONE_10.test(block)) score += 10

  if (/\b(address|delivery|ship to|pincode|pin code|city|state)\b/i.test(block)) score += 5
  if (/^\s*[A-Za-z][a-z]+ [A-Za-z][a-z]+(\s+[A-Za-z][a-z]+)?\s*$/m.test(block)) score += 5

  if (CHAT_ONLY.test(text) && lines.length <= 2) score -= 25
  if (/^[\d\s\-:]+$/.test(block)) score -= 20
  if (lines.every((l) => l.length < 15)) score -= 15

  return score
}

/**
 * From full OCR text (e.g. WhatsApp screenshot with multiple messages), extract the
 * single block that most likely contains the address. Returns that block only, so
 * the parser can disambiguate address line, city, pincode, etc. from clean text.
 */
export function extractAddressBlockFromChat(
  rawOcrText: string,
  localeHint: 'IN' | 'US' = 'IN'
): string {
  const trimmed = rawOcrText.trim()
  if (!trimmed) return trimmed

  const blocks = getCandidateBlocks(trimmed)
  if (blocks.length === 0) return trimmed
  if (blocks.length === 1) return blocks[0]

  let best = blocks[0]
  let bestScore = scoreBlock(blocks[0], localeHint)

  for (let i = 1; i < blocks.length; i++) {
    const s = scoreBlock(blocks[i], localeHint)
    if (s > bestScore) {
      bestScore = s
      best = blocks[i]
    }
  }

  if (bestScore < 5) return trimmed
  return best
}
