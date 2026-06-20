<script>
  import Icon from './Icon.svelte'
  import { get } from 'svelte/store'
  import { familyMembers } from '../stores/familyMembers.js'
  import { medicines } from '../stores/medicines.js'
  import { takeMedication, snoozeAlarm, skipAlarm } from '../utils/scheduler.js'

  export let show = false
  export let alarm = null
  export let timeKey = ''
  export let isSnoozed = false

  let showSuccess = false

  $: member = alarm
    ? $familyMembers.find((m) => m.id === alarm.familyMemberId)
    : null

  $: medicine = alarm
    ? $medicines.find((m) => m.id === alarm.medicineId)
    : null

  function handleTake() {
    if (!alarm || !timeKey) return
    
    takeMedication(alarm, timeKey)
    showSuccess = true
    
    setTimeout(() => {
      showSuccess = false
      show = false
    }, 1500)
  }

  function handleSnooze() {
    if (!alarm || !timeKey) return
    
    snoozeAlarm(alarm, timeKey, 5)
    show = false
  }

  function handleSkip() {
    if (!alarm || !timeKey) return
    
    skipAlarm(alarm, timeKey)
    show = false
  }

  function formatTimeDisplay(time) {
    if (!time) return ''
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    let period = ''
    if (hour >= 5 && hour < 12) period = '早上'
    else if (hour >= 12 && hour < 14) period = '中午'
    else if (hour >= 14 && hour < 18) period = '下午'
    else if (hour >= 18 && hour < 24) period = '晚上'
    else period = '凌晨'
    return `${period} ${time}`
  }
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" on:click={() => {}}></div>
    
    <div class="relative w-full max-w-md">
      {#if showSuccess}
        <div class="bg-white rounded-2xl shadow-2xl p-8 text-center animate-bounce-in">
          <div class="w-16 h-16 rounded-full bg-medical-green-100 flex items-center justify-center mx-auto mb-4">
            <Icon name="check" size={32} color="#10B981" />
          </div>
          <h3 class="text-xl font-bold text-medical-text-primary mb-2">打卡成功！</h3>
          <p class="text-sm text-medical-text-secondary">已记录本次用药</p>
        </div>
      {:else}
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
          <div class="bg-gradient-to-r from-medical-blue-500 to-medical-blue-600 p-6 text-white">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon name="pill" size={24} color="white" />
              </div>
              <div>
                <p class="text-sm opacity-80">用药提醒</p>
                <h3 class="text-xl font-bold">{medicine?.name || alarm?.medicineName || '药品'}</h3>
              </div>
            </div>
            {#if isSnoozed}
              <div class="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm">
                <Icon name="clock" size={14} />
                <span>稍后提醒</span>
              </div>
            {/if}
          </div>

          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3 p-3 bg-medical-blue-50 rounded-xl">
              <span class="text-2xl">{member?.avatar || '👤'}</span>
              <div>
                <p class="text-sm font-medium text-medical-text-primary">
                  {member?.name || alarm?.familyMemberName || '家人'}
                </p>
                <p class="text-xs text-medical-text-secondary">
                  {formatTimeDisplay(timeKey)}
                  {#if alarm?.dosage}
                    · 每次 {alarm.dosage}{alarm.dosageUnit || ''}
                  {/if}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <button
                class="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-medical-text-secondary"
                on:click={handleSkip}
              >
                <Icon name="x" size={20} />
                <span class="text-xs font-medium">跳过</span>
              </button>
              
              <button
                class="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all text-amber-600"
                on:click={handleSnooze}
              >
                <Icon name="clock" size={20} />
                <span class="text-xs font-medium">5分钟后</span>
              </button>
              
              <button
                class="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-medical-green-300 bg-medical-green-500 hover:bg-medical-green-600 transition-all text-white"
                on:click={handleTake}
              >
                <Icon name="check" size={20} />
                <span class="text-xs font-medium">已服药</span>
              </button>
            </div>

            <p class="text-xs text-center text-medical-text-tertiary">
              点击"已服药"直接记录用药，无需手动打卡
            </p>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes bounce-in {
    0% {
      opacity: 0;
      transform: scale(0.9);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  
  .animate-bounce-in {
    animation: bounce-in 0.4s ease-out;
  }
</style>
