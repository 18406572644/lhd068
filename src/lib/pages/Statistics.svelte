<script>
  import { onMount, onDestroy } from 'svelte'
  import Icon from '../components/Icon.svelte'
  import { medicines, getMedicinesWithPurchaseInfo } from '../stores/medicines.js'
  import { PURCHASE_CHANNEL_LABELS, CATEGORY_LABELS } from '../utils/constants.js'
  import {
    getSpendingTrendData,
    getCategoryDistributionData,
    getChannelComparisonData,
    getTopMedicinesBySpending,
    getTopPurchasesByAmount,
    getSummaryStats,
    filterMedicinesByDateRange,
    generateExcelData,
    exportToExcel,
    calculateTotalAmount
  } from '../utils/statistics.js'
  import { Chart, registerables } from 'chart.js'
  import { format, subMonths, subYears } from 'date-fns'

  Chart.register(...registerables)

  let trendGranularity = 'month'
  let startDate = ''
  let endDate = ''
  let activeTab = 'trend'

  let trendChart = null
  let categoryChart = null
  let channelChart = null

  let trendCanvas = null
  let categoryCanvas = null
  let channelCanvas = null

  $: allMedicinesWithPurchase = getMedicinesWithPurchaseInfo()
  $: filteredMedicines = filterMedicinesByDateRange($medicines, startDate, endDate)
  $: filteredWithPurchase = filteredMedicines.filter(m => m.purchaseDate)
  $: summary = getSummaryStats(filteredWithPurchase)
  $: trendData = getSpendingTrendData(filteredWithPurchase, trendGranularity)
  $: categoryData = getCategoryDistributionData(filteredWithPurchase)
  $: channelData = getChannelComparisonData(filteredWithPurchase)
  $: topMedicines = getTopMedicinesBySpending(filteredWithPurchase, 10)
  $: topPurchases = getTopPurchasesByAmount(filteredWithPurchase, 10)

  function setQuickRange(range) {
    const today = new Date()
    endDate = format(today, 'yyyy-MM-dd')
    if (range === 'month') {
      startDate = format(subMonths(today, 1), 'yyyy-MM-dd')
    } else if (range === 'quarter') {
      startDate = format(subMonths(today, 3), 'yyyy-MM-dd')
    } else if (range === 'year') {
      startDate = format(subYears(today, 1), 'yyyy-MM-dd')
    } else if (range === 'all') {
      startDate = ''
      endDate = ''
    }
  }

  function handleExport() {
    const data = generateExcelData(filteredWithPurchase)
    const dateSuffix = startDate || endDate ? `_${startDate || '开始'}_${endDate || '至今'}` : ''
    exportToExcel(data, `药品消费明细${dateSuffix}.xlsx`)
  }

  function initTrendChart() {
    if (!trendCanvas) return
    if (trendChart) trendChart.destroy()

    const ctx = trendCanvas.getContext('2d')
    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendData.labels,
        datasets: [{
          label: '消费金额（元）',
          data: trendData.data,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `金额: ¥${ctx.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => '¥' + v }
          }
        }
      }
    })
  }

  function initCategoryChart() {
    if (!categoryCanvas) return
    if (categoryChart) categoryChart.destroy()

    const ctx = categoryCanvas.getContext('2d')
    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categoryData.labels,
        datasets: [{
          data: categoryData.data,
          backgroundColor: categoryData.colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 20, usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0
                return `${ctx.label}: ¥${ctx.parsed.toFixed(2)} (${percentage}%)`
              }
            }
          }
        }
      }
    })
  }

  function initChannelChart() {
    if (!channelCanvas) return
    if (channelChart) channelChart.destroy()

    const ctx = channelCanvas.getContext('2d')
    channelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: channelData.labels,
        datasets: [{
          label: '消费金额（元）',
          data: channelData.data,
          backgroundColor: channelData.colors,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `金额: ¥${ctx.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => '¥' + v }
          }
        }
      }
    })
  }

  $: if (trendCanvas && trendData) {
    initTrendChart()
  }

  $: if (categoryCanvas && categoryData) {
    initCategoryChart()
  }

  $: if (channelCanvas && channelData) {
    initChannelChart()
  }

  onDestroy(() => {
    if (trendChart) trendChart.destroy()
    if (categoryChart) categoryChart.destroy()
    if (channelChart) channelChart.destroy()
  })
</script>

<div class="h-full flex flex-col">
  <div class="border-b border-medical-blue-50 bg-white">
    <div class="p-6 pb-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-medical-text-primary">消费统计</h2>
          <p class="text-sm text-medical-text-secondary mt-1">共记录 {filteredWithPurchase.length} 笔采购，{summary.medicineCount} 种药品</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" on:click={handleExport}>
            <Icon name="download" size={16} />
            <span class="ml-1.5">导出Excel</span>
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
          <button
            class="px-3 py-1.5 rounded-md text-sm transition-all {activeTab === 'trend' ? 'bg-white shadow text-medical-blue-500' : 'text-medical-text-secondary hover:text-medical-text-primary'}"
            on:click={() => activeTab = 'trend'}
          >
            <Icon name="trendingUp" size={14} class="inline mr-1" />
            消费趋势
          </button>
          <button
            class="px-3 py-1.5 rounded-md text-sm transition-all {activeTab === 'category' ? 'bg-white shadow text-medical-blue-500' : 'text-medical-text-secondary hover:text-medical-text-primary'}"
            on:click={() => activeTab = 'category'}
          >
            <Icon name="pieChart" size={14} class="inline mr-1" />
            分类占比
          </button>
          <button
            class="px-3 py-1.5 rounded-md text-sm transition-all {activeTab === 'channel' ? 'bg-white shadow text-medical-blue-500' : 'text-medical-text-secondary hover:text-medical-text-primary'}"
            on:click={() => activeTab = 'channel'}
          >
            <Icon name="barChart" size={14} class="inline mr-1" />
            渠道对比
          </button>
          <button
            class="px-3 py-1.5 rounded-md text-sm transition-all {activeTab === 'ranking' ? 'bg-white shadow text-medical-blue-500' : 'text-medical-text-secondary hover:text-medical-text-primary'}"
            on:click={() => activeTab = 'ranking'}
          >
            <Icon name="trophy" size={14} class="inline mr-1" />
            排行榜
          </button>
        </div>

        <div class="flex-1"></div>

        <div class="flex items-center gap-2">
          <button class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all" on:click={() => setQuickRange('month')}>
            近1个月
          </button>
          <button class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all" on:click={() => setQuickRange('quarter')}>
            近3个月
          </button>
          <button class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all" on:click={() => setQuickRange('year')}>
            近1年
          </button>
          <button class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all" on:click={() => setQuickRange('all')}>
            全部
          </button>
        </div>

        <div class="flex items-center gap-2">
          <input type="date" class="input-base w-auto text-sm" bind:value={startDate} />
          <span class="text-medical-text-tertiary">至</span>
          <input type="date" class="input-base w-auto text-sm" bind:value={endDate} />
        </div>
      </div>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-6 bg-gray-50">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-medical-text-tertiary">总消费</p>
            <p class="text-2xl font-bold text-medical-text-primary mt-1">¥{summary.totalSpending.toFixed(2)}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-medical-blue-50 flex items-center justify-center">
            <Icon name="wallet" size={24} color="#3B82F6" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-medical-text-tertiary">采购笔数</p>
            <p class="text-2xl font-bold text-medical-text-primary mt-1">{summary.purchaseCount}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-medical-green-50 flex items-center justify-center">
            <Icon name="shoppingCart" size={24} color="#10B981" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-medical-text-tertiary">平均单笔</p>
            <p class="text-2xl font-bold text-medical-text-primary mt-1">¥{summary.avgPerPurchase.toFixed(2)}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <Icon name="trendingUp" size={24} color="#F59E0B" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-medical-text-tertiary">主要渠道</p>
            <p class="text-2xl font-bold text-medical-text-primary mt-1">{summary.topChannel}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <Icon name="mapPin" size={24} color="#8B5CF6" />
          </div>
        </div>
      </div>
    </div>

    {#if activeTab === 'trend'}
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-medical-text-primary">消费趋势</h3>
          <div class="flex items-center gap-2">
            <button
              class="text-sm px-3 py-1 rounded-md transition-all {trendGranularity === 'month' ? 'bg-medical-blue-100 text-medical-blue-500' : 'text-medical-text-secondary hover:bg-gray-100'}"
              on:click={() => trendGranularity = 'month'}
            >
              月度
            </button>
            <button
              class="text-sm px-3 py-1 rounded-md transition-all {trendGranularity === 'quarter' ? 'bg-medical-blue-100 text-medical-blue-500' : 'text-medical-text-secondary hover:bg-gray-100'}"
              on:click={() => trendGranularity = 'quarter'}
            >
              季度
            </button>
            <button
              class="text-sm px-3 py-1 rounded-md transition-all {trendGranularity === 'year' ? 'bg-medical-blue-100 text-medical-blue-500' : 'text-medical-text-secondary hover:bg-gray-100'}"
              on:click={() => trendGranularity = 'year'}
            >
              年度
            </button>
          </div>
        </div>
        {#if trendData.labels.length > 0}
          <div class="h-80">
            <canvas bind:this={trendCanvas}></canvas>
          </div>
        {:else}
          <div class="h-80 flex items-center justify-center">
            <div class="text-center">
              <Icon name="barChart" size={48} color="#D1D5DB" />
              <p class="text-medical-text-secondary mt-4">暂无消费数据</p>
            </div>
          </div>
        {/if}
      </div>
    {:else if activeTab === 'category'}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-medical-text-primary mb-4">分类消费占比</h3>
          {#if categoryData.data.some(d => d > 0)}
            <div class="h-80">
              <canvas bind:this={categoryCanvas}></canvas>
            </div>
          {:else}
            <div class="h-80 flex items-center justify-center">
              <div class="text-center">
                <Icon name="pieChart" size={48} color="#D1D5DB" />
                <p class="text-medical-text-secondary mt-4">暂无分类消费数据</p>
              </div>
            </div>
          {/if}
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-medical-text-primary mb-4">分类明细</h3>
          <div class="space-y-3">
            {#each categoryData.labels as label, i}
              <div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full" style="background-color: {categoryData.colors[i]}"></div>
                  <span class="text-sm text-medical-text-primary">{label}</span>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-medical-text-primary">¥{categoryData.data[i].toFixed(2)}</p>
                  <p class="text-xs text-medical-text-tertiary">
                    {categoryData.data.reduce((a, b) => a + b, 0) > 0
                      ? ((categoryData.data[i] / categoryData.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {:else if activeTab === 'channel'}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-medical-text-primary mb-4">渠道消费对比</h3>
          {#if channelData.data.some(d => d > 0)}
            <div class="h-80">
              <canvas bind:this={channelCanvas}></canvas>
            </div>
          {:else}
            <div class="h-80 flex items-center justify-center">
              <div class="text-center">
                <Icon name="barChart" size={48} color="#D1D5DB" />
                <p class="text-medical-text-secondary mt-4">暂无渠道消费数据</p>
              </div>
            </div>
          {/if}
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-medical-text-primary mb-4">渠道明细</h3>
          <div class="space-y-3">
            {#each channelData.labels as label, i}
              <div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full" style="background-color: {channelData.colors[i]}"></div>
                  <span class="text-sm text-medical-text-primary">{label}</span>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-medical-text-primary">¥{channelData.data[i].toFixed(2)}</p>
                  <p class="text-xs text-medical-text-tertiary">
                    {channelData.data.reduce((a, b) => a + b, 0) > 0
                      ? ((channelData.data[i] / channelData.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {:else if activeTab === 'ranking'}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-medical-text-primary mb-4">
            <Icon name="trophy" size={18} color="#F59E0B" class="inline mr-2" />
            单种药品花费 Top 10
          </h3>
          {#if topMedicines.length > 0}
            <div class="space-y-2">
              {#each topMedicines as item, i}
                <div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold {i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500'}">
                      {i + 1}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-medical-text-primary">{item.name}</p>
                      <p class="text-xs text-medical-text-tertiary">{CATEGORY_LABELS[item.category] || '-'} · {item.count} 次采购</p>
                    </div>
                  </div>
                  <p class="text-sm font-semibold text-medical-text-primary">¥{item.totalAmount.toFixed(2)}</p>
                </div>
              {/each}
            </div>
          {:else}
            <div class="h-64 flex items-center justify-center">
              <div class="text-center">
                <Icon name="trophy" size={48} color="#D1D5DB" />
                <p class="text-medical-text-secondary mt-4">暂无排行数据</p>
              </div>
            </div>
          {/if}
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-medical-text-primary mb-4">
            <Icon name="shoppingCart" size={18} color="#3B82F6" class="inline mr-2" />
            单次采购金额 Top 10
          </h3>
          {#if topPurchases.length > 0}
            <div class="space-y-2">
              {#each topPurchases as item, i}
                <div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold {i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500'}">
                      {i + 1}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-medical-text-primary">{item.name}</p>
                      <p class="text-xs text-medical-text-tertiary">
                        {item.purchaseDate || '-'} · {PURCHASE_CHANNEL_LABELS[item.purchaseChannel] || '-'}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-semibold text-medical-text-primary">¥{item.amount.toFixed(2)}</p>
                    <p class="text-xs text-medical-text-tertiary">{item.quantity} {item.unit} × ¥{item.unitPrice}</p>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="h-64 flex items-center justify-center">
              <div class="text-center">
                <Icon name="shoppingCart" size={48} color="#D1D5DB" />
                <p class="text-medical-text-secondary mt-4">暂无排行数据</p>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    {#if filteredWithPurchase.length > 0}
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
        <h3 class="text-lg font-semibold text-medical-text-primary mb-4">消费明细</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left py-3 px-4 font-medium text-medical-text-secondary">药品名称</th>
                <th class="text-left py-3 px-4 font-medium text-medical-text-secondary">分类</th>
                <th class="text-left py-3 px-4 font-medium text-medical-text-secondary">规格</th>
                <th class="text-right py-3 px-4 font-medium text-medical-text-secondary">单价</th>
                <th class="text-right py-3 px-4 font-medium text-medical-text-secondary">数量</th>
                <th class="text-right py-3 px-4 font-medium text-medical-text-secondary">总金额</th>
                <th class="text-left py-3 px-4 font-medium text-medical-text-secondary">购买日期</th>
                <th class="text-left py-3 px-4 font-medium text-medical-text-secondary">购买渠道</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredWithPurchase.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)) as m}
                <tr class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="py-3 px-4 text-medical-text-primary">{m.name}</td>
                  <td class="py-3 px-4 text-medical-text-secondary">{CATEGORY_LABELS[m.category] || '-'}</td>
                  <td class="py-3 px-4 text-medical-text-secondary">{m.specification || '-'}</td>
                  <td class="py-3 px-4 text-right text-medical-text-primary">¥{parseFloat(m.unitPrice).toFixed(2)}</td>
                  <td class="py-3 px-4 text-right text-medical-text-primary">{m.quantity} {m.unit}</td>
                  <td class="py-3 px-4 text-right font-medium text-medical-green-500">¥{calculateTotalAmount(m).toFixed(2)}</td>
                  <td class="py-3 px-4 text-medical-text-secondary">{m.purchaseDate}</td>
                  <td class="py-3 px-4 text-medical-text-secondary">{PURCHASE_CHANNEL_LABELS[m.purchaseChannel] || '-'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</div>
