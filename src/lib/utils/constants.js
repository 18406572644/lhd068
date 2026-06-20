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

export const PURCHASE_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

export const PURCHASE_PRIORITY_LABELS = {
  [PURCHASE_PRIORITY.HIGH]: '高',
  [PURCHASE_PRIORITY.MEDIUM]: '中',
  [PURCHASE_PRIORITY.LOW]: '低'
}

export const PURCHASE_PRIORITY_COLORS = {
  [PURCHASE_PRIORITY.HIGH]: 'bg-red-100 text-red-600',
  [PURCHASE_PRIORITY.MEDIUM]: 'bg-amber-100 text-amber-600',
  [PURCHASE_PRIORITY.LOW]: 'bg-blue-100 text-blue-600'
}

export const PURCHASE_ITEM_SOURCE = {
  LOW_STOCK: 'low_stock',
  EXPIRED_STOCK: 'expired_stock',
  MANUAL: 'manual',
  TEMPLATE: 'template'
}

export const STOCK_WARNING_THRESHOLD = 2

export const PURCHASE_CHANNELS = {
  HOSPITAL: 'hospital',
  PHARMACY: 'pharmacy',
  JD: 'jd',
  MEITUAN: 'meituan',
  OTHER: 'other'
}

export const PURCHASE_CHANNEL_LABELS = {
  [PURCHASE_CHANNELS.HOSPITAL]: '医院',
  [PURCHASE_CHANNELS.PHARMACY]: '线下药店',
  [PURCHASE_CHANNELS.JD]: '京东',
  [PURCHASE_CHANNELS.MEITUAN]: '美团',
  [PURCHASE_CHANNELS.OTHER]: '其他'
}

export const PURCHASE_CHANNEL_COLORS = {
  [PURCHASE_CHANNELS.HOSPITAL]: '#3B82F6',
  [PURCHASE_CHANNELS.PHARMACY]: '#10B981',
  [PURCHASE_CHANNELS.JD]: '#EF4444',
  [PURCHASE_CHANNELS.MEITUAN]: '#F59E0B',
  [PURCHASE_CHANNELS.OTHER]: '#8B5CF6'
}

export const ALLERGY_TYPES = [
  { value: 'penicillin', label: '青霉素类' },
  { value: 'cephalosporin', label: '头孢菌素类' },
  { value: 'sulfonamide', label: '磺胺类' },
  { value: 'aspirin', label: '阿司匹林' },
  { value: 'nsaid', label: '非甾体抗炎药' },
  { value: 'iodine', label: '碘剂' },
  { value: 'codeine', label: '可待因/吗啡类' },
  { value: 'antibiotic_other', label: '其他抗生素' }
]

export const CHRONIC_DISEASES = [
  { value: 'hypertension', label: '高血压' },
  { value: 'diabetes', label: '糖尿病' },
  { value: 'heart_disease', label: '心脏病' },
  { value: 'liver_disease', label: '肝脏疾病' },
  { value: 'kidney_disease', label: '肾脏疾病' },
  { value: 'asthma', label: '哮喘/慢阻肺' },
  { value: 'gastritis', label: '胃溃疡/胃炎' },
  { value: 'glaucoma', label: '青光眼' },
  { value: 'gout', label: '痛风/高尿酸' },
  { value: 'epilepsy', label: '癫痫' },
  { value: 'depression', label: '抑郁症/精神类' },
  { value: 'arrhythmia', label: '心律失常' }
]

export const ORGAN_FUNCTION = {
  NORMAL: 'normal',
  MILD: 'mild',
  SEVERE: 'severe'
}

export const ORGAN_FUNCTION_LABELS = {
  [ORGAN_FUNCTION.NORMAL]: '正常',
  [ORGAN_FUNCTION.MILD]: '轻度异常',
  [ORGAN_FUNCTION.SEVERE]: '重度异常'
}

export const ORGAN_FUNCTION_COLORS = {
  [ORGAN_FUNCTION.NORMAL]: 'bg-medical-green-50 text-medical-green-500',
  [ORGAN_FUNCTION.MILD]: 'bg-amber-50 text-amber-600',
  [ORGAN_FUNCTION.SEVERE]: 'bg-red-50 text-medical-danger'
}

export const INTERACTION_RISK = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

export const INTERACTION_RISK_LABELS = {
  [INTERACTION_RISK.HIGH]: '高风险',
  [INTERACTION_RISK.MEDIUM]: '中风险',
  [INTERACTION_RISK.LOW]: '低风险'
}

export const INTERACTION_RISK_COLORS = {
  [INTERACTION_RISK.HIGH]: 'bg-red-100 text-medical-danger border-red-200',
  [INTERACTION_RISK.MEDIUM]: 'bg-amber-100 text-amber-700 border-amber-200',
  [INTERACTION_RISK.LOW]: 'bg-blue-100 text-blue-600 border-blue-200'
}

export const FAMILY_MEDICINE_TEMPLATES = {
  cold: {
    name: '感冒类',
    icon: 'thermometer',
    color: '#3B82F6',
    items: [
      { name: '复方感冒灵颗粒', specification: '10g*9袋', suggestedQuantity: 2, priority: PURCHASE_PRIORITY.MEDIUM, notes: '感冒发热' },
      { name: '布洛芬缓释胶囊', specification: '0.3g*20粒', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.HIGH, notes: '退烧止痛' },
      { name: '连花清瘟胶囊', specification: '0.35g*48粒', suggestedQuantity: 2, priority: PURCHASE_PRIORITY.MEDIUM, notes: '清热解毒' },
      { name: '复方氨酚烷胺片', specification: '12片/盒', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.MEDIUM, notes: '缓解感冒症状' }
    ]
  },
  anti_inflammatory: {
    name: '消炎类',
    icon: 'shield',
    color: '#10B981',
    items: [
      { name: '阿莫西林胶囊', specification: '0.25g*24粒', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.HIGH, notes: '抗生素，需遵医嘱' },
      { name: '头孢拉定胶囊', specification: '0.25g*24粒', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.MEDIUM, notes: '抗生素，需遵医嘱' },
      { name: '盐酸左氧氟沙星片', specification: '0.1g*6片', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.MEDIUM, notes: '抗生素，需遵医嘱' }
    ]
  },
  trauma: {
    name: '外伤类',
    icon: 'bandage',
    color: '#F59E0B',
    items: [
      { name: '云南白药创可贴', specification: '100片/盒', suggestedQuantity: 2, priority: PURCHASE_PRIORITY.HIGH, notes: '小伤口止血' },
      { name: '碘伏消毒液', specification: '100ml/瓶', suggestedQuantity: 2, priority: PURCHASE_PRIORITY.HIGH, notes: '伤口消毒' },
      { name: '医用纱布', specification: '5m/卷', suggestedQuantity: 2, priority: PURCHASE_PRIORITY.MEDIUM, notes: '包扎伤口' },
      { name: '医用棉签', specification: '50支/包', suggestedQuantity: 5, priority: PURCHASE_PRIORITY.MEDIUM, notes: '清洁消毒' },
      { name: '云南白药气雾剂', specification: '85g/瓶', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.MEDIUM, notes: '跌打损伤' },
      { name: '红花油', specification: '25ml/瓶', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.LOW, notes: '活血化瘀' }
    ]
  },
  stomach: {
    name: '肠胃类',
    icon: 'heart',
    color: '#EF4444',
    items: [
      { name: '蒙脱石散', specification: '3g*10袋', suggestedQuantity: 2, priority: PURCHASE_PRIORITY.HIGH, notes: '止泻' },
      { name: '奥美拉唑肠溶胶囊', specification: '20mg*14粒', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.MEDIUM, notes: '胃酸过多' },
      { name: '多潘立酮片', specification: '10mg*30片', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.MEDIUM, notes: '消化不良' },
      { name: '小檗碱片', specification: '0.1g*24片', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.MEDIUM, notes: '肠道感染' },
      { name: '乳酸菌素片', specification: '0.4g*60片', suggestedQuantity: 2, priority: PURCHASE_PRIORITY.LOW, notes: '调节肠道菌群' }
    ]
  },
  first_aid: {
    name: '急救类',
    icon: 'alert',
    color: '#EF4444',
    items: [
      { name: '硝酸甘油片', specification: '0.5mg*100片', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.HIGH, notes: '心绞痛急救' },
      { name: '阿司匹林肠溶片', specification: '100mg*30片', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.HIGH, notes: '抗血小板' },
      { name: '速效救心丸', specification: '40mg*60丸', suggestedQuantity: 2, priority: PURCHASE_PRIORITY.HIGH, notes: '心绞痛急救' },
      { name: '安宫牛黄丸', specification: '3g/丸', suggestedQuantity: 1, priority: PURCHASE_PRIORITY.MEDIUM, notes: '高热惊厥' }
    ]
  },
  chronic: {
    name: '慢性病类',
    icon: 'clock',
    color: '#8B5CF6',
    items: [
      { name: '硝苯地平缓释片', specification: '10mg*30片', suggestedQuantity: 2, priority: PURCHASE_PRIORITY.HIGH, notes: '高血压' },
      { name: '二甲双胍片', specification: '0.5g*20片', suggestedQuantity: 2, priority: PURCHASE_PRIORITY.HIGH, notes: '糖尿病' },
      { name: '阿托伐他汀钙片', specification: '20mg*7片', suggestedQuantity: 4, priority: PURCHASE_PRIORITY.HIGH, notes: '降血脂' },
      { name: '氯吡格雷片', specification: '75mg*7片', suggestedQuantity: 4, priority: PURCHASE_PRIORITY.MEDIUM, notes: '抗血栓' },
      { name: '缬沙坦胶囊', specification: '80mg*14粒', suggestedQuantity: 2, priority: PURCHASE_PRIORITY.HIGH, notes: '高血压' }
    ]
  }
}
