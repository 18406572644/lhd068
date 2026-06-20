<script>
  import Icon from './Icon.svelte'
  import Modal from './Modal.svelte'
  import { familyMembers } from '../stores/familyMembers.js'
  import {
    alarms,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    getAlarmsByMedicineAndMember
  } from '../stores/alarms.js'

  export let show = false
  export let medicine = null

  let editingAlarm = null
  let selectedMemberId = ''
  let showAlarmForm = false
  let alarmTimes = ['08:00']
  let alarmDosage = ''
  let alarmDosageUnit = '片'

  $: medicineAlarms = medicine
    ? $alarms.filter((a) => a.medicineId === medicine.id)
    : []

  $: if (medicine && !editingAlarm) {
    alarmDosage = medicine.dosage || ''
    alarmDosageUnit = medicine.dosageUnit || '片'
  }

  function resetForm() {
    editingAlarm = null
    selectedMemberId = ''
    showAlarmForm = false
    alarmTimes = ['08:00']
    if (medicine) {
      alarmDosage = medicine.dosage || ''
      alarmDosageUnit = medicine.dosageUnit || '片'
    }
  }

  function openAddAlarm() {
    editingAlarm = null
    selectedMemberId = ''
    alarmTimes = ['08:00']
    if (medicine) {
      alarmDosage = medicine.dosage || ''
      alarmDosageUnit = medicine.dosageUnit || '片'
    }
    showAlarmForm = true
  }

  function openEditAlarm(alarm) {
    editingAlarm = alarm
    selectedMemberId = alarm.familyMemberId
    alarmTimes = [...alarm.times]
    alarmDosage = alarm.dosage || ''
    alarmDosageUnit = alarm.dosageUnit || '片'
    showAlarmForm = true
  }

  function addTime() {
    alarmTimes = [...alarmTimes, '12:00']
  }

  function removeTime(index) {
    if (alarmTimes.length > 1) {
      alarmTimes = alarmTimes.filter((_, i) => i !== index)
    }
  }

  function updateTime(index, value) {
    alarmTimes = alarmTimes.map((t, i) => (i === index ? value : t))
  }

  function handleSubmit() {
    if (!selectedMemberId) {
      alert('请选择家庭成员')
      return
    }
    if (alarmTimes.length === 0) {
      alert('请至少设置一个提醒时间')
      return
    }

    const sortedTimes = [...alarmTimes].sort()
    const member = $familyMembers.find((m) => m.id === selectedMemberId)

    const alarmData = {
      medicineId: medicine.id,
      medicineName: medicine.name,
      familyMemberId: selectedMemberId,
      familyMemberName: member?.name || '',
      times: sortedTimes,
      dosage: alarmDosage,
      dosageUnit: alarmDosageUnit
    }

    if (editingAlarm) {
      updateAlarm(editingAlarm.id, alarmData)
    } else {
      const existing = getAlarmsByMedicineAndMember(medicine.id, selectedMemberId)
      if (existing.length > 0) {
        if (!confirm('该成员已设置过提醒，是否更新原有设置？')) {
          return
        }
        updateAlarm(existing[0].id, alarmData)
      } else {
        addAlarm(alarmData)
      }
    }

    resetForm()
  }

  function handleToggle(id) {
    toggleAlarm(id)
  }

  function handleDelete(id) {
    if (confirm('确定要删除这个闹钟吗？')) {
      deleteAlarm(id)
    }
  }

  function formatTimeLabel(time) {
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    if (hour >= 5 && hour < 12) return `${time} (早)`
    if (hour >= 12 && hour < 14) return `${time} (午)`
    if (hour >= 14 && hour < 18) return `${time} (下午)`
    if (hour >= 18 && hour < 24) return `${time} (晚)`
    return `${time} (凌晨)`
  }

  function getMemberById(id) {
    return $familyMembers.find((m) => m.id === id)
  }
</script>

<Modal bind:show title="用药闹钟设置" width="560px" on:close={resetForm}>
  {#if medicine}
    <div class="space-y-4">
      <div class="flex items-center gap-3 p-3 bg-medical-blue-50 rounded-xl">
        <div class="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
          <Icon name="pill" size={20} color="#3B82F6" />
        </div>
        <div>
          <p class="font-medium text-medical-text-primary">{medicine.name}</p>
          <p class="text-xs text-medical-text-secondary">{medicine.specification || ''}</p>
        </div>
      </div>

      <div class="border-t border-medical-blue-50 pt-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-medium text-medical-text-secondary">已设置的闹钟</p>
          <button class="btn-primary text-sm py-1.5" on:click={openAddAlarm}>
            <Icon name="plus" size={14} />
            <span class="ml-1">添加闹钟</span>
          </button>
        </div>

        {#if medicineAlarms.length === 0}
          <div class="text-center py-8 text-medical-text-secondary text-sm">
            <Icon name="clock" size={32} color="#D1D5DB" />
            <p class="mt-2">暂无闹钟设置</p>
            <p class="text-xs">点击上方按钮为家人设置用药提醒</p>
          </div>
        {:else}
          <div class="space-y-2 max-h-64 overflow-y-auto">
            {#each medicineAlarms as alarm (alarm.id)}
              {@const member = getMemberById(alarm.familyMemberId)}
              <div class="flex items-center justify-between p-3 rounded-xl border border-medical-blue-100 bg-white hover:border-medical-blue-300 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="text-xl">{member?.avatar || '👤'}</span>
                  <div>
                    <p class="text-sm font-medium text-medical-text-primary">
                      {member?.name || '未知成员'}
                    </p>
                    <p class="text-xs text-medical-text-secondary">
                      {alarm.times.map((t) => formatTimeLabel(t)).join('、')}
                    </p>
                    {#if alarm.dosage}
                      <p class="text-xs text-medical-text-tertiary">
                        每次 {alarm.dosage}{alarm.dosageUnit || ''}
                      </p>
                    {/if}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-medical-text-secondary hover:bg-medical-blue-50 hover:text-medical-blue-500 transition-colors"
                    on:click={() => openEditAlarm(alarm)}
                    title="编辑"
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-medical-text-secondary hover:bg-red-50 hover:text-medical-danger transition-colors"
                    on:click={() => handleDelete(alarm.id)}
                    title="删除"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                  <button
                    class="relative w-11 h-6 rounded-full transition-colors {alarm.enabled ? 'bg-medical-blue-500' : 'bg-gray-300'}"
                    on:click={() => handleToggle(alarm.id)}
                  >
                    <span
                      class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                      style="transform: translateX({alarm.enabled ? '20px' : '0'})"
                    ></span>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      {#if showAlarmForm}
        <div class="border-t border-medical-blue-50 pt-4">
          <p class="text-sm font-medium text-medical-text-secondary mb-3">
            {editingAlarm ? '编辑闹钟' : '新建闹钟'}
          </p>

          <div class="space-y-4">
            <div>
              <label class="label-base">选择家庭成员</label>
              <select class="input-base" bind:value={selectedMemberId} disabled={!!editingAlarm}>
                <option value="">请选择家庭成员</option>
                {#each $familyMembers as member}
                  <option value={member.id}>{member.avatar} {member.name}</option>
                {/each}
              </select>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="label-base mb-0">提醒时间</label>
                <button
                  class="text-sm text-medical-blue-500 hover:text-medical-blue-600"
                  on:click={addTime}
                >
                  <Icon name="plus" size={14} />
                  <span class="ml-0.5">添加时间</span>
                </button>
              </div>
              <div class="space-y-2">
                {#each alarmTimes as time, index}
                  <div class="flex items-center gap-2">
                    <input
                      type="time"
                      class="input-base flex-1"
                      value={time}
                      on:change={(e) => updateTime(index, e.target.value)}
                    />
                    <span class="text-sm text-medical-text-tertiary w-16">
                      {#each [time] as t}
                        {@const parts = formatTimeLabel(t).split(' ')}
                        {parts[1] || ''}
                      {/each}
                    </span>
                    <button
                      class="w-8 h-8 rounded-lg text-medical-text-secondary hover:bg-red-50 hover:text-medical-danger transition-colors"
                      on:click={() => removeTime(index)}
                      disabled={alarmTimes.length <= 1}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                {/each}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label-base">每次剂量</label>
                <input type="number" class="input-base" min="0" step="0.5" bind:value={alarmDosage} />
              </div>
              <div>
                <label class="label-base">单位</label>
                <input type="text" class="input-base" bind:value={alarmDosageUnit} placeholder="如：片、粒、袋" />
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <div slot="footer">
    {#if showAlarmForm}
      <button class="btn-ghost" on:click={resetForm}>取消</button>
      <button class="btn-primary" on:click={handleSubmit}>
        {editingAlarm ? '保存修改' : '添加闹钟'}
      </button>
    {:else}
      <button class="btn-ghost" on:click={() => show = false}>关闭</button>
    {/if}
  </div>
</Modal>
