import { get } from 'svelte/store'
import { createPersistentStore } from './storage.js'
import { generateId, nowISO, getExpiryStatus } from '../utils/helpers.js'
import {
  PURCHASE_PRIORITY,
  PURCHASE_ITEM_SOURCE,
  STOCK_WARNING_THRESHOLD,
  FAMILY_MEDICINE_TEMPLATES,
  EXPIRY_STATUS
} from '../utils/constants.js'
import { medicines } from './medicines.js'

const initialPurchaseList = []

export const purchaseList = createPersistentStore('purchaseList', initialPurchaseList)

export function addPurchaseItem(data) {
  const item = {
    id: generateId(),
    name: '',
    suggestedQuantity: 1,
    specification: '',
    priority: PURCHASE_PRIORITY.MEDIUM,
    notes: '',
    source: PURCHASE_ITEM_SOURCE.MANUAL,
    sourceId: null,
    purchased: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    ...data
  }
  purchaseList.update((list) => [...list, item])
  return item
}

export function addPurchaseItemsBatch(items) {
  const now = nowISO()
  const newItems = items.map((data) => ({
    id: generateId(),
    name: '',
    suggestedQuantity: 1,
    specification: '',
    priority: PURCHASE_PRIORITY.MEDIUM,
    notes: '',
    source: PURCHASE_ITEM_SOURCE.MANUAL,
    sourceId: null,
    purchased: false,
    createdAt: now,
    updatedAt: now,
    ...data
  }))
  purchaseList.update((existing) => [...existing, ...newItems])
  return newItems
}

export function updatePurchaseItem(id, data) {
  purchaseList.update((list) =>
    list.map((item) =>
      item.id === id ? { ...item, ...data, updatedAt: nowISO() } : item
    )
  )
}

export function deletePurchaseItem(id) {
  purchaseList.update((list) => list.filter((item) => item.id !== id))
}

export function togglePurchased(id) {
  purchaseList.update((list) =>
    list.map((item) =>
      item.id === id
        ? { ...item, purchased: !item.purchased, updatedAt: nowISO() }
        : item
    )
  )
}

export function clearPurchaseList() {
  purchaseList.set([])
}

export function clearPurchasedItems() {
  purchaseList.update((list) => list.filter((item) => !item.purchased))
}

export function movePriorityUp(id) {
  const list = get(purchaseList)
  const index = list.findIndex((item) => item.id === id)
  if (index <= 0) return

  const priorityOrder = [PURCHASE_PRIORITY.HIGH, PURCHASE_PRIORITY.MEDIUM, PURCHASE_PRIORITY.LOW]
  const currentPriorityIndex = priorityOrder.indexOf(list[index].priority)
  if (currentPriorityIndex > 0) {
    updatePurchaseItem(id, { priority: priorityOrder[currentPriorityIndex - 1] })
  }
}

export function movePriorityDown(id) {
  const list = get(purchaseList)
  const index = list.findIndex((item) => item.id === id)
  if (index < 0) return

  const priorityOrder = [PURCHASE_PRIORITY.HIGH, PURCHASE_PRIORITY.MEDIUM, PURCHASE_PRIORITY.LOW]
  const currentPriorityIndex = priorityOrder.indexOf(list[index].priority)
  if (currentPriorityIndex < priorityOrder.length - 1) {
    updatePurchaseItem(id, { priority: priorityOrder[currentPriorityIndex + 1] })
  }
}

export function moveItemUp(id) {
  purchaseList.update((list) => {
    const index = list.findIndex((item) => item.id === id)
    if (index <= 0) return list
    const newList = [...list]
    ;[newList[index - 1], newList[index]] = [newList[index], newList[index - 1]]
    return newList
  })
}

export function moveItemDown(id) {
  purchaseList.update((list) => {
    const index = list.findIndex((item) => item.id === id)
    if (index < 0 || index >= list.length - 1) return list
    const newList = [...list]
    ;[newList[index], newList[index + 1]] = [newList[index + 1], newList[index]]
    return newList
  })
}

export function generateSuggestions() {
  const meds = get(medicines)
  const currentList = get(purchaseList)
  const existingNames = new Set(currentList.map((item) => item.name.trim().toLowerCase()))

  const suggestions = []

  meds.forEach((med) => {
    const status = getExpiryStatus(med.expiryDate)
    const medNameLower = med.name.trim().toLowerCase()

    if (existingNames.has(medNameLower)) return

    if (med.quantity <= STOCK_WARNING_THRESHOLD) {
      suggestions.push({
        name: med.name,
        specification: med.specification,
        suggestedQuantity: Math.max(STOCK_WARNING_THRESHOLD - med.quantity + 1, 1),
        priority: PURCHASE_PRIORITY.HIGH,
        notes: `库存不足（当前库存：${med.quantity} ${med.unit || '盒'}）`,
        source: PURCHASE_ITEM_SOURCE.LOW_STOCK,
        sourceId: med.id
      })
      return
    }

    if (status === EXPIRY_STATUS.EXPIRED && med.notes?.includes('常备需补货')) {
      suggestions.push({
        name: med.name,
        specification: med.specification,
        suggestedQuantity: 1,
        priority: PURCHASE_PRIORITY.HIGH,
        notes: '已过期，常备需补货',
        source: PURCHASE_ITEM_SOURCE.EXPIRED_STOCK,
        sourceId: med.id
      })
    }
  })

  if (suggestions.length > 0) {
    addPurchaseItemsBatch(suggestions)
  }

  return suggestions
}

export function importTemplate(templateKey) {
  const template = FAMILY_MEDICINE_TEMPLATES[templateKey]
  if (!template) return []

  const currentList = get(purchaseList)
  const existingNames = new Set(currentList.map((item) => item.name.trim().toLowerCase()))

  const itemsToImport = template.items
    .filter((item) => !existingNames.has(item.name.trim().toLowerCase()))
    .map((item) => ({
      ...item,
      source: PURCHASE_ITEM_SOURCE.TEMPLATE,
      sourceId: templateKey
    }))

  if (itemsToImport.length > 0) {
    addPurchaseItemsBatch(itemsToImport)
  }

  return itemsToImport
}

export function exportAsText() {
  const list = get(purchaseList)
  if (list.length === 0) return ''

  const priorityOrder = [PURCHASE_PRIORITY.HIGH, PURCHASE_PRIORITY.MEDIUM, PURCHASE_PRIORITY.LOW]
  const sortedList = [...list].sort(
    (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  )

  let text = '📋 家庭药品采购清单\n'
  text += `生成时间：${new Date().toLocaleString('zh-CN')}\n`
  text += '═'.repeat(50) + '\n\n'

  const grouped = {
    high: sortedList.filter((i) => i.priority === PURCHASE_PRIORITY.HIGH),
    medium: sortedList.filter((i) => i.priority === PURCHASE_PRIORITY.MEDIUM),
    low: sortedList.filter((i) => i.priority === PURCHASE_PRIORITY.LOW)
  }

  Object.entries(grouped).forEach(([key, items]) => {
    if (items.length === 0) return
    const label = key === 'high' ? '🔴 高优先级' : key === 'medium' ? '🟡 中优先级' : '🔵 低优先级'
    text += `${label}（${items.length}项）\n`
    text += '-'.repeat(30) + '\n'
    items.forEach((item, idx) => {
      const status = item.purchased ? '✅ 已购' : '⬜ 待购'
      const spec = item.specification ? `（${item.specification}）` : ''
      text += `${idx + 1}. ${item.name}${spec} × ${item.suggestedQuantity}\n`
      if (item.notes) text += `   备注：${item.notes}\n`
      text += `   状态：${status}\n`
    })
    text += '\n'
  })

  text += '═'.repeat(50) + '\n'
  const purchasedCount = sortedList.filter((i) => i.purchased).length
  text += `总计：${sortedList.length} 项，已购 ${purchasedCount} 项，待购 ${sortedList.length - purchasedCount} 项\n`

  return text
}

export function copyToClipboard() {
  const text = exportAsText()
  if (text && navigator.clipboard) {
    navigator.clipboard.writeText(text)
    return true
  }
  return false
}

export function getPurchaseItemById(id) {
  return get(purchaseList).find((item) => item.id === id)
}

export function getSuggestedMedicineForm(purchaseItemId) {
  const item = getPurchaseItemById(purchaseItemId)
  if (!item) return null

  return {
    name: item.name,
    specification: item.specification,
    category: 'otc',
    manufacturer: '',
    barcode: '',
    batchNumber: '',
    expiryDate: '',
    location: '客厅药箱',
    quantity: item.suggestedQuantity,
    unit: '盒',
    dosage: '1',
    dosageUnit: '片',
    frequency: '',
    usage: '',
    indications: '',
    contraindications: '',
    sideEffects: '',
    notes: item.notes || '',
    instructionFile: null,
    familyMemberIds: []
  }
}
