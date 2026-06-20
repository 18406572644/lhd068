<script>
  import Icon from '../components/Icon.svelte'
  import Modal from '../components/Modal.svelte'
  import {
    medicationRecords,
    addRecord,
    updateRecord,
    deleteRecord
  } from '../stores/medicationRecords.js'
  import { medicines } from '../stores/medicines.js'
  import { familyMembers, getMemberById, getMemberCurrentMedicines } from '../stores/familyMembers.js'
  import { DOSAGE_UNITS, INTERACTION_RISK, INTERACTION_RISK_LABELS, INTERACTION_RISK_COLORS } from '../utils/constants.js'
  import { formatDateTime, formatDate, nowISO } from '../utils/helpers.js'
  import { checkAllWarnings } from '../utils/medicationSafety.js'

  let filterMember = 'all'
  let filterMedicine = 'all'
  let showFormModal = false
  let showDeleteConfirm = false
  let editingRecord = null
  let deletingRecordId = null
  let showSafetyConfirm = false
  let pendingSafetyWarnings = []

  let form = {
    medicineId: '',
    medicineName: '',
    familyMemberId: '',
    dosage: '1',
    dosageUnit: DOSAGE_UNITS[0],
    time: nowISO(),
    notes: ''
  }

  $: sortedRecords = [...$medicationRecords].filter((r) => {
    if (filterMember !== 'all' && r.familyMemberId !== filterMember) return false
    if (filterMedicine !== 'all' && r.medicineId !== filterMedicine) return false
    return true
  }).sort((a, b) => new Date(b.time) - new Date(a.time))

  $: uniqueMedicines = new Set(sortedRecords.map(r => r.medicineName || r.medicineId).filter(Boolean))
  $: uniqueMembers = new Set(sortedRecords.map(r => r.familyMemberId).filter(Boolean))

  $: currentSafetyResult = (() => {
    if (!form.familyMemberId || (!form.medicineName && !form.medicineId)) {
      return { warnings: [], hasBlocker: false, hasHighRisk: false, hasMediumRisk: false, hasLowRisk: false }
    }
    const member = getMemberById(form.familyMemberId)
    const medName = form.medicineName || (() => {
      const m = $medicines.find((x) => x.id === form.medicineId)
      return m ? m.name : ''
    })()
    const currentMeds = getMemberCurrentMedicines(form.familyMemberId).filter((n) => n !== medName)
    return checkAllWarnings(member, medName, currentMeds, form.dosage)
  })()

  function resetForm() {
    form = {
      medicineId: '',
      medicineName: '',
      familyMemberId: '',
      dosage: '1',
      dosageUnit: DOSAGE_UNITS[0],
      time: nowISO(),
      notes: ''
    }
    showSafetyConfirm = false
    pendingSafetyWarnings = []
  }

  function openAddForm() {
    editingRecord = null
    resetForm()
    showFormModal = true
  }

  function openEditForm(record) {
    editingRecord = record
    form = { ...record }
    showFormModal = true
  }

  function handleMedicineChange() {
    if (form.medicineId) {
      const med = $medicines.find((m) => m.id === form.medicineId)
      if (med) {
        form.medicineName = med.name
        if (med.dosage) form.dosage = med.dosage
        if (med.dosageUnit) form.dosageUnit = med.dosageUnit
      }
    }
    form = form
  }

  function handleSubmit() {
    if (!form.medicineName.trim() && !form.medicineId) {
      alert('请选择或输入药品名称')
      return
    }
    if (!form.familyMemberId) {
      alert('请选择用药成员')
      return
    }

    if (currentSafetyResult.hasBlocker) {
      return
    }

    if (currentSafetyResult.warnings.length > 0 && !showSafetyConfirm) {
      pendingSafetyWarnings = currentSafetyResult.warnings
      showSafetyConfirm = true
      return
    }

    if (editingRecord) {
      updateRecord(editingRecord.id, form)
    } else {
      addRecord(form)
    }
    showFormModal = false
    showSafetyConfirm = false
    pendingSafetyWarnings = []
  }

  function confirmSafetyAndSubmit() {
    if (editingRecord) {
      updateRecord(editingRecord.id, form)
    } else {
      addRecord(form)
    }
    showFormModal = false
    showSafetyConfirm = false
    pendingSafetyWarnings = []
  }

  function cancelSafetyConfirm() {
    showSafetyConfirm = false
    pendingSafetyWarnings = []
  }

  function requestDelete(id) {
    deletingRecordId = id
    showDeleteConfirm = true
  }

  function confirmDelete() {
    if (deletingRecordId) {
      deleteRecord(deletingRecordId)
      showDeleteConfirm = false
      deletingRecordId = null
    }
  }

  function cancelDelete() {
    showDeleteConfirm = false
    deletingRecordId = null
  }

  function getMember(id) {
    return $familyMembers.find((m) => m.id === id)
  }

  function getWarningIcon(level) {
    if (level === INTERACTION_RISK.HIGH) return 'alert'
    if (level === INTERACTION_RISK.MEDIUM) return 'alert'
    return 'info'
  }

  function getWarningColor(level) {
    if (level === INTERACTION_RISK.HIGH) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-medical-danger', iconColor: '#EF4444' }
    if (level === INTERACTION_RISK.MEDIUM) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconColor: '#F59E0B' }
    return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', iconColor: '#3B82F6' }
  }
</script>

<div class="h-full flex flex-col">
  <div class="p-6 border-b border-medical-blue-50 bg-white">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold text-medical-text-primary">用药记录</h2>
        <p class="text-sm text-medical-text-secondary mt-1">共 {sortedRecords.length} 条记录</p>
      </div>
      <button class="btn-primary" on:click={openAddForm}>
        <Icon name="plus" size={16} />
        <span class="ml-1.5">记录用药</span>
      </button>
    </div>
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <select class="input-base w-auto" bind:value={filterMember}>
        <option value="all">全部成员</option>
        {#each $familyMembers as member}
          <option value={member.id}>{member.avatar} {member.name}</option>
        {/each}
      </select>
      <select class="input-base w-auto" bind:value={filterMedicine}>
        <option value="all">全部药品</option>
        {#each $medicines as med}
          <option value={med.id}>{med.name}</option>
        {/each}
      </select>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-medical-blue-50/50 rounded-lg p-3 text-center">
        <p class="text-2xl font-bold text-medical-blue-500">{sortedRecords.length}</p>
        <p class="text-xs text-medical-text-secondary mt-0.5">总次数</p>
      </div>
      <div class="bg-medical-green-50/50 rounded-lg p-3 text-center">
        <p class="text-2xl font-bold text-medical-green-500">{uniqueMedicines.size}</p>
        <p class="text-xs text-medical-text-secondary mt-0.5">涉及药品</p>
      </div>
      <div class="bg-purple-50 rounded-lg p-3 text-center">
        <p class="text-2xl font-bold text-purple-500">{uniqueMembers.size}</p>
        <p class="text-xs text-medical-text-secondary mt-0.5">涉及成员</p>
      </div>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-6">
    {#if sortedRecords.length === 0}
      <div class="h-full flex flex-col items-center justify-center py-20">
        <div class="w-20 h-20 rounded-full bg-medical-green-50 flex items-center justify-center mb-4">
          <Icon name="clock" size={40} color="#6EE7B7" />
        </div>
        <p class="text-medical-text-secondary mb-4">暂无用药记录</p>
        <button class="btn-primary" on:click={openAddForm}>
          <Icon name="plus" size={16} />
          <span class="ml-1.5">添加第一条记录</span>
        </button>
      </div>
    {:else}
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-medical-blue-50/50">
            <tr>
              <th class="text-left py-3 px-4 font-medium text-medical-text-secondary">时间</th>
              <th class="text-left py-3 px-4 font-medium text-medical-text-secondary">成员</th>
              <th class="text-left py-3 px-4 font-medium text-medical-text-secondary">药品</th>
              <th class="text-left py-3 px-4 font-medium text-medical-text-secondary">剂量</th>
              <th class="text-left py-3 px-4 font-medium text-medical-text-secondary">备注</th>
              <th class="text-right py-3 px-4 font-medium text-medical-text-secondary w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedRecords as record (record.id)}
              <tr class="border-t border-medical-blue-50 hover:bg-medical-blue-50/30 transition-colors">
                <td class="py-3 px-4">
                  <div class="text-sm text-medical-text-primary">{formatDateTime(record.time)}</div>
                </td>
                <td class="py-3 px-4">
                  {#each [getMember(record.familyMemberId)] as member}
                    {#if member}
                      <div class="flex items-center gap-2">
                        <span class="text-lg">{member.avatar}</span>
                        <span class="text-sm text-medical-text-primary">{member.name}</span>
                      </div>
                    {:else}
                      <span class="text-sm text-medical-text-tertiary">-</span>
                    {/if}
                  {/each}
                </td>
                <td class="py-3 px-4 text-sm text-medical-text-primary">{record.medicineName || '-'}</td>
                <td class="py-3 px-4">
                  <span class="tag bg-medical-blue-50 text-medical-blue-500">
                    {record.dosage} {record.dosageUnit}
                  </span>
                </td>
                <td class="py-3 px-4 text-sm text-medical-text-secondary max-w-xs truncate">{record.notes || '-'}</td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button class="w-8 h-8 rounded-lg text-medical-text-secondary hover:bg-medical-blue-50 hover:text-medical-blue-500 transition-all" on:click={() => openEditForm(record)}>
                      <Icon name="edit" size={16} />
                    </button>
                    <button class="w-8 h-8 rounded-lg text-medical-text-secondary hover:bg-red-50 hover:text-medical-danger transition-all" on:click={() => requestDelete(record.id)}>
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<Modal show={showFormModal} title={editingRecord ? '编辑用药记录' : '记录用药'} width="520px">
  <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
    <div>
      <label class="label-base">成员 <span class="text-medical-danger">*</span></label>
      <select class="input-base" bind:value={form.familyMemberId}>
        <option value="">请选择用药成员</option>
        {#each $familyMembers as member}
          <option value={member.id}>{member.avatar} {member.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label class="label-base">选择已有药品</label>
      <select class="input-base" bind:value={form.medicineId} on:change={handleMedicineChange}>
        <option value="">手动输入药品名称</option>
        {#each $medicines as med}
          <option value={med.id}>{med.name}</option>
        {/each}
      </select>
    </div>
    {#if !form.medicineId}
      <div>
        <label class="label-base">药品名称 <span class="text-medical-danger">*</span></label>
        <input type="text" class="input-base" placeholder="请输入药品名称" bind:value={form.medicineName} />
      </div>
    {/if}
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="label-base">剂量</label>
        <input type="number" class="input-base" min="0" bind:value={form.dosage} />
      </div>
      <div>
        <label class="label-base">单位</label>
        <select class="input-base" bind:value={form.dosageUnit}>
          {#each DOSAGE_UNITS as u}
            <option value={u}>{u}</option>
          {/each}
        </select>
      </div>
    </div>
    <div>
      <label class="label-base">用药时间</label>
      <input type="datetime-local" class="input-base" bind:value={form.time} />
    </div>
    <div>
      <label class="label-base">备注</label>
      <textarea class="input-base h-20 resize-none" placeholder="饭后服用 / 与餐同服 等" bind:value={form.notes}></textarea>
    </div>

    {#if currentSafetyResult.warnings.length > 0}
      <div class="pt-3 border-t border-medical-blue-50">
        <p class="text-sm font-semibold text-medical-text-primary mb-2 flex items-center gap-1.5">
          <Icon name="shield" size={16} color="#EF4444" />
          用药安全提示
        </p>
        <div class="space-y-2">
          {#each currentSafetyResult.warnings as w, idx}
            {@const colors = getWarningColor(w.level)}
            <div class="rounded-lg border p-3 {colors.bg} {colors.border}">
              <div class="flex items-start gap-2">
                <div class="flex-shrink-0 mt-0.5">
                  <Icon name={getWarningIcon(w.level)} size={16} color={colors.iconColor} />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-medium {colors.text}">{w.title}</span>
                    <span class="tag text-xs px-2 py-0.5 {INTERACTION_RISK_COLORS[w.level]}">{INTERACTION_RISK_LABELS[w.level]}</span>
                    {#if w.blockSave}
                      <span class="tag text-xs px-2 py-0.5 bg-red-100 text-medical-danger border-red-200">禁止保存</span>
                    {/if}
                  </div>
                  <p class="text-xs mt-1 text-medical-text-secondary leading-relaxed">{w.description}</p>
                  {#if w.drugA && w.drugB}
                    <p class="text-xs mt-1 {colors.text} font-medium">冲突药物：{w.drugA} + {w.drugB}</p>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => showFormModal = false}>取消</button>
    <button class="btn-primary" on:click={handleSubmit} disabled={currentSafetyResult.hasBlocker}>
      {currentSafetyResult.hasBlocker ? '存在致命风险，无法保存' : editingRecord ? '保存修改' : '保存记录'}
    </button>
  </div>
</Modal>

<Modal show={showSafetyConfirm} title="确认继续用药" width="520px" on:close={cancelSafetyConfirm}>
  <div class="py-2">
    <div class="flex items-start gap-3 mb-4">
      <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <Icon name="alert" size={20} color="#F59E0B" />
      </div>
      <div>
        <p class="font-medium text-medical-text-primary">以下安全风险需要您确认</p>
        <p class="text-sm text-medical-text-secondary mt-1">请仔细阅读以下风险提示，确认是否继续保存记录。</p>
      </div>
    </div>
    <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
      {#each pendingSafetyWarnings as w, idx}
        {@const colors = getWarningColor(w.level)}
        <div class="rounded-lg border p-3 {colors.bg} {colors.border}">
          <div class="flex items-start gap-2">
            <div class="flex-shrink-0 mt-0.5">
              <Icon name={getWarningIcon(w.level)} size={16} color={colors.iconColor} />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium {colors.text}">{w.title}</span>
                <span class="tag text-xs px-2 py-0.5 {INTERACTION_RISK_COLORS[w.level]}">{INTERACTION_RISK_LABELS[w.level]}</span>
              </div>
              <p class="text-xs mt-1 text-medical-text-secondary leading-relaxed">{w.description}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
    <p class="text-xs text-medical-text-tertiary mt-4">
      提示：如您对用药安全有疑问，请咨询医生或药师。
    </p>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={cancelSafetyConfirm}>返回修改</button>
    <button class="btn-danger" on:click={confirmSafetyAndSubmit}>
      <Icon name="check" size={16} />
      <span class="ml-1.5">我已了解风险，确认保存</span>
    </button>
  </div>
</Modal>

<Modal show={showDeleteConfirm} title="确认删除" width="400px" on:close={cancelDelete}>
  <div class="py-4">
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
        <Icon name="alert" size={20} color="#EF4444" />
      </div>
      <div>
        <p class="font-medium text-medical-text-primary">确定要删除此用药记录吗？</p>
        <p class="text-sm text-medical-text-secondary mt-1">删除后将无法恢复。</p>
      </div>
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={cancelDelete}>取消</button>
    <button class="btn-danger" on:click={confirmDelete}>确认删除</button>
  </div>
</Modal>
