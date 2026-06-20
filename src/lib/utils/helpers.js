import { differenceInDays, format, parseISO } from 'date-fns'
import { EXPIRY_STATUS, REMINDER_THRESHOLD_DAYS } from './constants.js'

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'yyyy-MM-dd')
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'yyyy-MM-dd HH:mm')
  } catch {
    return dateStr
  }
}

export function getDaysUntilExpiry(expiryDate) {
  if (!expiryDate) return Infinity
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = parseISO(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    return differenceInDays(expiry, today)
  } catch {
    return Infinity
  }
}

export function getExpiryStatus(expiryDate) {
  const days = getDaysUntilExpiry(expiryDate)
  if (days < 0) return EXPIRY_STATUS.EXPIRED
  if (days <= REMINDER_THRESHOLD_DAYS) return EXPIRY_STATUS.WARNING
  return EXPIRY_STATUS.NORMAL
}

export function getExpiryStatusText(expiryDate) {
  const days = getDaysUntilExpiry(expiryDate)
  if (days < 0) return `已过期 ${Math.abs(days)} 天`
  if (days === 0) return '今天到期'
  if (days <= 7) return `剩余 ${days} 天`
  if (days <= REMINDER_THRESHOLD_DAYS) return `剩余 ${days} 天`
  return `剩余 ${days} 天`
}

export function getExpiryStatusColor(status) {
  switch (status) {
    case EXPIRY_STATUS.EXPIRED:
      return 'text-medical-danger bg-red-50'
    case EXPIRY_STATUS.WARNING:
      return 'text-medical-warning bg-amber-50'
    default:
      return 'text-medical-green-500 bg-medical-green-50'
  }
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function nowISO() {
  return new Date().toISOString()
}
