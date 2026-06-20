import { get } from 'svelte/store'
import { createPersistentStore } from './storage.js'
import { generateId, nowISO, formatDate } from '../utils/helpers.js'
import { medicationRecords } from './medicationRecords.js'

const initialRecords = [
  {
    id: generateId(),
    visitDate: '2026-06-15',
    hospital: '北京协和医院',
    department: '内科',
    doctor: '张医生',
    familyMemberId: 'me',
    chiefComplaint: '持续发热3天，伴有咳嗽',
    diagnosis: '上呼吸道感染',
    medicalSummary: '患者3天前受凉后出现发热，体温最高38.5℃，伴咳嗽、咳黄痰。查体：咽部充血，双侧扁桃体Ⅰ度肿大。双肺呼吸音粗，未闻及干湿性啰音。血常规：白细胞11.2×10^9/L，中性粒细胞78%。胸片未见明显异常。',
    attachments: [],
    consultationFee: 50,
    medicineFee: 120,
    totalFee: 170,
    prescribedMedicines: [
      { medicineId: null, medicineName: '阿莫西林胶囊', dosage: '1', dosageUnit: '粒', frequency: '每日3次', duration: '7天' },
      { medicineId: null, medicineName: '复方感冒灵颗粒', dosage: '1', dosageUnit: '袋', frequency: '每日3次', duration: '5天' }
    ],
    nextVisitDate: '2026-06-22',
    notes: '注意休息，多喝水，清淡饮食',
    createdAt: nowISO(),
    updatedAt: nowISO()
  },
  {
    id: generateId(),
    visitDate: '2026-06-10',
    hospital: '首都医科大学附属北京儿童医院',
    department: '儿科',
    doctor: '李医生',
    familyMemberId: 'child',
    chiefComplaint: '腹泻2天',
    diagnosis: '小儿腹泻病',
    medicalSummary: '患儿2天前无明显诱因出现腹泻，每日5-6次，为黄色稀水样便，伴轻度呕吐。精神尚可，尿量正常。查体：腹软，无压痛，肠鸣音活跃。便常规：白细胞0-2/HP，未见红细胞。',
    attachments: [],
    consultationFee: 60,
    medicineFee: 85,
    totalFee: 145,
    prescribedMedicines: [
      { medicineId: null, medicineName: '蒙脱石散', dosage: '1', dosageUnit: '袋', frequency: '每日3次', duration: '3天' },
      { medicineId: null, medicineName: '口服补液盐Ⅲ', dosage: '1', dosageUnit: '袋', frequency: '按需服用', duration: '3天' }
    ],
    nextVisitDate: null,
    notes: '注意补充水分，继续母乳喂养',
    createdAt: nowISO(),
    updatedAt: nowISO()
  }
]

export const medicalRecords = createPersistentStore('medicalRecords', initialRecords)

export function addMedicalRecord(data) {
  const record = {
    id: generateId(),
    ...data,
    createdAt: nowISO(),
    updatedAt: nowISO()
  }
  medicalRecords.update((list) => [record, ...list])
  return record
}

export function updateMedicalRecord(id, data) {
  medicalRecords.update((list) =>
    list.map((r) => (r.id === id ? { ...r, ...data, updatedAt: nowISO() } : r))
  )
}

export function deleteMedicalRecord(id) {
  medicalRecords.update((list) => list.filter((r) => r.id !== id))
}

export function getMedicalRecordById(id) {
  return get(medicalRecords).find((r) => r.id === id)
}

export function getMedicalRecordsByFamilyMember(memberId) {
  return get(medicalRecords).filter((r) => r.familyMemberId === memberId)
}

export function getMedicalRecordsByHospital(hospital) {
  return get(medicalRecords).filter((r) => r.hospital?.includes(hospital))
}

export function getMedicalRecordsByDiagnosis(keyword) {
  return get(medicalRecords).filter((r) =>
    r.diagnosis?.includes(keyword) ||
    r.chiefComplaint?.includes(keyword) ||
    r.medicalSummary?.includes(keyword)
  )
}

export function getUpcomingVisits(days = 7) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + days)

  return get(medicalRecords)
    .filter((r) => {
      if (!r.nextVisitDate) return false
      const visitDate = new Date(r.nextVisitDate)
      visitDate.setHours(0, 0, 0, 0)
      return visitDate >= today && visitDate <= endDate
    })
    .sort((a, b) => new Date(a.nextVisitDate) - new Date(b.nextVisitDate))
}

export function getOverdueVisits() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return get(medicalRecords)
    .filter((r) => {
      if (!r.nextVisitDate) return false
      const visitDate = new Date(r.nextVisitDate)
      visitDate.setHours(0, 0, 0, 0)
      return visitDate < today
    })
    .sort((a, b) => new Date(a.nextVisitDate) - new Date(b.nextVisitDate))
}

export function getMedicalRecordTimeline(recordId) {
  const record = getMedicalRecordById(recordId)
  if (!record) return []

  const timeline = []

  timeline.push({
    id: `visit-${record.id}`,
    type: 'visit',
    title: '就诊',
    date: record.visitDate,
    description: `${record.hospital} ${record.department}`,
    doctor: record.doctor,
    diagnosis: record.diagnosis
  })

  const relatedMedRecords = get(medicationRecords).filter(
    (mr) => mr.time?.startsWith(record.visitDate) || 
           record.prescribedMedicines?.some(pm => pm.medicineName === mr.medicineName)
  )

  relatedMedRecords.forEach((mr) => {
    timeline.push({
      id: `med-${mr.id}`,
      type: 'medication',
      title: '用药记录',
      date: mr.time,
      medicineName: mr.medicineName,
      dosage: mr.dosage,
      dosageUnit: mr.dosageUnit,
      notes: mr.notes
    })
  })

  if (record.nextVisitDate) {
    timeline.push({
      id: `next-${record.id}`,
      type: 'next_visit',
      title: '复诊',
      date: record.nextVisitDate,
      description: '下次复诊日期'
    })
  }

  return timeline.sort((a, b) => new Date(a.date) - new Date(b.date))
}

export function filterMedicalRecords(filters = {}) {
  let records = get(medicalRecords)

  if (filters.familyMemberId && filters.familyMemberId !== 'all') {
    records = records.filter((r) => r.familyMemberId === filters.familyMemberId)
  }

  if (filters.hospital) {
    records = records.filter((r) => r.hospital?.includes(filters.hospital))
  }

  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    records = records.filter((r) =>
      r.diagnosis?.toLowerCase().includes(keyword) ||
      r.chiefComplaint?.toLowerCase().includes(keyword) ||
      r.medicalSummary?.toLowerCase().includes(keyword) ||
      r.hospital?.toLowerCase().includes(keyword) ||
      r.doctor?.toLowerCase().includes(keyword)
    )
  }

  return records.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
}
