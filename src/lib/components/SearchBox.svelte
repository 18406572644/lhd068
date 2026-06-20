<script>
  import Icon from './Icon.svelte'
  import { medicines } from '../stores/medicines.js'
  import {
    searchHistory,
    quickFilters,
    addSearchHistory,
    clearSearchHistory,
    removeSearchHistoryItem,
    deleteQuickFilter
  } from '../stores/search.js'
  import { CATEGORY_LABELS } from '../utils/constants.js'
  import { getDaysUntilExpiry } from '../utils/helpers.js'

  export let value = ''
  export let placeholder = '搜索药品名称、厂家、条形码、适应症...'
  export let showAdvancedToggle = true
  export let advancedOpen = false

  let showDropdown = false
  let inputRef = null
  let dropdownRef = null
  let selectedSuggestionIndex = -1

  function handleFocus() {
    showDropdown = true
    selectedSuggestionIndex = -1
  }

  function handleBlur() {
    setTimeout(() => {
      showDropdown = false
      selectedSuggestionIndex = -1
    }, 150)
  }

  function handleInput(e) {
    value = e.target.value
    showDropdown = true
    selectedSuggestionIndex = -1
  }

  function handleKeydown(e) {
    const allItems = getAllDropdownItems()
    const totalItems = allItems.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedSuggestionIndex = (selectedSuggestionIndex + 1) % totalItems
      scrollToSelected()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedSuggestionIndex = selectedSuggestionIndex <= 0 ? totalItems - 1 : selectedSuggestionIndex - 1
      scrollToSelected()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < totalItems) {
        selectItem(allItems[selectedSuggestionIndex])
      } else {
        submitSearch()
      }
    } else if (e.key === 'Escape') {
      showDropdown = false
      selectedSuggestionIndex = -1
    }
  }

  function scrollToSelected() {
    setTimeout(() => {
      const el = dropdownRef?.querySelector(`[data-index="${selectedSuggestionIndex}"]`)
      if (el) {
        el.scrollIntoView({ block: 'nearest' })
      }
    }, 0)
  }

  $: suggestions = getSuggestions(value, $medicines)
  $: hasInput = value && value.trim().length > 0

  function getSuggestions(query, meds) {
    if (!query || !query.trim()) return []
    const q = query.trim().toLowerCase()
    const result = []
    const seenIds = new Set()

    for (const med of meds) {
      if (seenIds.has(med.id)) continue
      let matchType = null
      let highlightField = null

      if (med.name.toLowerCase().includes(q)) {
        matchType = 'name'
        highlightField = med.name
      } else if (med.manufacturer && med.manufacturer.toLowerCase().includes(q)) {
        matchType = 'manufacturer'
        highlightField = med.manufacturer
      } else if (med.barcode && med.barcode.includes(q)) {
        matchType = 'barcode'
        highlightField = med.barcode
      } else if (med.indications && med.indications.toLowerCase().includes(q)) {
        matchType = 'indications'
        highlightField = med.indications
      }

      if (matchType) {
        result.push({ medicine: med, matchType, highlightField })
        seenIds.add(med.id)
      }

      if (result.length >= 8) break
    }

    return result
  }

  $: similarSuggestions = hasInput && suggestions.length === 0
    ? getSimilarSuggestions(value, $medicines).slice(0, 5)
    : []

  function getSimilarSuggestions(query, meds) {
    if (!query || !query.trim()) return []
    const q = query.trim().toLowerCase()
    const qChars = new Set(q)
    const scored = []

    for (const med of meds) {
      const nameChars = new Set(med.name.toLowerCase())
      let common = 0
      for (const c of qChars) {
        if (nameChars.has(c)) common++
      }
      const score = common / Math.max(qChars.size, 1)
      if (score >= 0.3) {
        scored.push({ medicine: med, score })
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .map((x) => x.medicine)
  }

  $: sameCategorySuggestions = hasInput && suggestions.length === 0 && similarSuggestions.length === 0
    ? getSameCategorySuggestions(value, $medicines).slice(0, 5)
    : []

  function getSameCategorySuggestions(query, meds) {
    if (!query || !query.trim()) return []
    const q = query.trim()
    const keywords = ['感冒', '退烧', '消炎', '止痛', '胃', '咳嗽', '过敏', '皮肤', '消化', '维生素', '血压', '血糖']
    let matchedCategory = null

    for (const kw of keywords) {
      if (q.includes(kw)) {
        matchedCategory = kw
        break
      }
    }

    if (!matchedCategory) return []

    return meds.filter((m) =>
      m.name.includes(matchedCategory) ||
      (m.indications && m.indications.includes(matchedCategory))
    )
  }

  function getAllDropdownItems() {
    const items = []

    if (hasInput) {
      for (let i = 0; i < suggestions.length; i++) {
        items.push({ type: 'suggestion', index: i })
      }
      for (let i = 0; i < similarSuggestions.length; i++) {
        items.push({ type: 'similar', index: i })
      }
      for (let i = 0; i < sameCategorySuggestions.length; i++) {
        items.push({ type: 'sameCategory', index: i })
      }
    } else {
      for (let i = 0; i < $quickFilters.length; i++) {
        items.push({ type: 'quickFilter', index: i })
      }
      for (let i = 0; i < $searchHistory.length; i++) {
        items.push({ type: 'history', index: i })
      }
    }

    return items
  }

  function selectItem(item) {
    if (!item) return
    if (item.type === 'suggestion') {
      const s = suggestions[item.index]
      value = s.medicine.name
      submitSearch()
    } else if (item.type === 'similar' || item.type === 'sameCategory') {
      const m = item.type === 'similar' ? similarSuggestions[item.index] : sameCategorySuggestions[item.index]
      value = m.name
      submitSearch()
    } else if (item.type === 'history') {
      value = $searchHistory[item.index]
      submitSearch()
    } else if (item.type === 'quickFilter') {
      applyQuickFilter($quickFilters[item.index])
    }
    showDropdown = false
    selectedSuggestionIndex = -1
  }

  function submitSearch() {
    if (value && value.trim()) {
      addSearchHistory(value.trim())
    }
    dispatch('search', { query: value })
  }

  function applyQuickFilter(filter) {
    dispatch('applyQuickFilter', filter)
  }

  function clearInput() {
    value = ''
    showDropdown = true
    selectedSuggestionIndex = -1
    if (inputRef) inputRef.focus()
    dispatch('clear')
  }

  function removeHistory(e, item) {
    e.stopPropagation()
    removeSearchHistoryItem(item)
  }

  function removeFilter(e, id) {
    e.stopPropagation()
    deleteQuickFilter(id)
  }

  function highlightText(text, query) {
    if (!query || !text) return text
    const q = query.trim()
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx < 0) return text
    return {
      before: text.substring(0, idx),
      match: text.substring(idx, idx + q.length),
      after: text.substring(idx + q.length)
    }
  }

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  function getGlobalIndex(type, index) {
    return getGlobalIndexStatic(
      type, index,
      suggestions, similarSuggestions, sameCategorySuggestions,
      $quickFilters, $searchHistory, hasInput
    )
  }

  function formatFilterSummary(filters) {
    const parts = []
    if (filters.expiryDaysMin != null || filters.expiryDaysMax != null) {
      const min = filters.expiryDaysMin ?? 0
      const max = filters.expiryDaysMax ?? '∞'
      parts.push(`有效期 ${min}-${max}天`)
    }
    if (filters.quantityMin != null || filters.quantityMax != null) {
      const min = filters.quantityMin ?? 0
      const max = filters.quantityMax ?? '∞'
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

<div class="relative w-full" bind:this={dropdownRef}>
  <div class="relative flex items-center">
    <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
      <Icon name="search" size={16} color="#9CA3AF" />
    </div>
    <input
      bind:this={inputRef}
      type="text"
      class="input-base pl-9 pr-20"
      {placeholder}
      {value}
      on:focus={handleFocus}
      on:blur={handleBlur}
      on:input={handleInput}
      on:keydown={handleKeydown}
    />
    <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
      {#if value}
        <button
          type="button"
          class="w-7 h-7 rounded-lg flex items-center justify-center text-medical-text-tertiary hover:bg-medical-blue-50 hover:text-medical-blue-500 transition-all"
          on:mousedown|preventDefault={clearInput}
          title="清除"
        >
          <Icon name="x" size={14} />
        </button>
      {/if}
      {#if showAdvancedToggle}
        <button
          type="button"
          class="w-7 h-7 rounded-lg flex items-center justify-center transition-all {advancedOpen ? 'bg-medical-blue-100 text-medical-blue-500' : 'text-medical-text-tertiary hover:bg-medical-blue-50 hover:text-medical-blue-500'}"
          on:mousedown|preventDefault={() => dispatch('toggleAdvanced')}
          title="高级搜索"
        >
          <Icon name="filter" size={14} />
        </button>
      {/if}
    </div>
  </div>

  {#if showDropdown}
    <div class="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-medical-blue-100 overflow-hidden max-h-96 overflow-y-auto">
      {#if hasInput}
        {#if suggestions.length > 0}
          <div class="px-3 py-2 text-xs font-medium text-medical-text-tertiary bg-medical-blue-50/50 border-b border-medical-blue-50">
            搜索建议
          </div>
          {#each suggestions as s, i}
            <div
              class="px-3 py-2.5 cursor-pointer hover:bg-medical-blue-50 transition-all border-b border-gray-50 last:border-b-0 {getGlobalIndex('suggestion', i) === selectedSuggestionIndex ? 'bg-medical-blue-50' : ''}"
              data-index={getGlobalIndex('suggestion', i)}
              on:mousedown|preventDefault={() => selectItem({ type: 'suggestion', index: i })}
            >
              <div class="flex items-start gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-medical-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="pill" size={16} color="#3B82F6" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-medical-text-primary truncate">
                    {#if s.matchType === 'name'}
                      {@const h = highlightText(s.highlightField, value)}
                      {#if typeof h === 'string'}
                        {h}
                      {:else}
                        {h.before}<span class="text-medical-blue-500 bg-medical-blue-100 rounded px-0.5">{h.match}</span>{h.after}
                      {/if}
                    {:else}
                      {s.medicine.name}
                    {/if}
                  </div>
                  <div class="text-xs text-medical-text-secondary mt-0.5 truncate">
                    {#if s.matchType === 'manufacturer'}
                      {@const h = highlightText(s.highlightField, value)}
                      <span class="text-medical-text-tertiary">厂家：</span>
                      {#if typeof h === 'string'}
                        {h}
                      {:else}
                        {h.before}<span class="text-medical-blue-500">{h.match}</span>{h.after}
                      {/if}
                    {:else if s.matchType === 'barcode'}
                      {@const h = highlightText(s.highlightField, value)}
                      <span class="text-medical-text-tertiary">条码：</span>
                      {#if typeof h === 'string'}
                        {h}
                      {:else}
                        {h.before}<span class="text-medical-blue-500">{h.match}</span>{h.after}
                      {/if}
                    {:else if s.matchType === 'indications'}
                      <span class="text-medical-text-tertiary">适应症：</span>
                      {@const h = highlightText(s.highlightField, value)}
                      {#if typeof h === 'string'}
                        {h}
                      {:else}
                        {h.before}<span class="text-medical-blue-500">{h.match}</span>{h.after}
                      {/if}
                    {:else}
                      {s.medicine.manufacturer || '-'} · {s.medicine.specification || ''}
                    {/if}
                  </div>
                </div>
                <span class="tag {s.medicine.category === 'prescription' ? 'bg-red-50 text-red-600' : s.medicine.category === 'external' ? 'bg-medical-blue-100 text-medical-blue-500' : 'bg-medical-green-100 text-medical-green-500'} text-xs flex-shrink-0">
                  {CATEGORY_LABELS[s.medicine.category]}
                </span>
              </div>
            </div>
          {/each}
        {/if}

        {#if similarSuggestions.length > 0}
          <div class="px-3 py-2 text-xs font-medium text-medical-warning bg-amber-50/50 border-b border-amber-50 flex items-center gap-1.5">
            <Icon name="search" size={12} />
            未找到「{value}」，您是否要找：
          </div>
          {#each similarSuggestions as m, i}
            <div
              class="px-3 py-2.5 cursor-pointer hover:bg-medical-blue-50 transition-all border-b border-gray-50 last:border-b-0 {getGlobalIndex('similar', i) === selectedSuggestionIndex ? 'bg-medical-blue-50' : ''}"
              data-index={getGlobalIndex('similar', i)}
              on:mousedown|preventDefault={() => selectItem({ type: 'similar', index: i })}
            >
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Icon name="sparkles" size={16} color="#F59E0B" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-medical-text-primary truncate">{m.name}</div>
                  <div class="text-xs text-medical-text-secondary mt-0.5 truncate">
                    {m.manufacturer || '-'} · 剩余 {getDaysUntilExpiry(m.expiryDate)} 天
                  </div>
                </div>
              </div>
            </div>
          {/each}
        {/if}

        {#if sameCategorySuggestions.length > 0}
          <div class="px-3 py-2 text-xs font-medium text-medical-green-500 bg-medical-green-50/50 border-b border-medical-green-50 flex items-center gap-1.5">
            <Icon name="lightbulb" size={12} />
            为您推荐同类型药品：
          </div>
          {#each sameCategorySuggestions as m, i}
            <div
              class="px-3 py-2.5 cursor-pointer hover:bg-medical-blue-50 transition-all border-b border-gray-50 last:border-b-0 {getGlobalIndex('sameCategory', i) === selectedSuggestionIndex ? 'bg-medical-blue-50' : ''}"
              data-index={getGlobalIndex('sameCategory', i)}
              on:mousedown|preventDefault={() => selectItem({ type: 'sameCategory', index: i })}
            >
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-medical-green-50 flex items-center justify-center flex-shrink-0">
                  <Icon name="star" size={16} color="#10B981" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-medical-text-primary truncate">{m.name}</div>
                  <div class="text-xs text-medical-text-secondary mt-0.5 truncate">
                    {m.indications || m.manufacturer || '-'}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        {/if}

        {#if suggestions.length === 0 && similarSuggestions.length === 0 && sameCategorySuggestions.length === 0}
          <div class="px-4 py-8 text-center">
            <div class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Icon name="search" size={24} color="#9CA3AF" />
            </div>
            <p class="text-sm text-medical-text-secondary">未找到相关药品</p>
            <p class="text-xs text-medical-text-tertiary mt-1">尝试使用其他关键词或查看高级搜索</p>
          </div>
        {/if}
      {:else}
        {#if $quickFilters.length > 0}
          <div class="px-3 py-2 text-xs font-medium text-medical-blue-500 bg-medical-blue-50/50 border-b border-medical-blue-50 flex items-center justify-between">
            <span class="flex items-center gap-1.5"><Icon name="bookmark" size={12} />快捷筛选</span>
          </div>
          {#each $quickFilters as filter, i}
            <div
              class="px-3 py-2 cursor-pointer hover:bg-medical-blue-50 transition-all border-b border-gray-50 last:border-b-0 group {getGlobalIndex('quickFilter', i) === selectedSuggestionIndex ? 'bg-medical-blue-50' : ''}"
              data-index={getGlobalIndex('quickFilter', i)}
              on:mousedown|preventDefault={() => selectItem({ type: 'quickFilter', index: i })}
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-medical-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon name="filter" size={14} color="#3B82F6" />
                  </div>
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-medical-text-primary truncate">{filter.name}</div>
                    <div class="text-xs text-medical-text-tertiary mt-0.5 truncate">
                      {formatFilterSummary(filter.filters)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  class="w-6 h-6 rounded flex items-center justify-center text-medical-text-tertiary hover:bg-red-50 hover:text-medical-danger opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  on:mousedown|preventDefault={(e) => removeFilter(e, filter.id)}
                  title="删除"
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            </div>
          {/each}
        {/if}

        {#if $searchHistory.length > 0}
          <div class="px-3 py-2 text-xs font-medium text-medical-text-tertiary bg-gray-50/50 border-b border-gray-50 flex items-center justify-between">
            <span class="flex items-center gap-1.5"><Icon name="clock" size={12} />搜索历史</span>
            <button
              type="button"
              class="text-xs text-medical-text-tertiary hover:text-medical-danger transition-all"
              on:mousedown|preventDefault={clearSearchHistory}
            >
              清空
            </button>
          </div>
          {#each $searchHistory as item, i}
            <div
              class="px-3 py-2 cursor-pointer hover:bg-medical-blue-50 transition-all border-b border-gray-50 last:border-b-0 group {getGlobalIndex('history', i) === selectedSuggestionIndex ? 'bg-medical-blue-50' : ''}"
              data-index={getGlobalIndex('history', i)}
              on:mousedown|preventDefault={() => selectItem({ type: 'history', index: i })}
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon name="history" size={14} color="#6B7280" />
                  </div>
                  <span class="text-sm text-medical-text-primary truncate">{item}</span>
                </div>
                <button
                  type="button"
                  class="w-6 h-6 rounded flex items-center justify-center text-medical-text-tertiary hover:bg-red-50 hover:text-medical-danger opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  on:mousedown|preventDefault={(e) => removeHistory(e, item)}
                  title="删除"
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            </div>
          {/each}
        {/if}

        {#if $quickFilters.length === 0 && $searchHistory.length === 0}
          <div class="px-4 py-8 text-center">
            <div class="w-12 h-12 rounded-full bg-medical-blue-50 flex items-center justify-center mx-auto mb-3">
              <Icon name="search" size={24} color="#3B82F6" />
            </div>
            <p class="text-sm text-medical-text-secondary">输入关键词开始搜索</p>
            <p class="text-xs text-medical-text-tertiary mt-1">支持药品名称、厂家、条形码、适应症</p>
          </div>
        {/if}
      {/if}
    </div>
  {/if}

  {#if showAdvancedToggle}
    <button
      type="button"
      class="sr-only"
      on:click={() => dispatch('toggleAdvanced')}
      aria-hidden="true"
    ></button>
  {/if}
</div>

<script context="module">
  export function getGlobalIndexStatic(type, index, suggestions, similar, sameCategory, quickFilters, history, hasInput) {
    if (hasInput) {
      if (type === 'suggestion') return index
      if (type === 'similar') return suggestions.length + index
      if (type === 'sameCategory') return suggestions.length + similar.length + index
    } else {
      if (type === 'quickFilter') return index
      if (type === 'history') return quickFilters.length + index
    }
    return -1
  }
</script>
