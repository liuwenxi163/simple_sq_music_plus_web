<script setup>
defineProps({ name: String, size: { default: 21 } })
const paths = {
  calendar: 'M4 5h16v16H4zM8 2v6M16 2v6M4 10h16M8 14h2M14 14h2M8 18h2',
  library: 'M4 4v16M9 4v16M14 5l5-1 3 15-5 1z', search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', settings: 'M4 7h16M4 17h16M8 4v6M16 14v6',
  play: 'm8 4 13 8-13 8z', pause: 'M7 4v16M17 4v16', next: 'm5 4 12 8-12 8zM20 4v16', prev: 'm19 4-12 8 12 8zM4 4v16',
  down: 'm5 9 7 7 7-7', close: 'm5 5 14 14M19 5 5 19', more: 'M5 12h.01M12 12h.01M19 12h.01',
  queue: 'M3 5h18M3 11h18M3 17h11m4-1 4 3-4 3z', shuffle: 'm3 4 15 16h3m-3-3 3 3-3 3M3 20l6-7m4-2 5-7h3m-3-3 3 3-3 3',
  repeat: 'M4 7h16l-4-4m4 4-4 4M20 17H4l4 4m-4-4 4-4', volume: 'm11 4-6 5H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3m12-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3',
  refresh: 'M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 14-2l1 2M4 17l1 2a8 8 0 0 0 14-2',
  lyrics: 'M4 4h16v16H4zM8 9h8M8 13h8M8 17h4', arrow: 'M4 12h16m-6-6 6 6-6 6', plus: 'M12 4v16M4 12h16',
  server: 'M4 3h16v7H4zM4 14h16v7H4zM8 6.5h.01M8 17.5h.01M12 6.5h5M12 17.5h5',
  cloud: 'M7 19a5 5 0 0 1-1-9.9 7 7 0 0 1 13.4 1.5A4.3 4.3 0 0 1 18 19z',
  spark: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z'
}
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.music" /></svg></template>
