import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { generateQRCodePayload, generateEmergencyCardData } from './healthProfile.js'
import { formatDate } from './helpers.js'

const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297
const MARGIN_MM = 15
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2

const DPI = 300
const MM_TO_PX = DPI / 25.4
const SCALE = 2

const PAGE_WIDTH_PX = Math.round(PAGE_WIDTH_MM * MM_TO_PX)
const PAGE_HEIGHT_PX = Math.round(PAGE_HEIGHT_MM * MM_TO_PX)
const MARGIN_PX = MARGIN_MM * MM_TO_PX
const CONTENT_WIDTH_PX = CONTENT_WIDTH_MM * MM_TO_PX

const FONT_STACK = [
  '"PingFang SC"',
  '"Microsoft YaHei"',
  '"Source Han Sans SC"',
  '"Noto Sans SC"',
  '"Hiragino Sans GB"',
  '"WenQuanYi Micro Hei"',
  'sans-serif'
].join(', ')

const COLORS = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryBg: '#EFF6FF',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  dangerBg: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningBg: '#FFFBEB',
  success: '#10B981',
  successLight: '#D1FAE5',
  successBg: '#ECFDF5',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  purpleBg: '#F5F3FF',
  cyan: '#06B6D4',
  rose: '#F43F5E',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  bgGray: '#F9FAFB',
  white: '#FFFFFF'
}

function mmToPx(mm) {
  return mm * MM_TO_PX
}

function createHiDPICanvas(widthPx, heightPx) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(widthPx * SCALE)
  canvas.height = Math.round(heightPx * SCALE)
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)
  ctx.textBaseline = 'top'
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return { canvas, ctx }
}

function setFont(ctx, sizePx, weight = 'normal') {
  ctx.font = `${weight} ${sizePx}px ${FONT_STACK}`
  ctx.textBaseline = 'top'
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2
  if (h < 2 * r) r = h / 2
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(ctx, text, maxWidthPx) {
  if (!text) return ['']
  const chars = String(text).split('')
  const lines = []
  let currentLine = ''

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    if (char === '\n') {
      lines.push(currentLine)
      currentLine = ''
      continue
    }
    const testLine = currentLine + char
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidthPx && currentLine !== '') {
      lines.push(currentLine)
      currentLine = char
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 1)]
    : [59, 130, 246]
}

function rgba(hex, alpha = 1) {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

async function generateQRCodeImage(text, sizePx) {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: Math.round(sizePx * SCALE),
      margin: 2,
      color: { dark: '#111827', light: '#FFFFFF' },
      errorCorrectionLevel: 'M'
    })
    const img = new Image()
    img.src = dataUrl
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })
    return img
  } catch (e) {
    console.warn('生成二维码失败:', e)
    return null
  }
}

function drawPageHeader(ctx, title, subtitle, pageNum, totalPages) {
  ctx.fillStyle = COLORS.primary
  ctx.fillRect(0, 0, PAGE_WIDTH_PX, mmToPx(25))

  ctx.fillStyle = COLORS.white
  setFont(ctx, 18, 'bold')
  ctx.fillText(title, MARGIN_PX, mmToPx(8))

  if (subtitle) {
    setFont(ctx, 11, 'normal')
    ctx.globalAlpha = 0.9
    ctx.fillText(subtitle, MARGIN_PX, mmToPx(15.5))
    ctx.globalAlpha = 1
  }

  setFont(ctx, 10, 'normal')
  ctx.globalAlpha = 0.85
  ctx.textAlign = 'right'
  ctx.fillText(`第 ${pageNum} / ${totalPages} 页`, PAGE_WIDTH_PX - MARGIN_PX, mmToPx(11))
  ctx.textAlign = 'left'
  ctx.globalAlpha = 1

  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(MARGIN_PX, mmToPx(33))
  ctx.lineTo(PAGE_WIDTH_PX - MARGIN_PX, mmToPx(33))
  ctx.stroke()
}

function drawPageFooter(ctx, memberName) {
  const footerY = PAGE_HEIGHT_PX - mmToPx(12)
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(MARGIN_PX, footerY - mmToPx(5))
  ctx.lineTo(PAGE_WIDTH_PX - MARGIN_PX, footerY - mmToPx(5))
  ctx.stroke()

  setFont(ctx, 9, 'normal')
  ctx.fillStyle = COLORS.textMuted
  ctx.fillText(`家庭健康档案 · ${memberName || ''}`, MARGIN_PX, footerY)
  ctx.textAlign = 'right'
  ctx.fillText(`生成时间：${formatDate(new Date().toISOString())}`, PAGE_WIDTH_PX - MARGIN_PX, footerY)
  ctx.textAlign = 'left'
}

function drawSectionTitle(ctx, title, y, color = COLORS.primary) {
  ctx.fillStyle = color
  ctx.fillRect(MARGIN_PX, y, mmToPx(1.2), mmToPx(6))

  setFont(ctx, 14, 'bold')
  ctx.fillStyle = COLORS.textPrimary
  ctx.fillText(title, MARGIN_PX + mmToPx(3), y - mmToPx(0.5))

  return y + mmToPx(10)
}

function drawAdherenceChartCanvas(adherence, widthPx, heightPx) {
  const { canvas, ctx } = createHiDPICanvas(widthPx, heightPx)

  ctx.fillStyle = COLORS.white
  ctx.fillRect(0, 0, widthPx, heightPx)

  const padding = { top: mmToPx(10), right: mmToPx(8), bottom: mmToPx(18), left: mmToPx(14) }
  const chartW = widthPx - padding.left - padding.right
  const chartH = heightPx - padding.top - padding.bottom

  const labels = adherence.weekLabels || []
  const data = adherence.weeklyData || []

  setFont(ctx, 14, 'bold')
  ctx.fillStyle = COLORS.textPrimary
  ctx.textAlign = 'center'
  ctx.fillText('用药依从性统计图', widthPx / 2, mmToPx(3))
  ctx.textAlign = 'left'

  if (data.length === 0) {
    setFont(ctx, 12, 'normal')
    ctx.fillStyle = COLORS.textMuted
    ctx.textAlign = 'center'
    ctx.fillText('暂无足够数据生成图表', widthPx / 2, heightPx / 2 - mmToPx(3))
    ctx.textAlign = 'left'
    return canvas
  }

  const maxValue = Math.max(...data, 21)
  const yTicks = 5
  const yStep = maxValue / yTicks

  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 1
  setFont(ctx, 10, 'normal')
  ctx.fillStyle = COLORS.textTertiary
  ctx.textAlign = 'right'

  for (let i = 0; i <= yTicks; i++) {
    const y = padding.top + (chartH / yTicks) * i
    const value = Math.round(maxValue - yStep * i)
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartW, y)
    ctx.stroke()
    ctx.fillText(String(value), padding.left - mmToPx(2), y - mmToPx(2.5))
  }

  const barWidth = chartW / data.length * 0.65
  const gap = chartW / data.length * 0.35

  setFont(ctx, 9, 'normal')
  ctx.fillStyle = COLORS.textTertiary
  ctx.textAlign = 'center'

  const barColor = adherence.level === 'high'
    ? COLORS.success
    : adherence.level === 'medium'
      ? COLORS.warning
      : COLORS.danger

  data.forEach((value, index) => {
    const x = padding.left + (chartW / data.length) * index + gap / 2
    const barH = (value / maxValue) * chartH
    const y = padding.top + chartH - barH

    const gradient = ctx.createLinearGradient(0, y, 0, y + barH)
    gradient.addColorStop(0, barColor)
    gradient.addColorStop(1, rgba(barColor, 0.7))
    ctx.fillStyle = gradient

    drawRoundedRect(ctx, x, y, barWidth, barH, mmToPx(1))
    ctx.fill()

    setFont(ctx, 11, 'bold')
    ctx.fillStyle = COLORS.textPrimary
    ctx.fillText(String(value), x + barWidth / 2, y - mmToPx(5))

    setFont(ctx, 9, 'normal')
    ctx.fillStyle = COLORS.textTertiary
    const labelText = labels[index] || ''
    ctx.fillText(labelText, x + barWidth / 2, padding.top + chartH + mmToPx(3))
  })

  ctx.textAlign = 'left'

  setFont(ctx, 9, 'normal')
  ctx.fillStyle = COLORS.textMuted
  ctx.textAlign = 'center'
  ctx.fillText('（按周统计服药次数，基准为每日3次）', widthPx / 2, heightPx - mmToPx(5))
  ctx.textAlign = 'left'

  return canvas
}

function estimateTotalPages(profile) {
  let pages = 1
  const medsCount = profile.currentMedications?.length || 0
  const recordsCount = profile.medicalRecords?.length || 0
  const warningsCount = profile.safetyAssessment?.warnings?.length || 0

  if (medsCount > 5) pages += Math.ceil((medsCount - 5) / 7)
  if (recordsCount > 2) pages += Math.ceil((recordsCount - 2) / 3)
  if (warningsCount > 2) pages += Math.ceil((warningsCount - 2) / 4)
  pages += 1

  return Math.max(pages, 3)
}

class PDFRenderer {
  constructor(profile, options = {}) {
    this.profile = profile
    this.options = options
    this.pages = []
    this.currentPageIdx = 0
    this.cursorY = 0
    this.totalPages = estimateTotalPages(profile)
    this.dateRangeText = ''
  }

  init() {
    const { startDate, endDate } = this.options
    this.dateRangeText = (startDate && endDate)
      ? `报告周期：${startDate} 至 ${endDate}`
      : '报告周期：全部数据'
    this._newPage()
  }

  _newPage() {
    const { canvas, ctx } = createHiDPICanvas(PAGE_WIDTH_PX, PAGE_HEIGHT_PX)
    ctx.fillStyle = COLORS.white
    ctx.fillRect(0, 0, PAGE_WIDTH_PX, PAGE_HEIGHT_PX)

    const pageNum = this.pages.length + 1
    drawPageHeader(ctx, '健康档案报告', `${this.profile.basicInfo.name} · ${this.dateRangeText}`, pageNum, this.totalPages)
    drawPageFooter(ctx, this.profile.basicInfo.name)

    this.currentCtx = ctx
    this.currentCanvas = canvas
    this.cursorY = mmToPx(40)
    this.pages.push(canvas)
  }

  ensureSpace(neededPx) {
    if (this.cursorY + neededPx > PAGE_HEIGHT_PX - mmToPx(22)) {
      this._newPage()
      return true
    }
    return false
  }

  async render() {
    this._renderPersonalInfo()
    this._renderCurrentMeds()
    this._renderMedicalRecords()
    this._renderAdherence()
    this._renderSafetyAssessment()
    await this._renderQRCodeSection()
    return this.pages
  }

  _renderPersonalInfo() {
    const ctx = this.currentCtx
    let y = this.cursorY

    y = drawSectionTitle(ctx, '个人信息与过敏禁忌摘要', y, COLORS.danger)

    const hasAllergies = this.profile.basicInfo.allergyLabels?.length > 0
    const hasHighRisk = this.profile.safetyAssessment?.summary?.highCount > 0
    const isHighAlert = hasAllergies || hasHighRisk

    const bannerBg = isHighAlert ? COLORS.dangerLight : COLORS.successLight
    const bannerText = isHighAlert
      ? '⚠ 重要：存在过敏史或高风险用药，就医时请务必告知医生！'
      : '✓ 暂无特殊过敏禁忌'
    const bannerTextColor = isHighAlert ? '#991B1B' : '#166534'

    ctx.fillStyle = bannerBg
    drawRoundedRect(ctx, MARGIN_PX, y, CONTENT_WIDTH_PX, mmToPx(9), mmToPx(2))
    ctx.fill()

    setFont(ctx, 12, 'bold')
    ctx.fillStyle = bannerTextColor
    ctx.textAlign = 'center'
    ctx.fillText(bannerText, PAGE_WIDTH_PX / 2, y + mmToPx(3))
    ctx.textAlign = 'left'
    y += mmToPx(14)

    const colW = (CONTENT_WIDTH_PX - mmToPx(8)) / 2
    const leftX = MARGIN_PX
    const rightX = MARGIN_PX + colW + mmToPx(8)
    const lineGap = mmToPx(6)

    const infoPairs = [
      ['姓名：', this.profile.basicInfo.name, '关系：', this.profile.basicInfo.relation],
      ['年龄：', this.profile.basicInfo.ageText || '-', '出生日期：', this.profile.basicInfo.birthDate || '-'],
      ['体重：', this.profile.basicInfo.weight ? `${this.profile.basicInfo.weight} kg` : '-', '报告时间：', formatDate(new Date().toISOString())]
    ]

    for (const [lLabel, lValue, rLabel, rValue] of infoPairs) {
      this._drawLabelValue(ctx, lLabel, lValue, leftX, y)
      this._drawLabelValue(ctx, rLabel, rValue, rightX, y)
      y += lineGap
    }

    y += mmToPx(4)
    y = drawSectionTitle(ctx, '过敏史与禁忌', y, COLORS.danger)

    const allergyText = this.profile.basicInfo.allergyLabels?.length > 0
      ? this.profile.basicInfo.allergyLabels.join('、')
      : '无已知过敏史'

    setFont(ctx, this.profile.basicInfo.allergyLabels?.length > 0 ? 13 : 12,
      this.profile.basicInfo.allergyLabels?.length > 0 ? 'bold' : 'normal')
    ctx.fillStyle = this.profile.basicInfo.allergyLabels?.length > 0 ? COLORS.danger : COLORS.textTertiary

    const allergyLines = wrapText(ctx, allergyText, CONTENT_WIDTH_PX)
    for (const line of allergyLines) {
      ctx.fillText(line, MARGIN_PX, y)
      y += mmToPx(5)
    }

    y += mmToPx(3)
    y = drawSectionTitle(ctx, '慢性病史', y, COLORS.warning)

    const chronicText = this.profile.basicInfo.chronicLabels?.length > 0
      ? this.profile.basicInfo.chronicLabels.join('、')
      : '无慢性病记录'

    setFont(ctx, this.profile.basicInfo.chronicLabels?.length > 0 ? 13 : 12,
      this.profile.basicInfo.chronicLabels?.length > 0 ? 'bold' : 'normal')
    ctx.fillStyle = this.profile.basicInfo.chronicLabels?.length > 0 ? '#B45309' : COLORS.textTertiary

    const chronicLines = wrapText(ctx, chronicText, CONTENT_WIDTH_PX)
    for (const line of chronicLines) {
      ctx.fillText(line, MARGIN_PX, y)
      y += mmToPx(5)
    }

    y += mmToPx(5)
    y = drawSectionTitle(ctx, '肝肾功能状态', y, COLORS.success)

    const organBoxW = (CONTENT_WIDTH_PX - mmToPx(5)) / 2
    const liverNormal = this.profile.basicInfo.liverFunction === 'normal'
    const kidneyNormal = this.profile.basicInfo.kidneyFunction === 'normal'

    ctx.fillStyle = liverNormal ? COLORS.successBg : COLORS.dangerBg
    drawRoundedRect(ctx, MARGIN_PX, y, organBoxW, mmToPx(10), mmToPx(2))
    ctx.fill()
    setFont(ctx, 10, 'normal')
    ctx.fillStyle = COLORS.textTertiary
    ctx.fillText('肝功能', MARGIN_PX + mmToPx(3), y + mmToPx(1.5))
    setFont(ctx, 12, 'bold')
    ctx.fillStyle = liverNormal ? '#047857' : COLORS.danger
    ctx.fillText(this.profile.basicInfo.liverFunctionLabel, MARGIN_PX + mmToPx(3), y + mmToPx(4.5))

    ctx.fillStyle = kidneyNormal ? COLORS.successBg : COLORS.dangerBg
    drawRoundedRect(ctx, MARGIN_PX + organBoxW + mmToPx(5), y, organBoxW, mmToPx(10), mmToPx(2))
    ctx.fill()
    setFont(ctx, 10, 'normal')
    ctx.fillStyle = COLORS.textTertiary
    ctx.fillText('肾功能', MARGIN_PX + organBoxW + mmToPx(8), y + mmToPx(1.5))
    setFont(ctx, 12, 'bold')
    ctx.fillStyle = kidneyNormal ? '#047857' : COLORS.danger
    ctx.fillText(this.profile.basicInfo.kidneyFunctionLabel, MARGIN_PX + organBoxW + mmToPx(8), y + mmToPx(4.5))

    this.cursorY = y + mmToPx(14)
  }

  _drawLabelValue(ctx, label, value, x, y) {
    setFont(ctx, 11, 'normal')
    ctx.fillStyle = COLORS.textTertiary
    ctx.fillText(label, x, y)
    setFont(ctx, 12, 'bold')
    ctx.fillStyle = COLORS.textPrimary
    ctx.fillText(value || '-', x + mmToPx(14), y)
  }

  _renderCurrentMeds() {
    this.ensureSpace(mmToPx(35))
    let ctx = this.currentCtx
    let y = this.cursorY

    y = drawSectionTitle(ctx, '当前用药清单', y, COLORS.primary)

    const meds = this.profile.currentMedications || []

    if (meds.length === 0) {
      setFont(ctx, 12, 'normal')
      ctx.fillStyle = COLORS.textMuted
      ctx.fillText('暂无当前用药记录', MARGIN_PX, y + mmToPx(4))
      this.cursorY = y + mmToPx(18)
      return
    }

    const headers = ['药品名称', '剂量', '频次', '类型']
    const colWidths = [mmToPx(70), mmToPx(28), mmToPx(38), mmToPx(26)]
    const rowH = mmToPx(8)

    ctx.fillStyle = COLORS.borderLight
    ctx.fillRect(MARGIN_PX, y, CONTENT_WIDTH_PX, rowH)

    setFont(ctx, 11, 'bold')
    ctx.fillStyle = COLORS.textSecondary
    let hx = MARGIN_PX + mmToPx(3)
    for (let i = 0; i < headers.length; i++) {
      ctx.fillText(headers[i], hx, y + mmToPx(2.5))
      hx += colWidths[i]
    }
    y += rowH

    for (let i = 0; i < meds.length; i++) {
      const med = meds[i]

      if (this.ensureSpace(rowH + mmToPx(5))) {
        y = this.cursorY
        ctx = this.currentCtx
        ctx.fillStyle = COLORS.borderLight
        ctx.fillRect(MARGIN_PX, y, CONTENT_WIDTH_PX, rowH)
        setFont(ctx, 11, 'bold')
        ctx.fillStyle = COLORS.textSecondary
        let hx2 = MARGIN_PX + mmToPx(3)
        for (let hi = 0; hi < headers.length; hi++) {
          ctx.fillText(headers[hi], hx2, y + mmToPx(2.5))
          hx2 += colWidths[hi]
        }
        y += rowH
      }

      if (i % 2 === 1) {
        ctx.fillStyle = COLORS.bgGray
        ctx.fillRect(MARGIN_PX, y, CONTENT_WIDTH_PX, rowH)
      }

      setFont(ctx, 10.5, 'normal')
      ctx.fillStyle = COLORS.textPrimary

      let rx = MARGIN_PX + mmToPx(3)
      const dosageText = `${med.dosage || '-'}${med.dosageUnit || ''}`
      const typeText = med.isLongTerm ? '长期用药' : (med.duration || '短期')
      const values = [med.name, dosageText, med.frequency || '-', typeText]

      for (let vi = 0; vi < values.length; vi++) {
        const maxChars = Math.floor(colWidths[vi] / 7)
        const displayText = values[vi]?.length > maxChars
          ? values[vi].slice(0, maxChars - 1) + '…'
          : (values[vi] || '-')
        ctx.fillText(displayText, rx, y + mmToPx(2.5))
        rx += colWidths[vi]
      }

      y += rowH
    }

    this.cursorY = y + mmToPx(6)
  }

  _renderMedicalRecords() {
    this.ensureSpace(mmToPx(30))
    const ctx = this.currentCtx
    let y = this.cursorY

    y = drawSectionTitle(ctx, '近期就诊记录', y, COLORS.purple)

    const records = this.profile.medicalRecords || []
    if (records.length === 0) {
      setFont(ctx, 12, 'normal')
      ctx.fillStyle = COLORS.textMuted
      ctx.fillText('暂无就诊记录', MARGIN_PX, y + mmToPx(4))
      this.cursorY = y + mmToPx(18)
      return
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i]

      this.ensureSpace(mmToPx(45))
      const c = this.currentCtx

      c.fillStyle = COLORS.purpleLight
      c.fillRect(MARGIN_PX, y, CONTENT_WIDTH_PX, mmToPx(0.8))
      y += mmToPx(4)

      setFont(c, 13, 'bold')
      c.fillStyle = COLORS.purple
      c.fillText(`${record.visitDate || '-'}  ${record.hospital || '-'}  ${record.department || ''}`, MARGIN_PX, y)
      y += mmToPx(7)

      setFont(c, 12, 'bold')
      c.fillStyle = COLORS.textPrimary
      c.fillText(`诊断：${record.diagnosis || '-'}`, MARGIN_PX, y)
      y += mmToPx(6)

      setFont(c, 11, 'normal')
      c.fillStyle = COLORS.textSecondary
      const ccLines = wrapText(c, `主诉：${record.chiefComplaint || '-'}`, CONTENT_WIDTH_PX)
      for (const line of ccLines) {
        c.fillText(line, MARGIN_PX, y)
        y += mmToPx(5)
      }

      if (record.prescribedMedicines?.length > 0) {
        this.ensureSpace(mmToPx(20))
        const c2 = this.currentCtx
        setFont(c2, 11, 'bold')
        c2.fillStyle = COLORS.primary
        c2.fillText('处方用药：', MARGIN_PX, y + mmToPx(2))
        y += mmToPx(6)

        setFont(c2, 10, 'normal')
        c2.fillStyle = COLORS.textSecondary
        for (let pi = 0; pi < record.prescribedMedicines.length; pi++) {
          const pm = record.prescribedMedicines[pi]
          const mt = `${pi + 1}. ${pm.medicineName} ${pm.dosage || ''}${pm.dosageUnit || ''} ${pm.frequency || ''} ${pm.duration || ''}`.trim()
          const mtLines = wrapText(c2, mt, CONTENT_WIDTH_PX - mmToPx(5))
          for (const line of mtLines) {
            this.ensureSpace(mmToPx(6))
            this.currentCtx.fillText(line, MARGIN_PX + mmToPx(3), y)
            y += mmToPx(4.5)
          }
        }
      }

      if (record.notes) {
        this.ensureSpace(mmToPx(12))
        const c3 = this.currentCtx
        setFont(c3, 10, 'normal')
        c3.fillStyle = COLORS.textTertiary
        const noteLines = wrapText(c3, `医嘱：${record.notes}`, CONTENT_WIDTH_PX)
        for (const line of noteLines) {
          c3.fillText(line, MARGIN_PX, y)
          y += mmToPx(4.5)
        }
      }

      y += mmToPx(5)
    }

    this.cursorY = y
  }

  _renderAdherence() {
    this.ensureSpace(mmToPx(50))
    const ctx = this.currentCtx
    let y = this.cursorY

    y = drawSectionTitle(ctx, '用药依从性统计', y, COLORS.cyan)

    const adherence = this.profile.adherence || {}
    const statBoxW = (CONTENT_WIDTH_PX - mmToPx(15)) / 4
    const stats = [
      ['统计天数', `${adherence.totalDays || 0} 天`],
      ['预期服药', adherence.totalExpectedDoses || 0],
      ['实际服药', adherence.totalActualDoses || 0],
      ['记录天数', `${adherence.daysWithDosing || 0} 天`]
    ]

    for (let i = 0; i < stats.length; i++) {
      const bx = MARGIN_PX + i * (statBoxW + mmToPx(5))
      ctx.fillStyle = COLORS.bgGray
      drawRoundedRect(ctx, bx, y, statBoxW, mmToPx(12), mmToPx(2))
      ctx.fill()

      setFont(ctx, 10, 'normal')
      ctx.fillStyle = COLORS.textTertiary
      ctx.textAlign = 'center'
      ctx.fillText(stats[i][0], bx + statBoxW / 2, y + mmToPx(2))
      setFont(ctx, 16, 'bold')
      ctx.fillStyle = COLORS.cyan
      ctx.fillText(String(stats[i][1]), bx + statBoxW / 2, y + mmToPx(5.5))
      ctx.textAlign = 'left'
    }
    y += mmToPx(16)

    const rate = adherence.adherenceRate || 0
    setFont(ctx, 13, 'bold')
    ctx.fillStyle = COLORS.textPrimary
    ctx.fillText('依从性评分：', MARGIN_PX, y + mmToPx(2))
    setFont(ctx, 24, 'bold')
    ctx.fillStyle = adherence.levelColor || COLORS.danger
    ctx.fillText(`${rate}%`, MARGIN_PX + mmToPx(30), y - mmToPx(0.5))
    setFont(ctx, 11, 'normal')
    ctx.fillStyle = COLORS.textTertiary
    ctx.fillText(`· ${adherence.levelText || ''}`, MARGIN_PX + mmToPx(55), y + mmToPx(3.5))
    y += mmToPx(22)

    this.ensureSpace(mmToPx(70))
    const chartH = mmToPx(65)
    const chartCanvas = drawAdherenceChartCanvas(adherence, CONTENT_WIDTH_PX, chartH)
    this.currentCtx.drawImage(chartCanvas, MARGIN_PX, y, CONTENT_WIDTH_PX, chartH)
    y += chartH + mmToPx(6)

    this.cursorY = y
  }

  _renderSafetyAssessment() {
    this.ensureSpace(mmToPx(55))
    const ctx = this.currentCtx
    let y = this.cursorY

    y = drawSectionTitle(ctx, '药物安全评估摘要', y, COLORS.rose)

    const safety = this.profile.safetyAssessment?.summary
    if (!safety) {
      this.cursorY = y + mmToPx(10)
      return
    }

    const riskColor = safety.overallRiskColor || COLORS.success

    ctx.fillStyle = rgba(riskColor, 0.1)
    ctx.strokeStyle = riskColor
    ctx.lineWidth = 1.5
    drawRoundedRect(ctx, MARGIN_PX, y, CONTENT_WIDTH_PX, mmToPx(20), mmToPx(2))
    ctx.fill()
    ctx.stroke()

    setFont(ctx, 13, 'bold')
    ctx.fillStyle = riskColor
    ctx.fillText(`综合风险等级：${safety.overallRiskText}`, MARGIN_PX + mmToPx(3), y + mmToPx(3.5))

    setFont(ctx, 10.5, 'normal')
    ctx.fillStyle = COLORS.textSecondary
    const descLines = wrapText(ctx, safety.overallRiskDesc || '', CONTENT_WIDTH_PX - mmToPx(6))
    for (let i = 0; i < descLines.length; i++) {
      ctx.fillText(descLines[i], MARGIN_PX + mmToPx(3), y + mmToPx(9) + i * mmToPx(4.5))
    }
    y += mmToPx(20) + Math.max(0, descLines.length - 1) * mmToPx(4.5) + mmToPx(4)

    const riskBoxW = (CONTENT_WIDTH_PX - mmToPx(20)) / 5
    const riskItems = [
      ['高风险', safety.highCount || 0, COLORS.danger],
      ['中风险', safety.mediumCount || 0, COLORS.warning],
      ['低风险', safety.lowCount || 0, COLORS.primary],
      ['过敏项', safety.allergyRisk || 0, '#EC4899'],
      ['慢性病', safety.chronicCount || 0, COLORS.purple]
    ]

    for (let i = 0; i < riskItems.length; i++) {
      const [label, count, color] = riskItems[i]
      const rx = MARGIN_PX + i * (riskBoxW + mmToPx(5))

      ctx.fillStyle = rgba(color, 0.1)
      drawRoundedRect(ctx, rx, y, riskBoxW, mmToPx(14), mmToPx(2))
      ctx.fill()

      setFont(ctx, 10, 'normal')
      ctx.fillStyle = COLORS.textTertiary
      ctx.textAlign = 'center'
      ctx.fillText(label, rx + riskBoxW / 2, y + mmToPx(2))
      setFont(ctx, 18, 'bold')
      ctx.fillStyle = color
      ctx.fillText(String(count), rx + riskBoxW / 2, y + mmToPx(6))
      ctx.textAlign = 'left'
    }
    y += mmToPx(18)

    const warnings = this.profile.safetyAssessment?.warnings || []
    if (warnings.length > 0) {
      y += mmToPx(4)
      this.ensureSpace(mmToPx(25))
      const c = this.currentCtx

      setFont(c, 12, 'bold')
      c.fillStyle = COLORS.textSecondary
      c.fillText('风险明细：', MARGIN_PX, y)
      y += mmToPx(7)

      const toShow = warnings.slice(0, 10)
      for (const w of toShow) {
        this.ensureSpace(mmToPx(18))
        const wc = this.currentCtx

        const levelColor = w.level === 'high' ? COLORS.danger : (w.level === 'medium' ? COLORS.warning : COLORS.primary)

        wc.fillStyle = rgba(levelColor, 0.08)
        drawRoundedRect(wc, MARGIN_PX, y, CONTENT_WIDTH_PX, mmToPx(13), mmToPx(2))
        wc.fill()

        setFont(wc, 11, 'bold')
        wc.fillStyle = levelColor
        const levelLabel = w.level === 'high' ? '高' : (w.level === 'medium' ? '中' : '低')
        wc.fillText(`[${levelLabel}风险] ${w.medicine} - ${w.title}`, MARGIN_PX + mmToPx(3), y + mmToPx(2.5))
        y += mmToPx(6.5)

        setFont(wc, 10, 'normal')
        wc.fillStyle = COLORS.textSecondary
        const descLines = wrapText(wc, w.description || '', CONTENT_WIDTH_PX - mmToPx(6))
        for (const line of descLines) {
          this.ensureSpace(mmToPx(5))
          this.currentCtx.fillText(line, MARGIN_PX + mmToPx(3), y)
          y += mmToPx(4.5)
        }
        y += mmToPx(2)
      }
    }

    this.cursorY = y
  }

  async _renderQRCodeSection() {
    this.ensureSpace(mmToPx(45))
    const ctx = this.currentCtx
    let y = this.cursorY

    y = drawSectionTitle(ctx, '扫码查看电子档案', y, COLORS.primary)

    const qrPayload = generateQRCodePayload(this.profile.basicInfo.id)
    const qrSize = mmToPx(50)

    if (qrPayload) {
      const qrImg = await generateQRCodeImage(qrPayload, qrSize)
      if (qrImg) {
        ctx.drawImage(qrImg, MARGIN_PX, y, qrSize, qrSize)

        const qrTextX = MARGIN_PX + qrSize + mmToPx(8)
        const qrTextW = CONTENT_WIDTH_PX - qrSize - mmToPx(8)

        setFont(ctx, 11, 'normal')
        ctx.fillStyle = COLORS.textTertiary
        const desc = '医生或急救人员可使用手机扫描左侧二维码，快速获取患者的关键健康信息（过敏史、禁忌、当前用药等）。建议将此页打印随身携带或存入手机相册。'
        const descLines = wrapText(ctx, desc, qrTextW)
        for (const line of descLines) {
          ctx.fillText(line, qrTextX, y + mmToPx(5))
          y += mmToPx(5)
        }

        setFont(ctx, 10, 'normal')
        ctx.fillStyle = COLORS.textMuted
        ctx.fillText(`二维码生成时间：${formatDate(new Date().toISOString())}`, qrTextX, y + qrSize - mmToPx(18))
      }
    }

    this.cursorY = y + qrSize + mmToPx(5)
  }
}

export async function generateHealthReportPDF(profile, options = {}) {
  if (!profile || !profile.basicInfo) return null

  try {
    const renderer = new PDFRenderer(profile, options)
    renderer.init()
    const pages = await renderer.render()

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) doc.addPage()
      const imgData = pages[i].toDataURL('image/jpeg', 0.92)
      doc.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, undefined, 'FAST')
    }

    const fileName = `健康档案_${profile.basicInfo.name}_${formatDate(new Date().toISOString())}.pdf`
    doc.save(fileName)
    return fileName
  } catch (err) {
    console.error('生成PDF失败:', err)
    throw err
  }
}

// ========== 急诊卡 ==========

async function renderEmergencyCard(memberId) {
  const cardData = generateEmergencyCardData(memberId)
  if (!cardData) return null

  const cardW = mmToPx(90)
  const cardH = mmToPx(58)

  const { canvas, ctx } = createHiDPICanvas(cardW, cardH)
  const primaryColor = cardData.color || COLORS.primary

  ctx.fillStyle = primaryColor
  ctx.fillRect(0, 0, cardW, cardH)

  ctx.fillStyle = COLORS.white
  ctx.fillRect(mmToPx(3), mmToPx(3), cardW - mmToPx(6), cardH - mmToPx(6))

  ctx.fillStyle = primaryColor
  ctx.fillRect(mmToPx(3), mmToPx(3), cardW - mmToPx(6), mmToPx(9))

  ctx.fillStyle = COLORS.white
  setFont(ctx, 12, 'bold')
  ctx.textAlign = 'center'
  ctx.fillText('急诊医疗信息卡 / EMERGENCY CARD', cardW / 2, mmToPx(5.5))
  ctx.textAlign = 'left'

  let y = mmToPx(15)

  setFont(ctx, 14, 'bold')
  ctx.fillStyle = COLORS.textPrimary
  ctx.fillText(cardData.name, mmToPx(5), y)

  setFont(ctx, 10, 'normal')
  ctx.fillStyle = COLORS.textTertiary
  ctx.fillText(`${cardData.relation || ''}  ${cardData.ageText || ''}`, mmToPx(38), y + mmToPx(0.5))

  y += mmToPx(7)

  if (cardData.birthDate) {
    setFont(ctx, 9, 'normal')
    ctx.fillStyle = COLORS.textTertiary
    ctx.fillText(`生日: ${cardData.birthDate}`, mmToPx(5), y)
  }
  if (cardData.weight) {
    ctx.fillText(`体重: ${cardData.weight}kg`, mmToPx(38), y)
  }

  y += mmToPx(6)

  const hasAllergies = cardData.allergies?.length > 0
  if (hasAllergies) {
    ctx.fillStyle = COLORS.dangerLight
    drawRoundedRect(ctx, mmToPx(4), y - mmToPx(2), cardW - mmToPx(8), mmToPx(10), mmToPx(2))
    ctx.fill()

    setFont(ctx, 10, 'bold')
    ctx.fillStyle = COLORS.danger
    const allergyLabel = '⚠ 过敏：' + (cardData.allergies.join('、') || '无')
    const allergyLines = wrapText(ctx, allergyLabel, cardW - mmToPx(12))
    for (let i = 0; i < allergyLines.length; i++) {
      ctx.fillText(allergyLines[i], mmToPx(6), y + i * mmToPx(4.5))
    }
    y += allergyLines.length * mmToPx(4.5) + mmToPx(2)
  } else {
    ctx.fillStyle = COLORS.successLight
    drawRoundedRect(ctx, mmToPx(4), y - mmToPx(2), cardW - mmToPx(8), mmToPx(8), mmToPx(2))
    ctx.fill()

    setFont(ctx, 10, 'bold')
    ctx.fillStyle = '#047857'
    ctx.fillText('✓ 无已知过敏史', mmToPx(6), y)
    y += mmToPx(6)
  }

  if (cardData.chronicDiseases?.length > 0) {
    setFont(ctx, 10, 'bold')
    ctx.fillStyle = '#B45309'
    const chronicTxt = `慢病：${cardData.chronicDiseases.join('、')}`
    const chronicLines = wrapText(ctx, chronicTxt, cardW - mmToPx(12))
    for (const line of chronicLines) {
      ctx.fillText(line, mmToPx(5), y)
      y += mmToPx(4.5)
    }
  }

  if (cardData.liverFunction !== '正常' || cardData.kidneyFunction !== '正常') {
    setFont(ctx, 9, 'normal')
    ctx.fillStyle = COLORS.textTertiary
    const parts = []
    if (cardData.liverFunction !== '正常') parts.push(`肝功:${cardData.liverFunction}`)
    if (cardData.kidneyFunction !== '正常') parts.push(`肾功:${cardData.kidneyFunction}`)
    ctx.fillText(parts.join('  '), mmToPx(5), y + mmToPx(0.5))
    y += mmToPx(5)
  }

  y += mmToPx(1)
  ctx.strokeStyle = primaryColor
  ctx.lineWidth = 0.8
  ctx.setLineDash([2, 2])
  ctx.beginPath()
  ctx.moveTo(mmToPx(4), y)
  ctx.lineTo(cardW - mmToPx(4), y)
  ctx.stroke()
  ctx.setLineDash([])
  y += mmToPx(4)

  setFont(ctx, 10, 'bold')
  ctx.fillStyle = primaryColor
  ctx.fillText('当前用药 / Current Meds:', mmToPx(5), y)
  y += mmToPx(5.5)

  const meds = cardData.currentMedications || []
  const maxMeds = Math.min(meds.length, 3)
  setFont(ctx, 9, 'normal')
  ctx.fillStyle = COLORS.textSecondary

  for (let i = 0; i < maxMeds; i++) {
    const med = meds[i]
    const medText = `${i + 1}. ${med.name} ${med.dosage || ''}${med.dosageUnit || ''} ${med.frequency || ''}`.trim()
    const medLines = wrapText(ctx, medText, cardW - mmToPx(28))
    for (const line of medLines) {
      ctx.fillText(line, mmToPx(6), y)
      y += mmToPx(4)
    }
  }

  if (meds.length > 3) {
    setFont(ctx, 9, 'normal')
    ctx.fillStyle = COLORS.textMuted
    ctx.fillText(`...等共 ${meds.length} 种药物`, mmToPx(6), y)
    y += mmToPx(4)
  }

  if (meds.length === 0) {
    setFont(ctx, 9, 'normal')
    ctx.fillStyle = COLORS.textMuted
    ctx.fillText('暂无用药记录', mmToPx(6), y)
  }

  const qrPayload = generateQRCodePayload(memberId)
  const qrSize = mmToPx(18)
  const qrX = cardW - mmToPx(5) - qrSize
  const qrY = cardH - mmToPx(5) - qrSize

  if (qrPayload) {
    const qrImg = await generateQRCodeImage(qrPayload, qrSize)
    if (qrImg) {
      ctx.fillStyle = COLORS.white
      ctx.fillRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2)
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    }
  }

  setFont(ctx, 8, 'normal')
  ctx.fillStyle = COLORS.textMuted
  ctx.fillText(`生成: ${formatDate(new Date().toISOString())}`, mmToPx(5), cardH - mmToPx(5))

  return canvas
}

export async function generateEmergencyCardPDF(memberId) {
  try {
    const canvas = await renderEmergencyCard(memberId)
    if (!canvas) return null

    const cardData = generateEmergencyCardData(memberId)

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [90, 58],
      compress: true
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    doc.addImage(imgData, 'JPEG', 0, 0, 90, 58, undefined, 'FAST')

    const fileName = `急诊卡_${cardData.name}_${formatDate(new Date().toISOString())}.pdf`
    doc.save(fileName)
    return fileName
  } catch (err) {
    console.error('生成急诊卡失败:', err)
    throw err
  }
}
