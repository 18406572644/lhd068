import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { generateQRCodePayload, generateEmergencyCardData } from './healthProfile.js'
import { formatDate } from './helpers.js'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 15
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

async function generateQRCodeDataURL(text, size = 150) {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#FFFFFF'
      }
    })
  } catch {
    return ''
  }
}

function drawHeader(doc, title, subtitle, pageNum, totalPages) {
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, PAGE_WIDTH, 25, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, MARGIN, 12)

  if (subtitle) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, MARGIN, 20)
  }

  doc.setFontSize(8)
  doc.text(`第 ${pageNum} / ${totalPages} 页`, PAGE_WIDTH - MARGIN, 18, { align: 'right' })

  doc.setDrawColor(209, 213, 219)
  doc.line(MARGIN, 32, PAGE_WIDTH - MARGIN, 32)
}

function drawFooter(doc, memberName, pageNum) {
  const y = PAGE_HEIGHT - 12
  doc.setDrawColor(209, 213, 219)
  doc.line(MARGIN, y - 5, PAGE_WIDTH - MARGIN, y - 5)

  doc.setFontSize(7)
  doc.setTextColor(156, 163, 175)
  doc.setFont('helvetica', 'normal')
  doc.text(`家庭健康档案 · ${memberName || ''}`, MARGIN, y)
  doc.text(`生成时间：${formatDate(new Date().toISOString())}`, PAGE_WIDTH - MARGIN, y, { align: 'right' })
}

function drawSectionTitle(doc, title, y, color = '#3B82F6') {
  const [r, g, b] = hexToRgb(color)
  doc.setFillColor(r, g, b)
  doc.rect(MARGIN, y, 4, 8, 'F')

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(title, MARGIN + 7, y + 7)

  return y + 12
}

function drawLabelValueRow(doc, label, value, x, y, maxWidth) {
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(label, x, y)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)

  const valueX = x + 35
  const remainingWidth = maxWidth - 35
  const lines = doc.splitTextToSize(value || '-', remainingWidth)
  doc.text(lines, valueX, y)

  return lines.length * 4.5
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [59, 130, 246]
}

function checkPageBreak(doc, currentY, requiredSpace = 30) {
  if (currentY + requiredSpace > PAGE_HEIGHT - 25) {
    doc.addPage()
    return 38
  }
  return currentY
}

async function drawAdherenceChartCanvas(adherenceData) {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 350
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const padding = { top: 40, right: 40, bottom: 60, left: 60 }
  const chartWidth = canvas.width - padding.left - padding.right
  const chartHeight = canvas.height - padding.top - padding.bottom

  const labels = adherenceData.weekLabels || []
  const data = adherenceData.weeklyData || []

  if (data.length === 0) {
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '16px Helvetica'
    ctx.textAlign = 'center'
    ctx.fillText('暂无足够数据生成图表', canvas.width / 2, canvas.height / 2)
    return canvas.toDataURL('image/png')
  }

  ctx.font = 'bold 18px Helvetica'
  ctx.fillStyle = '#111827'
  ctx.textAlign = 'center'
  ctx.fillText('用药依从性统计图', canvas.width / 2, 25)

  const maxValue = Math.max(...data, 21)
  const yTicks = 5
  const yStep = maxValue / yTicks

  ctx.strokeStyle = '#E5E7EB'
  ctx.lineWidth = 1
  ctx.font = '12px Helvetica'
  ctx.fillStyle = '#6B7280'
  ctx.textAlign = 'right'

  for (let i = 0; i <= yTicks; i++) {
    const y = padding.top + (chartHeight / yTicks) * i
    const value = Math.round(maxValue - yStep * i)
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()
    ctx.fillText(value.toString(), padding.left - 10, y + 4)
  }

  const barWidth = chartWidth / data.length * 0.6
  const barGap = chartWidth / data.length * 0.4

  ctx.font = '11px Helvetica'
  ctx.fillStyle = '#6B7280'
  ctx.textAlign = 'center'

  data.forEach((value, index) => {
    const x = padding.left + (chartWidth / data.length) * index + barGap / 2
    const barHeight = (value / maxValue) * chartHeight
    const y = padding.top + chartHeight - barHeight

    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
    if (adherenceData.level === 'high') {
      gradient.addColorStop(0, '#34D399')
      gradient.addColorStop(1, '#10B981')
    } else if (adherenceData.level === 'medium') {
      gradient.addColorStop(0, '#FBBF24')
      gradient.addColorStop(1, '#F59E0B')
    } else {
      gradient.addColorStop(0, '#F87171')
      gradient.addColorStop(1, '#EF4444')
    }

    ctx.fillStyle = gradient
    roundRect(ctx, x, y, barWidth, barHeight, 4)
    ctx.fill()

    ctx.fillStyle = '#111827'
    ctx.font = 'bold 12px Helvetica'
    ctx.fillText(value.toString(), x + barWidth / 2, y - 8)

    ctx.fillStyle = '#6B7280'
    ctx.font = '11px Helvetica'
    const labelText = labels[index] || ''
    ctx.fillText(labelText, x + barWidth / 2, padding.top + chartHeight + 20)
  })

  ctx.fillStyle = '#6B7280'
  ctx.font = '12px Helvetica'
  ctx.textAlign = 'center'
  ctx.fillText('（按周统计服药次数，基准为每日3次）', canvas.width / 2, canvas.height - 15)

  return canvas.toDataURL('image/png')
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function estimatePages(profile) {
  let pages = 1
  const medsCount = profile.currentMedications?.length || 0
  const recordsCount = profile.medicalRecords?.length || 0
  const warningsCount = profile.safetyAssessment?.warnings?.length || 0

  pages += Math.ceil(Math.max(0, medsCount - 5) / 8)
  pages += Math.ceil(Math.max(0, recordsCount - 2) / 3)
  pages += Math.ceil(Math.max(0, warningsCount - 2) / 5)
  pages += 1

  return Math.max(pages, 3)
}

export async function generateHealthReportPDF(profile, options = {}) {
  if (!profile || !profile.basicInfo) return null

  const { startDate, endDate } = options
  const totalPages = estimatePages(profile)
  let currentPage = 1
  let y = 38

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  })

  const dateRangeText = (startDate && endDate)
    ? `报告周期：${startDate} 至 ${endDate}`
    : '报告周期：全部数据'

  drawHeader(doc, '健康档案报告', `${profile.basicInfo.name} · ${dateRangeText}`, currentPage, totalPages)

  y = drawSectionTitle(doc, '个人信息与过敏禁忌摘要', y, '#EF4444')

  const hasAllergies = profile.basicInfo.allergyLabels?.length > 0
  const hasHighRisk = profile.safetyAssessment?.summary?.highCount > 0
  const bannerColor = hasAllergies || hasHighRisk ? [254, 226, 226] : [220, 252, 231]
  const bannerText = hasAllergies || hasHighRisk
    ? '⚠ 重要：存在过敏史或高风险用药，就医时请务必告知医生！'
    : '✓ 暂无特殊过敏禁忌'

  doc.setFillColor(...bannerColor)
  doc.rect(MARGIN, y, CONTENT_WIDTH, 12, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(hasAllergies || hasHighRisk ? 185 : 22, 28 + (hasAllergies || hasHighRisk ? 0 : 160), hasAllergies || hasHighRisk ? 28 : 136)
  doc.text(bannerText, MARGIN + CONTENT_WIDTH / 2, y + 7.5, { align: 'center' })
  y += 18

  const colWidth = (CONTENT_WIDTH - 10) / 2
  const leftX = MARGIN
  const rightX = MARGIN + colWidth + 10

  y += drawLabelValueRow(doc, '姓名：', profile.basicInfo.name, leftX, y, colWidth)
  y += drawLabelValueRow(doc, '关系：', profile.basicInfo.relation, rightX, y, colWidth)
  y += 1

  y += drawLabelValueRow(doc, '年龄：', profile.basicInfo.ageText || '-', leftX, y, colWidth)
  y += drawLabelValueRow(doc, '出生日期：', profile.basicInfo.birthDate || '-', rightX, y, colWidth)
  y += 1

  y += drawLabelValueRow(doc, '体重：', profile.basicInfo.weight ? `${profile.basicInfo.weight} kg` : '-', leftX, y, colWidth)
  y += drawLabelValueRow(doc, '报告时间：', formatDate(new Date().toISOString()), rightX, y, colWidth)
  y += 4

  y = drawSectionTitle(doc, '过敏史与禁忌', y + 4, '#EF4444')
  const allergyText = profile.basicInfo.allergyLabels?.length > 0
    ? profile.basicInfo.allergyLabels.join('、')
    : '无已知过敏史'
  doc.setFontSize(10)
  doc.setFont('helvetica', profile.basicInfo.allergyLabels?.length > 0 ? 'bold' : 'normal')
  doc.setTextColor(profile.basicInfo.allergyLabels?.length > 0 ? 239 : 107, 68, profile.basicInfo.allergyLabels?.length > 0 ? 68 : 128)
  const allergyLines = doc.splitTextToSize(allergyText, CONTENT_WIDTH)
  doc.text(allergyLines, MARGIN, y)
  y += allergyLines.length * 5 + 6

  y = checkPageBreak(doc, y, 60)
  if (y === 38) {
    currentPage++
    drawHeader(doc, '健康档案报告', `${profile.basicInfo.name} · ${dateRangeText}`, currentPage, totalPages)
  }

  y = drawSectionTitle(doc, '慢性病史', y, '#F59E0B')
  const chronicText = profile.basicInfo.chronicLabels?.length > 0
    ? profile.basicInfo.chronicLabels.join('、')
    : '无慢性病记录'
  doc.setFontSize(10)
  doc.setFont('helvetica', profile.basicInfo.chronicLabels?.length > 0 ? 'bold' : 'normal')
  doc.setTextColor(profile.basicInfo.chronicLabels?.length > 0 ? 217 : 107, 119, profile.basicInfo.chronicLabels?.length > 0 ? 6 : 128)
  const chronicLines = doc.splitTextToSize(chronicText, CONTENT_WIDTH)
  doc.text(chronicLines, MARGIN, y)
  y += chronicLines.length * 5 + 6

  y = drawSectionTitle(doc, '肝肾功能状态', y, '#10B981')
  const organInfo = [
    ['肝功能', profile.basicInfo.liverFunctionLabel || '正常', profile.basicInfo.liverFunction === 'normal'],
    ['肾功能', profile.basicInfo.kidneyFunctionLabel || '正常', profile.basicInfo.kidneyFunction === 'normal']
  ]
  for (const [label, value, isNormal] of organInfo) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(`${label}：`, MARGIN, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(isNormal ? 16 : 239, 185, isNormal ? 129 : 68)
    doc.text(value, MARGIN + 22, y)
    y += 6
  }
  y += 4

  y = checkPageBreak(doc, y, 80)
  if (y === 38) {
    currentPage++
    drawHeader(doc, '健康档案报告', `${profile.basicInfo.name} · ${dateRangeText}`, currentPage, totalPages)
  }

  y = drawSectionTitle(doc, '当前用药清单', y, '#3B82F6')

  if (profile.currentMedications?.length > 0) {
    const tableTop = y
    const headers = ['药品名称', '剂量', '频次', '类型']
    const colWidths = [75, 30, 40, 30]
    const rowHeight = 10

    doc.setFillColor(243, 244, 246)
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(55, 65, 81)

    let hx = MARGIN + 3
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], hx, y + 7)
      hx += colWidths[i]
    }
    y += rowHeight

    for (let i = 0; i < profile.currentMedications.length; i++) {
      const med = profile.currentMedications[i]

      y = checkPageBreak(doc, y, rowHeight + 10)
      if (y === 38) {
        currentPage++
        drawHeader(doc, '健康档案报告', `${profile.basicInfo.name} · ${dateRangeText}`, currentPage, totalPages)
        doc.setFillColor(243, 244, 246)
        doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(55, 65, 81)
        let rhx = MARGIN + 3
        for (let hi = 0; hi < headers.length; hi++) {
          doc.text(headers[hi], rhx, y + 7)
          rhx += colWidths[hi]
        }
        y += rowHeight
      }

      if (i % 2 === 1) {
        doc.setFillColor(249, 250, 251)
        doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, 'F')
      }

      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(31, 41, 55)

      let rx = MARGIN + 3
      const dosageText = `${med.dosage || '-'}${med.dosageUnit || ''}`
      const typeText = med.isLongTerm ? '长期用药' : (med.duration || '短期')
      const values = [med.name, dosageText, med.frequency || '-', typeText]

      for (let vi = 0; vi < values.length; vi++) {
        const maxChars = Math.floor(colWidths[vi] / 2.2)
        const displayText = values[vi]?.length > maxChars
          ? values[vi].slice(0, maxChars - 1) + '…'
          : (values[vi] || '-')
        doc.text(displayText, rx, y + 7)
        rx += colWidths[vi]
      }

      y += rowHeight
    }
  } else {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(156, 163, 175)
    doc.text('暂无当前用药记录', MARGIN, y + 5)
    y += 15
  }

  y += 8

  y = checkPageBreak(doc, y, 100)
  if (y === 38) {
    currentPage++
    drawHeader(doc, '健康档案报告', `${profile.basicInfo.name} · ${dateRangeText}`, currentPage, totalPages)
  }

  y = drawSectionTitle(doc, '近期就诊记录', y, '#8B5CF6')

  if (profile.medicalRecords?.length > 0) {
    for (let i = 0; i < profile.medicalRecords.length; i++) {
      const record = profile.medicalRecords[i]

      y = checkPageBreak(doc, y, 55)
      if (y === 38) {
        currentPage++
        drawHeader(doc, '健康档案报告', `${profile.basicInfo.name} · ${dateRangeText}`, currentPage, totalPages)
      }

      doc.setFillColor(245, 243, 255)
      doc.rect(MARGIN, y, CONTENT_WIDTH, 2, 'F')
      y += 5

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(139, 92, 246)
      doc.text(`${record.visitDate || '-'}  ${record.hospital || '-'}  ${record.department || ''}`, MARGIN, y)
      y += 6

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(9)
      doc.text(`诊断：${record.diagnosis || '-'}`, MARGIN, y)
      y += 5

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(75, 85, 99)
      const ccLines = doc.splitTextToSize(`主诉：${record.chiefComplaint || '-'}`, CONTENT_WIDTH)
      doc.text(ccLines, MARGIN, y)
      y += ccLines.length * 4.5

      if (record.prescribedMedicines?.length > 0) {
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(59, 130, 246)
        doc.text('处方用药：', MARGIN, y)
        y += 4.5

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(75, 85, 99)
        const medTexts = record.prescribedMedicines.map((pm, idx) =>
          `${idx + 1}. ${pm.medicineName} ${pm.dosage || ''}${pm.dosageUnit || ''} ${pm.frequency || ''} ${pm.duration || ''}`.trim()
        )
        const medLines = doc.splitTextToSize(medTexts.join('  '), CONTENT_WIDTH)
        doc.text(medLines, MARGIN + 2, y)
        y += medLines.length * 4.5
      }

      if (record.notes) {
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(107, 114, 128)
        const noteLines = doc.splitTextToSize(`医嘱：${record.notes}`, CONTENT_WIDTH)
        doc.text(noteLines, MARGIN, y)
        y += noteLines.length * 4.5
      }

      y += 5
    }
  } else {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(156, 163, 175)
    doc.text('暂无就诊记录', MARGIN, y + 5)
    y += 15
  }

  y = checkPageBreak(doc, y, 75)
  if (y === 38) {
    currentPage++
    drawHeader(doc, '健康档案报告', `${profile.basicInfo.name} · ${dateRangeText}`, currentPage, totalPages)
  }

  y = drawSectionTitle(doc, '用药依从性统计', y, '#06B6D4')

  const adherence = profile.adherence || {}
  const stats = [
    ['统计天数', `${adherence.totalDays || 0} 天`],
    ['预期服药次数', adherence.totalExpectedDoses || 0],
    ['实际服药次数', adherence.totalActualDoses || 0],
    ['有服药记录的天数', `${adherence.daysWithDosing || 0} 天`]
  ]

  const boxWidth = (CONTENT_WIDTH - 15) / 4
  for (let i = 0; i < stats.length; i++) {
    const bx = MARGIN + i * (boxWidth + 5)
    doc.setFillColor(248, 250, 252)
    doc.rect(bx, y, boxWidth, 18, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(stats[i][0], bx + boxWidth / 2, y + 7, { align: 'center' })
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(6, 182, 212)
    doc.text(String(stats[i][1]), bx + boxWidth / 2, y + 15, { align: 'center' })
  }
  y += 26

  const rate = adherence.adherenceRate || 0
  const [rr, rg, rb] = hexToRgb(adherence.levelColor || '#EF4444')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(`依从性评分：`, MARGIN, y)
  doc.setTextColor(rr, rg, rb)
  doc.setFontSize(20)
  doc.text(`${rate}%`, MARGIN + 30, y + 3)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`· ${adherence.levelText || ''}`, MARGIN + 55, y + 3)
  y += 15

  y = checkPageBreak(doc, y, 55)
  if (y === 38) {
    currentPage++
    drawHeader(doc, '健康档案报告', `${profile.basicInfo.name} · ${dateRangeText}`, currentPage, totalPages)
  }

  try {
    const chartDataURL = await drawAdherenceChartCanvas(adherence)
    if (chartDataURL) {
      const imgW = CONTENT_WIDTH
      const imgH = 70
      doc.addImage(chartDataURL, 'PNG', MARGIN, y, imgW, imgH)
      y += imgH + 10
    }
  } catch {
    y += 20
  }

  y = checkPageBreak(doc, y, 80)
  if (y === 38) {
    currentPage++
    drawHeader(doc, '健康档案报告', `${profile.basicInfo.name} · ${dateRangeText}`, currentPage, totalPages)
  }

  y = drawSectionTitle(doc, '药物安全评估摘要', y, '#F43F5E')

  const safety = profile.safetyAssessment?.summary
  if (safety) {
    const [sr, sg, sb] = hexToRgb(safety.overallRiskColor || '#10B981')
    doc.setFillColor(sr, sg, sb, 0.12)
    doc.setDrawColor(sr, sg, sb)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 16, 2, 2, 'FD')

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(sr, sg, sb)
    doc.text(`综合风险等级：${safety.overallRiskText}`, MARGIN + 8, y + 7)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const descLines = doc.splitTextToSize(safety.overallRiskDesc || '', CONTENT_WIDTH - 16)
    doc.text(descLines, MARGIN + 8, y + 13)
    y += 16 + descLines.length * 4.5 + 4
  }

  const riskBoxWidth = (CONTENT_WIDTH - 20) / 5
  const riskItems = [
    ['高风险', safety?.highCount || 0, '#EF4444'],
    ['中风险', safety?.mediumCount || 0, '#F59E0B'],
    ['低风险', safety?.lowCount || 0, '#3B82F6'],
    ['过敏项', safety?.allergyRisk || 0, '#EC4899'],
    ['慢性病', safety?.chronicCount || 0, '#8B5CF6']
  ]

  for (let i = 0; i < riskItems.length; i++) {
    const [label, count, color] = riskItems[i]
    const rx = MARGIN + i * (riskBoxWidth + 5)
    const [ir, ig, ib] = hexToRgb(color)

    doc.setFillColor(ir, ig, ib, 0.1)
    doc.rect(rx, y, riskBoxWidth, 16, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(label, rx + riskBoxWidth / 2, y + 6.5, { align: 'center' })
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(ir, ig, ib)
    doc.text(String(count), rx + riskBoxWidth / 2, y + 14, { align: 'center' })
  }
  y += 24

  if (profile.safetyAssessment?.warnings?.length > 0) {
    y += 4
    y = checkPageBreak(doc, y, 40)
    if (y === 38) {
      currentPage++
      drawHeader(doc, '健康档案报告', `${profile.basicInfo.name} · ${dateRangeText}`, currentPage, totalPages)
    }

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(55, 65, 81)
    doc.text('风险明细：', MARGIN, y)
    y += 7

    const warnings = profile.safetyAssessment.warnings.slice(0, 10)
    for (const w of warnings) {
      y = checkPageBreak(doc, y, 16)
      if (y === 38) {
        currentPage++
        drawHeader(doc, '健康档案报告', `${profile.basicInfo.name} · ${dateRangeText}`, currentPage, totalPages)
      }

      const levelColor = w.level === 'high' ? '#EF4444' : (w.level === 'medium' ? '#F59E0B' : '#3B82F6')
      const [lwR, lwG, lwB] = hexToRgb(levelColor)
      doc.setFillColor(lwR, lwG, lwB, 0.08)
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 14, 2, 2, 'F')

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(lwR, lwG, lwB)
      const levelLabel = w.level === 'high' ? '高' : (w.level === 'medium' ? '中' : '低')
      doc.text(`[${levelLabel}风险] ${w.medicine} - ${w.title}`, MARGIN + 4, y + 5.5)
      y += 7
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(75, 85, 99)
      const descMaxWidth = CONTENT_WIDTH - 8
      const descLines = doc.splitTextToSize(w.description || '', descMaxWidth)
      doc.text(descLines, MARGIN + 4, y)
      y += descLines.length * 4.2 + 4
    }
  }

  y = checkPageBreak(doc, y, 50)
  if (y === 38) {
    currentPage++
    drawHeader(doc, '健康档案报告', `${profile.basicInfo.name} · ${dateRangeText}`, currentPage, totalPages)
  }

  y = drawSectionTitle(doc, '扫码查看电子档案', y, '#3B82F6')
  const qrPayload = generateQRCodePayload(profile.basicInfo.id)
  const qrDataURL = qrPayload ? await generateQRCodeDataURL(qrPayload, 200) : ''

  if (qrDataURL) {
    const qrSize = 45
    const qrX = MARGIN
    const qrY = y

    doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    const qrTextX = qrX + qrSize + 8
    const qrTextWidth = CONTENT_WIDTH - qrSize - 8
    const qrLines = doc.splitTextToSize(
      '医生或急救人员可使用手机扫描左侧二维码，快速获取患者的关键健康信息（过敏史、禁忌、当前用药等）。建议将此页打印随身携带或存入手机相册。',
      qrTextWidth
    )
    doc.text(qrLines, qrTextX, y + 10)

    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(`二维码生成时间：${formatDate(new Date().toISOString())}`, qrTextX, y + qrSize - 3)
  }

  drawFooter(doc, profile.basicInfo.name, currentPage)

  const fileName = `健康档案_${profile.basicInfo.name}_${formatDate(new Date().toISOString())}.pdf`
  doc.save(fileName)
  return fileName
}

export async function generateEmergencyCardPDF(memberId) {
  const cardData = generateEmergencyCardData(memberId)
  if (!cardData) return null

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [90, 58],
    compress: true
  })

  const W = 90
  const H = 58
  const M = 4
  const [cr, cg, cb] = hexToRgb(cardData.color || '#3B82F6')

  doc.setFillColor(cr, cg, cb)
  doc.rect(0, 0, W, H, 'F')

  doc.setFillColor(255, 255, 255)
  doc.rect(M, M, W - M * 2, H - M * 2, 'F')

  doc.setFillColor(cr, cg, cb)
  doc.rect(M, M, W - M * 2, 9, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('急诊医疗信息卡 / EMERGENCY CARD', W / 2, M + 6, { align: 'center' })

  let y = M + 14

  doc.setTextColor(17, 24, 39)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(cardData.name, M + 3, y)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`${cardData.relation || ''}  ${cardData.ageText || ''}`, M + 32, y)

  if (cardData.birthDate) {
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)
    doc.text(`生日: ${cardData.birthDate}`, M + 3, y + 4)
  }
  if (cardData.weight) {
    doc.text(`体重: ${cardData.weight}kg`, M + 32, y + 4)
  }

  y += 10

  const hasAllergies = cardData.allergies?.length > 0
  if (hasAllergies) {
    doc.setFillColor(254, 226, 226)
    doc.rect(M + 2, y - 3, W - M * 2 - 4, 9, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(185, 28, 28)
    const allergyLabel = '⚠ 过敏：' + (cardData.allergies.join('、') || '无')
    const allergyLines = doc.splitTextToSize(allergyLabel, W - M * 2 - 8)
    doc.text(allergyLines, M + 4, y + 2)
    y += allergyLines.length * 4 + 2
  } else {
    doc.setFillColor(220, 252, 231)
    doc.rect(M + 2, y - 3, W - M * 2 - 4, 8, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 163, 74)
    doc.text('✓ 无已知过敏史', M + 4, y + 2)
    y += 6
  }

  if (cardData.chronicDiseases?.length > 0) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(180, 83, 9)
    doc.text(`慢病：${cardData.chronicDiseases.join('、')}`, M + 3, y + 2)
    y += 5
  }

  if (cardData.liverFunction !== '正常' || cardData.kidneyFunction !== '正常') {
    doc.setFontSize(6.5)
    doc.setTextColor(107, 114, 128)
    const organText = []
    if (cardData.liverFunction !== '正常') organText.push(`肝功:${cardData.liverFunction}`)
    if (cardData.kidneyFunction !== '正常') organText.push(`肾功:${cardData.kidneyFunction}`)
    doc.text(organText.join('  '), M + 3, y + 2)
    y += 5
  }

  y += 1
  doc.setDrawColor(cr, cg, cb)
  doc.setLineDashPattern([1, 1], 0)
  doc.line(M + 2, y, W - M - 2, y)
  doc.setLineDashPattern([], 0)
  y += 3

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(cr, cg, cb)
  doc.text('当前用药 / Current Meds:', M + 3, y)
  y += 4

  const meds = cardData.currentMedications || []
  const maxMeds = Math.min(meds.length, 3)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(55, 65, 81)

  for (let i = 0; i < maxMeds; i++) {
    const med = meds[i]
    const medText = `${i + 1}. ${med.name} ${med.dosage || ''}${med.dosageUnit || ''} ${med.frequency || ''}`.trim()
    const medLines = doc.splitTextToSize(medText, W - M * 2 - 6)
    doc.text(medLines, M + 5, y)
    y += medLines.length * 3
  }

  if (meds.length > 3) {
    doc.setFontSize(6)
    doc.setTextColor(156, 163, 175)
    doc.text(`...等共 ${meds.length} 种药物`, M + 5, y)
    y += 3
  }

  if (meds.length === 0) {
    doc.setFontSize(6)
    doc.setTextColor(156, 163, 175)
    doc.text('暂无用药记录', M + 5, y)
  }

  const qrPayload = generateQRCodePayload(memberId)
  const qrDataURL = qrPayload ? await generateQRCodeDataURL(qrPayload, 100) : ''
  if (qrDataURL) {
    const qrSize = 18
    const qrX = W - M - qrSize - 1
    const qrY = H - M - qrSize - 1

    doc.setFillColor(255, 255, 255)
    doc.rect(qrX - 0.5, qrY - 0.5, qrSize + 1, qrSize + 1, 'F')
    doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize)
  }

  doc.setFontSize(5.5)
  doc.setTextColor(156, 163, 175)
  doc.text(`生成: ${formatDate(new Date().toISOString())}`, M + 3, H - M - 1)

  const fileName = `急诊卡_${cardData.name}_${formatDate(new Date().toISOString())}.pdf`
  doc.save(fileName)
  return fileName
}
