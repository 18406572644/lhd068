<script>
  export let size = 20
  export let color = 'currentColor'
</script>

<svelte:options customElement="icon-component" />

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <slot />
</svg>
