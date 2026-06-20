import { get } from 'svelte/store'
import { createPersistentStore } from './storage.js'
import { generateId, nowISO, todayISO } from '../utils/helpers.js'

const initialAlarms = []

export const alarms = createPersistentStore('alarms', initialAlarms)

export function addAlarm(data) {
  const alarm = {
    id: generateId(),
    ...data,
    enabled: true,
    lastTriggered: {},
    createdAt: nowISO(),
    updatedAt: nowISO()
  }
  alarms.update((list) => [alarm, ...list])
  return alarm
}

export function updateAlarm(id, data) {
  alarms.update((list) =>
    list.map((a) => (a.id === id ? { ...a, ...data, updatedAt: nowISO() } : a))
  )
}

export function deleteAlarm(id) {
  alarms.update((list) => list.filter((a) => a.id !== id))
}

export function toggleAlarm(id) {
  alarms.update((list) =>
    list.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled, updatedAt: nowISO() } : a
    )
  )
}

export function getAlarmById(id) {
  return get(alarms).find((a) => a.id === id)
}

export function getAlarmsByMedicine(medicineId) {
  return get(alarms).filter((a) => a.medicineId === medicineId)
}

export function getAlarmsByFamilyMember(memberId) {
  return get(alarms).filter((a) => a.familyMemberId === memberId)
}

export function getEnabledAlarms() {
  return get(alarms).filter((a) => a.enabled)
}

export function markTriggered(alarmId, timeKey) {
  const today = todayISO()
  alarms.update((list) =>
    list.map((a) => {
      if (a.id === alarmId) {
        return {
          ...a,
          lastTriggered: {
            ...a.lastTriggered,
            [timeKey]: today
          },
          updatedAt: nowISO()
        }
      }
      return a
    })
  )
}

export function isTriggeredToday(alarm, timeKey) {
  const today = todayISO()
  return alarm.lastTriggered?.[timeKey] === today
}

export function getAlarmsByMedicineAndMember(medicineId, memberId) {
  return get(alarms).filter(
    (a) => a.medicineId === medicineId && a.familyMemberId === memberId
  )
}
