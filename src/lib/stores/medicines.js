import { get } from 'svelte/store'
import { createPersistentStore } from './storage.js'
import { generateId, nowISO, getExpiryStatus, getDaysUntilExpiry, todayISO } from '../utils/helpers.js'
import { MEDICINE_CATEGORIES, EXPIRY_STATUS, PURCHASE_CHANNELS } from '../utils/constants.js'

const initialMedicines = [
  {
    id: generateId(),
    name: '阿莫西林胶囊',
    category: MEDICINE_CATEGORIES.PRESCRIPTION,
    specification: '0.25g*24粒',
    manufacturer: '华北制药',
    barcode: '6901234567890',
    batchNumber: 'A20250101',
    expiryDate: '2026-08-15',
    location: '客厅药箱-第一层',
    quantity: 2,
    unit: '盒',
    dosage: '1',
    dosageUnit: '粒',
    frequency: '每日3次',
    usage: '饭后温水送服',
    indications: '用于敏感菌所致的感染',
    contraindications: '青霉素过敏者禁用',
    sideEffects: '可能出现恶心、呕吐',
    notes: '处方药物，需遵医嘱',
    instructionFile: null,
    familyMemberIds: ['me', 'wife'],
    markedExpired: false,
    unitPrice: 28.5,
    purchaseDate: '2026-01-15',
    purchaseChannel: PURCHASE_CHANNELS.HOSPITAL,
    receiptPhoto: null,
    createdAt: nowISO(),
    updatedAt: nowISO()
  },
  {
    id: generateId(),
    name: '复方感冒灵颗粒',
    category: MEDICINE_CATEGORIES.OTC,
    specification: '10g*9袋',
    manufacturer: '三九医药',
    barcode: '6901234567891',
    batchNumber: 'B20250315',
    expiryDate: '2026-07-10',
    location: '客厅药箱-第二层',
    quantity: 3,
    unit: '盒',
    dosage: '1',
    dosageUnit: '袋',
    frequency: '每日3次',
    usage: '开水冲服',
    indications: '用于感冒引起的头痛、发热',
    contraindications: '严重肝肾功能不全者禁用',
    sideEffects: '偶见嗜睡',
    notes: '',
    instructionFile: null,
    familyMemberIds: ['me', 'wife', 'child'],
    markedExpired: false,
    unitPrice: 15.8,
    purchaseDate: '2026-03-20',
    purchaseChannel: PURCHASE_CHANNELS.PHARMACY,
    receiptPhoto: null,
    createdAt: nowISO(),
    updatedAt: nowISO()
  },
  {
    id: generateId(),
    name: '云南白药创可贴',
    category: MEDICINE_CATEGORIES.EXTERNAL,
    specification: '100片',
    manufacturer: '云南白药',
    barcode: '6901234567892',
    batchNumber: 'C20250220',
    expiryDate: '2027-06-20',
    location: '卫生间储物柜',
    quantity: 1,
    unit: '盒',
    dosage: '1',
    dosageUnit: '贴',
    frequency: '需要时使用',
    usage: '外用，贴于患处',
    indications: '用于小面积开放性外科创伤',
    contraindications: '对胶布过敏者慎用',
    sideEffects: '偶见过敏反应',
    notes: '',
    instructionFile: null,
    familyMemberIds: ['me', 'wife', 'child', 'father', 'mother'],
    markedExpired: false,
    unitPrice: 12.9,
    purchaseDate: '2026-02-10',
    purchaseChannel: PURCHASE_CHANNELS.JD,
    receiptPhoto: null,
    createdAt: nowISO(),
    updatedAt: nowISO()
  }
]

export const medicines = createPersistentStore('medicines', initialMedicines)

export function addMedicine(data) {
  const medicine = {
    id: generateId(),
    ...data,
    markedExpired: false,
    createdAt: nowISO(),
    updatedAt: nowISO()
  }
  medicines.update((list) => [medicine, ...list])
  return medicine
}

export function addMedicinesBatch(list) {
  const now = nowISO()
  const newMedicines = list.map((data) => ({
    id: generateId(),
    ...data,
    markedExpired: false,
    createdAt: now,
    updatedAt: now
  }))
  medicines.update((existing) => [...newMedicines, ...existing])
  return newMedicines
}

export function updateMedicine(id, data) {
  medicines.update((list) =>
    list.map((m) => (m.id === id ? { ...m, ...data, updatedAt: nowISO() } : m))
  )
}

export function deleteMedicine(id) {
  medicines.update((list) => list.filter((m) => m.id !== id))
}

export function toggleMarkedExpired(id) {
  medicines.update((list) =>
    list.map((m) =>
      m.id === id ? { ...m, markedExpired: !m.markedExpired, updatedAt: nowISO() } : m
    )
  )
}

export function markAllExpired() {
  medicines.update((list) =>
    list.map((m) => {
      const status = getExpiryStatus(m.expiryDate)
      if (status === EXPIRY_STATUS.EXPIRED && !m.markedExpired) {
        return { ...m, markedExpired: true, updatedAt: nowISO() }
      }
      return m
    })
  )
}

export function getMedicineById(id) {
  return get(medicines).find((m) => m.id === id)
}

export function getExpiredMedicines() {
  return get(medicines).filter(
    (m) => getExpiryStatus(m.expiryDate) === EXPIRY_STATUS.EXPIRED
  )
}

export function getWarningMedicines() {
  return get(medicines).filter((m) => {
    const days = getDaysUntilExpiry(m.expiryDate)
    const status = getExpiryStatus(m.expiryDate)
    return status === EXPIRY_STATUS.WARNING && days >= 0
  })
}

export function getMedicinesByCategory(category) {
  return get(medicines).filter((m) => m.category === category)
}

export function getMedicinesByLocation(location) {
  return get(medicines).filter((m) => m.location?.includes(location))
}

export function getMedicinesByFamilyMember(memberId) {
  return get(medicines).filter((m) => m.familyMemberIds?.includes(memberId))
}

export function getMedicinesWithPurchaseInfo() {
  return get(medicines).filter((m) => m.unitPrice != null && m.purchaseDate)
}

export function getPurchaseStatsByDateRange(startDate, endDate) {
  const list = getMedicinesWithPurchaseInfo()
  return list.filter((m) => {
    const purchaseDate = new Date(m.purchaseDate)
    const start = startDate ? new Date(startDate) : new Date('1970-01-01')
    const end = endDate ? new Date(endDate + 'T23:59:59') : new Date('2099-12-31')
    return purchaseDate >= start && purchaseDate <= end
  })
}

export function getTotalSpending(medicinesList) {
  return medicinesList.reduce((total, m) => {
    const price = parseFloat(m.unitPrice) || 0
    const qty = parseFloat(m.quantity) || 0
    return total + price * qty
  }, 0)
}
