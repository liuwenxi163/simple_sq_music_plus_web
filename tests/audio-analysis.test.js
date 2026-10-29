import {test} from 'node:test'
import assert from 'node:assert/strict'
import {startVisualPlayback,createAudioAnalysis} from '../src/listening/audio-analysis.js'
import {paletteFromPixels,defaultPalette} from '../src/listening/scene-palette.js'

test('CORS failure reuses the authorized URL without requiring analysis for sound',async()=>{
 const seen=[];const audio={error:{code:4},load(){},pause(){},removeAttribute(name){assert.equal(name,'crossorigin');this.crossOrigin=null},play(){seen.push([this.src,this.crossOrigin]);if(this.crossOrigin)throw Object.assign(new Error('CORS blocked'),{name:'NotSupportedError'});return Promise.resolve()}}
 await startVisualPlayback(audio,'same-resource',{wait:async()=>{}})
 assert.deepEqual(seen,[['same-resource','anonymous'],['same-resource',null]])
})
test('visualization preserves the three-open retry limit',async()=>{
 let opens=0;const audio={error:{code:4},load(){},pause(){},removeAttribute(){},play(){opens++;throw Object.assign(new Error('unavailable'),{name:'NotSupportedError'})}}
 await assert.rejects(startVisualPlayback(audio,'same-resource',{wait:async()=>{}}));assert.equal(opens,3)
})
test('autoplay permission errors do not fall back or replay',async()=>{
 let removed=false;const audio={load(){},pause(){},removeAttribute(){removed=true},play(){throw Object.assign(new Error('gesture required'),{name:'NotAllowedError'})}}
 await assert.rejects(startVisualPlayback(audio,'same-resource'));assert.equal(removed,false)
})
test('captured analysis never reroutes or stops the audible element',async()=>{
 let captures=0,stopped=0;const handlers={};const audio={paused:false,captureStream(){captures++;return {getAudioTracks:()=>[{stop(){stopped++}}]}},addEventListener(name,fn){handlers[name]=fn},removeEventListener(name){delete handlers[name]},play(){throw new Error('Must not control playback')},pause(){throw new Error('Must not control playback')}}
 const node=()=>({connect(){},disconnect(){},gain:{value:1},fftSize:0,frequencyBinCount:1024,getByteFrequencyData(bins){bins.fill(100)}})
 class Context{constructor(){this.state='suspended';this.destination={}}createAnalyser(){return node()}createGain(){return node()}createMediaStreamSource(){return node()}createMediaElementSource(){throw new Error('Must not reroute sound')}async resume(){this.state='running'}async suspend(){this.state='suspended'}async close(){this.state='closed'}}
 const analysis=createAudioAnalysis(audio,{Context});await analysis.activate();assert.ok(analysis.sample().live);assert.ok(captures>0)
 audio.paused=true;assert.equal(analysis.sample().energy,0);analysis.dispose();assert.equal(stopped,0);assert.deepEqual(handlers,{})
})
test('unsupported capture produces no fabricated frequency levels',async()=>{
 const analysis=createAudioAnalysis({paused:false,addEventListener(){},removeEventListener(){}},{Context:undefined})
 assert.equal(await analysis.activate(),false);assert.equal(analysis.sample().energy,0);assert.equal(analysis.sample().live,false);analysis.dispose()
})
test('neutral artwork uses a stable fallback and does not share mutable arrays',()=>{
 const one=paletteFromPixels(new Uint8ClampedArray([255,255,255,255,10,10,10,255,120,120,120,255]))
 assert.deepEqual(one,defaultPalette);one[0][0]=0;assert.notDeepEqual(one,defaultPalette)
 const colored=paletteFromPixels(new Uint8ClampedArray([190,75,30,255,70,130,190,255,255,255,255,255]))
 assert.notDeepEqual(colored,defaultPalette);assert.equal(colored.length,3)
})
