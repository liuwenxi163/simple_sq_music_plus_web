import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAudioFeatures } from '../src/listening/audio-features.js'
import { createAudioAnalysis } from '../src/listening/audio-analysis.js'

const tone = hz => Float32Array.from({length:4096},(_,i)=>.2*Math.sin(2*Math.PI*hz*i/48000))
const spectrum = hz => {const bins=new Uint8Array(2048);bins[Math.round(hz*4096/48000)]=235;return bins}

test('a low tone excites bass while a high tone excites the high bands',()=>{
  const low=createAudioFeatures().sample(spectrum(80),tone(80),100)
  const high=createAudioFeatures().sample(spectrum(8000),tone(8000),100)
  assert.ok(low.bass>low.highs);assert.ok(high.highs>high.bass)
  assert.ok(low.energy>.2);assert.ok(high.energy>.2)
  assert.ok([...low.levels].some(v=>v>0));assert.ok([...high.levels].some(v=>v>0))
})

test('transients respond immediately and decay quickly without inventing energy in silence',()=>{
  const analyzer=createAudioFeatures(),zeros=new Uint8Array(2048),silent=new Float32Array(4096)
  const quiet=analyzer.sample(zeros,silent,100);assert.equal(quiet.energy,0);assert.ok(quiet.levels.every(v=>v===0))
  const attack=analyzer.sample(spectrum(80),tone(80),117).energy;assert.ok(attack>.2)
  let release
  for(let now=134;now<400;now+=17)release=analyzer.sample(zeros,silent,now)
  assert.ok(release.energy<attack*.15)
  const reset=analyzer.reset();assert.equal(reset.energy,0);assert.equal(reset.beat,0);assert.ok(reset.peaks.every(v=>v===0))
  assert.equal(analyzer.sample(zeros,new Float32Array(4096).fill(.4),500).energy,0)
})

test('capture graph follows replaced media tracks, remains single, and clears on seek or muted capture',async()=>{
  const handlers={},streamHandlers={};let track={readyState:'live',muted:false},captures=0,sources=0
  const stream={getAudioTracks:()=>[track],addEventListener:(n,f)=>streamHandlers[n]=f,removeEventListener:n=>delete streamHandlers[n]}
  const audio={paused:false,readyState:4,captureStream(){captures++;return stream},addEventListener:(n,f)=>handlers[n]=f,removeEventListener:n=>delete handlers[n]}
  const node=()=>({connect(){},disconnect(){},gain:{value:1},fftSize:4096,frequencyBinCount:2048,getByteFrequencyData:b=>b.fill(140),getFloatTimeDomainData:b=>b.set(tone(80))})
  class Context{constructor(){this.state='suspended';this.sampleRate=48000;this.destination={}}createAnalyser(){return node()}createGain(){return node()}createMediaStreamSource(){sources++;return node()}async resume(){this.state='running'}async suspend(){this.state='suspended'}async close(){this.state='closed'}}
  const analysis=createAudioAnalysis(audio,{Context,now:()=>100})
  await analysis.activate();await analysis.activate();assert.equal(captures,1);assert.equal(sources,1);assert.ok(analysis.sample().energy>0)
  audio.seeking=true;handlers.seeking();assert.equal(analysis.sample().energy,0);audio.seeking=false
  track={readyState:'live',muted:false};streamHandlers.addtrack();assert.equal(sources,2)
  track.muted=true;const muted=analysis.sample();assert.equal(muted.reason,'unavailable');assert.equal(muted.live,false);assert.ok(muted.levels.every(v=>v===0))
  analysis.dispose();assert.deepEqual(handlers,{});assert.deepEqual(streamHandlers,{})
})

test('a browser capture security failure is unavailable rather than a fake spectrum or endless connecting state',async()=>{
  const audio={paused:false,readyState:4,captureStream(){throw new Error('SecurityError')},addEventListener(){},removeEventListener(){}}
  const node=()=>({connect(){},disconnect(){},gain:{value:1},frequencyBinCount:2048})
  class Context{constructor(){this.state='suspended';this.destination={}}createAnalyser(){return node()}createGain(){return node()}async resume(){this.state='running'}async close(){}}
  const analysis=createAudioAnalysis(audio,{Context});await analysis.activate()
  const sample=analysis.sample();assert.equal(sample.reason,'unavailable');assert.equal(sample.live,false);assert.equal(sample.energy,0);assert.ok(sample.levels.every(v=>v===0));analysis.dispose()
})
