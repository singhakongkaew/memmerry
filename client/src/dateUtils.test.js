import assert from 'node:assert/strict'
import test from 'node:test'
import { dateFromIsoDate, formatBuddhistDate, getCountdownDifferenceSeconds, normalizeDateInput } from './dateUtils.js'

test('normalizes Gregorian and Buddhist Era picker values to the same Gregorian date', () => {
  assert.equal(normalizeDateInput('2022-11-03'), '2022-11-03')
  assert.equal(normalizeDateInput('2565-11-03'), '2022-11-03')
})

test('rejects malformed, impossible, and out-of-range dates', () => {
  assert.equal(normalizeDateInput('2022-02-29'), null)
  assert.equal(normalizeDateInput('1880-01-01'), null)
  assert.equal(normalizeDateInput('3108-11-03'), null)
})

test('uses the canonical date for both the Thai display and countdown calculation', () => {
  const date = dateFromIsoDate('2565-11-03')
  assert.equal(date.getFullYear(), 2022)
  assert.match(formatBuddhistDate(date), /2565/)
  assert.equal(getCountdownDifferenceSeconds(date, new Date(2022, 11, 3).getTime()), 30 * 86400)
})
