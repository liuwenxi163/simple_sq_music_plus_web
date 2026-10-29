<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { createFlow } from './flow-scene'
import { sceneKinds,scenePalette } from './scene-model'
import { createAurora } from './aurora-renderer'
import { createScene } from './scene-renderer'
import { defaultPalette, paletteFromPixels } from './scene-palette'
import { createAudioAnalysis } from './audio-analysis'
import { createAudioFeatures } from './audio-features'
const props=defineProps({audio:Object,cover:String,playing:Boolean,mode:{type:String,default:'aurora'}})
const emit=defineEmits(['signal'])
const canvas=ref(null),lightCanvas=ref(null),curtainCanvas=ref(null),curtainSize=ref({width:'1px',height:'1px'}),renderer=ref('css'),signal=ref('waiting'),frames=ref(0),fps=ref(0),drawMs=ref(0),bassLevel=ref(0),midLevel=ref(0),highLevel=ref(0),audioPath=ref('capture'),rawPeak=ref(0),audioClock=ref(0),recoveries=ref(0)
const silence=createAudioFeatures()
let scene,flow,aurora,flowTried=false,auroraTried=false,analysis,observer,frame=0,last=0,count=0,palette=defaultPalette.map(c=>[...c]),generation=0,disposed=false,reduce,budget=700000,windowStart=0,windowFrames=0,drawTotal=0,layout={}
function status(value){if(signal.value!==value){signal.value=value;emit('signal',value)}}
function draw(){
  if(!scene){status('unavailable');return}
  const enabled=props.mode!=='still'&&!reduce?.matches&&props.playing&&!document.hidden
  const sample=enabled?analysis?.sample()||{...silence.reset(),live:false,reason:'waiting'}:{...silence.reset(),live:false}
  status(props.mode==='still'?'still':reduce?.matches?'reduced':!props.playing?'paused':sample.live?'live':sample.reason||'waiting')
  const now=performance.now();let gpu=false
  if(props.mode==='aurora'){if(!flowTried){flowTried=true;flow=createFlow(lightCanvas.value)}gpu=!!flow?.draw(sample,palette,now);renderer.value=gpu?'react-bits-grainient':'canvas2d-liquid'}
  else if(props.mode==='curtain'){if(!auroraTried){auroraTried=true;aurora=createAurora(curtainCanvas.value)}gpu=!!aurora?.draw(sample,scenePalette('curtain',palette),'curtain',now);renderer.value=gpu?'aurora-curtain':'canvas2d-curtain'}
  else renderer.value=props.mode==='still'?'static-artwork':'canvas2d-'+sceneKinds[props.mode]
  const visual=scene.draw(sample,palette,props.mode,layout,{now,gpu})
  if(props.mode==='vinyl')canvas.value?.closest('.player-stage')?.style.setProperty('--record-angle',(visual?.rotation||0)+'rad')
  if(!sample.live){bassLevel.value=midLevel.value=highLevel.value=rawPeak.value=0}
  if(canvas.value)canvas.value.closest('.player-stage')?.style.setProperty('--sound-energy',String(sample.energy))
  return sample
}
function resize(){
  if(!canvas.value)return
  const bounds=canvas.value.getBoundingClientRect(),{width,height}=bounds
  const scale=Math.min(devicePixelRatio||1,1.4,Math.sqrt(budget/Math.max(1,width*height)))
  const stage=canvas.value.closest('.player-stage'),cover=stage?.querySelector('.stage-cover')?.getBoundingClientRect(),rail=stage?.querySelector('.stage-spectrum-slot')?.getBoundingClientRect(),dock=stage?.querySelector('.stage-dock')?.getBoundingClientRect(),record=stage?.querySelector('.stage-record')?.getBoundingClientRect()
  layout={width,height,recordBottom:record?.width?record.bottom-bounds.top:0,dockY:dock?dock.top-bounds.top:height*.83,cover:cover?.width?{x:cover.left-bounds.left,y:cover.top-bounds.top,width:cover.width,height:cover.height}:{x:width*.18,y:height*.18,width:width*.27,height:width*.27},rail:rail?{x:rail.left-bounds.left,y:rail.top-bounds.top,width:rail.width,height:rail.height}:{x:width*.1,y:height*.76,width:width*.8,height:40}}
  const lightScale=Math.min(.8,Math.sqrt(420000/Math.max(1,width*height)));lightCanvas.value.width=Math.max(1,Math.floor(width*lightScale));lightCanvas.value.height=Math.max(1,Math.floor(height*lightScale));curtainCanvas.value.width=Math.max(1,Math.floor(height*lightScale));curtainCanvas.value.height=Math.max(1,Math.floor(width*lightScale));curtainSize.value={width:height+'px',height:width+'px'}
  canvas.value.width=Math.max(1,Math.floor(width*scale));canvas.value.height=Math.max(1,Math.floor(height*scale));draw()
}
function tick(now){
  frame=0;if(disposed||document.hidden||!props.playing||props.mode==='still'||reduce?.matches)return
  if(!last||now-last>=1000/30-1){
    last=now;const began=performance.now(),sample=draw();drawTotal+=performance.now()-began;count++;windowFrames++;if(!windowStart)windowStart=now
    if(now-windowStart>=1000){
      fps.value=Math.round(windowFrames*1000/(now-windowStart));frames.value=count;drawMs.value=Math.round(drawTotal/windowFrames*10)/10;drawTotal=0
      audioPath.value=sample?.path||'none';rawPeak.value=Math.round((sample?.rawPeak||0)*10000)/10000;audioClock.value=Math.round((sample?.clock||0)*10)/10;recoveries.value=sample?.recoveries||0
      bassLevel.value=Math.round((sample?.bass||0)*100);midLevel.value=Math.round((sample?.mids||0)*100);highLevel.value=Math.round((sample?.highs||0)*100)
      if(drawMs.value>12&&budget>450000){budget=Math.max(450000,Math.round(budget*.75));resize()}
      windowStart=now;windowFrames=0
    }
  }
  frame=requestAnimationFrame(tick)
}
function refresh(){
  cancelAnimationFrame(frame);frame=0;last=0;windowStart=0;windowFrames=0;drawTotal=0
  if(!scene||props.mode==='still'||reduce?.matches||document.hidden||!props.playing){analysis?.suspend();draw();return}
  analysis?.activate();frame=requestAnimationFrame(tick)
}
async function activate(){await analysis?.activate();refresh()}
function colors(url){
  const request=++generation;palette=defaultPalette.map(c=>[...c]);draw();if(!url)return
  const image=new Image();image.crossOrigin='anonymous';image.referrerPolicy='no-referrer'
  image.onload=()=>{if(disposed||request!==generation)return;try{const sample=document.createElement('canvas');sample.width=sample.height=24;const c=sample.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0,24,24);palette=paletteFromPixels(c.getImageData(0,0,24,24).data);draw()}catch{}}
  image.src=url
}
watch(()=>props.cover,colors)
watch(()=>[props.playing,props.mode],refresh)
onMounted(()=>{
  reduce=matchMedia('(prefers-reduced-motion: reduce)');reduce.addEventListener('change',refresh)
  analysis=createAudioAnalysis(props.audio);scene=createScene(canvas.value)
  resize();refresh();colors(props.cover)
  observer=new ResizeObserver(resize);observer.observe(canvas.value);const stage=canvas.value.closest('.player-stage');for(const el of stage.querySelectorAll('.stage-cover,.stage-spectrum-slot,.stage-dock'))observer.observe(el)
  document.addEventListener('visibilitychange',refresh)
})
onUnmounted(()=>{disposed=true;generation++;cancelAnimationFrame(frame);observer?.disconnect();scene?.dispose();flow?.dispose();aurora?.dispose();analysis?.dispose();reduce?.removeEventListener('change',refresh);document.removeEventListener('visibilitychange',refresh)})
defineExpose({activate,layout:resize})
</script>
<template><div class="listening-scene" :data-scene="mode" aria-hidden="true"><div class="scene-poster" :style="cover?{backgroundImage:`url(${JSON.stringify(cover)})`}:{}"></div><canvas v-show="mode==='aurora'" ref="lightCanvas" class="flow-light"></canvas><canvas v-show="mode==='curtain'" ref="curtainCanvas" class="curtain-light" :style="curtainSize"></canvas><canvas ref="canvas" class="scene-geometry" :data-effect="sceneKinds[mode]" :data-renderer="renderer" :data-audio-signal="signal" :data-rendered-frames="frames" :data-render-fps="fps" :data-draw-ms="drawMs" :data-bass="bassLevel" :data-mids="midLevel" :data-highs="highLevel" :data-audio-path="audioPath" :data-audio-peak="rawPeak" :data-audio-clock="audioClock" :data-audio-recoveries="recoveries"></canvas><div class="scene-shade"></div></div></template>
<style scoped>
.listening-scene{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:oklch(12% .016 250)}.flow-light,.scene-geometry{position:absolute;width:100%;height:100%;inset:0}.curtain-light{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(90deg)}
.scene-poster{position:absolute;inset:-20%;background-position:center;background-size:cover;filter:blur(90px) saturate(1.1);opacity:.1}.scene-shade{position:absolute;inset:0;background:linear-gradient(90deg,oklch(10% .012 250 / .05) 35%,oklch(10% .012 250 / .62) 78%),linear-gradient(oklch(10% .012 250 / .3),transparent 40%,oklch(10% .012 250 / .25))}
[data-scene=stars] .scene-poster,[data-scene=spectrum] .scene-poster,[data-scene=orbit] .scene-poster{display:none}[data-scene=stars] .scene-shade{background:linear-gradient(90deg,transparent 35%,oklch(10% .02 265 / .48) 80%),linear-gradient(oklch(10% .02 265 / .12),transparent 75%,oklch(10% .02 265 / .4))}[data-scene=curtain] .scene-shade{background:linear-gradient(90deg,transparent 38%,oklch(10% .014 255 / .65) 85%),linear-gradient(transparent 65%,oklch(10% .014 255 / .5))}[data-scene=spectrum] .scene-shade{background:linear-gradient(oklch(9% .015 235 / .2),transparent 68%,oklch(9% .015 235 / .08))}[data-scene=still]{background:oklch(13% .008 250)}[data-scene=still] .scene-poster{opacity:.07}
[data-scene=neon] .scene-shade,[data-scene=terrain] .scene-shade,[data-scene=prism] .scene-shade,[data-scene=water] .scene-shade{background:linear-gradient(90deg,transparent 30%,oklch(10% .02 260 / .74) 82%),linear-gradient(transparent 55%,oklch(10% .02 260 / .55))}[data-scene=ink] .scene-shade{background:linear-gradient(90deg,transparent 35%,oklch(94% .012 100 / .7) 85%)}[data-scene=ink] .scene-poster{display:none}
</style>
