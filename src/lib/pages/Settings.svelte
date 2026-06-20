<script>
  import Icon from '../components/Icon.svelte'
  import { settings, updateSettings } from '../stores/settings.js'
  import { medicines } from '../stores/medicines.js'
  import { familyMembers } from '../stores/familyMembers.js'
  import { medicationRecords } from '../stores/medicationRecords.js'

  function handleExportData() {
    const data = {
      medicines: $medicines,
      familyMembers: $familyMembers,
      medicationRecords: $medicationRecords,
      settings: $settings,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `家庭药箱数据_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportData(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.medicines) localStorage.setItem('medicines', JSON.stringify(data.medicines))
        if (data.familyMembers) localStorage.setItem('familyMembers', JSON.stringify(data.familyMembers))
        if (data.medicationRecords) localStorage.setItem('medicationRecords', JSON.stringify(data.medicationRecords))
        if (data.settings) localStorage.setItem('settings', JSON.stringify(data.settings))
        alert('数据导入成功！请刷新页面。')
        location.reload()
      } catch (err) {
        alert('导入失败：文件格式不正确')
      }
    }
    reader.readAsText(file)
  }

  function handleClearAll() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      if (confirm('再次确认：所有药品、成员、记录数据将被删除！')) {
        localStorage.clear()
        location.reload()
      }
    }
  }
</script>

<div class="h-full overflow-y-auto">
  <div class="p-6 max-w-3xl mx-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-medical-text-primary">系统设置</h2>
      <p class="text-sm text-medical-text-secondary mt-1">管理提醒、通知和数据</p>
    </div>

    <div class="space-y-6">
      <div class="card">
        <div class="p-4 border-b border-medical-blue-50">
          <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
            <Icon name="bell" size={18} color="#F59E0B" />
            到期提醒
          </h3>
        </div>
        <div class="p-4 space-y-4">
          <div class="flex items-center justify-between py-2">
            <div>
              <p class="text-sm font-medium text-medical-text-primary">启用到期提醒</p>
              <p class="text-xs text-medical-text-tertiary mt-0.5">应用启动时自动检查即将过期的药品</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" bind:checked={$settings.reminderEnabled} on:change={() => updateSettings({ reminderEnabled: $settings.reminderEnabled })} />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-blue-400"></div>
            </label>
          </div>
          <div class="flex items-center justify-between py-2">
            <div>
              <p class="text-sm font-medium text-medical-text-primary">提前提醒天数</p>
              <p class="text-xs text-medical-text-tertiary mt-0.5">距离到期多少天时开始提醒</p>
            </div>
            <select class="input-base w-32" bind:value={$settings.reminderDays} on:change={() => updateSettings({ reminderDays: $settings.reminderDays })}>
              <option value="7">7 天</option>
              <option value="15">15 天</option>
              <option value="30">30 天</option>
              <option value="60">60 天</option>
              <option value="90">90 天</option>
            </select>
          </div>
          <div class="flex items-center justify-between py-2">
            <div>
              <p class="text-sm font-medium text-medical-text-primary">自动检查有效期</p>
              <p class="text-xs text-medical-text-tertiary mt-0.5">后台定时检查并推送提醒</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" bind:checked={$settings.autoCheckExpiry} on:change={() => updateSettings({ autoCheckExpiry: $settings.autoCheckExpiry })} />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-blue-400"></div>
            </label>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="p-4 border-b border-medical-blue-50">
          <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
            <Icon name="settings" size={18} color="#3B82F6" />
            运行设置
          </h3>
        </div>
        <div class="p-4 space-y-4">
          <div class="flex items-center justify-between py-2">
            <div>
              <p class="text-sm font-medium text-medical-text-primary">后台静默运行</p>
              <p class="text-xs text-medical-text-tertiary mt-0.5">关闭窗口后最小化到系统托盘继续运行</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" bind:checked={$settings.runInBackground} on:change={() => updateSettings({ runInBackground: $settings.runInBackground })} />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-blue-400"></div>
            </label>
          </div>
          <div class="flex items-center justify-between py-2">
            <div>
              <p class="text-sm font-medium text-medical-text-primary">最小化到托盘</p>
              <p class="text-xs text-medical-text-tertiary mt-0.5">点击关闭按钮时最小化而不是退出</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" bind:checked={$settings.minimizeToTray} on:change={() => updateSettings({ minimizeToTray: $settings.minimizeToTray })} />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-blue-400"></div>
            </label>
          </div>
          <div class="flex items-center justify-between py-2">
            <div>
              <p class="text-sm font-medium text-medical-text-primary">显示桌面通知</p>
              <p class="text-xs text-medical-text-tertiary mt-0.5">使用系统通知推送到期提醒</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" bind:checked={$settings.showNotifications} on:change={() => updateSettings({ showNotifications: $settings.showNotifications })} />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-blue-400"></div>
            </label>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="p-4 border-b border-medical-blue-50">
          <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
            <Icon name="file" size={18} color="#10B981" />
            数据管理
          </h3>
        </div>
        <div class="p-4 space-y-3">
          <div class="flex items-center justify-between p-3 rounded-lg bg-medical-blue-50/50">
            <div>
              <p class="text-sm font-medium text-medical-text-primary">导出数据</p>
              <p class="text-xs text-medical-text-tertiary mt-0.5">将所有数据导出为 JSON 备份文件</p>
            </div>
            <button class="btn-secondary" on:click={handleExportData}>
              <Icon name="download" size={16} />
              <span class="ml-1.5">导出</span>
            </button>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-medical-blue-50/50">
            <div>
              <p class="text-sm font-medium text-medical-text-primary">导入数据</p>
              <p class="text-xs text-medical-text-tertiary mt-0.5">从 JSON 备份文件恢复数据（将覆盖现有数据）</p>
            </div>
            <label class="btn-secondary cursor-pointer">
              <Icon name="upload" size={16} />
              <span class="ml-1.5">导入</span>
              <input type="file" accept=".json" class="hidden" on:change={handleImportData} />
            </label>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-red-50">
            <div>
              <p class="text-sm font-medium text-medical-danger">清除所有数据</p>
              <p class="text-xs text-medical-text-tertiary mt-0.5">删除所有药品、成员、记录数据</p>
            </div>
            <button class="btn-danger" on:click={handleClearAll}>
              <Icon name="trash" size={16} />
              <span class="ml-1.5">清除</span>
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="p-4 border-b border-medical-blue-50">
          <h3 class="font-semibold text-medical-text-primary flex items-center gap-2">
            <Icon name="box" size={18} color="#8B5CF6" />
            关于
          </h3>
        </div>
        <div class="p-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-medical-text-secondary">应用名称</span>
            <span class="text-medical-text-primary font-medium">家庭药箱</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-medical-text-secondary">版本号</span>
            <span class="text-medical-text-primary font-medium">v1.0.0</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-medical-text-secondary">技术架构</span>
            <span class="text-medical-text-primary font-medium">Tauri + Svelte + Vite</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-medical-text-secondary">内存优化</span>
            <span class="text-medical-green-500 font-medium">{'< 40MB'}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
