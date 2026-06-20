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
  import { familyMembers } from '../stores/familyMembers.js'
  import { DOSAGE_UNITS } from '../utils/constants.js'
  import { formatDateTime, formatDate, nowISO } from '../utils/helpers.js'

  let filterMember = 'all'
  let filterMedicine = 'all'
  let showFormModal = false
  let editingRecord = null

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
    if (editingRecord) {
      updateRecord(editingRecord.id, form)
    } else {
      addRecord(form)
    }
    showFormModal = false
  }

  function handleDelete(id) {
    if (confirm('确定删除此记录吗？')) {
      deleteRecord(id)
    }
  }

  function getMember(id) {
    return $familyMembers.find((m) => m.id === id)
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
    <div class="flex flex-wrap items-center gap-3">
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
                    <button class="w-8 h-8 rounded-lg text-medical-text-secondary hover:bg-red-50 hover:text-medical-danger transition-all" on:click={() => handleDelete(record.id)}>
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

<Modal show={showFormModal} title={editingRecord ? '编辑用药记录' : '记录用药'} width="480px">
  <div class="space-y-4">
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
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => showFormModal = false}>取消</button>
    <button class="btn-primary" on:click={handleSubmit}>{editingRecord ? '保存修改' : '保存记录'}</button>
  </div>
</Modal>
