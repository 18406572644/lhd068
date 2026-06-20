<script>
  import Icon from './Icon.svelte'
  import { CATEGORY_LABELS, CATEGORY_COLORS, EXPIRY_STATUS } from '../utils/constants.js'
  import { getExpiryStatus, getExpiryStatusText, getExpiryStatusColor, formatDate } from '../utils/helpers.js'
  import { getMemberById } from '../stores/familyMembers.js'

  export let medicine
  export let compact = false

  $: status = getExpiryStatus(medicine.expiryDate)
  $: statusText = getExpiryStatusText(medicine.expiryDate)
  $: statusColor = getExpiryStatusColor(status)
  $: isExpired = status === EXPIRY_STATUS.EXPIRED
  $: isWarning = status === EXPIRY_STATUS.WARNING
  $: categoryColor = CATEGORY_COLORS[medicine.category] || 'bg-gray-100 text-gray-600'
  $: categoryLabel = CATEGORY_LABELS[medicine.category] || '未知'
</script>

<div
  class="card p-4 hover:shadow-cardHover transition-all duration-300 cursor-pointer group {medicine.markedExpired ? 'opacity-60' : ''} {isExpired ? 'border-medical-danger/30' : isWarning ? 'border-medical-warning/30' : ''}"
  on:click
>
  <div class="flex items-start gap-3">
    <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 {isExpired ? 'bg-red-50' : isWarning ? 'bg-amber-50' : 'bg-medical-blue-50'}">
      {#if medicine.category === 'prescription'}
        <Icon name="alert" size={24} color={isExpired ? '#EF4444' : isWarning ? '#F59E0B' : '#EF4444'} />
      {:else if medicine.category === 'external'}
        <Icon name="mapPin" size={24} color={isExpired ? '#EF4444' : isWarning ? '#F59E0B' : '#3B82F6'} />
      {:else}
        <Icon name="pill" size={24} color={isExpired ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981'} />
      {/if}
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h4 class="font-medium text-medical-text-primary truncate {medicine.markedExpired ? 'line-through' : ''}">
            {medicine.name}
          </h4>
          <p class="text-xs text-medical-text-tertiary mt-0.5">{medicine.specification || '-'}</p>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          {#if medicine.markedExpired}
            <span class="tag bg-gray-100 text-gray-500">已标记处理</span>
          {/if}
        </div>
      </div>

      {#if !compact}
        <div class="flex items-center gap-2 mt-3 flex-wrap">
          <span class="tag {categoryColor}">{categoryLabel}</span>
          <span class="tag {statusColor}">{statusText}</span>
          {#if medicine.location}
            <span class="tag bg-medical-blue-50 text-medical-blue-500">
              <Icon name="mapPin" size={12} />
              <span class="ml-1">{medicine.location}</span>
            </span>
          {/if}
        </div>

        <div class="flex items-center justify-between mt-3 pt-3 border-t border-medical-blue-50">
          <div class="flex items-center gap-2">
            <span class="text-xs text-medical-text-secondary">库存:</span>
            <span class="text-sm font-medium text-medical-text-primary">{medicine.quantity || 0} {medicine.unit || '盒'}</span>
          </div>
          <div class="text-xs text-medical-text-tertiary">
            有效期至 {formatDate(medicine.expiryDate)}
          </div>
        </div>
      {/if}
    </div>
  </div>

  {#if compact}
    <div class="flex items-center justify-between mt-3 pt-3 border-t border-medical-blue-50">
      <span class="tag {categoryColor}">{categoryLabel}</span>
      <span class="tag {statusColor}">{statusText}</span>
    </div>
  {/if}
</div>
