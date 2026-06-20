<script>
  import { onMount } from 'svelte'
  import Icon from '../components/Icon.svelte'
  import Modal from '../components/Modal.svelte'
  import {
    purchaseList,
    addPurchaseItem,
    updatePurchaseItem,
    deletePurchaseItem,
    togglePurchased,
    clearPurchaseList,
    clearPurchasedItems,
    movePriorityUp,
    movePriorityDown,
    moveItemUp,
    moveItemDown,
    generateSuggestions,
    importTemplate,
    exportAsText,
    copyToClipboard,
    getSuggestedMedicineForm
  } from '../stores/purchaseList.js'
  import { addMedicine } from '../stores/medicines.js'
  import { familyMembers } from '../stores/familyMembers.js'
  import {
    PURCHASE_PRIORITY,
    PURCHASE_PRIORITY_LABELS,
    PURCHASE_PRIORITY_COLORS,
    PURCHASE_ITEM_SOURCE,
    FAMILY_MEDICINE_TEMPLATES,
    MEDICINE_CATEGORIES,
    STORAGE_LOCATIONS,
    DOSAGE_UNITS
  } from '../utils/constants.js'
  import { todayISO } from '../utils/helpers.js'

  let showAddModal = false
  let showEditModal = false
  let showTemplateModal = false
  let showAddMedicineModal = false
  let showClearConfirm = false
  let showExportModal = false
  let editingItem = null
  let prefilledMedicineForm = null
  let exportedText = ''
  let copySuccess = false

  let newItemForm = {
    name: '',
    suggestedQuantity: 1,
    specification: '',
    priority: PURCHASE_PRIORITY.MEDIUM,
    notes: ''
  }

  let medicineForm = null

  let filterStatus = 'all'
  let sortBy = 'priority'

  $: filteredList = $purchaseList.filter((item) => {
    if (filterStatus === 'purchased') return item.purchased
    if (filterStatus === 'pending') return !item.purchased
    return true
  })

  $: sortedList = [...filteredList].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = [PURCHASE_PRIORITY.HIGH, PURCHASE_PRIORITY.MEDIUM, PURCHASE_PRIORITY.LOW]
      return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'zh')
    }
    if (sortBy === 'created') {
      return new Date(b.createdAt) - new Date(a.createdAt)
    }
    return 0
  })

  $: stats = {
    total: $purchaseList.length,
    purchased: $purchaseList.filter((i) => i.purchased).length,
    pending: $purchaseList.filter((i) => !i.purchased).length,
    highPriority: $purchaseList.filter((i) => i.priority === PURCHASE_PRIORITY.HIGH && !i.purchased).length
  }

  function openAddModal() {
    newItemForm = {
      name: '',
      suggestedQuantity: 1,
      specification: '',
      priority: PURCHASE_PRIORITY.MEDIUM,
      notes: ''
    }
    showAddModal = true
  }

  function openEditModal(item) {
    editingItem = item
    newItemForm = { ...item }
    showEditModal = true
  }

  function handleAddSubmit() {
    if (!newItemForm.name.trim()) {
      alert('请输入药品名称')
      return
    }
    addPurchaseItem(newItemForm)
    showAddModal = false
  }

  function handleEditSubmit() {
    if (!newItemForm.name.trim()) {
      alert('请输入药品名称')
      return
    }
    updatePurchaseItem(editingItem.id, newItemForm)
    showEditModal = false
    editingItem = null
  }

  function handleGenerateSuggestions() {
    const suggestions = generateSuggestions()
    if (suggestions.length > 0) {
      alert(`已自动添加 ${suggestions.length} 项采购建议`)
    } else {
      alert('暂无可添加的采购建议，所有药品库存充足')
    }
  }

  function handleImportTemplate(key) {
    const imported = importTemplate(key)
    if (imported.length > 0) {
      alert(`已导入 ${imported.length} 项${FAMILY_MEDICINE_TEMPLATES[key].name}药品`)
    } else {
      alert('该分类下的药品已全部在清单中')
    }
    showTemplateModal = false
  }

  function handlePurchaseAndAdd(item) {
    if (!item.purchased) {
      togglePurchased(item.id)
    }
    prefilledMedicineForm = getSuggestedMedicineForm(item.id)
    medicineForm = { ...prefilledMedicineForm }
    showAddMedicineModal = true
  }

  function handleAddMedicineSubmit() {
    if (!medicineForm.name.trim()) {
      alert('请输入药品名称')
      return
    }
    if (!medicineForm.expiryDate) {
      alert('请选择有效期')
      return
    }
    addMedicine(medicineForm)
    showAddMedicineModal = false
    medicineForm = null
    prefilledMedicineForm = null
  }

  function handleExport() {
    exportedText = exportAsText()
    if (exportedText) {
      showExportModal = true
    } else {
      alert('清单为空，无法导出')
    }
  }

  function handleCopy() {
    const success = copyToClipboard()
    if (success) {
      copySuccess = true
      setTimeout(() => {
        copySuccess = false
      }, 2000)
    } else {
      alert('复制失败，请手动复制')
    }
  }

  function handleDownload() {
    const text = exportAsText()
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `采购清单_${new Date().toLocaleDateString('zh-CN')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleClearAll() {
    clearPurchaseList()
    showClearConfirm = false
  }

  function toggleMember(id) {
    if (!medicineForm.familyMemberIds) medicineForm.familyMemberIds = []
    const idx = medicineForm.familyMemberIds.indexOf(id)
    if (idx >= 0) {
      medicineForm.familyMemberIds.splice(idx, 1)
    } else {
      medicineForm.familyMemberIds.push(id)
    }
    medicineForm = medicineForm
  }

  function getSourceLabel(source) {
    switch (source) {
      case PURCHASE_ITEM_SOURCE.LOW_STOCK:
        return '库存预警'
      case PURCHASE_ITEM_SOURCE.EXPIRED_STOCK:
        return '过期补货'
      case PURCHASE_ITEM_SOURCE.TEMPLATE:
        return '模板导入'
      case PURCHASE_ITEM_SOURCE.MANUAL:
      default:
        return '手动添加'
    }
  }

  function getSourceColor(source) {
    switch (source) {
      case PURCHASE_ITEM_SOURCE.LOW_STOCK:
        return 'bg-red-50 text-red-600'
      case PURCHASE_ITEM_SOURCE.EXPIRED_STOCK:
        return 'bg-orange-50 text-orange-600'
      case PURCHASE_ITEM_SOURCE.TEMPLATE:
        return 'bg-purple-50 text-purple-600'
      case PURCHASE_ITEM_SOURCE.MANUAL:
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }
</script>

<div class="h-full flex flex-col">
  <div class="border-b border-medical-blue-50 bg-white">
    <div class="p-6 pb-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-medical-text-primary">采购清单</h2>
          <p class="text-sm text-medical-text-secondary mt-1">智能管理药品采购需求</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" on:click={handleGenerateSuggestions}>
            <Icon name="sparkles" size={16} />
            <span class="ml-1.5">一键生成建议</span>
          </button>
          <button class="btn-secondary" on:click={() => (showTemplateModal = true)}>
            <Icon name="bookmark" size={16} />
            <span class="ml-1.5">常备药模板</span>
          </button>
          <button class="btn-secondary" on:click={handleExport}>
            <Icon name="download" size={16} />
            <span class="ml-1.5">导出</span>
          </button>
          <button class="btn-primary" on:click={openAddModal}>
            <Icon name="plus" size={16} />
            <span class="ml-1.5">添加药品</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="card p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-medical-blue-50 flex items-center justify-center">
              <Icon name="clipboard" size={20} color="#3B82F6" />
            </div>
            <div>
              <p class="text-2xl font-bold text-medical-text-primary">{stats.total}</p>
              <p class="text-xs text-medical-text-tertiary">总计</p>
            </div>
          </div>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <Icon name="alert" size={20} color="#EF4444" />
            </div>
            <div>
              <p class="text-2xl font-bold text-medical-danger">{stats.highPriority}</p>
              <p class="text-xs text-medical-text-tertiary">高优先级待购</p>
            </div>
          </div>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="clock" size={20} color="#F59E0B" />
            </div>
            <div>
              <p class="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p class="text-xs text-medical-text-tertiary">待购</p>
            </div>
          </div>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-medical-green-50 flex items-center justify-center">
              <Icon name="check" size={20} color="#10B981" />
            </div>
            <div>
              <p class="text-2xl font-bold text-medical-green-500">{stats.purchased}</p>
              <p class="text-xs text-medical-text-tertiary">已购</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <select class="input-base w-auto" bind:value={filterStatus}>
          <option value="all">全部状态</option>
          <option value="pending">待购</option>
          <option value="purchased">已购</option>
        </select>
        <select class="input-base w-auto" bind:value={sortBy}>
          <option value="priority">按优先级排序</option>
          <option value="name">按名称排序</option>
          <option value="created">按添加时间排序</option>
        </select>
        <button class="btn-ghost text-sm" on:click={clearPurchasedItems} disabled={stats.purchased === 0}>
          <Icon name="check" size={16} />
          <span class="ml-1.5">清除已购</span>
        </button>
        <button class="btn-danger text-sm" on:click={() => (showClearConfirm = true)} disabled={stats.total === 0}>
          <Icon name="trash" size={16} />
          <span class="ml-1.5">一键清空</span>
        </button>
      </div>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-6">
    {#if sortedList.length === 0}
      <div class="h-full flex flex-col items-center justify-center py-20">
        <div class="w-20 h-20 rounded-full bg-medical-blue-50 flex items-center justify-center mb-4">
          <Icon name="clipboard" size={40} color="#93C5FD" />
        </div>
        <p class="text-medical-text-secondary mb-4">采购清单为空</p>
        <div class="flex gap-3">
          <button class="btn-secondary" on:click={handleGenerateSuggestions}>
            <Icon name="sparkles" size={16} />
            <span class="ml-1.5">生成采购建议</span>
          </button>
          <button class="btn-primary" on:click={openAddModal}>
            <Icon name="plus" size={16} />
            <span class="ml-1.5">手动添加</span>
          </button>
        </div>
      </div>
    {:else}
      <div class="space-y-3">
        {#each sortedList as item (item.id)}
          <div class="card p-4 hover:shadow-md transition-shadow {item.purchased ? 'opacity-60' : ''}">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0">
                <button
                  class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all {item.purchased ? 'bg-medical-green-500 border-medical-green-500' : 'border-gray-300 hover:border-medical-blue-400'}"
                  on:click={() => togglePurchased(item.id)}
                >
                  {#if item.purchased}
                    <Icon name="check" size={14} color="#fff" />
                  {/if}
                </button>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-semibold text-medical-text-primary truncate {item.purchased ? 'line-through' : ''}">
                    {item.name}
                  </h3>
                  <span class="tag {PURCHASE_PRIORITY_COLORS[item.priority]}">
                    {PURCHASE_PRIORITY_LABELS[item.priority]}
                  </span>
                  <span class="tag {getSourceColor(item.source)} text-xs">
                    {getSourceLabel(item.source)}
                  </span>
                </div>
                <div class="flex items-center gap-4 text-sm text-medical-text-secondary">
                  {#if item.specification}
                    <span>规格：{item.specification}</span>
                  {/if}
                  <span>建议采购：<span class="font-semibold text-medical-text-primary">{item.suggestedQuantity}</span> 单位</span>
                </div>
                {#if item.notes}
                  <p class="text-sm text-medical-text-tertiary mt-2">备注：{item.notes}</p>
                {/if}
              </div>
              <div class="flex items-center gap-1">
                <button class="p-2 rounded-lg hover:bg-gray-100 text-medical-text-secondary hover:text-medical-text-primary transition-colors" title="上移" on:click={() => moveItemUp(item.id)}>
                  <Icon name="chevronUp" size={18} />
                </button>
                <button class="p-2 rounded-lg hover:bg-gray-100 text-medical-text-secondary hover:text-medical-text-primary transition-colors" title="下移" on:click={() => moveItemDown(item.id)}>
                  <Icon name="chevronDown" size={18} />
                </button>
                <button class="p-2 rounded-lg hover:bg-amber-50 text-medical-text-secondary hover:text-amber-600 transition-colors" title="提高优先级" on:click={() => movePriorityUp(item.id)}>
                  <Icon name="arrowLeft" size={18} />
                </button>
                <button class="p-2 rounded-lg hover:bg-blue-50 text-medical-text-secondary hover:text-blue-600 transition-colors" title="降低优先级" on:click={() => movePriorityDown(item.id)}>
                  <Icon name="arrowLeft" size={18} style="transform: rotate(180deg)" />
                </button>
                <button class="p-2 rounded-lg hover:bg-medical-green-50 text-medical-text-secondary hover:text-medical-green-500 transition-colors" title="已购买并入库" on:click={() => handlePurchaseAndAdd(item)}>
                  <Icon name="plus" size={18} />
                </button>
                <button class="p-2 rounded-lg hover:bg-medical-blue-50 text-medical-text-secondary hover:text-medical-blue-500 transition-colors" title="编辑" on:click={() => openEditModal(item)}>
                  <Icon name="edit" size={18} />
                </button>
                <button class="p-2 rounded-lg hover:bg-red-50 text-medical-text-secondary hover:text-medical-danger transition-colors" title="删除" on:click={() => deletePurchaseItem(item.id)}>
                  <Icon name="trash" size={18} />
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<Modal show={showAddModal} title="添加采购项" width="520px" on:close={() => (showAddModal = false)}>
  <div class="space-y-4">
    <div>
      <label class="label-base">药品名称 <span class="text-medical-danger">*</span></label>
      <input type="text" class="input-base" placeholder="如：阿莫西林胶囊" bind:value={newItemForm.name} />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="label-base">建议采购数量</label>
        <input type="number" class="input-base" min="1" bind:value={newItemForm.suggestedQuantity} />
      </div>
      <div>
        <label class="label-base">优先级</label>
        <select class="input-base" bind:value={newItemForm.priority}>
          <option value={PURCHASE_PRIORITY.HIGH}>高</option>
          <option value={PURCHASE_PRIORITY.MEDIUM}>中</option>
          <option value={PURCHASE_PRIORITY.LOW}>低</option>
        </select>
      </div>
    </div>
    <div>
      <label class="label-base">规格</label>
      <input type="text" class="input-base" placeholder="如：0.25g*24粒" bind:value={newItemForm.specification} />
    </div>
    <div>
      <label class="label-base">备注</label>
      <textarea class="input-base h-20 resize-none" placeholder="备注信息" bind:value={newItemForm.notes}></textarea>
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => (showAddModal = false)}>取消</button>
    <button class="btn-primary" on:click={handleAddSubmit}>添加</button>
  </div>
</Modal>

<Modal show={showEditModal} title="编辑采购项" width="520px" on:close={() => (showEditModal = false)}>
  <div class="space-y-4">
    <div>
      <label class="label-base">药品名称 <span class="text-medical-danger">*</span></label>
      <input type="text" class="input-base" placeholder="如：阿莫西林胶囊" bind:value={newItemForm.name} />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="label-base">建议采购数量</label>
        <input type="number" class="input-base" min="1" bind:value={newItemForm.suggestedQuantity} />
      </div>
      <div>
        <label class="label-base">优先级</label>
        <select class="input-base" bind:value={newItemForm.priority}>
          <option value={PURCHASE_PRIORITY.HIGH}>高</option>
          <option value={PURCHASE_PRIORITY.MEDIUM}>中</option>
          <option value={PURCHASE_PRIORITY.LOW}>低</option>
        </select>
      </div>
    </div>
    <div>
      <label class="label-base">规格</label>
      <input type="text" class="input-base" placeholder="如：0.25g*24粒" bind:value={newItemForm.specification} />
    </div>
    <div>
      <label class="label-base">备注</label>
      <textarea class="input-base h-20 resize-none" placeholder="备注信息" bind:value={newItemForm.notes}></textarea>
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => (showEditModal = false)}>取消</button>
    <button class="btn-primary" on:click={handleEditSubmit}>保存</button>
  </div>
</Modal>

<Modal show={showTemplateModal} title="常备药模板" width="640px" on:close={() => (showTemplateModal = false)}>
  <div class="grid grid-cols-2 gap-4">
    {#each Object.entries(FAMILY_MEDICINE_TEMPLATES) as [key, template]}
      <div class="card p-4 hover:shadow-md transition-shadow cursor-pointer" on:click={() => handleImportTemplate(key)}>
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: {template.color}20;">
            <Icon name={template.icon} size={20} color={template.color} />
          </div>
          <div>
            <h3 class="font-semibold text-medical-text-primary">{template.name}</h3>
            <p class="text-xs text-medical-text-tertiary">{template.items.length} 种药品</p>
          </div>
        </div>
        <div class="text-sm text-medical-text-secondary space-y-1">
          {#each template.items.slice(0, 3) as item}
            <p class="truncate">• {item.name}</p>
          {/each}
          {#if template.items.length > 3}
            <p class="text-medical-text-tertiary">... 还有 {template.items.length - 3} 种</p>
          {/if}
        </div>
      </div>
    {/each}
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => (showTemplateModal = false)}>关闭</button>
  </div>
</Modal>

<Modal show={showAddMedicineModal && medicineForm} title="药品入库" width="640px" on:close={() => (showAddMedicineModal = false)}>
  {#if medicineForm}
    <div class="space-y-5">
      <div class="p-3 rounded-lg bg-medical-blue-50">
        <p class="text-sm text-medical-blue-600">
          <Icon name="info" size={16} class="inline mr-1" />
          已预填采购清单信息，请补充批号、有效期等信息
        </p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="label-base">药品名称 <span class="text-medical-danger">*</span></label>
          <input type="text" class="input-base" placeholder="如：阿莫西林胶囊" bind:value={medicineForm.name} />
        </div>
        <div>
          <label class="label-base">药品分类</label>
          <select class="input-base" bind:value={medicineForm.category}>
            <option value={MEDICINE_CATEGORIES.PRESCRIPTION}>处方药</option>
            <option value={MEDICINE_CATEGORIES.OTC}>非处方药</option>
            <option value={MEDICINE_CATEGORIES.EXTERNAL}>外用药</option>
          </select>
        </div>
        <div>
          <label class="label-base">规格</label>
          <input type="text" class="input-base" placeholder="如：0.25g*24粒" bind:value={medicineForm.specification} />
        </div>
        <div>
          <label class="label-base">生产厂家</label>
          <input type="text" class="input-base" placeholder="如：华北制药" bind:value={medicineForm.manufacturer} />
        </div>
        <div>
          <label class="label-base">条形码</label>
          <input type="text" class="input-base" placeholder="扫描或手动输入" bind:value={medicineForm.barcode} />
        </div>
        <div>
          <label class="label-base">批号 <span class="text-medical-danger">*</span></label>
          <input type="text" class="input-base" placeholder="如：A20250101" bind:value={medicineForm.batchNumber} />
        </div>
        <div>
          <label class="label-base">有效期至 <span class="text-medical-danger">*</span></label>
          <input type="date" class="input-base" bind:value={medicineForm.expiryDate} />
        </div>
        <div>
          <label class="label-base">存放位置</label>
          <select class="input-base" bind:value={medicineForm.location}>
            {#each STORAGE_LOCATIONS as loc}
              <option value={loc}>{loc}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="label-base">库存数量</label>
          <div class="flex gap-2">
            <input type="number" class="input-base flex-1" min="0" bind:value={medicineForm.quantity} />
            <input type="text" class="input-base w-20" placeholder="单位" bind:value={medicineForm.unit} />
          </div>
        </div>
      </div>
      <div class="pt-4 border-t border-medical-blue-50">
        <label class="label-base">适用家庭成员</label>
        <div class="flex flex-wrap gap-2 mt-2">
          {#each $familyMembers as member}
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-sm border-2 transition-all {medicineForm.familyMemberIds?.includes(member.id) ? 'border-medical-blue-400 bg-medical-blue-50 text-medical-blue-500' : 'border-gray-200 text-medical-text-secondary hover:border-medical-blue-200'}"
              on:click={() => toggleMember(member.id)}
            >
              {member.avatar} {member.name}
            </button>
          {/each}
        </div>
      </div>
      <div>
        <label class="label-base">备注</label>
        <textarea class="input-base h-20 resize-none" bind:value={medicineForm.notes}></textarea>
      </div>
    </div>
  {/if}
  <div slot="footer">
    <button class="btn-ghost" on:click={() => (showAddMedicineModal = false)}>取消</button>
    <button class="btn-primary" on:click={handleAddMedicineSubmit}>确认入库</button>
  </div>
</Modal>

<Modal show={showExportModal} title="导出采购清单" width="640px" on:close={() => (showExportModal = false)}>
  <div class="space-y-4">
    <div class="flex gap-3">
      <button class="btn-secondary flex-1" on:click={handleCopy}>
        <Icon name="clipboard" size={16} />
        <span class="ml-1.5">{copySuccess ? '已复制!' : '复制到剪贴板'}</span>
      </button>
      <button class="btn-primary flex-1" on:click={handleDownload}>
        <Icon name="download" size={16} />
        <span class="ml-1.5">下载为文本文件</span>
      </button>
    </div>
    <div>
      <label class="label-base">预览</label>
      <textarea class="input-base h-80 resize-none font-mono text-sm" readonly>{exportedText}</textarea>
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => (showExportModal = false)}>关闭</button>
  </div>
</Modal>

<Modal show={showClearConfirm} title="确认清空" width="400px" on:close={() => (showClearConfirm = false)}>
  <div class="py-4">
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
        <Icon name="alert" size={20} color="#EF4444" />
      </div>
      <div>
        <p class="font-medium text-medical-text-primary">确定要清空采购清单吗？</p>
        <p class="text-sm text-medical-text-secondary mt-1">清空后将无法恢复所有采购项。</p>
      </div>
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => (showClearConfirm = false)}>取消</button>
    <button class="btn-danger" on:click={handleClearAll}>确认清空</button>
  </div>
</Modal>
