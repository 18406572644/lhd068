import { get } from 'svelte/store'
import { alarms, getEnabledAlarms, markTriggered, isTriggeredToday } from '../stores/alarms.js'
import { showMedicationReminder, showSnoozeReminder, recordMedicationFromAlarm } from './notification.js'

let schedulerInterval = null
let snoozedAlarms = new Map()
let onAlarmTriggerCallback = null
let pendingAlarm = null

const CHECK_INTERVAL_MS = 30000

export function startScheduler() {
  if (schedulerInterval) {
    stopScheduler()
  }
  
  checkAlarms()
  
  schedulerInterval = setInterval(() => {
    checkAlarms()
    checkSnoozedAlarms()
  }, CHECK_INTERVAL_MS)
  
  console.log('[AlarmScheduler] Started')
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
  console.log('[AlarmScheduler] Stopped')
}

function getCurrentTimeKey() {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

function isTimeReached(alarmTime, currentTime) {
  const [alarmH, alarmM] = alarmTime.split(':').map(Number)
  const [currH, currM] = currentTime.split(':').map(Number)
  
  const alarmTotal = alarmH * 60 + alarmM
  const currTotal = currH * 60 + currM
  
  return currTotal >= alarmTotal && currTotal - alarmTotal < 2
}

function checkAlarms() {
  const enabledAlarms = getEnabledAlarms()
  const currentTime = getCurrentTimeKey()
  
  for (const alarm of enabledAlarms) {
    if (!alarm.times || alarm.times.length === 0) continue
    
    for (const time of alarm.times) {
      if (isTimeReached(time, currentTime) && !isTriggeredToday(alarm, time)) {
        triggerAlarm(alarm, time)
      }
    }
  }
}

function triggerAlarm(alarm, timeKey) {
  console.log(`[AlarmScheduler] Triggering alarm: ${alarm.id} at ${timeKey}`)
  
  markTriggered(alarm.id, timeKey)
  
  showMedicationReminder(alarm, timeKey)
  
  pendingAlarm = { alarm, timeKey, triggeredAt: new Date() }
  
  if (onAlarmTriggerCallback) {
    onAlarmTriggerCallback(alarm, timeKey)
  }
}

export function snoozeAlarm(alarm, timeKey, minutes = 5) {
  const snoozeKey = `${alarm.id}-${timeKey}`
  const snoozeUntil = Date.now() + minutes * 60 * 1000
  
  snoozedAlarms.set(snoozeKey, {
    alarm,
    timeKey,
    snoozeUntil
  })
  
  console.log(`[AlarmScheduler] Snoozed alarm ${alarm.id} for ${minutes} minutes`)
  
  showSnoozeReminder(alarm, timeKey)
}

function checkSnoozedAlarms() {
  const now = Date.now()
  
  for (const [key, snooze] of snoozedAlarms.entries()) {
    if (now >= snooze.snoozeUntil) {
      snoozedAlarms.delete(key)
      triggerSnoozedAlarm(snooze.alarm, snooze.timeKey)
    }
  }
}

function triggerSnoozedAlarm(alarm, timeKey) {
  console.log(`[AlarmScheduler] Triggering snoozed alarm: ${alarm.id}`)
  
  showMedicationReminder(alarm, timeKey)
  
  pendingAlarm = { alarm, timeKey, triggeredAt: new Date(), isSnoozed: true }
  
  if (onAlarmTriggerCallback) {
    onAlarmTriggerCallback(alarm, timeKey, true)
  }
}

export function skipAlarm(alarm, timeKey) {
  markTriggered(alarm.id, timeKey)
  
  if (pendingAlarm && pendingAlarm.alarm.id === alarm.id && pendingAlarm.timeKey === timeKey) {
    pendingAlarm = null
  }
  
  const snoozeKey = `${alarm.id}-${timeKey}`
  snoozedAlarms.delete(snoozeKey)
  
  console.log(`[AlarmScheduler] Skipped alarm ${alarm.id} at ${timeKey}`)
}

export function takeMedication(alarm, timeKey) {
  const record = recordMedicationFromAlarm(alarm, timeKey)
  
  markTriggered(alarm.id, timeKey)
  
  if (pendingAlarm && pendingAlarm.alarm.id === alarm.id && pendingAlarm.timeKey === timeKey) {
    pendingAlarm = null
  }
  
  const snoozeKey = `${alarm.id}-${timeKey}`
  snoozedAlarms.delete(snoozeKey)
  
  console.log(`[AlarmScheduler] Medication recorded for alarm ${alarm.id}`)
  
  return record
}

export function setAlarmTriggerCallback(callback) {
  onAlarmTriggerCallback = callback
}

export function getPendingAlarm() {
  return pendingAlarm
}

export function clearPendingAlarm() {
  pendingAlarm = null
}

export function getNextAlarmTime() {
  const enabledAlarms = getEnabledAlarms()
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  
  let nextTime = null
  let nextAlarm = null
  
  for (const alarm of enabledAlarms) {
    if (!alarm.times || alarm.times.length === 0) continue
    
    for (const time of alarm.times) {
      const [h, m] = time.split(':').map(Number)
      const totalMinutes = h * 60 + m
      
      if (totalMinutes > nowMinutes) {
        if (nextTime === null || totalMinutes < nextTime) {
          nextTime = totalMinutes
          nextAlarm = { alarm, time }
        }
      }
    }
  }
  
  return nextAlarm
}
