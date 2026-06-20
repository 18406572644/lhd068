import { format, parseISO, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, eachMonthOfInterval, eachQuarterOfInterval, eachYearOfInterval, getQuarter, getMonth, getYear } from 'date-fns'
import { MEDICINE_CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS, PURCHASE_CHANNELS, PURCHASE_CHANNEL_LABELS, PURCHASE_CHANNEL_COLORS } from './constants.js'
import * as XLSX from 'xlsx'

const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const QUARTER_NAMES = ['第一季度', '第二季度', '第三季度', '第四季度']

function formatChineseDate(date, granularity) {
  const year = getYear(date)
  if (granularity === 'month') {
    const month = getMonth(date)
    return `${year}年${MONTH_NAMES[month]}`
  } else if (granularity === 'quarter') {
    const quarter = getQuarter(date) - 1
    return `${year}年${QUARTER_NAMES[quarter]}`
  } else {
    return `${year}年`
  }
}

export function calculateTotalAmount(medicine) {
  const price = parseFloat(medicine.unitPrice) || 0
  const qty = parseFloat(medicine.quantity) || 0
  return price * qty
}

export function getSpendingTrendData(medicines, granularity = 'month') {
  if (!medicines || medicines.length === 0) {
    return { labels: [], data: [] }
  }

  const datedMedicines = medicines
    .filter(m => m.purchaseDate)
    .map(m => ({
      ...m,
      amount: calculateTotalAmount(m),
      date: parseISO(m.purchaseDate)
    }))
    .sort((a, b) => a.date - b.date)

  if (datedMedicines.length === 0) {
    return { labels: [], data: [] }
  }

  const startDate = datedMedicines[0].date
  const endDate = datedMedicines[datedMedicines.length - 1].date

  let intervals = []

  if (granularity === 'month') {
    intervals = eachMonthOfInterval({ start: startDate, end: endDate })
  } else if (granularity === 'quarter') {
    intervals = eachQuarterOfInterval({ start: startDate, end: endDate })
  } else if (granularity === 'year') {
    intervals = eachYearOfInterval({ start: startDate, end: endDate })
  }

  const labels = intervals.map(d => formatChineseDate(d, granularity))
  const data = intervals.map(intervalStart => {
    let intervalEnd
    if (granularity === 'month') {
      intervalEnd = endOfMonth(intervalStart)
    } else if (granularity === 'quarter') {
      intervalEnd = endOfQuarter(intervalStart)
    } else {
      intervalEnd = endOfYear(intervalStart)
    }

    return datedMedicines
      .filter(m => m.date >= intervalStart && m.date <= intervalEnd)
      .reduce((sum, m) => sum + m.amount, 0)
  })

  return { labels, data }
}

export function getCategoryDistributionData(medicines) {
  const categoryTotals = {}
  const categories = [MEDICINE_CATEGORIES.PRESCRIPTION, MEDICINE_CATEGORIES.OTC, MEDICINE_CATEGORIES.EXTERNAL]

  categories.forEach(cat => {
    categoryTotals[cat] = 0
  })

  medicines.forEach(m => {
    const amount = calculateTotalAmount(m)
    const category = m.category || MEDICINE_CATEGORIES.OTC
    categoryTotals[category] = (categoryTotals[category] || 0) + amount
  })

  const labels = categories.map(cat => CATEGORY_LABELS[cat])
  const data = categories.map(cat => categoryTotals[cat])
  const colors = categories.map(cat => {
    const colorClass = CATEGORY_COLORS[cat]
    if (colorClass.includes('red')) return '#EF4444'
    if (colorClass.includes('green')) return '#10B981'
    return '#3B82F6'
  })

  return { labels, data, colors }
}

export function getChannelComparisonData(medicines) {
  const channelTotals = {}
  const channels = Object.values(PURCHASE_CHANNELS)

  channels.forEach(channel => {
    channelTotals[channel] = 0
  })

  medicines.forEach(m => {
    const amount = calculateTotalAmount(m)
    const channel = m.purchaseChannel || PURCHASE_CHANNELS.OTHER
    channelTotals[channel] = (channelTotals[channel] || 0) + amount
  })

  const labels = channels.map(ch => PURCHASE_CHANNEL_LABELS[ch])
  const data = channels.map(ch => channelTotals[ch])
  const colors = channels.map(ch => PURCHASE_CHANNEL_COLORS[ch])

  return { labels, data, colors }
}

export function getTopMedicinesBySpending(medicines, limit = 10) {
  const medicineTotals = {}

  medicines.forEach(m => {
    const amount = calculateTotalAmount(m)
    const key = m.name
    if (!medicineTotals[key]) {
      medicineTotals[key] = { name: m.name, totalAmount: 0, count: 0, category: m.category }
    }
    medicineTotals[key].totalAmount += amount
    medicineTotals[key].count += 1
  })

  return Object.values(medicineTotals)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit)
}

export function getTopPurchasesByAmount(medicines, limit = 10) {
  return medicines
    .map(m => ({
      name: m.name,
      amount: calculateTotalAmount(m),
      unitPrice: m.unitPrice,
      quantity: m.quantity,
      unit: m.unit,
      purchaseDate: m.purchaseDate,
      purchaseChannel: m.purchaseChannel
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

export function getSummaryStats(medicines) {
  const totalSpending = medicines.reduce((sum, m) => sum + calculateTotalAmount(m), 0)
  const purchaseCount = medicines.filter(m => m.purchaseDate).length
  const medicineCount = new Set(medicines.map(m => m.name)).size

  const avgPerPurchase = purchaseCount > 0 ? totalSpending / purchaseCount : 0

  const categoryStats = getCategoryDistributionData(medicines)
  const maxCategoryIndex = categoryStats.data.indexOf(Math.max(...categoryStats.data))
  const topCategory = maxCategoryIndex >= 0 ? categoryStats.labels[maxCategoryIndex] : '-'

  const channelStats = getChannelComparisonData(medicines)
  const maxChannelIndex = channelStats.data.indexOf(Math.max(...channelStats.data))
  const topChannel = maxChannelIndex >= 0 ? channelStats.labels[maxChannelIndex] : '-'

  return {
    totalSpending,
    purchaseCount,
    medicineCount,
    avgPerPurchase,
    topCategory,
    topChannel
  }
}

export function filterMedicinesByDateRange(medicines, startDate, endDate) {
  if (!startDate && !endDate) return medicines

  return medicines.filter(m => {
    if (!m.purchaseDate) return false
    const purchaseDate = parseISO(m.purchaseDate)
    const start = startDate ? parseISO(startDate) : new Date('1970-01-01')
    const end = endDate ? parseISO(endDate + 'T23:59:59') : new Date('2099-12-31')
    return purchaseDate >= start && purchaseDate <= end
  })
}

export function generateExcelData(medicines) {
  return medicines
    .filter(m => m.purchaseDate)
    .map(m => ({
      '药品名称': m.name,
      '分类': CATEGORY_LABELS[m.category] || '-',
      '规格': m.specification || '-',
      '生产厂家': m.manufacturer || '-',
      '单价(元)': m.unitPrice ? parseFloat(m.unitPrice).toFixed(2) : '-',
      '数量': m.quantity || 0,
      '单位': m.unit || '-',
      '总金额(元)': calculateTotalAmount(m).toFixed(2),
      '购买日期': m.purchaseDate || '-',
      '购买渠道': PURCHASE_CHANNEL_LABELS[m.purchaseChannel] || '-',
      '批号': m.batchNumber || '-',
      '有效期至': m.expiryDate || '-',
      '备注': m.notes || ''
    }))
}

export function exportToExcel(data, filename = '消费明细.xlsx') {
  if (!data || data.length === 0) {
    alert('没有可导出的数据')
    return
  }

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '消费明细')

  ws['!cols'] = [
    { wch: 20 },
    { wch: 10 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 30 }
  ]

  XLSX.writeFile(wb, filename)
}

export function exportToCSV(data, filename = '消费明细.csv') {
  if (!data || data.length === 0) {
    alert('没有可导出的数据')
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header]
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(','))
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
