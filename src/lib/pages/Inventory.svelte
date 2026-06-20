<script>
  import { onMount } from 'svelte'
  import Icon from '../components/Icon.svelte'
  import { medicines } from '../stores/medicines.js'
  import { familyMembers } from '../stores/familyMembers.js'
  import { medicationRecords } from '../stores/medicationRecords.js'
  import { MEDICINE_CATEGORIES, CATEGORY_LABELS, STORAGE_LOCATIONS, EXPIRY_STATUS } from '../utils/constants.js'
  import { getExpiryStatus, getDaysUntilExpiry } from '../utils/helpers.js'

  $: totalCount = $medicines.length
  $: totalQuantity = $medicines.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0)
  $: totalValue = 0

  $: byCategory = [
    {
      key: MEDICINE_CATEGORIES.PRESCRIPTION,
      label: CATEGORY_LABELS[MEDICINE_CATEGORIES.PRESCRIPTION],
      count: $medicines.filter(m => m.category === MEDICINE_CATEGORIES.PRESCRIPTION).length,
      color: '#EF4444'
    },
    {
      key: MEDICINE_CATEGORIES.OTC,
      label: CATEGORY_LABELS[MEDICINE_CATEGORIES.OTC],
      count: $medicines.filter(m => m.category === MEDICINE_CATEGORIES.OTC).length,
      color: '#10B981'
    },
    {
      key: MEDICINE_CATEGORIES.EXTERNAL,
      label: CATEGORY_LABELS[MEDICINE_CATEGORIES.EXTERNAL],
      count: $medicines.filter(m => m.category === MEDICINE_CATEGORIES.EXTERNAL).length,
      color: '#3B82F6'
    }
  ]

  $: byLocation = STORAGE_LOCATIONS.map(loc => ({
    location: loc,
    count: $medicines.filter(m => m.location?.includes(loc)).length
  })).filter(x => x.count > 0).sort((a, b) => b.count - a.count)

  $: byExpiry = [
    {
      label: '已过期',
      count: $medicines.filter(m => getExpiryStatus(m.expiryDate) === EXPIRY_STATUS.EXPIRED && !m.markedExpired).length,
      color: '#EF4444'
    },
    {
      label: '临期(30天内)',
      count: $medicines.filter(m => {
        const days = getDaysUntilExpiry(m.expiryDate)
        return days >= 0 && days <= 30
      }).length,
      color: '#F59E0B'
    },
    {
      label: '正常',
      count: $medicines.filter(m => getDaysUntilExpiry(m.expiryDate) > 30).length,
      color: '#10B981'
    }
  ]

  $: byMember = $familyMembers.map(member => ({
    id: member.id,
    name: member.name,
    avatar: member.avatar,
    color: member.color,
    count: $medicines.filter(m => m.familyMemberIds?.includes(member.id)).length,
    records: $medicationRecords.filter(r => r.familyMemberId === member.id).length
  })).sort((a, b) => b.count - a.count)

  $: maxCount = Math.max(...byLocation.map(x => x.count), 1)
</script>

<div class="h-full overflow-y-auto">
  <div class="p-6 max-w-7xl mx-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-medical-text-primary">库存统计</h2>
      <p class="text-sm text-medical-text-secondary mt-1">全面了解家庭药品库存状况</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-medical-text-secondary">药品种类</p>
            <p class="text-3xl font-bold text-medical-text-primary mt-1">{totalCount}</p>
            <p class="text-xs text-medical-text-tertiary mt-1">种不同药品</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-medical-blue-50 flex items-center justify-center">
            <Icon name="box" size={24} color="#3B82F6" />
          </div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-medical-text-secondary">总数量</p>
            <p class="text-3xl font-bold text-medical-green-500 mt-1">{totalQuantity}</p>
            <p class="text-xs text-medical-text-tertiary mt-1">盒/瓶/袋等</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-medical-green-50 flex items-center justify-center">
            <Icon name="stats" size={24} color="#10B981" />
          </div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-medical-text-secondary">用药记录</p>
            <p class="text-3xl font-bold text-purple-500 mt-1">{$medicationRecords.length}</p>
            <p class="text-xs text-medical-text-tertiary mt-1">条历史记录</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <Icon name="clock" size={24} color="#8B5CF6" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="card">
        <div class="p-4 border-b border-medical-blue-50">
          <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
            <Icon name="pill" size={18} color="#3B82F6" />
            分类占比
          </h3>
        </div>
        <div class="p-4 space-y-4">
          {#each byCategory as item (item.key)}
            <div>
              <div class="flex items-center justify-between text-sm mb-1.5">
                <span class="text-medical-text-secondary">{item.label}</span>
                <span class="font-medium" style="color: {item.color}">{item.count} 种</span>
              </div>
              <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  style="width: {totalCount > 0 ? (item.count / totalCount * 100) : 0}%; background-color: {item.color};"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="card">
        <div class="p-4 border-b border-medical-blue-50">
          <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
            <Icon name="clock" size={18} color="#F59E0B" />
            有效期状态
          </h3>
        </div>
        <div class="p-4 space-y-4">
          {#each byExpiry as item (item.label)}
            <div>
              <div class="flex items-center justify-between text-sm mb-1.5">
                <span class="text-medical-text-secondary">{item.label}</span>
                <span class="font-medium" style="color: {item.color}">{item.count} 种</span>
              </div>
              <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  style="width: {totalCount > 0 ? (item.count / totalCount * 100) : 0}%; background-color: {item.color};"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="card">
        <div class="p-4 border-b border-medical-blue-50">
          <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
            <Icon name="mapPin" size={18} color="#3B82F6" />
            存放位置分布
          </h3>
        </div>
        <div class="p-4">
          {#if byLocation.length === 0}
            <p class="text-center text-medical-text-tertiary py-8">暂无数据</p>
          {:else}
            <div class="space-y-3">
              {#each byLocation as item (item.location)}
                <div class="flex items-center gap-3">
                  <div class="w-32 text-sm text-medical-text-secondary truncate">{item.location}</div>
                  <div class="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-medical-blue-300 to-medical-green-300 rounded-lg transition-all duration-500 flex items-center justify-end px-2"
                      style="width: {(item.count / maxCount * 100)}%; min-width: 40px;"
                    >
                      <span class="text-xs font-medium text-white">{item.count}</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="card">
        <div class="p-4 border-b border-medical-blue-50">
          <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
            <Icon name="users" size={18} color="#8B5CF6" />
            家庭成员用药
          </h3>
        </div>
        <div class="p-4">
          {#if byMember.length === 0}
            <p class="text-center text-medical-text-tertiary py-8">暂无数据</p>
          {:else}
            <div class="space-y-3">
              {#each byMember as member (member.id)}
                <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-medical-blue-50/50 transition-colors">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style="background-color: {member.color}20;"
                  >
                    {member.avatar}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-medical-text-primary truncate">{member.name}</p>
                    <p class="text-xs text-medical-text-tertiary">{member.records} 条用药记录</p>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-bold" style="color: {member.color}">{member.count}</p>
                    <p class="text-xs text-medical-text-tertiary">种药品</p>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
