<script>
  import Icon from './Icon.svelte'
  import { familyMembers } from '../stores/familyMembers.js'
  import { quickFilters, addQuickFilter, deleteQuickFilter } from '../stores/search.js'
  import { MEDICINE_CATEGORIES, CATEGORY_LABELS } from '../utils/constants.js'

  export let open = false

  export let expiryDaysMin = null
  export let expiryDaysMax = null
  export let quantityMin = null
  export let quantityMax = null
  export let selectedCategories = []
  export let selectedMembers = []
  export let createdAfter = ''
  export let createdBefore = ''
  export let updatedAfter = ''
  export let updatedBefore = ''

  let showSaveDialog = false
  let saveName = ''

  const categoryOptions = [
    { value: MEDICINE_CATEGORIES.PRESCRIPTION, label: CATEGORY_LABELS[MEDICINE_CATEGORIES.PRESCRIPTION] },
    { value: MEDICINE_CATEGORIES.OTC, label: CATEGORY_LABELS[MEDICINE_CATEGORIES.OTC] },
    { value: MEDICINE_CATEGORIES.EXTERNAL, label: CATEGORY_LABELS[MEDICINE_CATEGORIES.EXTERNAL] }
  ]

  function toggleCategory(value) {
    const idx = selectedCategories.indexOf(value)
    if (idx >= 0) {
      selectedCategories.splice(idx, 1)
    } else {
      selectedCategories.push(value)
    }
    selectedCategories = selectedCategories
    emitChange()
  }

  function toggleMember(id) {
    const idx = selectedMembers.indexOf(id)
    if (idx >= 0) {
      selectedMembers.splice(idx, 1)
    } else {
      selectedMembers.push(id)
    }
    selectedMembers = selectedMembers
    emitChange()
  }

  function handleExpiryMinChange(e) {
    const val = e.target.value
    expiryDaysMin = val === '' ? null : Number(val)
    emitChange()
  }

  function handleExpiryMaxChange(e) {
    const val = e.target.value
    expiryDaysMax = val === '' ? null : Number(val)
    emitChange()
  }

  function handleQuantityMinChange(e) {
    const val = e.target.value
    quantityMin = val === '' ? null : Number(val)
    emitChange()
  }

  function handleQuantityMaxChange(e) {
    const val = e.target.value
    quantityMax = val === '' ? null : Number(val)
    emitChange()
  }

  function handleDateChange(field, e) {
    if (field === 'createdAfter') createdAfter = e.target.value
    if (field === 'createdBefore') createdBefore = e.target.value
    if (field === 'updatedAfter') updatedAfter = e.target.value
    if (field === 'updatedBefore') updatedBefore = e.target.value
    emitChange()
  }

  function emitChange() {
    dispatch('change', getCurrentFilters())
  }

  function getCurrentFilters() {
    return {
      expiryDaysMin,
      expiryDaysMax,
      quantityMin,
      quantityMax,
      categories: [...selectedCategories],
      familyMemberIds: [...selectedMembers],
      createdAfter,
      createdBefore,
      updatedAfter,
      updatedBefore
    }
  }

  function resetFilters() {
    expiryDaysMin = null
    expiryDaysMax = null
    quantityMin = null
    quantityMax = null
    selectedCategories = []
    selectedMembers = []
    createdAfter = ''
    createdBefore = ''
    updatedAfter = ''
    updatedBefore = ''
    emitChange()
    dispatch('reset')
  }

  function applyFilter(filter) {
    const f = filter.filters || filter
    expiryDaysMin = f.expiryDaysMin != null ? f.expiryDaysMin : null
    expiryDaysMax = f.expiryDaysMax != null ? f.expiryDaysMax : null
    quantityMin = f.quantityMin != null ? f.quantityMin : null
    quantityMax = f.quantityMax != null ? f.quantityMax : null
    selectedCategories = f.categories ? [...f.categories] : []
    selectedMembers = f.familyMemberIds ? [...f.familyMemberIds] : []
    createdAfter = f.createdAfter || ''
    createdBefore = f.createdBefore || ''
    updatedAfter = f.updatedAfter || ''
    updatedBefore = f.updatedBefore || ''
    emitChange()
  }

  function openSaveDialog() {
    showSaveDialog = true
    saveName = ''
  }

  function closeSaveDialog() {
    showSaveDialog = false
    saveName = ''
  }

  function handleSave() {
    if (!saveName.trim()) return
    const filter = addQuickFilter(saveName.trim(), getCurrentFilters())
    if (filter) {
      showSaveDialog = false
      saveName = ''
    }
  }

  function removeQuickFilter(e, id) {
    e.stopPropagation()
    deleteQuickFilter(id)
  }

  $: anyFilter = expiryDaysMin != null || expiryDaysMax != null ||
    quantityMin != null || quantityMax != null ||
    selectedCategories.length > 0 || selectedMembers.length > 0 ||
    createdAfter || createdBefore || updatedAfter || updatedBefore

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  export { applyFilter }

  function formatFilterSummary(filters) {
    const parts = []
    if (filters.expiryDaysMin != null || filters.expiryDaysMax != null) {
      const min = filters.expiryDaysMin ?? 0
      const max = filters.expiryDaysMax ?? '不限'
      parts.push(`有效期 ${min}-${max}天`)
    }
    if (filters.quantityMin != null || filters.quantityMax != null) {
      const min = filters.quantityMin ?? 0
      const max = filters.quantityMax ?? '不限'
      parts.push(`库存 ${min}-${max}`)
    }
    if (filters.categories && filters.categories.length > 0) {
      parts.push(`分类: ${filters.categories.length}项`)
    }
    if (filters.familyMemberIds && filters.familyMemberIds.length > 0) {
      parts.push(`成员: ${filters.familyMemberIds.length}人`)
    }
    return parts.join(' · ') || '自定义筛选'
  }
</script>

<div class="overflow-hidden transition-all duration-300 {open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}">
  <div class="bg-medical-blue-50/30 border-b border-medical-blue-100 p-4">
    <div class="flex items-start gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Icon name="clock" size={14} color="#3B82F6" />
            <span class="text-sm font-medium text-medical-text-primary">有效期剩余天数</span>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              class="input-base flex-1 h-8 text-xs"
              placeholder="最少天数"
              min="0"
              value={expiryDaysMin ?? ''}
              on:input={handleExpiryMinChange}
            />
            <span class="text-medical-text-tertiary text-sm">~</span>
            <input
              type="number"
              class="input-base flex-1 h-8 text-xs"
              placeholder="最多天数"
              min="0"
              value={expiryDaysMax ?? ''}
              on:input={handleExpiryMaxChange}
            />
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Icon name="box" size={14} color="#3B82F6" />
            <span class="text-sm font-medium text-medical-text-primary">库存数量</span>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              class="input-base flex-1 h-8 text-xs"
              placeholder="最少数量"
              min="0"
              value={quantityMin ?? ''}
              on:input={handleQuantityMinChange}
            />
            <span class="text-medical-text-tertiary text-sm">~</span>
            <input
              type="number"
              class="input-base flex-1 h-8 text-xs"
              placeholder="最多数量"
              min="0"
              value={quantityMax ?? ''}
              on:input={handleQuantityMaxChange}
            />
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Icon name="pill" size={14} color="#3B82F6" />
            <span class="text-sm font-medium text-medical-text-primary">药品分类（多选AND）</span>
          </div>
          <div class="flex flex-wrap gap-2">
            {#each categoryOptions as opt}
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs border-2 transition-all {selectedCategories.includes(opt.value) ? 'border-medical-blue-400 bg-medical-blue-50 text-medical-blue-500' : 'border-gray-200 bg-white text-medical-text-secondary hover:border-medical-blue-200'}"
                on:click={() => toggleCategory(opt.value)}
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-2 md:col-span-2 lg:col-span-1">
          <div class="flex items-center gap-2">
            <Icon name="users" size={14} color="#3B82F6" />
            <span class="text-sm font-medium text-medical-text-primary">适用成员（多选AND）</span>
          </div>
          <div class="flex flex-wrap gap-2">
            {#each $familyMembers as member}
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs border-2 transition-all {selectedMembers.includes(member.id) ? 'border-medical-blue-400 bg-medical-blue-50 text-medical-blue-500' : 'border-gray-200 bg-white text-medical-text-secondary hover:border-medical-blue-200'}"
                on:click={() => toggleMember(member.id)}
              >
                <span class="mr-1">{member.avatar}</span>{member.name}
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Icon name="calendar" size={14} color="#3B82F6" />
            <span class="text-sm font-medium text-medical-text-primary">创建时间</span>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="date"
              class="input-base flex-1 h-8 text-xs"
              value={createdAfter}
              on:input={(e) => handleDateChange('createdAfter', e)}
            />
            <span class="text-medical-text-tertiary text-sm">~</span>
            <input
              type="date"
              class="input-base flex-1 h-8 text-xs"
              value={createdBefore}
              on:input={(e) => handleDateChange('createdBefore', e)}
            />
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Icon name="edit" size={14} color="#3B82F6" />
            <span class="text-sm font-medium text-medical-text-primary">更新时间</span>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="date"
              class="input-base flex-1 h-8 text-xs"
              value={updatedAfter}
              on:input={(e) => handleDateChange('updatedAfter', e)}
            />
            <span class="text-medical-text-tertiary text-sm">~</span>
            <input
              type="date"
              class="input-base flex-1 h-8 text-xs"
              value={updatedBefore}
              on:input={(e) => handleDateChange('updatedBefore', e)}
            />
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2 flex-shrink-0">
        <button
          class="btn-primary h-8 text-xs px-3"
          on:click={openSaveDialog}
          disabled={!anyFilter}
          title="保存为快捷筛选"
        >
          <Icon name="save" size={14} />
          <span class="ml-1">保存筛选</span>
        </button>
        <button
          class="btn-ghost h-8 text-xs px-3"
          on:click={resetFilters}
          disabled={!anyFilter}
          title="重置所有条件"
        >
          <Icon name="x" size={14} />
          <span class="ml-1">重置</span>
        </button>
      </div>
    </div>

    {#if $quickFilters.length > 0}
      <div class="mt-4 pt-4 border-t border-medical-blue-100">
        <div class="flex items-center gap-2 mb-2">
          <Icon name="bookmark" size={14} color="#3B82F6" />
          <span class="text-sm font-medium text-medical-text-primary">快捷筛选</span>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each $quickFilters as filter}
            <div
              class="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-medical-blue-100 rounded-lg text-xs text-medical-blue-500 cursor-pointer hover:bg-medical-blue-50 hover:border-medical-blue-200 transition-all"
              on:click={() => applyFilter(filter)}
              title={formatFilterSummary(filter.filters)}
            >
              <Icon name="filter" size={12} />
              <span>{filter.name}</span>
              <button
                type="button"
                class="w-4 h-4 rounded flex items-center justify-center text-medical-text-tertiary hover:bg-red-50 hover:text-medical-danger opacity-0 group-hover:opacity-100 transition-all ml-1"
                on:click|preventDefault={(e) => removeQuickFilter(e, filter.id)}
                title="删除"
              >
                <Icon name="x" size={10} />
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

{#if showSaveDialog}
  <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" on:click={closeSaveDialog}>
    <div class="bg-white rounded-xl shadow-xl p-5 w-80" on:click|stopPropagation>
      <h3 class="text-base font-bold text-medical-text-primary mb-4">保存快捷筛选</h3>
      <div class="space-y-3">
        <div>
          <label class="label-base text-xs">筛选名称</label>
          <input
            type="text"
            class="input-base h-8 text-sm"
            placeholder="如：爸爸的常备药"
            bind:value={saveName}
            on:keydown={(e) => { if (e.key === 'Enter') handleSave() }}
          />
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-5">
        <button class="btn-ghost h-8 text-xs" on:click={closeSaveDialog}>取消</button>
        <button class="btn-primary h-8 text-xs" on:click={handleSave} disabled={!saveName.trim()}>保存</button>
      </div>
    </div>
  </div>
{/if}
