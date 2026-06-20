<script>
  import Icon from '../components/Icon.svelte'
  import MedicineCard from '../components/MedicineCard.svelte'
  import Modal from '../components/Modal.svelte'
  import {
    medicines,
    addMedicine,
    addMedicinesBatch,
    updateMedicine,
    deleteMedicine,
    toggleMarkedExpired,
    markAllExpired
  } from '../stores/medicines.js'
  import { familyMembers } from '../stores/familyMembers.js'
  import {
    MEDICINE_CATEGORIES,
    CATEGORY_LABELS,
    STORAGE_LOCATIONS,
    DOSAGE_UNITS,
    EXPIRY_STATUS
  } from '../utils/constants.js'
  import {
    getExpiryStatus,
    getDaysUntilExpiry,
    formatDate,
    todayISO
  } from '../utils/helpers.js'

  let searchQuery = ''
  let filterCategory = 'all'
  let filterStatus = 'all'
  let filterLocation = 'all'
  let filterMember = 'all'
  let sortBy = 'expiry'

  let showFormModal = false
  let showBatchModal = false
  let showDetailModal = false
  let showScanModal = false
  let showDeleteConfirm = false
  let editingMedicine = null
  let selectedMedicineId = null
  let deletingMedicineId = null

  $: selectedMedicine = $medicines.find((m) => m.id === selectedMedicineId) || null

  let form = getDefaultForm()
  let batchRows = [getDefaultForm()]

  let cameraActive = false
  let scannedBarcode = ''

  function getDefaultForm() {
    return {
      name: '',
      category: MEDICINE_CATEGORIES.OTC,
      specification: '',
      manufacturer: '',
      barcode: '',
      batchNumber: '',
      expiryDate: '',
      location: STORAGE_LOCATIONS[0],
      quantity: 1,
      unit: '盒',
      dosage: '1',
      dosageUnit: DOSAGE_UNITS[0],
      frequency: '',
      usage: '',
      indications: '',
      contraindications: '',
      sideEffects: '',
      notes: '',
      instructionFile: null,
      familyMemberIds: []
    }
  }

  $: filteredMedicines = $medicines.filter((m) => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.barcode?.includes(searchQuery)) {
      return false
    }
    if (filterCategory !== 'all' && m.category !== filterCategory) return false
    if (filterStatus !== 'all') {
      const status = getExpiryStatus(m.expiryDate)
      if (filterStatus === 'expired' && status !== EXPIRY_STATUS.EXPIRED) return false
      if (filterStatus === 'warning' && status !== EXPIRY_STATUS.WARNING) return false
      if (filterStatus === 'normal' && status !== EXPIRY_STATUS.NORMAL) return false
      if (filterStatus === 'marked' && !m.markedExpired) return false
    }
    if (filterLocation !== 'all' && !m.location?.includes(filterLocation)) return false
    if (filterMember !== 'all' && !m.familyMemberIds?.includes(filterMember)) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'expiry') {
      return getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate)
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'zh')
    }
    if (sortBy === 'created') {
      return new Date(b.createdAt) - new Date(a.createdAt)
    }
    return 0
  })

  function openAddForm() {
    editingMedicine = null
    form = getDefaultForm()
    showFormModal = true
  }

  function openEditForm(medicine) {
    editingMedicine = medicine
    form = { ...medicine }
    showFormModal = true
  }

  function openDetail(medicine) {
    selectedMedicineId = medicine.id
    showDetailModal = true
  }

  function requestDelete(id) {
    deletingMedicineId = id
    showDeleteConfirm = true
  }

  function confirmDelete() {
    if (deletingMedicineId) {
      deleteMedicine(deletingMedicineId)
      showDetailModal = false
      showDeleteConfirm = false
      deletingMedicineId = null
    }
  }

  function cancelDelete() {
    showDeleteConfirm = false
    deletingMedicineId = null
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      alert('请输入药品名称')
      return
    }
    if (editingMedicine) {
      updateMedicine(editingMedicine.id, form)
    } else {
      addMedicine(form)
    }
    showFormModal = false
  }

  function addBatchRow() {
    batchRows.push(getDefaultForm())
    batchRows = batchRows
  }

  function removeBatchRow(index) {
    if (batchRows.length > 1) {
      batchRows.splice(index, 1)
      batchRows = batchRows
    }
  }

  function handleBatchSubmit() {
    const validRows = batchRows.filter((r) => r.name.trim())
    if (validRows.length === 0) {
      alert('请至少填写一行药品信息')
      return
    }
    addMedicinesBatch(validRows)
    batchRows = [getDefaultForm()]
    showBatchModal = false
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        form.instructionFile = {
          name: file.name,
          type: file.type,
          data: ev.target.result
        }
      }
      reader.readAsDataURL(file)
    }
  }

  function toggleMember(id) {
    if (!form.familyMemberIds) form.familyMemberIds = []
    const idx = form.familyMemberIds.indexOf(id)
    if (idx >= 0) {
      form.familyMemberIds.splice(idx, 1)
    } else {
      form.familyMemberIds.push(id)
    }
    form = form
  }

  function startScanner() {
    showScanModal = true
    cameraActive = true
    setTimeout(() => {
      scannedBarcode = '690' + Math.floor(Math.random() * 100000000000).toString().padStart(10, '0')
    }, 2000)
  }

  function applyScannedBarcode() {
    if (scannedBarcode) {
      form.barcode = scannedBarcode
      showScanModal = false
      cameraActive = false
      if (!showFormModal) {
        openAddForm()
      }
    }
  }

  function stopScanner() {
    cameraActive = false
    showScanModal = false
  }
</script>

<div class="h-full flex flex-col">
  <div class="p-6 border-b border-medical-blue-50 bg-white">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold text-medical-text-primary">药品管理</h2>
        <p class="text-sm text-medical-text-secondary mt-1">共 {filteredMedicines.length} / {$medicines.length} 种药品</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-secondary" on:click={startScanner}>
          <Icon name="scan" size={16} />
          <span class="ml-1.5">扫码录入</span>
        </button>
        <button class="btn-ghost" on:click={() => showBatchModal = true}>
          <Icon name="upload" size={16} />
          <span class="ml-1.5">批量录入</span>
        </button>
        <button class="btn-primary" on:click={openAddForm}>
          <Icon name="plus" size={16} />
          <span class="ml-1.5">添加药品</span>
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-[200px]">
        <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon name="search" size={16} color="#9CA3AF" />
        </div>
        <input
          type="text"
          class="input-base pl-9"
          placeholder="搜索药品名称、厂家、条形码..."
          bind:value={searchQuery}
        />
      </div>
      <select class="input-base w-auto" bind:value={filterCategory}>
        <option value="all">全部分类</option>
        <option value={MEDICINE_CATEGORIES.PRESCRIPTION}>处方药</option>
        <option value={MEDICINE_CATEGORIES.OTC}>非处方药</option>
        <option value={MEDICINE_CATEGORIES.EXTERNAL}>外用药</option>
      </select>
      <select class="input-base w-auto" bind:value={filterStatus}>
        <option value="all">全部状态</option>
        <option value="normal">正常</option>
        <option value="warning">临期</option>
        <option value="expired">已过期</option>
        <option value="marked">已标记处理</option>
      </select>
      <select class="input-base w-auto" bind:value={filterLocation}>
        <option value="all">全部位置</option>
        {#each STORAGE_LOCATIONS as loc}
          <option value={loc}>{loc}</option>
        {/each}
      </select>
      <select class="input-base w-auto" bind:value={filterMember}>
        <option value="all">全部成员</option>
        {#each $familyMembers as member}
          <option value={member.id}>{member.avatar} {member.name}</option>
        {/each}
      </select>
      <select class="input-base w-auto" bind:value={sortBy}>
        <option value="expiry">按有效期排序</option>
        <option value="name">按名称排序</option>
        <option value="created">按添加时间排序</option>
      </select>
      <button class="btn-ghost text-sm" on:click={markAllExpired} title="一键标记所有过期药品">
        <Icon name="check" size={16} />
        <span class="ml-1.5">一键标记过期</span>
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-6">
    {#if filteredMedicines.length === 0}
      <div class="h-full flex flex-col items-center justify-center py-20">
        <div class="w-20 h-20 rounded-full bg-medical-blue-50 flex items-center justify-center mb-4">
          <Icon name="box" size={40} color="#93C5FD" />
        </div>
        <p class="text-medical-text-secondary mb-4">暂无符合条件的药品</p>
        <button class="btn-primary" on:click={openAddForm}>
          <Icon name="plus" size={16} />
          <span class="ml-1.5">添加第一个药品</span>
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each filteredMedicines as medicine (medicine.id)}
          <div on:click={() => openDetail(medicine)}>
            <MedicineCard {medicine} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<Modal show={showFormModal} title={editingMedicine ? '编辑药品' : '添加药品'} width="640px" on:close={() => showFormModal = false}>
  <div class="space-y-5">
    <div class="grid grid-cols-2 gap-4">
      <div class="col-span-2">
        <label class="label-base">药品名称 <span class="text-medical-danger">*</span></label>
        <input type="text" class="input-base" placeholder="如：阿莫西林胶囊" bind:value={form.name} />
      </div>
      <div>
        <label class="label-base">药品分类</label>
        <select class="input-base" bind:value={form.category}>
          <option value={MEDICINE_CATEGORIES.PRESCRIPTION}>处方药</option>
          <option value={MEDICINE_CATEGORIES.OTC}>非处方药</option>
          <option value={MEDICINE_CATEGORIES.EXTERNAL}>外用药</option>
        </select>
      </div>
      <div>
        <label class="label-base">规格</label>
        <input type="text" class="input-base" placeholder="如：0.25g*24粒" bind:value={form.specification} />
      </div>
      <div>
        <label class="label-base">生产厂家</label>
        <input type="text" class="input-base" placeholder="如：华北制药" bind:value={form.manufacturer} />
      </div>
      <div>
        <label class="label-base">条形码</label>
        <div class="flex gap-2">
          <input type="text" class="input-base flex-1" placeholder="扫描或手动输入" bind:value={form.barcode} />
          <button class="btn-secondary px-3" on:click={startScanner}>
            <Icon name="scan" size={16} />
          </button>
        </div>
      </div>
      <div>
        <label class="label-base">批号</label>
        <input type="text" class="input-base" placeholder="如：A20250101" bind:value={form.batchNumber} />
      </div>
      <div>
        <label class="label-base">有效期至 <span class="text-medical-danger">*</span></label>
        <input type="date" class="input-base" bind:value={form.expiryDate} />
      </div>
      <div>
        <label class="label-base">存放位置</label>
        <select class="input-base" bind:value={form.location}>
          {#each STORAGE_LOCATIONS as loc}
            <option value={loc}>{loc}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="label-base">库存数量</label>
        <div class="flex gap-2">
          <input type="number" class="input-base flex-1" min="0" bind:value={form.quantity} />
          <input type="text" class="input-base w-20" placeholder="单位" bind:value={form.unit} />
        </div>
      </div>
    </div>

    <div class="pt-4 border-t border-medical-blue-50">
      <p class="text-sm font-medium text-medical-text-secondary mb-3">用法用量</p>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="label-base">单次剂量</label>
          <div class="flex gap-2">
            <input type="number" class="input-base flex-1" bind:value={form.dosage} />
            <select class="input-base w-20" bind:value={form.dosageUnit}>
              {#each DOSAGE_UNITS as u}
                <option value={u}>{u}</option>
              {/each}
            </select>
          </div>
        </div>
        <div>
          <label class="label-base">服用频率</label>
          <input type="text" class="input-base" placeholder="如：每日3次" bind:value={form.frequency} />
        </div>
        <div>
          <label class="label-base">使用方法</label>
          <input type="text" class="input-base" placeholder="如：饭后温水送服" bind:value={form.usage} />
        </div>
      </div>
    </div>

    <div class="pt-4 border-t border-medical-blue-50">
      <p class="text-sm font-medium text-medical-text-secondary mb-3">药品说明</p>
      <div class="space-y-4">
        <div>
          <label class="label-base">适应症</label>
          <textarea class="input-base h-20 resize-none" placeholder="用于..." bind:value={form.indications}></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label-base">禁忌症</label>
            <textarea class="input-base h-20 resize-none" bind:value={form.contraindications}></textarea>
          </div>
          <div>
            <label class="label-base">不良反应</label>
            <textarea class="input-base h-20 resize-none" bind:value={form.sideEffects}></textarea>
          </div>
        </div>
      </div>
    </div>

    <div class="pt-4 border-t border-medical-blue-50">
      <label class="label-base">适用家庭成员</label>
      <div class="flex flex-wrap gap-2 mt-2">
        {#each $familyMembers as member}
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-sm border-2 transition-all {form.familyMemberIds?.includes(member.id) ? 'border-medical-blue-400 bg-medical-blue-50 text-medical-blue-500' : 'border-gray-200 text-medical-text-secondary hover:border-medical-blue-200'}"
            on:click={() => toggleMember(member.id)}
          >
            {member.avatar} {member.name}
          </button>
        {/each}
      </div>
    </div>

    <div class="pt-4 border-t border-medical-blue-50">
      <label class="label-base">药品说明书（电子版存档）</label>
      <div class="border-2 border-dashed border-medical-blue-100 rounded-lg p-6 text-center hover:border-medical-blue-300 transition-colors cursor-pointer">
        <input type="file" id="instruction-upload" accept=".pdf,.jpg,.jpeg,.png" class="hidden" on:change={handleFileUpload} />
        {#if form.instructionFile}
          <div class="flex items-center justify-center gap-2">
            <Icon name="file" size={20} color="#3B82F6" />
            <span class="text-sm text-medical-blue-500">{form.instructionFile.name}</span>
          </div>
        {:else}
          <label for="instruction-upload" class="cursor-pointer">
            <Icon name="upload" size={24} color="#9CA3AF" />
            <p class="text-sm text-medical-text-secondary mt-2">点击上传或拖拽 PDF/图片文件</p>
          </label>
        {/if}
      </div>
    </div>

    <div>
      <label class="label-base">备注</label>
      <textarea class="input-base h-20 resize-none" bind:value={form.notes}></textarea>
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => showFormModal = false}>取消</button>
    <button class="btn-primary" on:click={handleSubmit}>{editingMedicine ? '保存修改' : '添加药品'}</button>
  </div>
</Modal>

<Modal show={showBatchModal} title="批量录入药品" width="720px">
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-medical-blue-50">
          <th class="text-left py-2 px-2 font-medium text-medical-text-secondary">药品名称 *</th>
          <th class="text-left py-2 px-2 font-medium text-medical-text-secondary">分类</th>
          <th class="text-left py-2 px-2 font-medium text-medical-text-secondary">规格</th>
          <th class="text-left py-2 px-2 font-medium text-medical-text-secondary">有效期</th>
          <th class="text-left py-2 px-2 font-medium text-medical-text-secondary">位置</th>
          <th class="text-left py-2 px-2 font-medium text-medical-text-secondary">数量</th>
          <th class="py-2 px-2 w-8"></th>
        </tr>
      </thead>
      <tbody>
        {#each batchRows as row, index}
          <tr class="border-b border-medical-blue-50">
            <td class="py-2 px-1">
              <input type="text" class="input-base text-sm" placeholder="药品名称" bind:value={row.name} />
            </td>
            <td class="py-2 px-1">
              <select class="input-base text-sm" bind:value={row.category}>
                <option value={MEDICINE_CATEGORIES.PRESCRIPTION}>处方</option>
                <option value={MEDICINE_CATEGORIES.OTC}>非处方</option>
                <option value={MEDICINE_CATEGORIES.EXTERNAL}>外用</option>
              </select>
            </td>
            <td class="py-2 px-1">
              <input type="text" class="input-base text-sm" placeholder="规格" bind:value={row.specification} />
            </td>
            <td class="py-2 px-1">
              <input type="date" class="input-base text-sm" bind:value={row.expiryDate} />
            </td>
            <td class="py-2 px-1">
              <select class="input-base text-sm" bind:value={row.location}>
                {#each STORAGE_LOCATIONS as loc}
                  <option value={loc}>{loc}</option>
                {/each}
              </select>
            </td>
            <td class="py-2 px-1">
              <input type="number" class="input-base text-sm w-16" min="0" bind:value={row.quantity} />
            </td>
            <td class="py-2 px-1">
              <button class="w-8 h-8 rounded-lg text-medical-text-secondary hover:bg-red-50 hover:text-medical-danger transition-all" on:click={() => removeBatchRow(index)}>
                <Icon name="trash" size={16} />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <button class="mt-3 w-full py-2 border-2 border-dashed border-medical-blue-100 rounded-lg text-sm text-medical-blue-500 hover:border-medical-blue-300 hover:bg-medical-blue-50 transition-all" on:click={addBatchRow}>
      <Icon name="plus" size={16} />
      <span class="ml-1">添加一行</span>
    </button>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => showBatchModal = false}>取消</button>
    <button class="btn-primary" on:click={handleBatchSubmit}>批量添加</button>
  </div>
</Modal>

<Modal show={showDetailModal && selectedMedicine} title={selectedMedicine?.name || ''} width="640px">
  {#if selectedMedicine}
    <div class="space-y-5">
      <div class="flex items-start gap-4">
        <div class="w-16 h-16 rounded-xl bg-medical-blue-50 flex items-center justify-center flex-shrink-0">
          <Icon name="pill" size={32} color="#3B82F6" />
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-medical-text-primary">{selectedMedicine.name}</h3>
          <p class="text-sm text-medical-text-secondary mt-1">{selectedMedicine.specification || '-'}</p>
          <div class="flex flex-wrap gap-2 mt-3">
            <span class="tag {selectedMedicine.category === MEDICINE_CATEGORIES.PRESCRIPTION ? 'bg-red-50 text-red-600' : selectedMedicine.category === MEDICINE_CATEGORIES.EXTERNAL ? 'bg-medical-blue-100 text-medical-blue-500' : 'bg-medical-green-100 text-medical-green-500'}">
              {CATEGORY_LABELS[selectedMedicine.category]}
            </span>
            <span class="tag {getExpiryStatus(selectedMedicine.expiryDate) === EXPIRY_STATUS.EXPIRED ? 'bg-red-50 text-medical-danger' : getExpiryStatus(selectedMedicine.expiryDate) === EXPIRY_STATUS.WARNING ? 'bg-amber-50 text-medical-warning' : 'bg-medical-green-50 text-medical-green-500'}">
              {getExpiryStatus(selectedMedicine.expiryDate) === EXPIRY_STATUS.EXPIRED ? `已过期 ${Math.abs(getDaysUntilExpiry(selectedMedicine.expiryDate))} 天` : getExpiryStatus(selectedMedicine.expiryDate) === EXPIRY_STATUS.WARNING ? `剩余 ${getDaysUntilExpiry(selectedMedicine.expiryDate)} 天` : `剩余 ${getDaysUntilExpiry(selectedMedicine.expiryDate)} 天`}
            </span>
            {#if selectedMedicine.markedExpired}
              <span class="tag bg-gray-100 text-gray-500">已标记处理</span>
            {/if}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 pt-4 border-t border-medical-blue-50">
        <div>
          <p class="text-xs text-medical-text-tertiary">生产厂家</p>
          <p class="text-sm text-medical-text-primary mt-0.5">{selectedMedicine.manufacturer || '-'}</p>
        </div>
        <div>
          <p class="text-xs text-medical-text-tertiary">条形码</p>
          <p class="text-sm text-medical-text-primary mt-0.5">{selectedMedicine.barcode || '-'}</p>
        </div>
        <div>
          <p class="text-xs text-medical-text-tertiary">批号</p>
          <p class="text-sm text-medical-text-primary mt-0.5">{selectedMedicine.batchNumber || '-'}</p>
        </div>
        <div>
          <p class="text-xs text-medical-text-tertiary">有效期至</p>
          <p class="text-sm text-medical-text-primary mt-0.5">{formatDate(selectedMedicine.expiryDate)}</p>
        </div>
        <div>
          <p class="text-xs text-medical-text-tertiary">存放位置</p>
          <p class="text-sm text-medical-text-primary mt-0.5">{selectedMedicine.location || '-'}</p>
        </div>
        <div>
          <p class="text-xs text-medical-text-tertiary">库存</p>
          <p class="text-sm text-medical-text-primary mt-0.5">{selectedMedicine.quantity || 0} {selectedMedicine.unit || '盒'}</p>
        </div>
      </div>

      {#if selectedMedicine.dosage || selectedMedicine.frequency}
        <div class="pt-4 border-t border-medical-blue-50">
          <p class="text-sm font-medium text-medical-text-secondary mb-2">用法用量</p>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <p class="text-xs text-medical-text-tertiary">剂量</p>
              <p class="text-sm text-medical-text-primary mt-0.5">{selectedMedicine.dosage || '-'} {selectedMedicine.dosageUnit || ''}</p>
            </div>
            <div>
              <p class="text-xs text-medical-text-tertiary">频率</p>
              <p class="text-sm text-medical-text-primary mt-0.5">{selectedMedicine.frequency || '-'}</p>
            </div>
            <div>
              <p class="text-xs text-medical-text-tertiary">方法</p>
              <p class="text-sm text-medical-text-primary mt-0.5">{selectedMedicine.usage || '-'}</p>
            </div>
          </div>
        </div>
      {/if}

      {#if selectedMedicine.indications || selectedMedicine.contraindications || selectedMedicine.sideEffects}
        <div class="pt-4 border-t border-medical-blue-50 space-y-3">
          {#if selectedMedicine.indications}
            <div>
              <p class="text-sm font-medium text-medical-text-secondary">适应症</p>
              <p class="text-sm text-medical-text-primary mt-1">{selectedMedicine.indications}</p>
            </div>
          {/if}
          {#if selectedMedicine.contraindications}
            <div>
              <p class="text-sm font-medium text-medical-text-secondary">禁忌症</p>
              <p class="text-sm text-medical-text-primary mt-1">{selectedMedicine.contraindications}</p>
            </div>
          {/if}
          {#if selectedMedicine.sideEffects}
            <div>
              <p class="text-sm font-medium text-medical-text-secondary">不良反应</p>
              <p class="text-sm text-medical-text-primary mt-1">{selectedMedicine.sideEffects}</p>
            </div>
          {/if}
        </div>
      {/if}

      {#if selectedMedicine.familyMemberIds?.length > 0}
        <div class="pt-4 border-t border-medical-blue-50">
          <p class="text-sm font-medium text-medical-text-secondary mb-2">适用成员</p>
          <div class="flex flex-wrap gap-2">
            {#each selectedMedicine.familyMemberIds as mid}
              {#each $familyMembers as m}
                {#if m.id === mid}
                  <span class="px-3 py-1.5 rounded-lg text-sm bg-medical-blue-50 text-medical-blue-500">
                    {m.avatar} {m.name}
                  </span>
                {/if}
              {/each}
            {/each}
          </div>
        </div>
      {/if}

      {#if selectedMedicine.instructionFile}
        <div class="pt-4 border-t border-medical-blue-50">
          <p class="text-sm font-medium text-medical-text-secondary mb-2">说明书</p>
          <a href={selectedMedicine.instructionFile.data} download={selectedMedicine.instructionFile.name} class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-medical-blue-50 text-medical-blue-500 hover:bg-medical-blue-100 transition-all">
            <Icon name="download" size={16} />
            <span class="text-sm">{selectedMedicine.instructionFile.name}</span>
          </a>
        </div>
      {/if}

      {#if selectedMedicine.notes}
        <div class="pt-4 border-t border-medical-blue-50">
          <p class="text-sm font-medium text-medical-text-secondary">备注</p>
          <p class="text-sm text-medical-text-primary mt-1">{selectedMedicine.notes}</p>
        </div>
      {/if}
    </div>
  {/if}
  <div slot="footer">
    <button class="btn-danger" on:click={() => requestDelete(selectedMedicine.id)}>
      <Icon name="trash" size={16} />
      <span class="ml-1">删除</span>
    </button>
    <button class="btn-secondary" on:click={() => toggleMarkedExpired(selectedMedicine.id)}>
      <Icon name="check" size={16} />
      <span class="ml-1">{selectedMedicine?.markedExpired ? '取消标记' : '标记已处理'}</span>
    </button>
    <button class="btn-ghost" on:click={() => showDetailModal = false}>关闭</button>
    <button class="btn-primary" on:click={() => { showDetailModal = false; openEditForm(selectedMedicine) }}>
      <Icon name="edit" size={16} />
      <span class="ml-1">编辑</span>
    </button>
  </div>
</Modal>

<Modal show={showScanModal} title="扫描条形码" width="520px">
  <div class="space-y-4">
    <div class="relative aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
      {#if cameraActive}
        <div class="text-center">
          <div class="w-48 h-32 border-2 border-medical-green-400 rounded-lg mx-auto relative">
            <div class="absolute inset-x-0 top-1/2 h-0.5 bg-medical-green-400 animate-pulse"></div>
          </div>
          <p class="text-white text-sm mt-4">{scannedBarcode ? '识别成功！' : '正在识别条形码...'}</p>
        </div>
      {:else}
        <Icon name="camera" size={48} color="#6B7280" />
      {/if}
    </div>
    <div>
      <label class="label-base">扫描结果</label>
      <input type="text" class="input-base font-mono" placeholder="条形码将自动填入..." bind:value={scannedBarcode} />
    </div>
    <p class="text-xs text-medical-text-tertiary">提示：将条形码对准相机取景框，或手动输入条形码编号</p>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={stopScanner}>取消</button>
    <button class="btn-primary" on:click={applyScannedBarcode} disabled={!scannedBarcode}>确认使用</button>
  </div>
</Modal>

<Modal show={showDeleteConfirm} title="确认删除" width="400px" on:close={cancelDelete}>
  <div class="py-4">
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
        <Icon name="alert" size={20} color="#EF4444" />
      </div>
      <div>
        <p class="font-medium text-medical-text-primary">确定要删除此药品吗？</p>
        <p class="text-sm text-medical-text-secondary mt-1">删除后将无法恢复，相关用药记录不会被删除。</p>
      </div>
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={cancelDelete}>取消</button>
    <button class="btn-danger" on:click={confirmDelete}>确认删除</button>
  </div>
</Modal>
