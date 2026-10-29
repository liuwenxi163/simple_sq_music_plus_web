<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { mountGrainient } from './ambient-grainient'
const props = defineProps({ active: { type:Boolean, default:true } })
const canvas = ref(null)
let ambient
onMounted(() => { ambient = mountGrainient(canvas.value,{active:props.active}) })
watch(() => props.active,active => ambient?.setActive(active))
onUnmounted(() => ambient?.dispose())
</script>
<template><div class="room-atmosphere" aria-hidden="true"><canvas ref="canvas"></canvas><div class="room-atmosphere-shade"></div></div></template>
