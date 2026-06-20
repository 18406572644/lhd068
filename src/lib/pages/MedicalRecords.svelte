<script>
  import { onMount } from 'svelte'
  import Icon from '../components/Icon.svelte'
  import Modal from '../components/Modal.svelte'
  import MedicalRecordForm from '../components/MedicalRecordForm.svelte'
  import MedicalRecordDetail from './MedicalRecordDetail.svelte'
  import { medicalRecords, filterMedicalRecords, deleteMedicalRecord } from '../stores/medicalRecords.js'
  import { familyMembers, getMemberById } from '../stores/familyMembers.js'
  import { formatDate, getDaysUntilExpiry } from '../utils/helpers.js'

  let showForm = false
  let showDetail = false
  let showDeleteConfirm = false
  let editingRecord = null
  let isEdit = false
  let selectedRecord = null
  let recordToDelete = null

  let filters = {
    familyMemberId: 'all',
    hospital: '',
    keyword: ''
  }

  $: filteredRecords = filterMedicalRecords(filters)

  function openAddForm() {
    editingRecord = null
    isEdit = false
    showForm = true
  }

  function openEditForm(record) {
    editingRecord = record
    isEdit = true
    showForm = true
  }

  function openDetail(record) {
    selectedRecord = record
    showDetail = true
  }

  function confirmDelete(record) {
    recordToDelete = record
    showDeleteConfirm = true
  }

  function handleDelete() {
    if (recordToDelete) {
      deleteMedicalRecord(recordToDelete.id)
    }
    showDeleteConfirm = false
    recordToDelete = null
  }

  function resetFilters() {
    filters = {
      familyMemberId: 'all',
      hospital: '',
      keyword: ''
    }
  }

  function getMemberInfo(memberId) {
    return getMemberById(memberId) || { name: '未知', avatar: '👤', color: '#6B7280' }
  }

  function getNextVisitStatus(nextVisitDate) {
    if (!nextVisitDate) return null
    const days = getDaysUntilExpiry(nextVisitDate)
    if (days < 0) return { text: `已逾期 ${Math.abs(days)} 天`, class: 'bg-red-50 text-medical-danger' }
    if (days === 0) return { text: '今天复诊', class: 'bg-red-50 text-medical-danger' }
    if (days <= 7) return { text: `${days}天后复诊`, class: 'bg-amber-50 text-medical-warning' }
    return { text: `${days}天后复诊`, class: 'bg-medical-green-50 text-medical-green-500' }
  }

  $: hospitals = [...new Set($medicalRecords.map(r => r.hospital).filter(Boolean))]
</script>

<div class="h-full flex flex-col overflow-hidden">
  <div class="flex items-center justify-between p-6 border-b border-medical-blue-50">
    <div>
      <h2 class="text-2xl font-bold text-medical-text-primary">就诊记录</h2>
      <p class="text-sm text-medical-text-secondary mt-1">共 {$medicalRecords.length} 条记录</p>
    </div>
    <button class="btn-primary" on:click={openAddForm}>
      <Icon name="plus" size={16} />
      新增记录
    </button>
  </div>

  <div class="p-6 border-b border-medical-blue-50 bg-gray-50">
    <div class="flex flex-wrap gap-4">
      <div class="flex-1 min-w-48">
        <label class="form-label">关键词搜索</label>
        <div class="relative">
          <Icon name="search" size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-medical-text-tertiary" />
          <input
            type="text"
            class="form-input pl-10"
            bind:value={filters.keyword}
            placeholder="搜索诊断、医院、医生..."
          />
        </div>
      </div>
      <div class="w-48">
        <label class="form-label">家庭成员</label>
        <select class="form-input" bind:value={filters.familyMemberId}>
          <option value="all">全部成员</option>
          {#each $familyMembers as member (member.id)}
            <option value={member.id}>{member.avatar} {member.name}</option>
          {/each}
        </select>
      </div>
      <div class="w-48">
        <label class="form-label">医院</label>
        <select class="form-input" bind:value={filters.hospital}>
          <option value="">全部医院</option>
          {#each hospitals as hospital (hospital)}
            <option value={hospital}>{hospital}</option>
          {/each}
        </select>
      </div>
      <div class="flex items-end">
        <button class="btn-ghost" on:click={resetFilters}>
          <Icon name="close" size={14} />
          重置
        </button>
      </div>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-6">
    {#if filteredRecords.length === 0}
      <div class="h-full flex flex-col items-center justify-center text-medical-text-tertiary">
        <Icon name="fileText" size={48} />
        <p class="mt-4 text-lg font-medium">暂无就诊记录</p>
        <p class="text-sm mt-1">点击右上角按钮添加第一条就诊记录</p>
        <button class="btn-primary mt-6" on:click={openAddForm}>
          <Icon name="plus" size={16} />
          新增记录
        </button>
      </div>
    {:else}
      <div class="space-y-4">
        {#each filteredRecords as record (record.id)}
          {@const member = getMemberInfo(record.familyMemberId)}
          {@const nextVisitStatus = getNextVisitStatus(record.nextVisitDate)}
          <div class="card hover:shadow-lg transition-shadow cursor-pointer" on:click={() => openDetail(record)}>
            <div class="p-5">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl" style="background-color: {member.color}20;">
                    {member.avatar}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="font-semibold text-medical-text-primary">{member.name}</h3>
                      <span class="tag bg-medical-blue-50 text-medical-blue-500">{record.diagnosis}</span>
                    </div>
                    <div class="flex items-center gap-3 mt-1 text-sm text-medical-text-secondary">
                      <span class="flex items-center gap-1">
                        <Icon name="calendar" size={14} />
                        {formatDate(record.visitDate)}
                      </span>
                      <span class="flex items-center gap-1">
                        <Icon name="mapPin" size={14} />
                        {record.hospital}
                      </span>
                      {#if record.department}
                        <span class="flex items-center gap-1">
                          <Icon name="stethoscope" size={14} />
                          {record.department}
                        </span>
                      {/if}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  {#if nextVisitStatus}
                    <span class="tag {nextVisitStatus.class}">
                      <Icon name="bell" size={12} />
                      {nextVisitStatus.text}
                    </span>
                  {/if}
                  <div class="flex gap-1" on:click|stopPropagation>
                    <button class="icon-btn" on:click={() => openEditForm(record)} title="编辑">
                      <Icon name="edit" size={16} />
                    </button>
                    <button class="icon-btn text-medical-danger" on:click={() => confirmDelete(record)} title="删除">
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {#if record.chiefComplaint}
                <div class="mb-3">
                  <p class="text-sm text-medical-text-tertiary mb-1">主诉</p>
                  <p class="text-sm text-medical-text-secondary">{record.chiefComplaint}</p>
                </div>
              {/if}

              {#if record.prescribedMedicines && record.prescribedMedicines.length > 0}
                <div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-medical-blue-50">
                  {#each record.prescribedMedicines.slice(0, 3) as med (med.medicineId || med.medicineName)}
                    <span class="inline-flex items-center gap-1 px-2 py-1 bg-medical-green-50 text-medical-green-600 rounded-md text-xs">
                      <Icon name="pill" size={12} />
                      {med.medicineName}
                    </span>
                  {/each}
                  {#if record.prescribedMedicines.length > 3}
                    <span class="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs">
                      +{record.prescribedMedicines.length - 3} 种
                    </span>
                  {/if}
                </div>
              {/if}

              {#if record.totalFee}
                <div class="flex items-center gap-4 mt-3 pt-3 border-t border-medical-blue-50 text-sm">
                  {#if record.consultationFee}
                    <span class="text-medical-text-secondary">
                      诊疗费：<span class="font-medium text-medical-text-primary">¥{record.consultationFee}</span>
                    </span>
                  {/if}
                  {#if record.medicineFee}
                    <span class="text-medical-text-secondary">
                      药费：<span class="font-medium text-medical-text-primary">¥{record.medicineFee}</span>
                    </span>
                  {/if}
                  <span class="text-medical-text-secondary">
                    总计：<span class="font-medium text-medical-blue-500">¥{record.totalFee}</span>
                  </span>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<MedicalRecordForm
  bind:show={showForm}
  record={editingRecord}
  isEdit={isEdit}
  on:submit={() => { showForm = false; editingRecord = null }}
  on:close={() => { showForm = false; editingRecord = null }}
/>

<MedicalRecordDetail
  bind:show={showDetail}
  record={selectedRecord}
  on:close={() => { showDetail = false; selectedRecord = null }}
  on:edit={(e) => { showDetail = false; openEditForm(e.detail) }}
/>

<Modal show={showDeleteConfirm} title="确认删除" width="420px" on:close={() => showDeleteConfirm = false}>
  <div class="text-center py-4">
    <div class="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
      <Icon name="alert" size={32} color="#EF4444" />
    </div>
    <p class="text-lg font-medium text-medical-text-primary mb-2">确认删除这条就诊记录？</p>
    <p class="text-sm text-medical-text-secondary">删除后将无法恢复，相关的处方信息也会被移除</p>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => showDeleteConfirm = false}>取消</button>
    <button class="btn-primary bg-medical-danger hover:bg-red-600" on:click={handleDelete}>确认删除</button>
  </div>
</Modal>
