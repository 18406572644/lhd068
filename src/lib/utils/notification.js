import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/api/notification'
import { get } from 'svelte/store'
import { addRecord } from '../stores/medicationRecords.js'
import { getMedicineById } from '../stores/medicines.js'
import { getMemberById } from '../stores/familyMembers.js'

let onNotificationClickCallback = null

export async function checkNotificationPermission() {
  try {
    let granted = await isPermissionGranted()
    if (!granted) {
      const permission = await requestPermission()
      granted = permission === 'granted'
    }
    return granted
  } catch (e) {
    console.warn('Notification permission check failed:', e)
    return false
  }
}

export async function showMedicationReminder(alarm, timeKey) {
  const granted = await checkNotificationPermission()
  if (!granted) {
    console.warn('Notification permission not granted')
    return false
  }

  const medicine = getMedicineById(alarm.medicineId)
  const member = getMemberById(alarm.familyMemberId)
  
  const medicineName = medicine?.name || alarm.medicineName || '药品'
  const memberName = member?.name || alarm.familyMemberName || '家人'
  const dosage = alarm.dosage ? `${alarm.dosage}${alarm.dosageUnit || ''}` : ''
  
  const title = '💊 用药提醒'
  const body = `${memberName} 该吃 ${medicineName} 了\n${dosage ? '剂量：' + dosage : ''}\n\n点击通知进行打卡`

  try {
    await sendNotification({
      title,
      body,
      icon: 'icons/icon.png'
    })
    
    if (onNotificationClickCallback) {
      onNotificationClickCallback(alarm, timeKey)
    }
    
    return true
  } catch (e) {
    console.error('Failed to send notification:', e)
    return false
  }
}

export async function showSnoozeReminder(alarm, timeKey) {
  const granted = await checkNotificationPermission()
  if (!granted) return false

  const medicine = getMedicineById(alarm.medicineId)
  const member = getMemberById(alarm.familyMemberId)
  
  const medicineName = medicine?.name || alarm.medicineName || '药品'
  const memberName = member?.name || alarm.familyMemberName || '家人'
  
  const title = '⏰ 稍后提醒'
  const body = `${memberName} 的 ${medicineName} 提醒\n5分钟后再次提醒您`

  try {
    await sendNotification({ title, body, icon: 'icons/icon.png' })
    return true
  } catch (e) {
    console.error('Failed to send snooze notification:', e)
    return false
  }
}

export function recordMedicationFromAlarm(alarm, timeKey) {
  const medicine = getMedicineById(alarm.medicineId)
  const member = getMemberById(alarm.familyMemberId)
  
  const record = {
    medicineId: alarm.medicineId,
    medicineName: medicine?.name || alarm.medicineName || '',
    familyMemberId: alarm.familyMemberId,
    familyMemberName: member?.name || alarm.familyMemberName || '',
    dosage: alarm.dosage || '',
    dosageUnit: alarm.dosageUnit || '',
    time: new Date().toISOString(),
    notes: `闹钟提醒打卡 - ${timeKey}`,
    source: 'alarm'
  }
  
  return addRecord(record)
}

export function setNotificationClickCallback(callback) {
  onNotificationClickCallback = callback
}
