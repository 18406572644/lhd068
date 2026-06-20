<script>
  import Icon from './Icon.svelte'

  export let currentRoute = 'dashboard'

  const navItems = [
    { id: 'dashboard', label: '首页看板', icon: 'home' },
    { id: 'health-profile', label: '健康档案', icon: 'fileHealth' },
    { id: 'medicines', label: '药品管理', icon: 'pill' },
    { id: 'purchase-list', label: '采购清单', icon: 'shoppingCart' },
    { id: 'medical-records', label: '就诊记录', icon: 'fileText' },
    { id: 'records', label: '用药记录', icon: 'clock' },
    { id: 'family', label: '家庭成员', icon: 'users' },
    { id: 'inventory', label: '库存统计', icon: 'stats' },
    { id: 'statistics', label: '消费统计', icon: 'trendingUp' },
    { id: 'settings', label: '系统设置', icon: 'settings' }
  ]

  function handleNav(id) {
    currentRoute = id
  }
</script>

<aside class="w-60 h-full bg-white border-r border-medical-blue-50 flex flex-col">
  <div class="p-5 border-b border-medical-blue-50">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-blue-400 to-medical-green-400 flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="3" x2="12" y2="21"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
        </svg>
      </div>
      <div>
        <h1 class="text-base font-bold text-medical-text-primary">家庭药箱</h1>
        <p class="text-xs text-medical-text-tertiary">智能收纳·健康提醒</p>
      </div>
    </div>
  </div>

  <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
    {#each navItems as item (item.id)}
      <div
        class="nav-item {currentRoute === item.id ? 'active' : ''}"
        on:click={() => handleNav(item.id)}
      >
        <Icon name={item.icon} size={18} color={currentRoute === item.id ? '#3B82F6' : '#6B7280'} />
        <span class="text-sm">{item.label}</span>
      </div>
    {/each}
  </nav>

  <div class="p-4 border-t border-medical-blue-50">
    <div class="flex items-center gap-3 p-3 rounded-lg bg-medical-blue-50">
      <div class="w-8 h-8 rounded-full bg-medical-green-400 flex items-center justify-center text-white text-sm font-medium">
        我
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-medical-text-primary truncate">家庭管理员</p>
        <p class="text-xs text-medical-text-tertiary truncate">守护家人健康</p>
      </div>
    </div>
  </div>
</aside>
