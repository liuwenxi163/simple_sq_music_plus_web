<script setup>
import Icon from './Icon.vue'
import { ref, watch } from 'vue'
const props = defineProps({ src: String, title: String })
const failed = ref(false)
watch(() => props.src, () => failed.value = false)
</script>
<template><span class="artwork"><img v-if="src && !failed" :src="src" alt="" loading="lazy" @error="failed = true" /><span v-else class="art-placeholder"><Icon name="music" :size="36" /></span></span></template>
