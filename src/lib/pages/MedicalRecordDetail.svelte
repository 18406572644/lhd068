<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import Icon from '../components/Icon.svelte'
  import Modal from '../components/Modal.svelte'
  import { getMedicalRecordTimeline } from '../stores/medicalRecords.js'
  import { familyMembers, getMemberById } from '../stores/familyMembers.js'
  import { formatDate, formatDateTime, getDaysUntilExpiry } from '../utils/helpers.js'

  const dispatch = createEventDispatcher()

  export let show = false
  export let record = null

  let timeline = []
  let activeTab = 'overview'
  let showAttachmentPreview = false
  let currentPreviewAttachment = null

  $: if (show && record) {
    timeline = getMedicalRecordTimeline(record.id)
  }

  $: member = record ? getMemberById(record.familyMemberId) : null

  function getNextVisitStatus(nextVisitDate) {
    if (!nextVisitDate) return null
    const days = getDaysUntilExpiry(nextVisitDate)
    if (days < 0) return { text: `已逾期 ${Math.abs(days)} 天`, class: 'bg-red-50 text-medical-danger' }
    if (days === 0) return { text: '今天复诊', class: 'bg-red-50 text-medical-danger' }
    if (days <= 7) return { text: `${days}天后复诊`, class: 'bg-amber-50 text-medical-warning' }
    return { text: `${days}天后复诊`, class: 'bg-medical-green-50 text-medical-green-500' }
  }

  function getTimelineIcon(type) {
    switch (type) {
      case 'visit': return 'stethoscope'
      case 'medication': return 'pill'
      case 'next_visit': return 'calendar'
      default: return 'clock'
    }
  }

  function getTimelineColor(type) {
    switch (type) {
      case 'visit': return 'bg-medical-blue-500'
      case 'medication': return 'bg-medical-green-500'
      case 'next_visit': return 'bg-medical-warning'
      default: return 'bg-gray-400'
    }
  }

  function getTimelineBgColor(type) {
    switch (type) {
      case 'visit': return 'bg-medical-blue-50 border-medical-blue-200'
      case 'medication': return 'bg-medical-green-50 border-medical-green-200'
      case 'next_visit': return 'bg-amber-50 border-amber-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  function handleEdit() {
    dispatch('edit', record)
  }

  function handleClose() {
    show = false
    dispatch('close')
  }

  function openAttachmentPreview(attachment) {
    currentPreviewAttachment = attachment
    showAttachmentPreview = true
  }

  const tabs = [
    { id: 'overview', label: '总览', icon: 'fileText' },
    { id: 'timeline', label: '时间线', icon: 'history' },
    { id: 'prescription', label: '处方', icon: 'clipboard' },
    { id: 'attachments', label: '附件', icon: 'paperclip' }
  ]
</script>

<Modal {show} title="就诊记录详情" width="800px" on:close={handleClose}>
  {#if record && member}
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style="background-color: {member.color}20;">
            {member.avatar}
          </div>
          <div>
            <h3 class="text-xl font-bold text-medical-text-primary">{member.name}</h3>
            <div class="flex items-center gap-3 mt-1">
              <span class="flex items-center gap-1 text-sm text-medical-text-secondary">
                <Icon name="calendar" size={14} />
                {formatDate(record.visitDate)}
              </span>
              <span class="flex items-center gap-1 text-sm text-medical-text-secondary">
                <Icon name="mapPin" size={14} />
                {record.hospital}
              </span>
              {#if record.department}
                <span class="flex items-center gap-1 text-sm text-medical-text-secondary">
                  <Icon name="stethoscope" size={14} />
                  {record.department}
                </span>
              {/if}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          {#if record.nextVisitDate}
            {@const nextStatus = getNextVisitStatus(record.nextVisitDate)}
            <span class="tag {nextStatus.class}">
              <Icon name="bell" size={12} />
              {nextStatus.text}
            </span>
          {/if}
          <button class="btn-outline" on:click={handleEdit}>
            <Icon name="edit" size={14} />
            编辑
          </button>
        </div>
      </div>

      <div class="flex gap-1 p-1 bg-medical-blue-50 rounded-lg mb-6">
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
        {#if activeTab === 'overview'}
          <div class="space-y-6">
            <div class="card p-5">
              <h4 class="font-semibold text-medical-text-primary mb-4 flex items-center gap-2">
                <Icon name="activity" size={18} color="#3B82F6" />
                诊断信息
              </h4>
              <div class="space-y-4">
                <div>
                  <p class="text-xs text-medical-text-tertiary mb-1">诊断结果</p>
                  <p class="text-lg font-medium text-medical-text-primary">{record.diagnosis || '-'}</p>
                </div>
                {#if record.chiefComplaint}
                  <div>
                    <p class="text-xs text-medical-text-tertiary mb-1">主诉</p>
                    <p class="text-medical-text-secondary">{record.chiefComplaint}</p>
                  </div>
                {/if}
                {#if record.doctor}
                  <div>
                    <p class="text-xs text-medical-text-tertiary mb-1">主治医生</p>
                    <p class="text-medical-text-secondary">{record.doctor}</p>
                  </div>
                {/if}
                {#if record.medicalSummary}
                  <div>
                    <p class="text-xs text-medical-text-tertiary mb-1">病历摘要</p>
                    <div class="p-4 bg-gray-50 rounded-lg text-medical-text-secondary whitespace-pre-wrap">
                      {record.medicalSummary}
                    </div>
                  </div>
                {/if}
                {#if record.notes}
                  <div>
                    <p class="text-xs text-medical-text-tertiary mb-1">备注</p>
                    <p class="text-medical-text-secondary">{record.notes}</p>
                  </div>
                {/if}
              </div>
            </div>

            {#if record.totalFee}
              <div class="card p-5">
                <h4 class="font-semibold text-medical-text-primary mb-4 flex items-center gap-2">
                  <Icon name="dollarSign" size={18} color="#10B981" />
                  费用信息
                </h4>
                <div class="grid grid-cols-3 gap-4">
                  {#if record.consultationFee}
                    <div class="text-center p-4 bg-medical-blue-50 rounded-lg">
                      <p class="text-xs text-medical-text-tertiary mb-1">诊疗费</p>
                      <p class="text-xl font-bold text-medical-blue-500">¥{record.consultationFee}</p>
                    </div>
                  {/if}
                  {#if record.medicineFee}
                    <div class="text-center p-4 bg-medical-green-50 rounded-lg">
                      <p class="text-xs text-medical-text-tertiary mb-1">药费</p>
                      <p class="text-xl font-bold text-medical-green-500">¥{record.medicineFee}</p>
                    </div>
                  {/if}
                  <div class="text-center p-4 bg-gradient-to-br from-medical-blue-50 to-medical-green-50 rounded-lg">
                    <p class="text-xs text-medical-text-tertiary mb-1">总计</p>
                    <p class="text-xl font-bold text-medical-blue-600">¥{record.totalFee}</p>
                  </div>
                </div>
              </div>
            {/if}

            {#if record.nextVisitDate}
              {@const nextStatus = getNextVisitStatus(record.nextVisitDate)}
              <div class="card p-5 border-amber-200 bg-amber-50/50">
                <h4 class="font-semibold text-medical-text-primary mb-2 flex items-center gap-2">
                  <Icon name="bell" size={18} color="#F59E0B" />
                  复诊提醒
                </h4>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-medical-text-secondary">下次复诊日期</p>
                    <p class="text-lg font-semibold text-medical-warning">{formatDate(record.nextVisitDate)}</p>
                  </div>
                  <span class="tag px-3 py-1.5 {nextStatus.class}">     
                    {nextStatus.text}
                  </span>
                </div>
              </div>
            {/if}
          </div>
        {/if}

        {#if activeTab === 'timeline'}
          <div class="relative">
            <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-medical-blue-100"></div>
            <div class="space-y-6">
              {#each timeline as item (item.id)}
                <div class="relative flex gap-4 pl-12">
                  <div class="absolute left-0 w-10 h-10 rounded-full {getTimelineColor(item.type)} flex items-center justify-center text-white shadow-lg">
                    <Icon name={getTimelineIcon(item.type)} size={18} />
                  </div>
                  <div class="flex-1 card p-4 border {getTimelineBgColor(item.type)}">
                    <div class="flex items-center justify-between mb-2">
                      <h5 class="font-semibold text-medical-text-primary">{item.title}</h5>
                      <span class="text-xs text-medical-text-tertiary">
                        {item.type === 'medication' ? formatDateTime(item.date) : formatDate(item.date)}
                      </span>
                    </div>
                    {#if item.type === 'visit'}
                      <div class="space-y-2">
                        <p class="text-sm text-medical-text-secondary">{item.description}</p>
                        {#if item.doctor}
                          <p class="text-sm text-medical-text-secondary">医生：{item.doctor}</p>
                        {/if}
                        {#if item.diagnosis}
                          <span class="inline-block mt-1 px-2 py-1 bg-white rounded text-xs font-medium text-medical-blue-600">
                            {item.diagnosis}
                          </span>
                        {/if}
                      </div>
                    {:else if item.type === 'medication'}
                      <div class="space-y-1">
                        <p class="font-medium text-medical-green-600">{item.medicineName}</p>
                        <p class="text-sm text-medical-text-secondary">
                          {item.dosage}{item.dosageUnit} · {item.notes || '按时服用'}
                        </p>
                      </div>
                    {:else if item.type === 'next_visit'}
                      <p class="text-sm text-medical-warning font-medium">{item.description}</p>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if activeTab === 'prescription'}
          <div class="space-y-4">
            {#if record.prescribedMedicines && record.prescribedMedicines.length > 0}
              {#each record.prescribedMedicines as med, index (med.medicineId || index)}
                <div class="card p-5">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-medical-green-100 flex items-center justify-center">
                        <Icon name="pill" size={20} color="#10B981" />
                      </div>
                      <div>
                        <h5 class="font-semibold text-medical-text-primary">{med.medicineName}</h5>
                        {#if med.duration}
                          <span class="text-xs text-medical-text-tertiary">疗程：{med.duration}</span>
                        {/if}
                      </div>
                    </div>
                    <span class="text-xs text-medical-green-600 bg-medical-green-50 px-2 py-1 rounded">
                      {med.frequency}
                    </span>
                  </div>
                  <div class="grid grid-cols-3 gap-4 pt-3 border-t border-medical-blue-50">
                    <div>
                      <p class="text-xs text-medical-text-tertiary mb-1">剂量</p>
                      <p class="font-medium text-medical-text-primary">{med.dosage} {med.dosageUnit}</p>
                    </div>
                    <div>
                      <p class="text-xs text-medical-text-tertiary mb-1">用法</p>
                      <p class="font-medium text-medical-text-primary">{med.frequency}</p>
                    </div>
                    <div>
                      <p class="text-xs text-medical-text-tertiary mb-1">疗程</p>
                      <p class="font-medium text-medical-text-primary">{med.duration || '-'}</p>
                    </div>
                  </div>
                </div>
              {/each}
            {:else}
              <div class="py-12 text-center text-medical-text-tertiary">
                <Icon name="pill" size={40} />
                <p class="mt-3">暂无处方药品</p>
              </div>
            {/if}
          </div>
        {/if}

        {#if activeTab === 'attachments'}
          <div class="space-y-4">
            {#if record.attachments && record.attachments.length > 0}
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                {#each record.attachments as attachment (attachment.id)}
                  <div
                    class="card p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    on:click={() => openAttachmentPreview(attachment)}
                  >
                    <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3 flex items-center justify-center">
                      {#if attachment.type.startsWith('image/')}
                        <img src={attachment.data} alt={attachment.name} class="w-full h-full object-cover" />
                      {:else}
                        <Icon name="file" size={48} color="#9CA3AF" />
                      {/if}
                    </div>
                    <p class="text-sm font-medium text-medical-text-primary truncate">{attachment.name}</p>
                    <p class="text-xs text-medical-text-tertiary">{(attachment.size / 1024).toFixed(1)} KB</p>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="py-12 text-center text-medical-text-tertiary">
                <Icon name="paperclip" size={40} />
                <p class="mt-3">暂无附件资料</p>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <div slot="footer">
    <button class="btn-ghost" on:click={handleClose}>关闭</button>
  </div>
</Modal>

<Modal show={showAttachmentPreview} title="附件预览" width="600px" on:close={() => showAttachmentPreview = false}>
  {#if currentPreviewAttachment}
    <div class="flex flex-col items-center">
      {#if currentPreviewAttachment.type.startsWith('image/')}
        <img src={currentPreviewAttachment.data} alt={currentPreviewAttachment.name} class="max-w-full max-h-96 rounded-lg" />
      {:else}
        <div class="py-12 text-center">
          <Icon name="file" size={64} color="#9CA3AF" />
          <p class="mt-4 text-medical-text-secondary">{currentPreviewAttachment.name}</p>
          <p class="text-sm text-medical-text-tertiary mt-1">该文件类型不支持预览，请下载后查看</p>
        </div>
      {/if}
      <p class="mt-4 text-sm text-medical-text-secondary">{currentPreviewAttachment.name} · {(currentPreviewAttachment.size / 1024).toFixed(1)} KB</p>
    </div>
  {/if}
  <div slot="footer">
    <button class="btn-ghost" on:click={() => showAttachmentPreview = false}>关闭</button>
  </div>
</Modal>
