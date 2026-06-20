<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import Icon from './Icon.svelte'
  import Modal from './Modal.svelte'
  import { familyMembers, getMemberById } from '../stores/familyMembers.js'
  import { medicines, addMedicine } from '../stores/medicines.js'
  import { addMedicalRecord, updateMedicalRecord } from '../stores/medicalRecords.js'
  import { todayISO, generateId } from '../utils/helpers.js'
  import { MEDICINE_CATEGORIES, DOSAGE_UNITS } from '../utils/constants.js'

  const dispatch = createEventDispatcher()

  export let show = false
  export let record = null
  export let isEdit = false

  let form = {
    visitDate: todayISO(),
    hospital: '',
    department: '',
    doctor: '',
    familyMemberId: 'me',
    chiefComplaint: '',
    diagnosis: '',
    medicalSummary: '',
    attachments: [],
    consultationFee: '',
    medicineFee: '',
    totalFee: '',
    prescribedMedicines: [],
    nextVisitDate: '',
    notes: ''
  }

  let activeTab = 'basic'
  let showMedicinePicker = false
  let showQuickAddMedicine = false
  let newMedicine = {
    name: '',
    category: MEDICINE_CATEGORIES.OTC,
    specification: '',
    manufacturer: ''
  }
  let selectedMedicines = new Set()
  let newPrescription = {
    medicineId: '',
    medicineName: '',
    dosage: '1',
    dosageUnit: '粒',
    frequency: '每日3次',
    duration: '7天'
  }

  $: {
    if (form.consultationFee && form.medicineFee) {
      form.totalFee = (parseFloat(form.consultationFee) + parseFloat(form.medicineFee)).toString()
    }
  }

  function resetForm() {
    form = {
      visitDate: todayISO(),
      hospital: '',
      department: '',
      doctor: '',
      familyMemberId: 'me',
      chiefComplaint: '',
      diagnosis: '',
      medicalSummary: '',
      attachments: [],
      consultationFee: '',
      medicineFee: '',
      totalFee: '',
      prescribedMedicines: [],
      nextVisitDate: '',
      notes: ''
    }
    activeTab = 'basic'
    selectedMedicines = new Set()
    showMedicinePicker = false
    showQuickAddMedicine = false
  }

  function loadRecord() {
    if (record) {
      form = { ...record }
      selectedMedicines = new Set(record.prescribedMedicines?.map(m => m.medicineId).filter(Boolean) || [])
    }
  }

  $: if (show) {
    if (isEdit && record) {
      loadRecord()
    } else {
      resetForm()
    }
  }

  function handleFileUpload(e) {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        form.attachments.push({
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: event.target.result
        })
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removeAttachment(id) {
    form.attachments = form.attachments.filter(a => a.id !== id)
  }

  function openMedicinePicker() {
    showMedicinePicker = true
  }

  function toggleMedicine(medicine) {
    if (selectedMedicines.has(medicine.id)) {
      selectedMedicines.delete(medicine.id)
      form.prescribedMedicines = form.prescribedMedicines.filter(m => m.medicineId !== medicine.id)
    } else {
      selectedMedicines.add(medicine.id)
      form.prescribedMedicines.push({
        medicineId: medicine.id,
        medicineName: medicine.name,
        dosage: medicine.dosage || '1',
        dosageUnit: medicine.dosageUnit || '粒',
        frequency: medicine.frequency || '每日3次',
        duration: '7天'
      })
    }
    selectedMedicines = selectedMedicines
  }

  function addQuickMedicine() {
    if (!newMedicine.name.trim()) return
    const medicine = addMedicine({
      ...newMedicine,
      expiryDate: '2028-12-31',
      quantity: 1,
      unit: '盒',
      location: '客厅药箱'
    })
    selectedMedicines.add(medicine.id)
    form.prescribedMedicines.push({
      medicineId: medicine.id,
      medicineName: medicine.name,
      dosage: '1',
      dosageUnit: '粒',
      frequency: '每日3次',
      duration: '7天'
    })
    showQuickAddMedicine = false
    newMedicine = {
      name: '',
      category: MEDICINE_CATEGORIES.OTC,
      specification: '',
      manufacturer: ''
    }
    selectedMedicines = selectedMedicines
  }

  function addCustomMedicine() {
    if (!newPrescription.medicineName.trim()) return
    form.prescribedMedicines.push({
      ...newPrescription
    })
    newPrescription = {
      medicineId: '',
      medicineName: '',
      dosage: '1',
      dosageUnit: '粒',
      frequency: '每日3次',
      duration: '7天'
    }
  }

  function removePrescription(index) {
    const med = form.prescribedMedicines[index]
    if (med.medicineId) {
      selectedMedicines.delete(med.medicineId)
      selectedMedicines = selectedMedicines
    }
    form.prescribedMedicines.splice(index, 1)
    form.prescribedMedicines = form.prescribedMedicines
  }

  function updatePrescription(index, field, value) {
    form.prescribedMedicines[index][field] = value
    form.prescribedMedicines = form.prescribedMedicines
  }

  function handleSubmit() {
    if (!form.visitDate || !form.hospital || !form.diagnosis) {
      alert('请填写必要信息：就诊日期、医院、诊断结果')
      return
    }

    const data = {
      ...form,
      consultationFee: form.consultationFee ? parseFloat(form.consultationFee) : null,
      medicineFee: form.medicineFee ? parseFloat(form.medicineFee) : null,
      totalFee: form.totalFee ? parseFloat(form.totalFee) : null
    }

    if (isEdit && record) {
      updateMedicalRecord(record.id, data)
    } else {
      addMedicalRecord(data)
    }

    dispatch('submit')
    show = false
    resetForm()
  }

  function handleClose() {
    show = false
    dispatch('close')
  }

  const tabs = [
    { id: 'basic', label: '基础信息', icon: 'clipboard' },
    { id: 'diagnosis', label: '诊断信息', icon: 'activity' },
    { id: 'medicines', label: '处方药品', icon: 'pill' },
    { id: 'attachments', label: '附件资料', icon: 'paperclip' },
    { id: 'fees', label: '费用信息', icon: 'dollarSign' }
  ]
</script>

<Modal {show} title={isEdit ? '编辑就诊记录' : '新增就诊记录'} width="720px" on:close={handleClose}>
  <div class="flex flex-col h-full">
    <div class="flex gap-1 p-1 bg-medical-blue-50 rounded-lg mb-4">
      {#each tabs as tab (tab.id)}
        <button
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all {activeTab === tab.id ? 'bg-white text-medical-blue-500 shadow-sm' : 'text-medical-text-secondary hover:text-medical-text-primary'}"
          on:click={() => activeTab = tab.id}
        >
          <Icon name={tab.icon} size={14} />
          <span>{tab.label}</span>
        </button>
      {/each}
    </div>

    <div class="flex-1 overflow-y-auto">
      {#if activeTab === 'basic'}
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">就诊日期 <span class="text-medical-danger">*</span></label>
              <input type="date" class="form-input" bind:value={form.visitDate} />
            </div>
            <div class="form-group">
              <label class="form-label">就诊成员 <span class="text-medical-danger">*</span></label>
              <select class="form-input" bind:value={form.familyMemberId}>
                {#each $familyMembers as member (member.id)}
                  <option value={member.id}>{member.avatar} {member.name}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">医院 <span class="text-medical-danger">*</span></label>
            <input type="text" class="form-input" bind:value={form.hospital} placeholder="请输入医院名称" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">科室</label>
              <input type="text" class="form-input" bind:value={form.department} placeholder="如：内科、外科、儿科等" />
            </div>
            <div class="form-group">
              <label class="form-label">主治医生</label>
              <input type="text" class="form-input" bind:value={form.doctor} placeholder="请输入医生姓名" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">下次复诊日期</label>
            <div class="flex gap-2">
              <input type="date" class="form-input" bind:value={form.nextVisitDate} />
              {#if form.nextVisitDate}
                <button class="btn-ghost px-3" on:click={() => form.nextVisitDate = ''}>
                  <Icon name="close" size={16} />
                </button>
              {/if}
            </div>
            <p class="text-xs text-medical-text-tertiary mt-1">设置后到期会在首页提醒</p>
          </div>

          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea class="form-input" rows="2" bind:value={form.notes} placeholder="其他需要记录的信息"></textarea>
          </div>
        </div>
      {/if}

      {#if activeTab === 'diagnosis'}
        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label">主诉</label>
            <textarea class="form-input" rows="2" bind:value={form.chiefComplaint} placeholder="患者主要症状和就诊原因"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">诊断结果 <span class="text-medical-danger">*</span></label>
            <input type="text" class="form-input" bind:value={form.diagnosis} placeholder="如：上呼吸道感染、高血压等" />
          </div>

          <div class="form-group">
            <label class="form-label">病历摘要</label>
            <textarea class="form-input" rows="6" bind:value={form.medicalSummary} placeholder="详细记录病史、查体、检查结果、治疗方案等"></textarea>
          </div>
        </div>
      {/if}

      {#if activeTab === 'medicines'}
        <div class="space-y-4">
          <div class="flex gap-2 mb-4">
            <button class="btn-primary flex-1" on:click={openMedicinePicker}>
              <Icon name="plus" size={16} />
              从药品库选择
            </button>
            <button class="btn-outline flex-1" on:click={() => showQuickAddMedicine = true}>
              <Icon name="plus" size={16} />
              快速新增药品
            </button>
          </div>

          <div class="space-y-3">
            <div class="flex items-center gap-3 p-3 bg-medical-blue-50 rounded-lg">
              <input type="text" class="form-input flex-1" bind:value={newPrescription.medicineName} placeholder="药品名称（手动输入）" />
              <input type="text" class="form-input w-20" bind:value={newPrescription.dosage} placeholder="剂量" />
              <select class="form-input w-20" bind:value={newPrescription.dosageUnit}>
                {#each DOSAGE_UNITS as unit (unit)}
                  <option value={unit}>{unit}</option>
                {/each}
              </select>
              <button class="btn-primary px-4" on:click={addCustomMedicine}>
                <Icon name="plus" size={16} />
              </button>
            </div>
            <div class="flex gap-2 text-xs text-medical-text-tertiary px-1">
              <span class="flex-1">用法：</span>
              <select class="form-input w-24 text-xs" bind:value={newPrescription.frequency}>
                <option value="每日1次">每日1次</option>
                <option value="每日2次">每日2次</option>
                <option value="每日3次">每日3次</option>
                <option value="每日4次">每日4次</option>
                <option value="每6小时1次">每6小时1次</option>
                <option value="每8小时1次">每8小时1次</option>
                <option value="每12小时1次">每12小时1次</option>
                <option value="需要时使用">需要时使用</option>
              </select>
              <input type="text" class="form-input w-20 text-xs" bind:value={newPrescription.duration} placeholder="疗程" />
            </div>
          </div>

          {#if form.prescribedMedicines.length > 0}
            <div class="space-y-2 mt-4">
              <h4 class="text-sm font-medium text-medical-text-primary">已选药品 ({form.prescribedMedicines.length})</h4>
              {#each form.prescribedMedicines as med, index (med.medicineId || index)}
                <div class="p-3 border border-medical-blue-50 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-medical-text-primary">{med.medicineName}</span>
                    <button class="text-medical-danger hover:text-red-600 p-1" on:click={() => removePrescription(index)}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                  <div class="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <label class="text-xs text-medical-text-tertiary">剂量</label>
                      <div class="flex gap-1">
                        <input type="text" class="form-input text-sm" value={med.dosage} on:input={(e) => updatePrescription(index, 'dosage', e.target.value)} />
                        <select class="form-input text-sm" value={med.dosageUnit} on:change={(e) => updatePrescription(index, 'dosageUnit', e.target.value)}>
                          {#each DOSAGE_UNITS as unit (unit)}
                            <option value={unit}>{unit}</option>
                          {/each}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label class="text-xs text-medical-text-tertiary">用法</label>
                      <select class="form-input text-sm" value={med.frequency} on:change={(e) => updatePrescription(index, 'frequency', e.target.value)}>
                        <option value="每日1次">每日1次</option>
                        <option value="每日2次">每日2次</option>
                        <option value="每日3次">每日3次</option>
                        <option value="每日4次">每日4次</option>
                        <option value="每6小时1次">每6小时1次</option>
                        <option value="每8小时1次">每8小时1次</option>
                        <option value="每12小时1次">每12小时1次</option>
                        <option value="需要时使用">需要时使用</option>
                      </select>
                    </div>
                    <div>
                      <label class="text-xs text-medical-text-tertiary">疗程</label>
                      <input type="text" class="form-input text-sm" value={med.duration} on:input={(e) => updatePrescription(index, 'duration', e.target.value)} />
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="py-8 text-center text-medical-text-tertiary">
              <Icon name="pill" size={32} />
              <p class="mt-2">暂无处方药品</p>
            </div>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'attachments'}
        <div class="space-y-4">
          <div class="border-2 border-dashed border-medical-blue-200 rounded-xl p-6 text-center hover:border-medical-blue-400 transition-colors cursor-pointer" on:click={() => document.getElementById('file-upload').click()}>
            <input id="file-upload" type="file" multiple accept="image/*,.pdf,.doc,.docx" class="hidden" on:change={handleFileUpload} />
            <Icon name="upload" size={32} color="#3B82F6" />
            <p class="mt-2 text-sm font-medium text-medical-text-primary">点击或拖拽文件到此处上传</p>
            <p class="text-xs text-medical-text-tertiary mt-1">支持图片、PDF、Word 等格式，多文件上传</p>
          </div>

          {#if form.attachments.length > 0}
            <div class="space-y-2">
              <h4 class="text-sm font-medium text-medical-text-primary">已上传附件 ({form.attachments.length})</h4>
              {#each form.attachments as attachment (attachment.id)}
                <div class="flex items-center justify-between p-3 bg-medical-blue-50 rounded-lg">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      {#if attachment.type.startsWith('image/')}
                        <img src={attachment.data} alt={attachment.name} class="w-8 h-8 object-cover rounded" />
                      {:else}
                        <Icon name="file" size={20} color="#6B7280" />
                      {/if}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-medical-text-primary truncate max-w-xs">{attachment.name}</p>
                      <p class="text-xs text-medical-text-tertiary">{(attachment.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button class="text-medical-danger hover:text-red-600 p-2" on:click={() => removeAttachment(attachment.id)}>
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'fees'}
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">诊疗费 (元)</label>
              <input type="number" class="form-input" bind:value={form.consultationFee} placeholder="0.00" step="0.01" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">药费 (元)</label>
              <input type="number" class="form-input" bind:value={form.medicineFee} placeholder="0.00" step="0.01" min="0" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">总计 (元)</label>
            <input type="number" class="form-input bg-gray-50" bind:value={form.totalFee} placeholder="自动计算" step="0.01" readonly />
          </div>

          <div class="p-4 bg-medical-blue-50 rounded-lg">
            <div class="flex items-center gap-2 text-sm">
              <Icon name="lightbulb" size={16} color="#F59E0B" />
              <span class="text-medical-text-secondary">提示：诊疗费和药费填写后会自动计算总计金额</span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div slot="footer">
    <button class="btn-ghost" on:click={handleClose}>取消</button>
    <button class="btn-primary" on:click={handleSubmit}>{isEdit ? '保存修改' : '保存记录'}</button>
  </div>
</Modal>

<Modal show={showMedicinePicker} title="选择药品" width="560px" on:close={() => showMedicinePicker = false}>
  <div class="space-y-3 max-h-96 overflow-y-auto">
    {#each $medicines as medicine (medicine.id)}
      <div
        class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all {selectedMedicines.has(medicine.id) ? 'border-medical-blue-400 bg-medical-blue-50' : 'border-medical-blue-50 hover:border-medical-blue-200'}"
        on:click={() => toggleMedicine(medicine)}
      >
        <div class="w-5 h-5 rounded border-2 flex items-center justify-center {selectedMedicines.has(medicine.id) ? 'border-medical-blue-500 bg-medical-blue-500' : 'border-gray-300'}">
          {#if selectedMedicines.has(medicine.id)}
            <Icon name="check" size={12} color="white" />
          {/if}
        </div>
        <div class="flex-1">
          <p class="font-medium text-medical-text-primary">{medicine.name}</p>
          <p class="text-xs text-medical-text-tertiary">{medicine.specification} · {medicine.manufacturer}</p>
        </div>
      </div>
    {/each}
  </div>
  <div slot="footer">
    <button class="btn-primary" on:click={() => showMedicinePicker = false}>确定</button>
  </div>
</Modal>

<Modal show={showQuickAddMedicine} title="快速新增药品" width="480px" on:close={() => showQuickAddMedicine = false}>
  <div class="space-y-4">
    <div class="form-group">
      <label class="form-label">药品名称 <span class="text-medical-danger">*</span></label>
      <input type="text" class="form-input" bind:value={newMedicine.name} placeholder="请输入药品名称" />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="form-group">
        <label class="form-label">分类</label>
        <select class="form-input" bind:value={newMedicine.category}>
          <option value={MEDICINE_CATEGORIES.PRESCRIPTION}>处方药</option>
          <option value={MEDICINE_CATEGORIES.OTC}>非处方药</option>
          <option value={MEDICINE_CATEGORIES.EXTERNAL}>外用药</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">规格</label>
        <input type="text" class="form-input" bind:value={newMedicine.specification} placeholder="如：0.25g*24粒" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">生产厂家</label>
      <input type="text" class="form-input" bind:value={newMedicine.manufacturer} placeholder="请输入生产厂家" />
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => showQuickAddMedicine = false}>取消</button>
    <button class="btn-primary" on:click={addQuickMedicine}>添加</button>
  </div>
</Modal>
