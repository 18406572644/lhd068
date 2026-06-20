<script>
  import Sidebar from './lib/components/Sidebar.svelte'
  import Dashboard from './lib/pages/Dashboard.svelte'
  import Medicines from './lib/pages/Medicines.svelte'
  import MedicalRecords from './lib/pages/MedicalRecords.svelte'
  import Records from './lib/pages/Records.svelte'
  import Family from './lib/pages/Family.svelte'
  import Inventory from './lib/pages/Inventory.svelte'
  import Settings from './lib/pages/Settings.svelte'

  let currentRoute = 'dashboard'

  function goTo(route) {
    currentRoute = route
  }
</script>

<div class="w-full h-full flex overflow-hidden">
  <Sidebar bind:currentRoute={currentRoute} />
  <main class="flex-1 h-full overflow-hidden">
    {#if currentRoute === 'dashboard'}
      <Dashboard {goTo} />
    {:else if currentRoute === 'medicines'}
      <Medicines />
    {:else if currentRoute === 'medical-records'}
      <MedicalRecords />
    {:else if currentRoute === 'records'}
      <Records />
    {:else if currentRoute === 'family'}
      <Family />
    {:else if currentRoute === 'inventory'}
      <Inventory />
    {:else if currentRoute === 'settings'}
      <Settings />
    {/if}
  </main>
</div>
