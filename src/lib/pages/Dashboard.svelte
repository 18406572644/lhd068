<script>
  import { onMount, onDestroy } from 'svelte'
  import Icon from '../components/Icon.svelte'
  import MedicineCard from '../components/MedicineCard.svelte'
  import Modal from '../components/Modal.svelte'
  import { medicines, getExpiredMedicines, getWarningMedicines, markAllExpired } from '../stores/medicines.js'
  import { medicationRecords, getTodayRecords } from '../stores/medicationRecords.js'
  import { medicalRecords, getUpcomingVisits, getOverdueVisits } from '../stores/medicalRecords.js'
  import { familyMembers, getMemberById } from '../stores/familyMembers.js'
  import { EXPIRY_STATUS } from '../utils/constants.js'
  import { getExpiryStatus, getDaysUntilExpiry, formatDate, formatDateTime } from '../utils/helpers.js'

  export let goTo

  let showExpiryModal = false
  let showVisitReminderModal = false
  let expiryMedicines = []
  let intervalId = null

  $: {
    expiryMedicines = $medicines.filter(m => {
      const status = getExpiryStatus(m.expiryDate)
      return status === EXPIRY_STATUS.EXPIRED || status === EXPIRY_STATUS.WARNING
    }).sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate))
  }

  $: totalCount = $medicines.length
  $: expiredCount = $medicines.filter(m => getExpiryStatus(m.expiryDate) === EXPIRY_STATUS.EXPIRED && !m.markedExpired).length
  $: warningCount = $medicines.filter(m => getExpiryStatus(m.expiryDate) === EXPIRY_STATUS.WARNING).length
  $: normalCount = $medicines.filter(m => getExpiryStatus(m.expiryDate) === EXPIRY_STATUS.NORMAL).length
  $: todayRecords = getTodayRecords()
  $: upcomingVisits = getUpcomingVisits(7)
  $: overdueVisits = getOverdueVisits()
  $: upcomingVisitCount = upcomingVisits.length + overdueVisits.length

  function checkExpiryReminders() {
    const urgent = expiryMedicines.filter(m => {
      const days = getDaysUntilExpiry(m.expiryDate)
      return days <= 7 && !m.markedExpired
    })
    if (urgent.length > 0) {
      showExpiryModal = true
    }
  }

  function checkVisitReminders() {
    if (upcomingVisits.length > 0 || overdueVisits.length > 0) {
      showVisitReminderModal = true
    }
  }

  function handleMarkAllExpired() {
    markAllExpired()
  }

  function getDaysUntilVisit(visitDate) {
    if (!visitDate) return Infinity
    return getDaysUntilExpiry(visitDate)
  }

  function getMemberInfo(memberId) {
    return getMemberById(memberId) || { name: '未知', avatar: '👤' }
  }

  function closeExpiryModal() {
    showExpiryModal = false
  }

  function closeVisitReminderModal() {
    showVisitReminderModal = false
  }

  onMount(() => {
    setTimeout(checkExpiryReminders, 1000)
    setTimeout(checkVisitReminders, 1500)
    intervalId = setInterval(() => {
      // 每小时检查一次
    }, 3600000)
  })

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId)
  })
</script>

<div class="h-full overflow-y-auto">
  <div class="p-6 max-w-7xl mx-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-medical-text-primary">首页看板</h2>
      <p class="text-sm text-medical-text-secondary mt-1">欢迎回来，今天是 {formatDate(new Date().toISOString())}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-medical-text-secondary">药品总数</p>
            <p class="text-3xl font-bold text-medical-text-primary mt-1">{totalCount}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-medical-blue-50 flex items-center justify-center">
            <Icon name="box" size={24} color="#3B82F6" />
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-medical-blue-50">
          <span class="text-xs text-medical-text-tertiary">共 {totalCount} 种药品</span>
        </div>
      </div>

      <div class="card p-5 border-medical-danger/20">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-medical-text-secondary">已过期</p>
            <p class="text-3xl font-bold text-medical-danger mt-1">{expiredCount}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
            <Icon name="alert" size={24} color="#EF4444" />
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-medical-blue-50">
          <button class="text-xs text-medical-danger hover:underline" on:click={handleMarkAllExpired}>一键标记已过期</button>
        </div>
      </div>

      <div class="card p-5 border-medical-warning/20">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-medical-text-secondary">临期提醒</p>
            <p class="text-3xl font-bold text-medical-warning mt-1">{warningCount}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <Icon name="bell" size={24} color="#F59E0B" />
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-medical-blue-50">
          <span class="text-xs text-medical-text-tertiary">30天内即将到期</span>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-medical-text-secondary">今日用药</p>
            <p class="text-3xl font-bold text-medical-green-500 mt-1">{todayRecords.length}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-medical-green-50 flex items-center justify-center">
            <Icon name="clock" size={24} color="#10B981" />
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-medical-blue-50">
          <button class="text-xs text-medical-green-500 hover:underline" on:click={() => goTo('records')}>查看用药记录 →</button>
        </div>
      </div>

      <div class="card p-5 border-purple-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-medical-text-secondary">即将复诊</p>
            <p class="text-3xl font-bold text-purple-600 mt-1">{upcomingVisitCount}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <Icon name="stethoscope" size={24} color="#8B5CF6" />
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-medical-blue-50">
          <button class="text-xs text-purple-600 hover:underline" on:click={() => goTo('medical-records')}>查看就诊记录 →</button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="card">
          <div class="flex items-center justify-between p-4 border-b border-medical-blue-50">
            <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
              <Icon name="clock" size={18} color="#F59E0B" />
              有效期提醒
            </h3>
            <button class="text-sm text-medical-blue-500 hover:underline" on:click={() => goTo('medicines')}>
              查看全部
            </button>
          </div>
          <div class="p-4">
            {#if expiryMedicines.length === 0}
              <div class="py-12 text-center">
                <div class="w-16 h-16 mx-auto rounded-full bg-medical-green-50 flex items-center justify-center mb-3">
                  <Icon name="check" size={32} color="#10B981" />
                </div>
                <p class="text-medical-text-secondary">所有药品状态良好，暂无过期或临期</p>
              </div>
            {:else}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each expiryMedicines.slice(0, 6) as medicine (medicine.id)}
                  <div on:click={() => goTo('medicines')}>
                    <MedicineCard {medicine} compact={true} />
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card border-purple-200">
          <div class="flex items-center justify-between p-4 border-b border-medical-blue-50">
            <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
              <Icon name="stethoscope" size={18} color="#8B5CF6" />
              即将复诊
            </h3>
            <button class="text-sm text-medical-blue-500 hover:underline" on:click={() => goTo('medical-records')}>
              查看全部
            </button>
          </div>
          <div class="p-4">
            {#if upcomingVisits.length === 0 && overdueVisits.length === 0}
              <div class="py-6 text-center">
                <div class="w-12 h-12 mx-auto rounded-full bg-medical-green-50 flex items-center justify-center mb-2">
                  <Icon name="check" size={24} color="#10B981" />
                </div>
                <p class="text-sm text-medical-text-secondary">近期暂无复诊安排</p>
              </div>
            {:else}
              <div class="space-y-3">
                {#each overdueVisits as record (record.id)}
                  {@const member = getMemberInfo(record.familyMemberId)}
                  {@const days = getDaysUntilVisit(record.nextVisitDate)}
                  <div class="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                    <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm">
                      {member.avatar}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-medical-text-primary truncate">{member.name} · {record.diagnosis}</p>
                      <p class="text-xs text-medical-danger">已逾期 {Math.abs(days)} 天 · {formatDate(record.nextVisitDate)}</p>
                    </div>
                    <Icon name="alert" size={16} color="#EF4444" />
                  </div>
                {/each}
                {#each upcomingVisits as record (record.id)}
                  {@const member = getMemberInfo(record.familyMemberId)}
                  {@const days = getDaysUntilVisit(record.nextVisitDate)}
                  <div class="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                    <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm">
                      {member.avatar}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-medical-text-primary truncate">{member.name} · {record.diagnosis}</p>
                      <p class="text-xs text-purple-600">
                        {days === 0 ? '今天' : `${days}天后`} · {formatDate(record.nextVisitDate)}
                      </p>
                    </div>
                    <span class="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      {days === 0 ? '今天' : `${days}天`}
                    </span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between p-4 border-b border-medical-blue-50">
            <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
              <Icon name="users" size={18} color="#3B82F6" />
              家庭成员
            </h3>
            <button class="text-sm text-medical-blue-500 hover:underline" on:click={() => goTo('family')}>
              管理
            </button>
          </div>
          <div class="p-4">
            <div class="flex flex-wrap gap-2">
              {#each $familyMembers as member (member.id)}
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-medical-blue-50">
                  <span class="text-lg">{member.avatar}</span>
                  <span class="text-sm font-medium text-medical-text-primary">{member.name}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between p-4 border-b border-medical-blue-50">
            <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
              <Icon name="stats" size={18} color="#10B981" />
              分类统计
            </h3>
          </div>
          <div class="p-4 space-y-3">
            <div>
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-medical-text-secondary">处方药</span>
                <span class="font-medium text-red-600">{$medicines.filter(m => m.category === 'prescription').length}</span>
              </div>
              <div class="h-2 bg-red-50 rounded-full overflow-hidden">
                <div class="h-full bg-red-400 rounded-full transition-all" style="width: {totalCount > 0 ? ($medicines.filter(m => m.category === 'prescription').length / totalCount * 100) : 0}%"></div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-medical-text-secondary">非处方药</span>
                <span class="font-medium text-medical-green-500">{$medicines.filter(m => m.category === 'otc').length}</span>
              </div>
              <div class="h-2 bg-medical-green-50 rounded-full overflow-hidden">
                <div class="h-full bg-medical-green-400 rounded-full transition-all" style="width: {totalCount > 0 ? ($medicines.filter(m => m.category === 'otc').length / totalCount * 100) : 0}%"></div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-medical-text-secondary">外用药</span>
                <span class="font-medium text-medical-blue-500">{$medicines.filter(m => m.category === 'external').length}</span>
              </div>
              <div class="h-2 bg-medical-blue-50 rounded-full overflow-hidden">
                <div class="h-full bg-medical-blue-400 rounded-full transition-all" style="width: {totalCount > 0 ? ($medicines.filter(m => m.category === 'external').length / totalCount * 100) : 0}%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<Modal bind:show={showExpiryModal} title="⚠️ 药品到期提醒" width="480px" on:close={closeExpiryModal}>
  <div class="space-y-3">
    <p class="text-sm text-medical-text-secondary">有以下药品即将过期或已过期，请及时处理：</p>
    <div class="max-h-64 overflow-y-auto space-y-2">
      {#each expiryMedicines.slice(0, 10) as m (m.id)}
        <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div>
            <p class="text-sm font-medium text-medical-text-primary">{m.name}</p>
            <p class="text-xs text-medical-text-tertiary">有效期至 {formatDate(m.expiryDate)}</p>
          </div>
          <span class="tag {getExpiryStatus(getExpiryStatus(m.expiryDate)) ? '' : ''} {getExpiryStatus(m.expiryDate) === EXPIRY_STATUS.EXPIRED ? 'bg-red-50 text-medical-danger' : 'bg-amber-50 text-medical-warning'}">
            {getExpiryStatus(m.expiryDate) === EXPIRY_STATUS.EXPIRED ? '已过期' : `${getDaysUntilExpiry(m.expiryDate)}天后到期`}
          </span>
        </div>
      {/each}
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={closeExpiryModal}>稍后提醒</button>
    <button class="btn-primary" on:click={() => { closeExpiryModal(); goTo('medicines') }}>立即查看</button>
  </div>
</Modal>

<Modal bind:show={showVisitReminderModal} title="📅 复诊提醒" width="480px" on:close={closeVisitReminderModal}>
  <div class="space-y-3">
    <p class="text-sm text-medical-text-secondary">有以下复诊安排，请及时就诊：</p>
    <div class="max-h-64 overflow-y-auto space-y-2">
      {#each overdueVisits as record (record.id)}
        {@const member = getMemberInfo(record.familyMemberId)}
        {@const days = getDaysUntilVisit(record.nextVisitDate)}
        <div class="flex items-center justify-between p-3 rounded-lg bg-red-50">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm">
              {member.avatar}
            </div>
            <div>
              <p class="text-sm font-medium text-medical-text-primary">{member.name} · {record.diagnosis}</p>
              <p class="text-xs text-medical-danger">已逾期 {Math.abs(days)} 天 · {formatDate(record.nextVisitDate)}</p>
            </div>
          </div>
          <Icon name="alert" size={18} color="#EF4444" />
        </div>
      {/each}
      {#each upcomingVisits.slice(0, 5) as record (record.id)}
        {@const member = getMemberInfo(record.familyMemberId)}
        {@const days = getDaysUntilVisit(record.nextVisitDate)}
        <div class="flex items-center justify-between p-3 rounded-lg bg-purple-50">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm">
              {member.avatar}
            </div>
            <div>
              <p class="text-sm font-medium text-medical-text-primary">{member.name} · {record.diagnosis}</p>
              <p class="text-xs text-purple-600">{days === 0 ? '今天' : `${days}天后`} · {formatDate(record.nextVisitDate)}</p>
            </div>
          </div>
          <span class="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
            {days === 0 ? '今天' : `${days}天`}
          </span>
        </div>
      {/each}
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={closeVisitReminderModal}>稍后提醒</button>
    <button class="btn-primary" on:click={() => { closeVisitReminderModal(); goTo('medical-records') }}>查看详情</button>
  </div>
</Modal>
