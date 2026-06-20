import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { formatDate } from './helpers.js'
import { generateQRCodePayload, generateEmergencyCardData } from './healthProfile.js'
import QRCode from 'qrcode'

const A4_WIDTH = 210
const A4_HEIGHT = 297
const DPI = 2
const PIXEL_WIDTH = A4_WIDTH * DPI * 3.78
const PIXEL_HEIGHT = A4_HEIGHT * DPI * 3.78

async function generateQRCodeDataURL(text, size = 300) {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: { dark: '#111827', light: '#FFFFFF' }
    })
  } catch {
    return ''
  }
}

function buildReportHTML(profile, options) {
  const { startDate, endDate } = options
  const basic = profile.basicInfo
  const hasAllergies = basic.allergyLabels?.length > 0
  const hasHighRisk = profile.safetyAssessment?.summary?.highCount > 0
  const dateRange = (startDate && endDate) ? `${startDate} 至 ${endDate}` : '全部数据'
  const qrPayload = generateQRCodePayload(basic.id)

  const safety = profile.safetyAssessment?.summary || {}
  const riskColor = safety.overallRiskColor || '#10B981'
  const riskText = safety.overallRiskText || '低风险'
  const riskDesc = safety.overallRiskDesc || ''

  const medsHTML = (profile.currentMedications || []).map((m, i) => `
    <tr style="${i % 2 === 1 ? 'background: #F9FAFB;' : ''}">
      <td style="padding: 10px 12px; font-size: 13px; color: #1F2937; font-weight: 500; border-bottom: 1px solid #F3F4F6;">
        ${m.name || '-'}
        ${m.usage ? `<div style="font-size: 11px; color: #9CA3AF; margin-top: 4px; font-weight: 400;">${m.usage}</div>` : ''}
      </td>
      <td style="padding: 10px 12px; font-size: 13px; color: #6B7280; border-bottom: 1px solid #F3F4F6;">
        ${m.dosage || '-'}${m.dosageUnit || ''}
      </td>
      <td style="padding: 10px 12px; font-size: 13px; color: #6B7280; border-bottom: 1px solid #F3F4F6;">
        ${m.frequency || '-'}
      </td>
      <td style="padding: 10px 12px; font-size: 13px; color: #6B7280; border-bottom: 1px solid #F3F4F6;">
        ${m.specification || '-'}
      </td>
      <td style="padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #F3F4F6;">
        ${m.isLongTerm
          ? '<span style="padding: 2px 8px; border-radius: 6px; background: #EFF6FF; color: #3B82F6; font-size: 12px; font-weight: 500;">长期用药</span>'
          : m.duration
            ? `<span style="padding: 2px 8px; border-radius: 6px; background: #F5F3FF; color: #8B5CF6; font-size: 12px; font-weight: 500;">${m.duration}</span>`
            : '<span style="padding: 2px 8px; border-radius: 6px; background: #F3F4F6; color: #6B7280; font-size: 12px;">短期</span>'}
      </td>
    </tr>
  `).join('')

  const recordsHTML = (profile.medicalRecords || []).slice(0, 10).map(r => `
    <div style="margin-bottom: 16px; padding: 14px; background: #FAFAFF; border: 1px solid #EDE9FE; border-radius: 12px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
        <span style="font-size: 14px; font-weight: 600; color: #7C3AED;">${r.visitDate || '-'}</span>
        <span style="font-size: 12px; color: #9CA3AF;">${r.hospital || ''} ${r.department ? '· ' + r.department : ''}</span>
      </div>
      <div style="font-size: 13px; font-weight: 500; color: #111827; margin-bottom: 4px;">诊断：${r.diagnosis || '-'}</div>
      ${r.chiefComplaint ? `<div style="font-size: 12px; color: #6B7280; margin-bottom: 6px;">主诉：${r.chiefComplaint}</div>` : ''}
      ${r.prescribedMedicines?.length > 0 ? `
        <div style="font-size: 12px; color: #6B7280;">
          <span style="font-weight: 500; color: #3B82F6;">处方用药：</span>
          ${r.prescribedMedicines.map((pm, i) =>
            `${i + 1}. ${pm.medicineName} ${pm.dosage || ''}${pm.dosageUnit || ''} ${pm.frequency || ''} ${pm.duration || ''}`
          ).join('  ')}
        </div>
      ` : ''}
      ${r.notes ? `<div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">医嘱：${r.notes}</div>` : ''}
    </div>
  `).join('')

  const warningsHTML = (profile.safetyAssessment?.warnings || []).slice(0, 10).map(w => {
    const bg = w.level === 'high' ? '#FEF2F2' : w.level === 'medium' ? '#FFFBEB' : '#EFF6FF'
    const border = w.level === 'high' ? '#FECACA' : w.level === 'medium' ? '#FDE68A' : '#BFDBFE'
    const color = w.level === 'high' ? '#DC2626' : w.level === 'medium' ? '#D97706' : '#2563EB'
    const label = w.level === 'high' ? '高风险' : w.level === 'medium' ? '中风险' : '低风险'
    const typeMap = { allergy: '过敏冲突', disease: '慢病禁忌', organ: '器官禁忌', dosage: '剂量提示', interaction: '药物相互作用' }
    const typeLabel = typeMap[w.type] || w.type
    return `
      <div style="padding: 10px 12px; margin-bottom: 8px; background: ${bg}; border: 1px solid ${border}; border-radius: 10px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
          <span style="padding: 1px 8px; border-radius: 999px; background: white; font-size: 11px; font-weight: 600; color: ${color};">${label}</span>
          <span style="padding: 1px 8px; border-radius: 999px; background: rgba(255,255,255,0.6); font-size: 11px; color: #4B5563;">${typeLabel}</span>
          <span style="font-size: 12px; font-weight: 600; color: #111827;">${w.medicine} · ${w.title}</span>
        </div>
        <div style="font-size: 12px; color: #4B5563;">${w.description}</div>
      </div>
    `
  }).join('')

  const html = `
    <div id="health-report" style="width: ${PIXEL_WIDTH}px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #FFFFFF; color: #111827; box-sizing: border-box; padding: 40px 50px;">
      <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; margin: -40px -50px 32px; padding: 48px 50px 36px;">
        <h1 style="font-size: 32px; font-weight: 700; margin: 0 0 6px;">健康档案报告</h1>
        <p style="font-size: 16px; margin: 0; opacity: 0.9;">${basic.name} · 报告周期：${dateRange}</p>
      </div>

      <div style="background: ${hasAllergies || hasHighRisk ? '#FEF2F2' : '#ECFDF5'}; border: 2px solid ${hasAllergies || hasHighRisk ? '#FECACA' : '#A7F3D0'}; border-radius: 16px; padding: 18px 24px; margin-bottom: 32px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 28px;">${hasAllergies || hasHighRisk ? '⚠️' : '✅'}</span>
          <div>
            <div style="font-size: 18px; font-weight: 700; color: ${hasAllergies || hasHighRisk ? '#DC2626' : '#059669'};">
              ${hasAllergies || hasHighRisk ? '重要提醒：存在过敏史或高风险用药，就医时请务必告知医生！' : '暂无特殊过敏禁忌，整体状况良好'}
            </div>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 16px; padding-left: 10px; border-left: 4px solid #3B82F6;">个人基本信息</h2>
          <div style="display: flex; align-items: center; gap: 18px; margin-bottom: 16px;">
            <div style="width: 68px; height: 68px; border-radius: 16px; background: ${basic.color}20; display: flex; align-items: center; justify-content: center; font-size: 36px;">
              ${basic.avatar || '👤'}
            </div>
            <div>
              <div style="font-size: 22px; font-weight: 700; color: #111827;">${basic.name}</div>
              <div style="font-size: 14px; color: #6B7280; margin-top: 2px;">${basic.relation || ''} · ${basic.ageText || ''}</div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px;">
            <div><span style="color: #9CA3AF; font-size: 13px;">出生日期</span><div style="font-size: 14px; font-weight: 500; color: #374151;">${basic.birthDate || '-'}</div></div>
            <div><span style="color: #9CA3AF; font-size: 13px;">体重</span><div style="font-size: 14px; font-weight: 500; color: #374151;">${basic.weight ? basic.weight + ' kg' : '-'}</div></div>
            <div><span style="color: #9CA3AF; font-size: 13px;">报告时间</span><div style="font-size: 14px; font-weight: 500; color: #374151;">${formatDate(new Date().toISOString())}</div></div>
            <div><span style="color: #9CA3AF; font-size: 13px;">用药种数</span><div style="font-size: 14px; font-weight: 500; color: #374151;">${profile.currentMedications?.length || 0} 种</div></div>
          </div>
        </div>

        <div>
          <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 16px; padding-left: 10px; border-left: 4px solid #EF4444;">过敏史与禁忌</h2>
          <div style="font-size: 15px; font-weight: ${hasAllergies ? '600' : '400'}; color: ${hasAllergies ? '#DC2626' : '#6B7280'}; line-height: 1.7;">
            ${hasAllergies ? basic.allergyLabels.join('、') : '无已知过敏史'}
          </div>

          <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 24px 0 16px; padding-left: 10px; border-left: 4px solid #F59E0B;">慢性病史</h2>
          <div style="font-size: 15px; color: ${basic.chronicLabels?.length > 0 ? '#D97706' : '#6B7280'}; font-weight: ${basic.chronicLabels?.length > 0 ? '600' : '400'};">
            ${basic.chronicLabels?.length > 0 ? basic.chronicLabels.join('、') : '无慢性病记录'}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px;">
            <div style="padding: 12px; background: ${basic.liverFunction === 'normal' ? '#ECFDF5' : '#FEF2F2'}; border-radius: 10px;">
              <div style="font-size: 12px; color: #9CA3AF;">肝功能</div>
              <div style="font-size: 16px; font-weight: 700; color: ${basic.liverFunction === 'normal' ? '#059669' : '#DC2626'}; margin-top: 2px;">${basic.liverFunctionLabel || '正常'}</div>
            </div>
            <div style="padding: 12px; background: ${basic.kidneyFunction === 'normal' ? '#ECFDF5' : '#FEF2F2'}; border-radius: 10px;">
              <div style="font-size: 12px; color: #9CA3AF;">肾功能</div>
              <div style="font-size: 16px; font-weight: 700; color: ${basic.kidneyFunction === 'normal' ? '#059669' : '#DC2626'}; margin-top: 2px;">${basic.kidneyFunctionLabel || '正常'}</div>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 32px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 16px; padding-left: 10px; border-left: 4px solid #3B82F6;">当前用药清单</h2>
        <div style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #F3F4F6;">
                <th style="text-align: left; padding: 10px 12px; font-size: 13px; font-weight: 600; color: #374151;">药品名称</th>
                <th style="text-align: left; padding: 10px 12px; font-size: 13px; font-weight: 600; color: #374151;">剂量</th>
                <th style="text-align: left; padding: 10px 12px; font-size: 13px; font-weight: 600; color: #374151;">频次</th>
                <th style="text-align: left; padding: 10px 12px; font-size: 13px; font-weight: 600; color: #374151;">规格</th>
                <th style="text-align: left; padding: 10px 12px; font-size: 13px; font-weight: 600; color: #374151;">类型</th>
              </tr>
            </thead>
            <tbody>
              ${medsHTML || '<tr><td colspan="5" style="padding: 24px; text-align: center; color: #9CA3AF; font-size: 13px;">暂无用药记录</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div style="margin-bottom: 32px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 16px; padding-left: 10px; border-left: 4px solid #8B5CF6;">近期就诊记录</h2>
        ${recordsHTML || '<div style="padding: 24px; text-align: center; color: #9CA3AF; font-size: 14px; background: #F9FAFB; border-radius: 12px;">暂无就诊记录</div>'}
      </div>

      <div style="margin-bottom: 32px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 16px; padding-left: 10px; border-left: 4px solid #06B6D4;">用药依从性统计</h2>
        ${buildAdherenceChartHTML(profile.adherence || {})}
      </div>

      <div style="margin-bottom: 32px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 16px; padding-left: 10px; border-left: 4px solid #F43F5E;">药物安全评估摘要</h2>
        <div style="background: ${riskColor}15; border: 1.5px solid ${riskColor}50; border-radius: 14px; padding: 18px 22px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div style="font-size: 16px; font-weight: 700; color: ${riskColor};">综合风险等级：${riskText}</div>
          </div>
          <div style="font-size: 13px; color: #4B5563; margin-top: 6px;">${riskDesc}</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
          <div style="text-align: center; padding: 14px 8px; background: #FEF2F2; border-radius: 10px;">
            <div style="font-size: 24px; font-weight: 700; color: #EF4444;">${safety.highCount || 0}</div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">高风险</div>
          </div>
          <div style="text-align: center; padding: 14px 8px; background: #FFFBEB; border-radius: 10px;">
            <div style="font-size: 24px; font-weight: 700; color: #F59E0B;">${safety.mediumCount || 0}</div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">中风险</div>
          </div>
          <div style="text-align: center; padding: 14px 8px; background: #EFF6FF; border-radius: 10px;">
            <div style="font-size: 24px; font-weight: 700; color: #3B82F6;">${safety.lowCount || 0}</div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">低风险</div>
          </div>
          <div style="text-align: center; padding: 14px 8px; background: #FDF2F8; border-radius: 10px;">
            <div style="font-size: 24px; font-weight: 700; color: #EC4899;">${safety.allergyRisk || 0}</div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">过敏项</div>
          </div>
          <div style="text-align: center; padding: 14px 8px; background: #F5F3FF; border-radius: 10px;">
            <div style="font-size: 24px; font-weight: 700; color: #8B5CF6;">${safety.chronicCount || 0}</div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">慢性病</div>
          </div>
        </div>

        ${warningsHTML ? `
          <div style="margin-top: 16px;">
            <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 10px;">风险明细</div>
            ${warningsHTML}
          </div>
        ` : ''}
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 16px; padding-left: 10px; border-left: 4px solid #3B82F6;">扫码查看电子档案</h2>
        <div style="display: flex; align-items: flex-start; gap: 24px; padding: 20px; background: #F9FAFB; border-radius: 14px;">
          <div style="width: 120px; height: 120px; background: white; border: 2px solid #E5E7EB; border-radius: 10px; padding: 8px; flex-shrink: 0;">
            ${qrPayload ? `<img id="report-qr" src="" alt="二维码" style="width: 100%; height: 100%; object-fit: contain; display: none;" />` : ''}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px;">使用说明</div>
            <div style="font-size: 13px; color: #6B7280; line-height: 1.7;">
              医生或急救人员可使用手机扫描左侧二维码，快速获取患者的关键健康信息（过敏史、禁忌、当前用药等）。<br>
              建议将此页打印随身携带或存入手机相册。
            </div>
            <div style="font-size: 11px; color: #9CA3AF; margin-top: 10px;">二维码生成时间：${formatDate(new Date().toISOString())}</div>
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid #E5E7EB; padding-top: 12px; font-size: 11px; color: #9CA3AF; display: flex; justify-content: space-between;">
        <span>家庭健康档案 · ${basic.name}</span>
        <span>生成时间：${formatDate(new Date().toISOString())}</span>
      </div>
    </div>
  `

  return { html, qrPayload }
}

function buildAdherenceChartHTML(adherence) {
  const labels = adherence.weekLabels || []
  const data = adherence.weeklyData || []
  const maxVal = Math.max(...data, 21)
  const rate = adherence.adherenceRate || 0
  const levelColor = adherence.levelColor || '#EF4444'
  const levelText = adherence.levelText || '需要改善'

  if (data.length === 0) {
    return `<div style="padding: 40px; text-align: center; color: #9CA3AF; font-size: 14px; background: #F9FAFB; border-radius: 12px;">暂无足够数据生成图表</div>`
  }

  const barWidth = 100 / data.length * 0.6
  const barGap = 100 / data.length * 0.2

  const bars = data.map((v, i) => {
    const h = (v / maxVal) * 180
    const left = i * (100 / data.length) + barGap
    return `
      <div style="position: absolute; bottom: 30px; left: ${left}%; width: ${barWidth}%; height: ${h}px;
        background: linear-gradient(to top, ${levelColor}, ${levelColor}CC);
        border-radius: 6px 6px 0 0;">
        <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
          font-size: 12px; font-weight: 600; color: #374151;">${v}</div>
      </div>
      <div style="position: absolute; bottom: 6px; left: ${left - barGap * 0.5}%; width: ${barWidth + barGap}%;
        text-align: center; font-size: 10px; color: #9CA3AF;">${labels[i] || ''}</div>
    `
  }).join('')

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(p => {
    const y = p * 180 + 30
    const val = Math.round(maxVal * (1 - p))
    return `
      <div style="position: absolute; left: 0; right: 0; top: ${y}px; border-top: 1px dashed #E5E7EB;">
        <span style="position: absolute; left: -34px; top: -8px; font-size: 11px; color: #9CA3AF; width: 30px; text-align: right;">${val}</span>
      </div>
    `
  }).join('')

  return `
    <div style="display: flex; gap: 24px; align-items: flex-start;">
      <div style="flex-shrink: 0; width: 130px;">
        <div style="text-align: center; padding: 18px; background: #F0FDFA; border-radius: 14px;">
          <div style="font-size: 12px; color: #6B7280;">依从性评分</div>
          <div style="font-size: 36px; font-weight: 700; color: ${levelColor}; margin-top: 4px;">${rate}%</div>
          <div style="font-size: 13px; font-weight: 600; color: ${levelColor}; margin-top: 4px;">${levelText}</div>
        </div>
        <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div style="text-align: center; padding: 10px 6px; background: #F9FAFB; border-radius: 8px;">
            <div style="font-size: 16px; font-weight: 600; color: #374151;">${adherence.totalDays || 0}</div>
            <div style="font-size: 10px; color: #9CA3AF;">统计天数</div>
          </div>
          <div style="text-align: center; padding: 10px 6px; background: #F9FAFB; border-radius: 8px;">
            <div style="font-size: 16px; font-weight: 600; color: #374151;">${adherence.daysWithDosing || 0}</div>
            <div style="font-size: 10px; color: #9CA3AF;">有记录天</div>
          </div>
        </div>
      </div>
      <div style="flex: 1; position: relative; height: 230px; margin-left: 40px;">
        ${gridLines}
        ${bars}
      </div>
    </div>
  `
}

async function renderHTMLToCanvas(htmlString, qrPayload) {
  const wrapper = document.createElement('div')
  wrapper.style.position = 'absolute'
  wrapper.style.left = '-99999px'
  wrapper.style.top = '0'
  wrapper.style.zIndex = '-1'
  wrapper.innerHTML = htmlString
  document.body.appendChild(wrapper)

  try {
    if (qrPayload) {
      const qrDataURL = await generateQRCodeDataURL(qrPayload, 300)
      const qrImg = wrapper.querySelector('#report-qr')
      if (qrImg && qrDataURL) {
        qrImg.src = qrDataURL
        qrImg.style.display = 'block'
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100))

    const reportEl = wrapper.querySelector('#health-report')
    if (!reportEl) throw new Error('报告元素未找到')

    const canvas = await html2canvas(reportEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false
    })

    return canvas
  } finally {
    document.body.removeChild(wrapper)
  }
}

function splitCanvasToPages(canvas, pageWidthPx, pageHeightPx) {
  const pages = []
  const totalHeight = canvas.height
  const totalWidth = canvas.width
  let currentY = 0

  while (currentY < totalHeight) {
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = totalWidth
    pageCanvas.height = Math.min(pageHeightPx, totalHeight - currentY)

    const ctx = pageCanvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, totalWidth, pageCanvas.height)
    ctx.drawImage(
      canvas,
      0, currentY,
      totalWidth, pageCanvas.height,
      0, 0,
      totalWidth, pageCanvas.height
    )

    pages.push(pageCanvas)
    currentY += pageHeightPx
  }

  return pages
}

export async function generateHealthReportPDF(profile, options = {}) {
  if (!profile || !profile.basicInfo) return null

  try {
    const { html, qrPayload } = buildReportHTML(profile, options)
    const canvas = await renderHTMLToCanvas(html, qrPayload)

    const pageWidthPx = PIXEL_WIDTH
    const pageHeightPx = canvas.width * (A4_HEIGHT / A4_WIDTH)
    const pageCanvases = splitCanvasToPages(canvas, pageWidthPx, pageHeightPx)

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    for (let i = 0; i < pageCanvases.length; i++) {
      const pageCanvas = pageCanvases[i]
      const imgData = pageCanvas.toDataURL('image/jpeg', 0.95)

      if (i > 0) {
        pdf.addPage()
      }

      const imgWidth = A4_WIDTH
      const imgHeight = (pageCanvas.height / pageCanvas.width) * A4_WIDTH
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)

      const pageNum = i + 1
      const totalPages = pageCanvases.length
      pdf.setFontSize(8)
      pdf.setTextColor(156, 163, 175)
      pdf.text(`第 ${pageNum} / ${totalPages} 页`, A4_WIDTH - 15, A4_HEIGHT - 8)
    }

    const fileName = `健康档案_${profile.basicInfo.name}_${formatDate(new Date().toISOString())}.pdf`
    pdf.save(fileName)
    return fileName
  } catch (err) {
    console.error('生成PDF报告失败:', err)
    throw err
  }
}

function buildEmergencyCardHTML(cardData) {
  if (!cardData) return ''

  const hasAllergies = cardData.allergies?.length > 0
  const meds = cardData.currentMedications || []

  let medsHTML = ''
  if (meds.length === 0) {
    medsHTML = '<div style="font-size: 9px; color: #9CA3AF;">暂无用药记录</div>'
  } else {
    medsHTML = meds.slice(0, 3).map((m, i) => `
      <div style="font-size: 9px; color: #374151; line-height: 1.4;">
        ${i + 1}. ${m.name} ${m.dosage || ''}${m.dosageUnit || ''} ${m.frequency || ''}
      </div>
    `).join('')
  }

  const moreMeds = meds.length > 3
    ? `<div style="font-size: 8px; color: #9CA3AF; margin-top: 2px;">...等共 ${meds.length} 种药物</div>`
    : ''

  const html = `
    <div id="emergency-card" style="width: 340px; height: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background: white; position: relative; box-sizing: border-box; border: 3px solid ${cardData.color}; border-radius: 8px; overflow: hidden;">
      <div style="background: ${cardData.color}; color: white; padding: 6px 10px;">
        <div style="font-size: 12px; font-weight: 700; text-align: center;">急诊医疗信息卡 / EMERGENCY CARD</div>
      </div>

      <div style="padding: 10px 12px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: ${cardData.color}20; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
            ${cardData.avatar || '👤'}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 16px; font-weight: 700; color: #111827;">${cardData.name}</div>
            <div style="font-size: 10px; color: #6B7280; margin-top: 1px;">${cardData.relation || ''}  ${cardData.ageText || ''}</div>
            <div style="font-size: 9px; color: #9CA3AF; margin-top: 2px;">
              ${cardData.birthDate ? '生日: ' + cardData.birthDate : ''}
              ${cardData.weight ? '  体重: ' + cardData.weight + 'kg' : ''}
            </div>
          </div>
        </div>

        <div style="margin-top: 8px; padding: 6px 8px; border-radius: 6px; background: ${hasAllergies ? '#FEF2F2' : '#ECFDF5'};">
          <div style="font-size: 10px; font-weight: 700; color: ${hasAllergies ? '#DC2626' : '#059669'};">
            ${hasAllergies ? '⚠ 过敏：' + cardData.allergies.join('、') : '✓ 无已知过敏史'}
          </div>
        </div>

        ${cardData.chronicDiseases?.length > 0 ? `
          <div style="margin-top: 4px; font-size: 10px; font-weight: 600; color: #B45309;">
            慢病：${cardData.chronicDiseases.join('、')}
          </div>
        ` : ''}

        ${cardData.liverFunction !== '正常' || cardData.kidneyFunction !== '正常' ? `
          <div style="margin-top: 3px; font-size: 9px; color: #6B7280;">
            ${cardData.liverFunction !== '正常' ? '肝功:' + cardData.liverFunction : ''}
            ${cardData.kidneyFunction !== '正常' ? '  肾功:' + cardData.kidneyFunction : ''}
          </div>
        ` : ''}

        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #D1D5DB;">
          <div style="font-size: 10px; font-weight: 700; color: ${cardData.color}; margin-bottom: 4px;">当前用药 / Current Meds:</div>
          ${medsHTML}
          ${moreMeds}
        </div>
      </div>

      <div style="position: absolute; right: 10px; bottom: 10px; width: 50px; height: 50px; background: white; border: 1px solid #E5E7EB; border-radius: 4px; padding: 3px;">
        <img id="card-qr" src="" alt="" style="width: 100%; height: 100%; object-fit: contain; display: none;" />
      </div>

      <div style="position: absolute; left: 10px; bottom: 8px; font-size: 8px; color: #9CA3AF;">
        生成: ${formatDate(new Date().toISOString())}
      </div>
    </div>
  `

  return html
}

export async function generateEmergencyCardPDF(memberId) {
  const cardData = generateEmergencyCardData(memberId)
  if (!cardData) return null

  try {
    const qrPayload = generateQRCodePayload(memberId)
    const html = buildEmergencyCardHTML(cardData)

    const wrapper = document.createElement('div')
    wrapper.style.position = 'absolute'
    wrapper.style.left = '-99999px'
    wrapper.style.top = '0'
    wrapper.style.zIndex = '-1'
    wrapper.innerHTML = html
    document.body.appendChild(wrapper)

    try {
      if (qrPayload) {
        const qrDataURL = await generateQRCodeDataURL(qrPayload, 200)
        const qrImg = wrapper.querySelector('#card-qr')
        if (qrImg && qrDataURL) {
          qrImg.src = qrDataURL
          qrImg.style.display = 'block'
        }
      }

      await new Promise(resolve => setTimeout(resolve, 80))

      const cardEl = wrapper.querySelector('#emergency-card')
      const canvas = await html2canvas(cardEl, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false
      })

      const cardWidthMm = 90
      const cardHeightMm = 58

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [cardWidthMm, cardHeightMm],
        compress: true
      })

      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, cardWidthMm, cardHeightMm)

      const fileName = `急诊卡_${cardData.name}_${formatDate(new Date().toISOString())}.pdf`
      pdf.save(fileName)
      return fileName
    } finally {
      document.body.removeChild(wrapper)
    }
  } catch (err) {
    console.error('生成急诊卡失败:', err)
    throw err
  }
}
