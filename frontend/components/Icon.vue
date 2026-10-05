<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 17 },
});

const paths = {
  shield: 'M10 2 3 5v5c0 4.2 3 6.8 7 8 4-1.2 7-3.8 7-8V5l-7-3Z|M7 10l2 2 4-4',
  grid: 'M2.5 2.5h6.5v6.5h-6.5z|M11 2.5h6.5v6.5h-6.5z|M2.5 11h6.5v6.5h-6.5z|M11 11h6.5v6.5h-6.5z',
  doc: 'M6 2.5h5.5L15 6v11.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z|M11 2.5V6h4|M7 10h6M7 13h6',
  people: 'M7 6.5a3 3 0 1 0 0-0.01|M1.5 17c.8-3.1 3.3-4.7 5.5-4.7s4.7 1.6 5.5 4.7|M15 7a2.3 2.3 0 1 0 0-0.01|M13.3 12.6c1.8.2 3.5 1.6 4.2 4.4',
  judge: 'M10 6.5a3.2 3.2 0 1 0 0-0.01|M3.5 17c1-3.2 4-4.8 6.5-4.8s5.5 1.6 6.5 4.8|M14.3 5.3l1 1 2-2',
  bars: 'M4 17V9M10 17V3M16 17v-5',
  gear: 'M10 10m-2.6 0a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0 -5.2 0|M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7',
  logout: 'M7.5 17H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3.5|M13 14l4-4-4-4M17 10H7.5',
  award: 'M9 3.5H5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9|M13 3l3.5 3.5L9.5 13.5H6V10L13 3Z',
};

function segments(name) {
  return (paths[name] || "").split("|");
}
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path v-for="(d, i) in segments(name)" :key="i" :d="d" />
  </svg>
</template>
