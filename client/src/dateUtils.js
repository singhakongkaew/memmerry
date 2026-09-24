const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const BUDDHIST_ERA_OFFSET = 543
const MIN_YEAR = 1900
const MAX_YEAR = 2100

function pad(value) { return String(value).padStart(2, '0') }

/**
 * Accept a date input in either Gregorian (CE) or Thai Buddhist Era (BE),
 * and return the canonical Gregorian YYYY-MM-DD value used for storage.
 */
export function normalizeDateInput(value) {
  const match = typeof value === 'string' ? ISO_DATE.exec(value) : null
  if (!match) return null

  const [, rawYear, rawMonth, rawDay] = match
  let year = Number(rawYear)
  const month = Number(rawMonth)
  const day = Number(rawDay)

  // Thai date pickers may submit BE years. A four-digit year outside the
  // supported Gregorian range is unambiguously a BE value in this app.
  if (year > MAX_YEAR) year -= BUDDHIST_ERA_OFFSET
  if (year < MIN_YEAR || year > MAX_YEAR) return null

  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null

  return `${year}-${pad(month)}-${pad(day)}`
}

export function dateFromIsoDate(value) {
  const normalized = normalizeDateInput(value)
  if (!normalized) return null
  const [year, month, day] = normalized.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatBuddhistDate(value) {
  const date = value instanceof Date ? value : dateFromIsoDate(value)
  if (!date || Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getCountdownDifferenceSeconds(date, now = Date.now()) {
  return Math.floor((now - date.getTime()) / 1000)
}
