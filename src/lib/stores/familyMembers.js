import { get } from 'svelte/store'
import { createPersistentStore } from './storage.js'
import { generateId } from '../utils/helpers.js'
import { getRecordsByFamilyMember } from './medicationRecords.js'
import { calculateAge, isChild, isElderly } from '../utils/medicationSafety.js'

const initialMembers = [
  { id: 'me', name: '我', relation: '本人', avatar: '👤', color: '#3B82F6', birthDate: '1990-01-01', allergies: [], customAllergies: [], chronicDiseases: [], longTermMedications: [], liverFunction: 'normal', kidneyFunction: 'normal', weight: null },
  { id: 'wife', name: '妻子', relation: '配偶', avatar: '👩', color: '#EC4899', birthDate: '1992-06-15', allergies: [], customAllergies: [], chronicDiseases: [], longTermMedications: [], liverFunction: 'normal', kidneyFunction: 'normal', weight: null },
  { id: 'child', name: '宝宝', relation: '子女', avatar: '👶', color: '#8B5CF6', birthDate: '2020-03-20', allergies: [], customAllergies: [], chronicDiseases: [], longTermMedications: [], liverFunction: 'normal', kidneyFunction: 'normal', weight: 15 },
  { id: 'father', name: '父亲', relation: '父母', avatar: '👨‍🦳', color: '#F59E0B', birthDate: '1965-08-10', allergies: [], customAllergies: [], chronicDiseases: ['hypertension'], longTermMedications: ['硝苯地平缓释片'], liverFunction: 'normal', kidneyFunction: 'normal', weight: 70 },
  { id: 'mother', name: '母亲', relation: '父母', avatar: '👩‍🦳', color: '#10B981', birthDate: '1968-11-25', allergies: ['penicillin'], customAllergies: [], chronicDiseases: ['diabetes'], longTermMedications: ['二甲双胍片'], liverFunction: 'normal', kidneyFunction: 'normal', weight: 60 }
]

export const familyMembers = createPersistentStore('familyMembers', initialMembers)

export function addMember(data) {
  const member = {
    id: generateId(),
    allergies: [],
    customAllergies: [],
    chronicDiseases: [],
    longTermMedications: [],
    liverFunction: 'normal',
    kidneyFunction: 'normal',
    weight: null,
    ...data
  }
  familyMembers.update((list) => [...list, member])
  return member
}

export function updateMember(id, data) {
  familyMembers.update((list) => list.map((m) => (m.id === id ? { ...m, ...data } : m)))
}

export function deleteMember(id) {
  familyMembers.update((list) => list.filter((m) => m.id !== id))
}

export function getMemberById(id) {
  return get(familyMembers).find((m) => m.id === id)
}

export function getMemberName(id) {
  const member = getMemberById(id)
  return member ? member.name : '未知'
}

export function getMemberAge(id) {
  const member = getMemberById(id)
  if (!member) return null
  return calculateAge(member.birthDate)
}

export function isMemberChild(id) {
  const age = getMemberAge(id)
  return isChild(age)
}

export function isMemberElderly(id) {
  const age = getMemberAge(id)
  return isElderly(age)
}

export function getMemberCurrentMedicines(id) {
  if (!id) return []
  const member = getMemberById(id)
  const longTerm = member?.longTermMedications || []
  const records = getRecordsByFamilyMember(id)
  const recentNames = records
    .filter((r) => {
      if (!r.time) return false
      const diff = (Date.now() - new Date(r.time).getTime()) / (1000 * 60 * 60 * 24)
      return diff <= 7
    })
    .map((r) => r.medicineName)
    .filter(Boolean)

  return [...new Set([...longTerm, ...recentNames])]
}

export function getMemberHealthSummary(id) {
  const member = getMemberById(id)
  if (!member) return null
  return {
    age: calculateAge(member.birthDate),
    isChild: isChild(calculateAge(member.birthDate)),
    isElderly: isElderly(calculateAge(member.birthDate)),
    allergies: member.allergies || [],
    customAllergies: member.customAllergies || [],
    chronicDiseases: member.chronicDiseases || [],
    longTermMedications: member.longTermMedications || [],
    liverFunction: member.liverFunction || 'normal',
    kidneyFunction: member.kidneyFunction || 'normal',
    weight: member.weight
  }
}
