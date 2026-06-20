<script>
  import { onMount, tick } from 'svelte'
  import { Chart, registerables } from 'chart.js'
  import Icon from '../components/Icon.svelte'
  import { medicines } from '../stores/medicines.js'
  import { familyMembers } from '../stores/familyMembers.js'
  import { medicationRecords } from '../stores/medicationRecords.js'
  import { MEDICINE_CATEGORIES, CATEGORY_LABELS, STORAGE_LOCATIONS, EXPIRY_STATUS } from '../utils/constants.js'
  import { getExpiryStatus, getDaysUntilExpiry, formatDate } from '../utils/helpers.js'

  Chart.register(...registerables)

  let trendPeriod = 7
  let trendDimension = 'day'
  let trendChart = null
  let medicineRankChart = null
  let memberCompareChart = null

  let trendCanvas = null
  let medicineRankCanvas = null
  let memberCompareCanvas = null

  const PERIOD_OPTIONS = [
    { value: 7, label: '近7天' },
    { value: 30, label: '近30天' },
    { value: 90, label: '近90天' }
  ]

  const DIMENSION_OPTIONS = [
    { value: 'day', label: '按日' },
    { value: 'week', label: '按周' },
    { value: 'month', label: '按月' }
  ]

  function getDateLabels(days, dimension) {
    const labels = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (dimension === 'day') {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        labels.push(formatDate(date.toISOString()))
      }
    } else if (dimension === 'week') {
      const weeks = Math.ceil(days / 7)
      for (let i = weeks - 1; i >= 0; i--) {
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() - i * 7)
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - 6)
        labels.push(`${formatDate(startDate.toISOString()).slice(5)}~${formatDate(endDate.toISOString()).slice(5)}`)
      }
    } else if (dimension === 'month') {
      const months = Math.ceil(days / 30)
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setMonth(date.getMonth() - i)
        labels.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
      }
    }
    return labels
  }

  function getTrendData(days, dimension) {
    const labels = getDateLabels(days, dimension)
    const counts = new Array(labels.length).fill(0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    $medicationRecords.forEach(record => {
      const recordDate = new Date(record.time)
      recordDate.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24))

      if (diffDays < days && diffDays >= 0) {
        let index
        if (dimension === 'day') {
          index = days - 1 - diffDays
        } else if (dimension === 'week') {
          index = Math.floor((days - 1 - diffDays) / 7)
          const weeks = Math.ceil(days / 7)
          index = weeks - 1 - Math.floor(diffDays / 7)
        } else if (dimension === 'month') {
          const months = Math.ceil(days / 30)
          const recordMonth = recordDate.getMonth()
          const todayMonth = today.getMonth()
          const diffMonths = (today.getFullYear() - recordDate.getFullYear()) * 12 + todayMonth - recordMonth
          index = months - 1 - diffMonths
        }
        if (index >= 0 && index < counts.length) {
          counts[index]++
        }
      }
    })

    return { labels, data: counts }
  }

  function getMedicineRankData(topN = 10) {
    const medicineCount = {}
    $medicationRecords.forEach(record => {
      const name = record.medicineName || '未知药品'
      medicineCount[name] = (medicineCount[name] || 0) + 1
    })

    const sorted = Object.entries(medicineCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)

    return {
      labels: sorted.map(item => item[0]).reverse(),
      data: sorted.map(item => item[1]).reverse()
    }
  }

  function getMemberCompareData(days) {
    const memberCount = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    $medicationRecords.forEach(record => {
      const recordDate = new Date(record.time)
      recordDate.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24))

      if (diffDays < days && diffDays >= 0) {
        const member = $familyMembers.find(m => m.id === record.familyMemberId)
        const name = member ? member.name : '未知成员'
        memberCount[name] = (memberCount[name] || 0) + 1
      }
    })

    const members = $familyMembers.map(m => m.name)
    return {
      labels: members,
      data: members.map(name => memberCount[name] || 0),
      colors: $familyMembers.map(m => m.color)
    }
  }

  function initTrendChart() {
    if (!trendCanvas) return
    if (trendChart) trendChart.destroy()

    const { labels, data } = getTrendData(trendPeriod, trendDimension)

    trendChart = new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '用药次数',
          data,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: '#6B7280'
            },
            grid: {
              color: 'rgba(229, 231, 235, 0.5)'
            }
          },
          x: {
            ticks: {
              color: '#6B7280',
              maxRotation: 45,
              minRotation: 0
            },
            grid: {
              display: false
            }
          }
        }
      }
    })
  }

  function initMedicineRankChart() {
    if (!medicineRankCanvas) return
    if (medicineRankChart) medicineRankChart.destroy()

    const { labels, data } = getMedicineRankData(10)

    medicineRankChart = new Chart(medicineRankCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '使用次数',
          data,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderRadius: 4,
          barThickness: 20
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: '#6B7280'
            },
            grid: {
              color: 'rgba(229, 231, 235, 0.5)'
            }
          },
          y: {
            ticks: {
              color: '#374151'
            },
            grid: {
              display: false
            }
          }
        }
      }
    })
  }

  function initMemberCompareChart() {
    if (!memberCompareCanvas) return
    if (memberCompareChart) memberCompareChart.destroy()

    const { labels, data, colors } = getMemberCompareData(trendPeriod)

    memberCompareChart = new Chart(memberCompareCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '用药次数',
          data,
          backgroundColor: colors,
          borderRadius: 6,
          barThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: '#6B7280'
            },
            grid: {
              color: 'rgba(229, 231, 235, 0.5)'
            }
          },
          x: {
            ticks: {
              color: '#374151'
            },
            grid: {
              display: false
            }
          }
        }
      }
    })
  }

  function updateAllCharts() {
    initTrendChart()
    initMedicineRankChart()
    initMemberCompareChart()
  }

  onMount(() => {
    tick().then(() => {
      updateAllCharts()
    })
  })

  $: trendPeriod, trendDimension, updateChartsForPeriod()

  function updateChartsForPeriod() {
    if (trendChart) initTrendChart()
    if (memberCompareChart) initMemberCompareChart()
  }

  $: recordLen = $medicationRecords.length
  $: if (recordLen >= 0 && trendChart && medicineRankChart && memberCompareChart) {
    updateAllCharts()
  }

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

    <div class="mb-6">
      <h2 class="text-xl font-bold text-medical-text-primary flex items-center gap-2">
        <Icon name="stats" size={20} color="#8B5CF6" />
        用药分析
      </h2>
      <p class="text-sm text-medical-text-secondary mt-1">深入了解家庭用药习惯与趋势</p>
    </div>

    <div class="card mb-6">
      <div class="p-4 border-b border-medical-blue-50 flex flex-wrap items-center justify-between gap-3">
        <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
          <Icon name="trendingUp" size={18} color="#3B82F6" />
          用药趋势
        </h3>
        <div class="flex items-center gap-2">
          <div class="flex bg-gray-100 rounded-lg p-0.5">
            {#each PERIOD_OPTIONS as opt}
              <button
                class="px-3 py-1 text-xs font-medium rounded-md transition-all {trendPeriod === opt.value ? 'bg-white text-medical-blue-500 shadow-sm' : 'text-medical-text-secondary hover:text-medical-text-primary'}"
                on:click={() => trendPeriod = opt.value}
              >
                {opt.label}
              </button>
            {/each}
          </div>
          <div class="flex bg-gray-100 rounded-lg p-0.5">
            {#each DIMENSION_OPTIONS as opt}
              <button
                class="px-3 py-1 text-xs font-medium rounded-md transition-all {trendDimension === opt.value ? 'bg-white text-medical-green-500 shadow-sm' : 'text-medical-text-secondary hover:text-medical-text-primary'}"
                on:click={() => trendDimension = opt.value}
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>
      </div>
      <div class="p-4">
        <div style="height: 280px;">
          <canvas bind:this={trendCanvas}></canvas>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <div class="p-4 border-b border-medical-blue-50">
          <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
            <Icon name="pill" size={18} color="#10B981" />
            药品使用排行
          </h3>
        </div>
        <div class="p-4">
          <div style="height: 320px;">
            <canvas bind:this={medicineRankCanvas}></canvas>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="p-4 border-b border-medical-blue-50">
          <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
            <Icon name="users" size={18} color="#8B5CF6" />
            成员用药对比
          </h3>
        </div>
        <div class="p-4">
          <div style="height: 320px;">
            <canvas bind:this={memberCompareCanvas}></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
