import { get } from 'svelte/store'
import { familyMembers } from '../stores/familyMembers.js'
import { medicalRecords } from '../stores/medicalRecords.js'
import { medicationRecords } from '../stores/medicationRecords.js'
import { medicines } from '../stores/medicines.js'
import { ALLERGY_TYPES, CHRONIC_DISEASES, ORGAN_FUNCTION_LABELS } from './constants.js'
import { calculateAge, isChild, isElderly, checkAllWarnings } from './medicationSafety.js'
import { formatDate, formatDateTime } from './helpers.js'
import { parseISO, differenceInDays, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns'

function getAllergyLabels(member) {
  const labels = []
  for (const a of member.allergies || []) {
    const found = ALLERGY_TYPES.find((t) => t.value === a)
    if (found) labels.push(found.label)
  }
  if (member.customAllergies) labels.push(...member.customAllergies)
  return labels
}

function getChronicLabels(member) {
  const labels = []
  for (const d of member.chronicDiseases || []) {
    const found = CHRONIC_DISEASES.find((t) => t.value === d)
    if (found) labels.push(found.label)
  }
  return labels
}

export function getMemberBasicInfo(memberId) {
  const member = get(familyMembers).find((m) => m.id === memberId)
  if (!member) return null

  const age = calculateAge(member.birthDate)
  return {
    ...member,
    age,
    ageText: age != null
      ? (isChild(age) ? `${age}岁 · 儿童` : isElderly(age) ? `${age}岁 · 老人` : `${age}岁`)
      : '',
    allergyLabels: getAllergyLabels(member),
    chronicLabels: getChronicLabels(member),
    liverFunctionLabel: ORGAN_FUNCTION_LABELS[member.liverFunction] || '正常',
    kidneyFunctionLabel: ORGAN_FUNCTION_LABELS[member.kidneyFunction] || '正常'
  }
}

export function getMemberMedicalRecords(memberId, startDate, endDate) {
  let records = get(medicalRecords).filter((r) => r.familyMemberId === memberId)
  if (startDate) {
    records = records.filter((r) => r.visitDate >= startDate)
  }
  if (endDate) {
    records = records.filter((r) => r.visitDate <= endDate)
  }
  return records.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
}

export function getMemberCurrentMedications(memberId) {
  const member = get(familyMembers).find((m) => m.id === memberId)
  if (!member) return []

  const longTermNames = member.longTermMedications || []
  const recentRecords = getMemberMedicalRecords(memberId)
  const recentPrescribedNames = new Set()

  for (const record of recentRecords) {
    const visitDate = record.visitDate ? parseISO(record.visitDate) : null
    if (!visitDate) continue
    const daysDiff = differenceInDays(new Date(), visitDate)
    if (daysDiff <= 30) {
      for (const pm of record.prescribedMedicines || []) {
        if (pm.medicineName) recentPrescribedNames.add(pm.medicineName)
      }
    }
  }

  const allNames = [...new Set([...longTermNames, ...recentPrescribedNames])]
  const medsStore = get(medicines)

  const result = []
  for (const name of allNames) {
    const foundInInventory = medsStore.find((m) => m.name === name)
    const fromPrescription = recentRecords
      .flatMap((r) => r.prescribedMedicines || [])
      .find((pm) => pm.medicineName === name)

    result.push({
      name,
      isLongTerm: longTermNames.includes(name),
      dosage: foundInInventory?.dosage || fromPrescription?.dosage || '',
      dosageUnit: foundInInventory?.dosageUnit || fromPrescription?.dosageUnit || '',
      frequency: foundInInventory?.frequency || fromPrescription?.frequency || '',
      usage: foundInInventory?.usage || '',
      specification: foundInInventory?.specification || '',
      manufacturer: foundInInventory?.manufacturer || '',
      expiryDate: foundInInventory?.expiryDate || '',
      duration: fromPrescription?.duration || ''
    })
  }

  return result
}

export function calculateAdherenceData(memberId, startDate, endDate) {
  const start = startDate ? startOfDay(parseISO(startDate)) : null
  const end = endDate ? endOfDay(parseISO(endDate)) : endOfDay(new Date())

  if (!start) {
    const defaultStart = new Date()
    defaultStart.setDate(defaultStart.getDate() - 30)
    const s = startOfDay(defaultStart)
    return computeAdherence(memberId, s, end)
  }
  return computeAdherence(memberId, start, end)
}

function computeAdherence(memberId, start, end) {
  const records = get(medicationRecords).filter((r) => {
    if (r.familyMemberId !== memberId) return false
    if (!r.time) return false
    const t = new Date(r.time)
    return t >= start && t <= end
  })

  const daysInterval = eachDayOfInterval({ start, end })
  const totalDays = daysInterval.length
  const totalExpectedDoses = totalDays * 3

  const medsByDay = {}
  for (const record of records) {
    const day = formatDate(record.time)
    if (!medsByDay[day]) medsByDay[day] = []
    medsByDay[day].push(record)
  }

  const dailyDoses = daysInterval.map((d) => {
    const dateStr = formatDate(d.toISOString())
    const count = medsByDay[dateStr]?.length || 0
    return { date: dateStr, count }
  })

  const daysWithDosing = Object.keys(medsByDay).length
  const totalActualDoses = records.length
  const adherenceRate = totalExpectedDoses > 0
    ? Math.min(100, Math.round((totalActualDoses / totalExpectedDoses) * 100))
    : 0

  let level = 'low'
  let levelText = '需要改善'
  let levelColor = '#EF4444'
  if (adherenceRate >= 80) {
    level = 'high'
    levelText = '优秀'
    levelColor = '#10B981'
  } else if (adherenceRate >= 60) {
    level = 'medium'
    levelText = '良好'
    levelColor = '#F59E0B'
  }

  const weeklyData = []
  const weekLabels = []
  for (let i = 0; i < dailyDoses.length; i += 7) {
    const chunk = dailyDoses.slice(i, i + 7)
    const sum = chunk.reduce((s, d) => s + d.count, 0)
    weeklyData.push(sum)
    const firstDay = chunk[0]?.date || ''
    const lastDay = chunk[chunk.length - 1]?.date || ''
    weekLabels.push(firstDay && lastDay ? `${firstDay.slice(5)} ~ ${lastDay.slice(5)}` : `第${weeklyData.length + 1}周`)
  }

  return {
    totalDays,
    totalExpectedDoses,
    totalActualDoses,
    daysWithDosing,
    adherenceRate,
    level,
    levelText,
    levelColor,
    dailyDoses,
    weeklyData,
    weekLabels
  }
}

export function getMedicationSafetyAssessment(memberId) {
  const member = get(familyMembers).find((m) => m.id === memberId)
  if (!member) return { warnings: [], summary: null }

  const currentMeds = getMemberCurrentMedications(memberId)
  const currentMedNames = currentMeds.map((m) => m.name)
  const allWarnings = []

  for (const med of currentMeds) {
    const check = checkAllWarnings(member, med.name, currentMedNames.filter((n) => n !== med.name), med.dosage)
    for (const w of check.warnings) {
      allWarnings.push({
        ...w,
        medicine: med.name
      })
    }
  }

  const highCount = allWarnings.filter((w) => w.level === 'high').length
  const mediumCount = allWarnings.filter((w) => w.level === 'medium').length
  const lowCount = allWarnings.filter((w) => w.level === 'low').length

  let overallRisk = 'safe'
  let overallRiskText = '低风险'
  let overallRiskColor = '#10B981'
  let overallRiskDesc = '当前用药方案整体安全，请继续保持。'

  if (highCount > 0) {
    overallRisk = 'danger'
    overallRiskText = '高风险'
    overallRiskColor = '#EF4444'
    overallRiskDesc = '检测到高风险用药问题，强烈建议立即咨询医生或药师调整用药方案！'
  } else if (mediumCount > 0) {
    overallRisk = 'warning'
    overallRiskText = '中风险'
    overallRiskColor = '#F59E0B'
    overallRiskDesc = '存在一些需要关注的用药问题，建议就医时告知医生。'
  } else if (lowCount > 0) {
    overallRisk = 'caution'
    overallRiskText = '低风险'
    overallRiskColor = '#3B82F6'
    overallRiskDesc = '有一些轻微注意事项，日常用药时稍加留意即可。'
  }

  const allergyRisk = (member.allergies?.length || 0) + (member.customAllergies?.length || 0)
  const chronicCount = member.chronicDiseases?.length || 0
  const medCount = currentMeds.length

  return {
    warnings: allWarnings,
    summary: {
      overallRisk,
      overallRiskText,
      overallRiskColor,
      overallRiskDesc,
      highCount,
      mediumCount,
      lowCount,
      allergyRisk,
      chronicCount,
      medCount
    }
  }
}

export function getMemberFullProfile(memberId, startDate, endDate) {
  const basicInfo = getMemberBasicInfo(memberId)
  if (!basicInfo) return null

  return {
    basicInfo,
    medicalRecords: getMemberMedicalRecords(memberId, startDate, endDate),
    currentMedications: getMemberCurrentMedications(memberId),
    adherence: calculateAdherenceData(memberId, startDate, endDate),
    safetyAssessment: getMedicationSafetyAssessment(memberId)
  }
}

export function generateQRCodePayload(memberId) {
  const basicInfo = getMemberBasicInfo(memberId)
  if (!basicInfo) return ''

  const payload = {
    v: 1,
    t: Math.floor(Date.now() / 1000),
    name: basicInfo.name,
    age: basicInfo.age,
    relation: basicInfo.relation,
    birthDate: basicInfo.birthDate,
    weight: basicInfo.weight,
    allergies: basicInfo.allergyLabels,
    chronic: basicInfo.chronicLabels,
    liver: basicInfo.liverFunctionLabel,
    kidney: basicInfo.kidneyFunctionLabel,
    longTermMeds: basicInfo.longTermMedications || [],
    currentMeds: getMemberCurrentMedications(memberId).map((m) => ({
      n: m.name,
      d: m.dosage + (m.dosageUnit || ''),
      f: m.frequency
    }))
  }

  try {
    return JSON.stringify(payload)
  } catch {
    return ''
  }
}

export function generateEmergencyCardData(memberId) {
  const basicInfo = getMemberBasicInfo(memberId)
  if (!basicInfo) return null

  return {
    name: basicInfo.name,
    relation: basicInfo.relation,
    ageText: basicInfo.ageText,
    avatar: basicInfo.avatar,
    color: basicInfo.color,
    birthDate: basicInfo.birthDate,
    weight: basicInfo.weight,
    allergies: basicInfo.allergyLabels,
    chronicDiseases: basicInfo.chronicLabels,
    liverFunction: basicInfo.liverFunctionLabel,
    kidneyFunction: basicInfo.kidneyFunctionLabel,
    longTermMedications: basicInfo.longTermMedications || [],
    currentMedications: getMemberCurrentMedications(memberId)
  }
}
