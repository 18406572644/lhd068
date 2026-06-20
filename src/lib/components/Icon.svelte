<script>
  import { Icons } from './icons.js'

  export let name = 'home'
  export let size = 20
  export let color = 'currentColor'
  export let strokeWidth = 2
  let className = ''
  export { className as class }

  $: path = Icons[name] || ''
</script>

<svg
  class={className}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  on:click
  on:mouseover
>
  {@html path}
</svg>
