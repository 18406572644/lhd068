import { get } from 'svelte/store'
import { createPersistentStore } from './storage.js'
import { generateId, nowISO } from '../utils/helpers.js'

const initialRecords = [
  {
    id: generateId(),
    medicineId: null,
    medicineName: '维生素C片',
    familyMemberId: 'me',
    dosage: '1',
    dosageUnit: '片',
    time: nowISO(),
    notes: '日常补充',
    createdAt: nowISO()
  }
]

export const medicationRecords = createPersistentStore('medicationRecords', initialRecords)

export function addRecord(data) {
  const record = {
    id: generateId(),
    ...data,
    createdAt: nowISO()
  }
  medicationRecords.update((list) => [record, ...list])
  return record
}

export function updateRecord(id, data) {
  medicationRecords.update((list) => list.map((r) => (r.id === id ? { ...r, ...data } : r)))
}

export function deleteRecord(id) {
  medicationRecords.update((list) => list.filter((r) => r.id !== id))
}

export function getRecordsByMedicine(medicineId) {
  return get(medicationRecords).filter((r) => r.medicineId === medicineId)
}

export function getRecordsByFamilyMember(memberId) {
  return get(medicationRecords).filter((r) => r.familyMemberId === memberId)
}

export function getRecordsByDate(dateStr) {
  return get(medicationRecords).filter((r) => r.time?.startsWith(dateStr))
}

export function getRecordsBetween(startDate, endDate) {
  return get(medicationRecords).filter((r) => {
    const t = r.time
    return t >= startDate && t <= endDate + 'T23:59:59.999Z'
  })
}

export function getTodayRecords() {
  const today = new Date().toISOString().split('T')[0]
  return getRecordsByDate(today)
}
