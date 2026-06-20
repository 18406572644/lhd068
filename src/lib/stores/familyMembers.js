import { get } from 'svelte/store'
import { createPersistentStore } from './storage.js'
import { generateId } from '../utils/helpers.js'

const initialMembers = [
  { id: 'me', name: '我', relation: '本人', avatar: '👤', color: '#3B82F6', birthDate: '1990-01-01' },
  { id: 'wife', name: '妻子', relation: '配偶', avatar: '👩', color: '#EC4899', birthDate: '1992-06-15' },
  { id: 'child', name: '宝宝', relation: '子女', avatar: '👶', color: '#8B5CF6', birthDate: '2020-03-20' },
  { id: 'father', name: '父亲', relation: '父母', avatar: '👨‍🦳', color: '#F59E0B', birthDate: '1965-08-10' },
  { id: 'mother', name: '母亲', relation: '父母', avatar: '👩‍🦳', color: '#10B981', birthDate: '1968-11-25' }
]

export const familyMembers = createPersistentStore('familyMembers', initialMembers)

export function addMember(data) {
  const member = {
    id: generateId(),
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
