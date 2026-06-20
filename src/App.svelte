<script>
  import { onMount, onDestroy } from 'svelte'
  import Sidebar from './lib/components/Sidebar.svelte'
  import Dashboard from './lib/pages/Dashboard.svelte'
  import Medicines from './lib/pages/Medicines.svelte'
  import MedicalRecords from './lib/pages/MedicalRecords.svelte'
  import Records from './lib/pages/Records.svelte'
  import Family from './lib/pages/Family.svelte'
  import Inventory from './lib/pages/Inventory.svelte'
  import PurchaseList from './lib/pages/PurchaseList.svelte'
  import Statistics from './lib/pages/Statistics.svelte'
  import Settings from './lib/pages/Settings.svelte'
  import HealthProfile from './lib/pages/HealthProfile.svelte'
  import ReminderAction from './lib/components/ReminderAction.svelte'
  import {
    startScheduler,
    stopScheduler,
    setAlarmTriggerCallback,
    getPendingAlarm
  } from './lib/utils/scheduler.js'
  import { checkNotificationPermission } from './lib/utils/notification.js'
  import { appWindow } from '@tauri-apps/api/window'

  let currentRoute = 'dashboard'
  let showReminder = false
  let reminderAlarm = null
  let reminderTimeKey = ''
  let reminderIsSnoozed = false

  function goTo(route) {
    currentRoute = route
  }

  function handleAlarmTrigger(alarm, timeKey, isSnoozed = false) {
    reminderAlarm = alarm
    reminderTimeKey = timeKey
    reminderIsSnoozed = isSnoozed
    showReminder = true
    
    try {
      appWindow.show()
      appWindow.unminimize()
      appWindow.setFocus()
    } catch (e) {
      console.warn('Failed to show window:', e)
    }
  }

  function closeReminder() {
    showReminder = false
    reminderAlarm = null
    reminderTimeKey = ''
    reminderIsSnoozed = false
  }

  onMount(async () => {
    try {
      await checkNotificationPermission()
    } catch (e) {
      console.warn('Notification permission check failed:', e)
    }

    setAlarmTriggerCallback(handleAlarmTrigger)

    startScheduler()

    const pending = getPendingAlarm()
    if (pending) {
      handleAlarmTrigger(pending.alarm, pending.timeKey, pending.isSnoozed)
    }
  })

  onDestroy(() => {
    stopScheduler()
  })
</script>

<div class="w-full h-full flex overflow-hidden">
  <Sidebar bind:currentRoute={currentRoute} />
  <main class="flex-1 h-full overflow-hidden">
    {#if currentRoute === 'dashboard'}
      <Dashboard {goTo} />
    {:else if currentRoute === 'medicines'}
      <Medicines />
    {:else if currentRoute === 'medical-records'}
      <MedicalRecords />
    {:else if currentRoute === 'records'}
      <Records />
    {:else if currentRoute === 'family'}
      <Family />
    {:else if currentRoute === 'inventory'}
      <Inventory />
    {:else if currentRoute === 'purchase-list'}
      <PurchaseList />
    {:else if currentRoute === 'statistics'}
      <Statistics />
    {:else if currentRoute === 'settings'}
      <Settings />
    {:else if currentRoute === 'health-profile'}
      <HealthProfile />
    {/if}
  </main>
</div>

<ReminderAction
  bind:show={showReminder}
  alarm={reminderAlarm}
  timeKey={reminderTimeKey}
  isSnoozed={reminderIsSnoozed}
/>
