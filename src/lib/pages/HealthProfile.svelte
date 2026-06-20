<script>
  import { onMount, afterUpdate, createEventDispatcher } from 'svelte'
  import Icon from '../components/Icon.svelte'
  import Modal from '../components/Modal.svelte'
  import { familyMembers } from '../stores/familyMembers.js'
  import {
    getMemberFullProfile,
    generateQRCodePayload
  } from '../utils/healthProfile.js'
  import {
    generateHealthReportPDF,
    generateEmergencyCardPDF
  } from '../utils/pdfGenerator.js'
  import { todayISO } from '../utils/helpers.js'
  import { INTERACTION_RISK_COLORS, INTERACTION_RISK_LABELS } from '../utils/constants.js'
  import { Chart, registerables } from 'chart.js'
  import QRCode from 'qrcode'

  Chart.register(...registerables)

  let selectedMemberId = null
  let startDate = ''
  let endDate = ''
  let profile = null
  let loading = false
  let generatingReport = false
  let generatingCard = false

  let showQRModal = false
  let qrDataURL = ''
  let qrMemberInfo = null

  let showReportModal = false
  let reportStartDate = ''
  let reportEndDate = ''
  let reportMemberId = null

  let adherenceChart = null
  let adherenceChartRef = null

  const dispatch = createEventDispatcher()

  $: if ($familyMembers.length > 0 && !selectedMemberId) {
    selectedMemberId = $familyMembers[0].id
  }

  $: if (selectedMemberId) {
    loadProfile()
  }

  function getDefaultDateRange() {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 3)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  onMount(() => {
    const range = getDefaultDateRange()
    startDate = range.start
    endDate = range.end
  })

  async function loadProfile() {
    if (!selectedMemberId) return
    loading = true
    try {
      profile = getMemberFullProfile(selectedMemberId, startDate, endDate)
      await afterUpdatePromise()
      renderAdherenceChart()
    } finally {
      loading = false
    }
  }

  function afterUpdatePromise() {
    return new Promise((resolve) => {
      afterUpdate(() => resolve())
    })
  }

  function renderAdherenceChart() {
    if (!adherenceChartRef || !profile) return

    if (adherenceChart) {
      adherenceChart.destroy()
      adherenceChart = null
    }

    const ctx = adherenceChartRef.getContext('2d')
    const adherence = profile.adherence || {}
    const labels = adherence.weekLabels?.length > 0 ? adherence.weekLabels : ['暂无数据']
    const data = adherence.weeklyData?.length > 0 ? adherence.weeklyData : [0]

    const barColor = adherence.level === 'high'
      ? 'rgba(16, 185, 129, 0.8)'
      : adherence.level === 'medium'
        ? 'rgba(245, 158, 11, 0.8)'
        : 'rgba(239, 68, 68, 0.8)'

    const barBorder = adherence.level === 'high'
      ? 'rgba(16, 185, 129, 1)'
      : adherence.level === 'medium'
        ? 'rgba(245, 158, 11, 1)'
        : 'rgba(239, 68, 68, 1)'

    adherenceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '服药次数',
          data,
          backgroundColor: barColor,
          borderColor: barBorder,
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `实际服药：${ctx.raw} 次 / 预期：21 次`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 21,
            grid: {
              color: 'rgba(229, 231, 235, 0.5)'
            },
            ticks: {
              stepSize: 7,
              color: '#9CA3AF',
              font: { size: 11 }
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#9CA3AF',
              font: { size: 10 },
              maxRotation: 0
            }
          }
        }
      }
    })
  }

  function getDateRangeOptions() {
    const today = todayISO()
    const minus7 = new Date()
    minus7.setDate(minus7.getDate() - 7)
    const minus30 = new Date()
    minus30.setDate(minus30.getDate() - 30)
    const minus90 = new Date()
    minus90.setDate(minus90.getDate() - 90)
    const yearStart = new Date(new Date().getFullYear(), 0, 1)

    return [
      { label: '最近7天', start: minus7.toISOString().split('T')[0], end: today },
      { label: '最近30天', start: minus30.toISOString().split('T')[0], end: today },
      { label: '最近90天', start: minus90.toISOString().split('T')[0], end: today },
      { label: '今年以来', start: yearStart.toISOString().split('T')[0], end: today },
      { label: '全部', start: '', end: '' }
    ]
  }

  function applyPreset(range) {
    startDate = range.start
    endDate = range.end
  }

  function openReportModal() {
    if (!selectedMemberId) return
    const range = getDefaultDateRange()
    reportStartDate = range.start
    reportEndDate = range.end
    reportMemberId = selectedMemberId
    showReportModal = true
  }

  function getReportDateRangeOptions() {
    return getDateRangeOptions()
  }

  function applyReportPreset(range) {
    reportStartDate = range.start
    reportEndDate = range.end
  }

  async function handleGenerateReport() {
    if (!reportMemberId || generatingReport) return
    generatingReport = true
    try {
      const reportProfile = getMemberFullProfile(reportMemberId, reportStartDate, reportEndDate)
      if (reportProfile) {
        await generateHealthReportPDF(reportProfile, {
          startDate: reportStartDate,
          endDate: reportEndDate
        })
        showReportModal = false
      }
    } catch (err) {
      console.error('生成PDF失败:', err)
      alert('生成PDF失败，请重试')
    } finally {
      generatingReport = false
    }
  }

  async function handleGenerateEmergencyCard() {
    if (!selectedMemberId || generatingCard) return
    generatingCard = true
    try {
      await generateEmergencyCardPDF(selectedMemberId)
    } catch (err) {
      console.error('生成急诊卡失败:', err)
      alert('生成急诊卡失败，请重试')
    } finally {
      generatingCard = false
    }
  }

  async function handleShowQRCode() {
    if (!selectedMemberId) return
    try {
      const payload = generateQRCodePayload(selectedMemberId)
      if (payload) {
        qrDataURL = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          color: {
            dark: '#111827',
            light: '#FFFFFF'
          }
        })
        qrMemberInfo = profile?.basicInfo
        showQRModal = true
      }
    } catch (err) {
      console.error('生成二维码失败:', err)
      alert('生成二维码失败，请重试')
    }
  }

  function downloadQRCode() {
    if (!qrDataURL || !qrMemberInfo) return
    const link = document.createElement('a')
    link.download = `健康二维码_${qrMemberInfo.name}.png`
    link.href = qrDataURL
    link.click()
  }

  function getRiskCardStyle(level) {
    return INTERACTION_RISK_COLORS[level] || 'bg-blue-50 text-blue-600 border-blue-200'
  }

  function getRiskLabel(level) {
    return INTERACTION_RISK_LABELS[level] || '低风险'
  }

  function getWarningTypeLabel(type) {
    const map = {
      allergy: '过敏冲突',
      disease: '慢病禁忌',
      organ: '器官禁忌',
      dosage: '剂量提示',
      interaction: '药物相互作用'
    }
    return map[type] || type
  }
</script>

<div class="h-full flex flex-col">
  <!-- 顶部导航栏 -->
  <div class="p-6 border-b border-medical-blue-50 bg-white">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 class="text-2xl font-bold text-medical-text-primary">健康档案</h2>
        <p class="text-sm text-medical-text-secondary mt-1">聚合展示家庭成员的健康信息，支持导出PDF报告</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          class="btn-secondary"
          on:click={handleShowQRCode}
          disabled={!selectedMemberId}
        >
          <Icon name="qrCode" size={16} />
          <span class="ml-1.5">健康二维码</span>
        </button>
        <button
          class="btn-secondary"
          on:click={handleGenerateEmergencyCard}
          disabled={!selectedMemberId || generatingCard}
        >
          <Icon name="zap" size={16} color="#EF4444" />
          <span class="ml-1.5">{generatingCard ? '生成中...' : '急诊卡'}</span>
        </button>
        <button
          class="btn-primary"
          on:click={openReportModal}
          disabled={!selectedMemberId}
        >
          <Icon name="download" size={16} />
          <span class="ml-1.5">生成PDF报告</span>
        </button>
      </div>
    </div>

    <!-- 家庭成员选择 -->
    <div class="mt-5">
      <div class="flex items-center gap-2 flex-wrap mb-3">
        {#each $familyMembers as member (member.id)}
          <button
            class="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border-2 {selectedMemberId === member.id ? 'border-medical-blue-400 bg-medical-blue-50 text-medical-blue-600 shadow-sm' : 'border-transparent bg-gray-50 text-medical-text-secondary hover:bg-medical-blue-50/50 hover:text-medical-blue-500'}"
            on:click={() => { selectedMemberId = member.id }}
          >
            <span class="text-lg">{member.avatar}</span>
            <span>{member.name}</span>
            {#if selectedMemberId === member.id}
              <span
                class="w-2 h-2 rounded-full"
                style="background-color: {member.color};"
              ></span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- 时间范围筛选 -->
    <div class="mt-2 flex items-center gap-3 flex-wrap">
      <span class="text-xs text-medical-text-tertiary flex-shrink-0">时间范围：</span>
      <div class="flex items-center gap-1 flex-wrap">
        {#each getDateRangeOptions() as range (range.label)}
          <button
            class="px-3 py-1 rounded-lg text-xs font-medium transition-all {startDate === range.start && endDate === range.end ? 'bg-medical-blue-400 text-white' : 'bg-gray-100 text-medical-text-secondary hover:bg-medical-blue-100 hover:text-medical-blue-600'}"
            on:click={() => applyPreset(range)}
          >
            {range.label}
          </button>
        {/each}
      </div>
      <div class="flex items-center gap-1.5 text-xs text-medical-text-secondary">
        <input
          type="date"
          class="input-base !py-1 !px-2 !text-xs w-auto"
          bind:value={startDate}
          on:change={loadProfile}
        />
        <span>至</span>
        <input
          type="date"
          class="input-base !py-1 !px-2 !text-xs w-auto"
          bind:value={endDate}
          on:change={loadProfile}
        />
      </div>
    </div>
  </div>

  <!-- 内容区 -->
  <div class="flex-1 overflow-y-auto p-6 bg-gray-50/50">
    {#if loading}
      <div class="h-full flex items-center justify-center">
        <div class="text-medical-text-secondary">加载中...</div>
      </div>
    {:else if !profile}
      <div class="h-full flex flex-col items-center justify-center py-20">
        <div class="w-20 h-20 rounded-full bg-medical-blue-50 flex items-center justify-center mb-4">
          <Icon name="fileText" size={40} color="#93C5FD" />
        </div>
        <p class="text-medical-text-secondary mb-4">请先选择家庭成员</p>
      </div>
    {:else}
      <div class="space-y-5">
        <!-- 顶部卡片：基本信息 + 过敏史 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- 基本信息 -->
          <div class="card p-5 lg:col-span-2">
            <div class="flex items-start gap-4">
              <div
                class="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
                style="background-color: {profile.basicInfo.color}20;"
              >
                {profile.basicInfo.avatar}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h3 class="text-xl font-bold text-medical-text-primary">{profile.basicInfo.name}</h3>
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <span class="tag bg-medical-blue-50 text-medical-blue-500">{profile.basicInfo.relation}</span>
                      {#if profile.basicInfo.ageText}
                        <span class="tag bg-purple-50 text-purple-500">{profile.basicInfo.ageText}</span>
                      {/if}
                      {#if profile.basicInfo.weight}
                        <span class="tag bg-gray-50 text-gray-500">{profile.basicInfo.weight}kg</span>
                      {/if}
                    </div>
                  </div>
                  <div class="flex items-center gap-4 text-sm flex-wrap">
                    <div class="text-right">
                      <p class="text-xs text-medical-text-tertiary">用药记录</p>
                      <p class="font-semibold text-medical-text-primary">{profile.adherence.totalActualDoses} 次</p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-medical-text-tertiary">就诊记录</p>
                      <p class="font-semibold text-medical-text-primary">{profile.medicalRecords.length} 次</p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-medical-text-tertiary">当前用药</p>
                      <p class="font-semibold text-medical-text-primary">{profile.currentMedications.length} 种</p>
                    </div>
                  </div>
                </div>

                <!-- 过敏史醒目展示 -->
                {#if profile.basicInfo.allergyLabels?.length > 0}
                  <div class="mt-4 p-3 rounded-xl bg-red-50 border border-red-200">
                    <div class="flex items-center gap-2 mb-1.5">
                      <Icon name="alert" size={16} color="#DC2626" />
                      <span class="text-sm font-bold text-red-700">药物过敏史（就医时请务必告知医生）</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      {#each profile.basicInfo.allergyLabels as allergy}
                        <span class="tag bg-white text-red-600 border border-red-200 text-xs font-medium">{allergy}</span>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <!-- 依从性概览 -->
          <div class="card p-5">
            <p class="text-xs font-semibold text-medical-text-tertiary uppercase tracking-wide mb-3">用药依从性评分</p>
            <div class="flex items-center gap-4">
              <div class="relative w-24 h-24 flex-shrink-0">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="#E5E7EB" stroke-width="10" fill="none" />
                  <circle
                    cx="50" cy="50" r="42"
                    stroke={profile.adherence.levelColor}
                    stroke-width="10"
                    fill="none"
                    stroke-linecap="round"
                    stroke-dasharray={2 * Math.PI * 42}
                    stroke-dashoffset={2 * Math.PI * 42 * (1 - profile.adherence.adherenceRate / 100)}
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center flex-col">
                  <span class="text-2xl font-bold" style="color: {profile.adherence.levelColor};">{profile.adherence.adherenceRate}%</span>
                </div>
              </div>
              <div class="flex-1">
                <p class="text-lg font-bold" style="color: {profile.adherence.levelColor};">{profile.adherence.levelText}</p>
                <div class="space-y-1 mt-2 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="text-medical-text-tertiary">统计天数</span>
                    <span class="font-medium text-medical-text-primary">{profile.adherence.totalDays} 天</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-medical-text-tertiary">有记录天数</span>
                    <span class="font-medium text-medical-text-primary">{profile.adherence.daysWithDosing} 天</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-medical-text-tertiary">实际/预期</span>
                    <span class="font-medium text-medical-text-primary">{profile.adherence.totalActualDoses} / {profile.adherence.totalExpectedDoses}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 健康信息行 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <!-- 慢性病史 -->
          <div class="card p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Icon name="clock" size={16} color="#F59E0B" />
              </div>
              <h4 class="font-semibold text-medical-text-primary">慢性病史</h4>
            </div>
            {#if profile.basicInfo.chronicLabels?.length > 0}
              <div class="flex flex-wrap gap-2">
                {#each profile.basicInfo.chronicLabels as disease}
                  <span class="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    {disease}
                  </span>
                {/each}
              </div>
            {:else}
              <p class="text-sm text-medical-text-tertiary">无慢性病记录</p>
            {/if}

            <div class="mt-4 pt-4 border-t border-medical-blue-50 grid grid-cols-2 gap-3">
              <div class="p-3 rounded-xl {profile.basicInfo.liverFunction === 'normal' ? 'bg-medical-green-50' : 'bg-red-50'}">
                <p class="text-xs text-medical-text-tertiary">肝功能</p>
                <p class="text-sm font-semibold mt-1 {profile.basicInfo.liverFunction === 'normal' ? 'text-medical-green-600' : 'text-medical-danger'}">
                  {profile.basicInfo.liverFunctionLabel}
                </p>
              </div>
              <div class="p-3 rounded-xl {profile.basicInfo.kidneyFunction === 'normal' ? 'bg-medical-green-50' : 'bg-red-50'}">
                <p class="text-xs text-medical-text-tertiary">肾功能</p>
                <p class="text-sm font-semibold mt-1 {profile.basicInfo.kidneyFunction === 'normal' ? 'text-medical-green-600' : 'text-medical-danger'}">
                  {profile.basicInfo.kidneyFunctionLabel}
                </p>
              </div>
            </div>
          </div>

          <!-- 药物安全评估 -->
          <div class="card p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                <Icon name="shield" size={16} color="#F43F5E" />
              </div>
              <h4 class="font-semibold text-medical-text-primary">药物安全评估</h4>
            </div>
            {#if profile.safetyAssessment.summary}
              <div
                class="p-3 rounded-xl border-2 mb-4"
                style="background-color: {profile.safetyAssessment.summary.overallRiskColor}10; border-color: {profile.safetyAssessment.summary.overallRiskColor}40;"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium" style="color: {profile.safetyAssessment.summary.overallRiskColor};">
                    综合风险等级
                  </span>
                  <span
                    class="text-lg font-bold"
                    style="color: {profile.safetyAssessment.summary.overallRiskColor};"
                  >
                    {profile.safetyAssessment.summary.overallRiskText}
                  </span>
                </div>
                <p class="text-xs text-medical-text-secondary mt-2">
                  {profile.safetyAssessment.summary.overallRiskDesc}
                </p>
              </div>

              <div class="grid grid-cols-5 gap-2">
                <div class="text-center p-2 rounded-lg bg-red-50">
                  <p class="text-lg font-bold text-medical-danger">{profile.safetyAssessment.summary.highCount}</p>
                  <p class="text-[10px] text-medical-text-tertiary mt-0.5">高风险</p>
                </div>
                <div class="text-center p-2 rounded-lg bg-amber-50">
                  <p class="text-lg font-bold text-amber-600">{profile.safetyAssessment.summary.mediumCount}</p>
                  <p class="text-[10px] text-medical-text-tertiary mt-0.5">中风险</p>
                </div>
                <div class="text-center p-2 rounded-lg bg-medical-blue-50">
                  <p class="text-lg font-bold text-medical-blue-500">{profile.safetyAssessment.summary.lowCount}</p>
                  <p class="text-[10px] text-medical-text-tertiary mt-0.5">低风险</p>
                </div>
                <div class="text-center p-2 rounded-lg bg-pink-50">
                  <p class="text-lg font-bold text-pink-600">{profile.safetyAssessment.summary.allergyRisk}</p>
                  <p class="text-[10px] text-medical-text-tertiary mt-0.5">过敏项</p>
                </div>
                <div class="text-center p-2 rounded-lg bg-purple-50">
                  <p class="text-lg font-bold text-purple-600">{profile.safetyAssessment.summary.chronicCount}</p>
                  <p class="text-[10px] text-medical-text-tertiary mt-0.5">慢病</p>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- 当前用药清单 -->
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-medical-blue-50 flex items-center justify-center">
                <Icon name="pill" size={16} color="#3B82F6" />
              </div>
              <h4 class="font-semibold text-medical-text-primary">当前用药清单</h4>
              <span class="tag bg-medical-blue-50 text-medical-blue-500 text-xs">{profile.currentMedications.length} 种</span>
            </div>
          </div>

          {#if profile.currentMedications.length > 0}
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b-2 border-medical-blue-50">
                    <th class="text-left py-3 px-3 text-xs font-semibold text-medical-text-tertiary uppercase tracking-wide">药品名称</th>
                    <th class="text-left py-3 px-3 text-xs font-semibold text-medical-text-tertiary uppercase tracking-wide">剂量</th>
                    <th class="text-left py-3 px-3 text-xs font-semibold text-medical-text-tertiary uppercase tracking-wide">频次</th>
                    <th class="text-left py-3 px-3 text-xs font-semibold text-medical-text-tertiary uppercase tracking-wide">规格</th>
                    <th class="text-left py-3 px-3 text-xs font-semibold text-medical-text-tertiary uppercase tracking-wide">类型</th>
                    <th class="text-left py-3 px-3 text-xs font-semibold text-medical-text-tertiary uppercase tracking-wide">有效期</th>
                  </tr>
                </thead>
                <tbody>
                  {#each profile.currentMedications as med, idx}
                    <tr class="border-b border-medical-blue-50/50 {idx % 2 === 1 ? 'bg-gray-50/30' : ''} hover:bg-medical-blue-50/30 transition-colors">
                      <td class="py-3 px-3">
                        <div class="font-medium text-medical-text-primary text-sm">{med.name}</div>
                        {#if med.usage}
                          <div class="text-xs text-medical-text-tertiary mt-0.5">{med.usage}</div>
                        {/if}
                      </td>
                      <td class="py-3 px-3 text-sm text-medical-text-secondary">{med.dosage || '-'}{med.dosageUnit || ''}</td>
                      <td class="py-3 px-3 text-sm text-medical-text-secondary">{med.frequency || '-'}</td>
                      <td class="py-3 px-3 text-sm text-medical-text-secondary">{med.specification || '-'}</td>
                      <td class="py-3 px-3">
                        {#if med.isLongTerm}
                          <span class="tag bg-medical-blue-50 text-medical-blue-500 text-xs">长期用药</span>
                        {:else if med.duration}
                          <span class="tag bg-purple-50 text-purple-500 text-xs">{med.duration}</span>
                        {:else}
                          <span class="tag bg-gray-50 text-gray-500 text-xs">短期</span>
                        {/if}
                      </td>
                      <td class="py-3 px-3 text-sm text-medical-text-secondary">{med.expiryDate || '-'}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <div class="py-8 text-center text-medical-text-tertiary text-sm">
              <Icon name="pill" size={32} color="#D1D5DB" />
              <p class="mt-2">暂无当前用药记录</p>
            </div>
          {/if}
        </div>

        <!-- 风险预警详情 -->
        {#if profile.safetyAssessment.warnings?.length > 0}
          <div class="card p-5 bg-rose-50/30 border-rose-100">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <Icon name="alert" size={16} color="#F43F5E" />
              </div>
              <h4 class="font-semibold text-medical-text-primary">风险预警详情</h4>
              <span class="tag bg-rose-100 text-rose-600 text-xs">{profile.safetyAssessment.warnings.length} 条</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {#each profile.safetyAssessment.warnings as warning}
                <div class="p-3 rounded-xl border-2 {getRiskCardStyle(warning.level)}">
                  <div class="flex items-start justify-between gap-2 mb-1.5">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60">{getRiskLabel(warning.level)}</span>
                      <span class="text-xs px-2 py-0.5 rounded-full bg-white/60">{getWarningTypeLabel(warning.type)}</span>
                    </div>
                    <Icon name="alertTriangle" size={14} />
                  </div>
                  <p class="text-sm font-semibold">{warning.medicine} · {warning.title}</p>
                  <p class="text-xs mt-1 opacity-80">{warning.description}</p>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- 用药依从性图表 + 就诊记录 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <!-- 依从性图表 -->
          <div class="card p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                <Icon name="trendingUp" size={16} color="#06B6D4" />
              </div>
              <h4 class="font-semibold text-medical-text-primary">用药依从性趋势</h4>
            </div>
            <div class="h-48">
              <canvas bind:this={adherenceChartRef}></canvas>
            </div>
          </div>

          <!-- 近期就诊记录 -->
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Icon name="fileText" size={16} color="#8B5CF6" />
                </div>
                <h4 class="font-semibold text-medical-text-primary">近期就诊记录</h4>
              </div>
              {#if profile.medicalRecords.length > 0}
                <span class="text-xs text-medical-text-tertiary">共 {profile.medicalRecords.length} 条</span>
              {/if}
            </div>

            {#if profile.medicalRecords.length > 0}
              <div class="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {#each profile.medicalRecords.slice(0, 5) as record}
                  <div class="p-3 rounded-xl bg-violet-50/50 border border-violet-100/50">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-sm font-semibold text-violet-700">{record.visitDate}</span>
                          <span class="text-xs text-medical-text-tertiary">
                            {record.hospital} · {record.department}
                          </span>
                        </div>
                        <p class="text-sm font-medium text-medical-text-primary mt-1">诊断：{record.diagnosis}</p>
                        {#if record.prescribedMedicines?.length > 0}
                          <div class="flex flex-wrap gap-1 mt-1.5">
                            {#each record.prescribedMedicines.slice(0, 3) as pm}
                              <span class="text-[10px] px-1.5 py-0.5 rounded bg-white text-medical-blue-500 border border-medical-blue-100">
                                {pm.medicineName}
                              </span>
                            {/each}
                            {#if record.prescribedMedicines.length > 3}
                              <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                +{record.prescribedMedicines.length - 3}
                              </span>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="py-8 text-center text-medical-text-tertiary text-sm">
                <Icon name="fileText" size={32} color="#D1D5DB" />
                <p class="mt-2">暂无就诊记录</p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- 生成报告弹窗 -->
<Modal bind:show={showReportModal} title="生成PDF健康报告" width="480px" on:close={() => { showReportModal = false }}>
  <div class="space-y-4">
    <div>
      <label class="label-base">选择家庭成员</label>
      <select class="input-base" bind:value={reportMemberId}>
        {#each $familyMembers as m (m.id)}
          <option value={m.id}>{m.avatar} {m.name}（{m.relation}）</option>
        {/each}
      </select>
    </div>

    <div>
      <label class="label-base">选择时间范围</label>
      <div class="flex flex-wrap gap-1.5 mb-2">
        {#each getReportDateRangeOptions() as range (range.label)}
          <button
            type="button"
            class="px-3 py-1 rounded-lg text-xs font-medium transition-all {reportStartDate === range.start && reportEndDate === range.end ? 'bg-medical-blue-400 text-white' : 'bg-gray-100 text-medical-text-secondary hover:bg-medical-blue-100 hover:text-medical-blue-600'}"
            on:click={() => applyReportPreset(range)}
          >
            {range.label}
          </button>
        {/each}
      </div>
      <div class="flex items-center gap-2">
        <input type="date" class="input-base flex-1" bind:value={reportStartDate} />
        <span class="text-medical-text-secondary">至</span>
        <input type="date" class="input-base flex-1" bind:value={reportEndDate} />
      </div>
    </div>

    <div class="p-4 rounded-xl bg-medical-blue-50">
      <p class="text-xs font-semibold text-medical-blue-600 mb-2">📋 报告将包含以下内容：</p>
      <ul class="text-xs text-medical-text-secondary space-y-1">
        <li>• 个人信息与过敏/禁忌摘要（首页醒目位置）</li>
        <li>• 当前用药清单（含剂量、频次）</li>
        <li>• 近期就诊记录（含诊断和处方）</li>
        <li>• 用药依从性统计图</li>
        <li>• 药物安全评估摘要</li>
        <li>• 扫码查看电子版的二维码</li>
      </ul>
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => { showReportModal = false }}>取消</button>
    <button
      class="btn-primary"
      on:click={handleGenerateReport}
      disabled={generatingReport || !reportMemberId}
    >
      {#if generatingReport}
        <Icon name="loader" size={16} />
        <span class="ml-1.5">生成中...</span>
      {:else}
        <Icon name="download" size={16} />
        <span class="ml-1.5">生成并下载</span>
      {/if}
    </button>
  </div>
</Modal>

<!-- 二维码弹窗 -->
<Modal bind:show={showQRModal} title="健康信息二维码" width="420px" on:close={() => { showQRModal = false }}>
  <div class="space-y-4">
    {#if qrMemberInfo}
      <div class="flex items-center gap-3 p-3 rounded-xl" style="background-color: {qrMemberInfo.color}15;">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style="background-color: {qrMemberInfo.color}30;"
        >
          {qrMemberInfo.avatar}
        </div>
        <div>
          <p class="font-semibold text-medical-text-primary">{qrMemberInfo.name}</p>
          <p class="text-xs text-medical-text-secondary">{qrMemberInfo.relation} · {qrMemberInfo.ageText}</p>
        </div>
      </div>
    {/if}

    <div class="flex justify-center">
      <div class="p-4 bg-white rounded-2xl border-2 border-medical-blue-100 shadow-sm">
        {#if qrDataURL}
          <img src={qrDataURL} alt="健康二维码" class="w-64 h-64" />
        {:else}
          <div class="w-64 h-64 flex items-center justify-center bg-gray-50 text-medical-text-tertiary">
            生成中...
          </div>
        {/if}
      </div>
    </div>

    <div class="p-4 rounded-xl bg-amber-50 border border-amber-100">
      <div class="flex items-start gap-2">
        <Icon name="alert" size={16} color="#D97706" class="mt-0.5 flex-shrink-0" />
        <div>
          <p class="text-sm font-semibold text-amber-800">使用说明</p>
          <p class="text-xs text-amber-700 mt-1">
            医生或急救人员扫描此二维码即可快速获取关键健康信息（过敏史、禁忌、当前用药等）。建议保存至手机相册或打印随身携带。
          </p>
        </div>
      </div>
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => { showQRModal = false }}>关闭</button>
    <button class="btn-secondary" on:click={downloadQRCode}>
      <Icon name="download" size={16} />
      <span class="ml-1.5">保存图片</span>
    </button>
  </div>
</Modal>
