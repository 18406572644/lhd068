<script>
  import { createEventDispatcher } from 'svelte'
  import Icon from './Icon.svelte'

  const dispatch = createEventDispatcher()

  export let show = false
  export let title = ''
  export let width = '520px'
  export let closable = true

  function close() {
    if (closable) {
      show = false
      dispatch('close')
    }
  }

  function stopPropagation(e) {
    e.stopPropagation()
  }

  $: if (show) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" on:click={close}>
    <div class="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"></div>
    <div
      class="relative bg-white rounded-2xl shadow-card flex flex-col max-h-[90vh]"
      style="width: {width}; max-width: 100%"
      on:click={stopPropagation}
    >
      <div class="flex items-center justify-between px-6 py-4 border-b border-medical-blue-50">
        <h3 class="text-lg font-semibold text-medical-text-primary">{title}</h3>
        {#if closable}
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-medical-text-secondary hover:bg-medical-blue-50 hover:text-medical-blue-500 transition-all"
            on:click={close}
          >
            <Icon name="close" size={18} />
          </button>
        {/if}
      </div>
      <div class="flex-1 overflow-y-auto px-6 py-5">
        <slot />
      </div>
      <div class="px-6 py-4 border-t border-medical-blue-50 flex justify-end gap-3">
        <slot name="footer">
          <button class="btn-ghost" on:click={close}>取消</button>
          <button class="btn-primary" on:click|stopPropagation={() => dispatch('confirm')}>确定</button>
        </slot>
      </div>
    </div>
  </div>
{/if}
