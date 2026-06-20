export const MEDICINE_CATEGORIES = {
  PRESCRIPTION: 'prescription',
  OTC: 'otc',
  EXTERNAL: 'external'
}

export const CATEGORY_LABELS = {
  [MEDICINE_CATEGORIES.PRESCRIPTION]: '处方药',
  [MEDICINE_CATEGORIES.OTC]: '非处方药',
  [MEDICINE_CATEGORIES.EXTERNAL]: '外用药'
}

export const CATEGORY_COLORS = {
  [MEDICINE_CATEGORIES.PRESCRIPTION]: 'bg-red-50 text-red-600',
  [MEDICINE_CATEGORIES.OTC]: 'bg-medical-green-100 text-medical-green-500',
  [MEDICINE_CATEGORIES.EXTERNAL]: 'bg-medical-blue-100 text-medical-blue-500'
}

export const EXPIRY_STATUS = {
  EXPIRED: 'expired',
  WARNING: 'warning',
  NORMAL: 'normal'
}

export const STORAGE_LOCATIONS = [
  '客厅药箱',
  '卧室床头柜',
  '厨房橱柜',
  '冰箱冷藏',
  '卫生间储物柜',
  '儿童房',
  '书房',
  '随身携带包',
  '车用急救包'
]

export const DOSAGE_UNITS = ['片', '粒', '袋', 'ml', 'mg', 'g', '喷', '贴', '滴']

export const REMINDER_THRESHOLD_DAYS = 30
