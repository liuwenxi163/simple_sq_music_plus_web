import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createAudioAnalysis} from '../src/listening/audio-analysis.js'
function fixture({native=true,copyError=false,trackDelayed=false}={}){
 const handlers={},stats={captures:0,copies:0,plays:0,releases:0,contexts:0};let time=0,path='capture',nativeSignal=false,trackAvailable=!trackDelayed,pendingError=copyError
 const audio={src:'https://media.example/song',currentTime:12,playbackRate:1,paused:false,readyState:4,addEventListener:(n,f)=>handlers[n]=f,removeEventListener:n=>delete handlers[n],play(){throw Error('Must not control audible playback')},pause(){throw Error('Must not pause audible playback')}}
 if(native)audio.captureStream=()=>{stats.captures++;return {getAudioTracks:()=>trackAvailable?[{readyState:'live',muted:false}]:[],addEventListener(){},removeEventListener(){}}}
 const node=()=>({connect(){},disconnect(){},gain:{value:1},fftSize:4096,frequencyBinCount:2048,getByteFrequencyData(b){b.fill(path==='copy'||nativeSignal?180:0)},getFloatTimeDomainData(b){for(let i=0;i<b.length;i++)b[i]=(path==='copy'||nativeSignal) ? .2*Math.sin(i*.17) : 0}})
 class Context{constructor(){stats.contexts++;this.state='suspended';this.sampleRate=48000;this.destination={};this.currentTime=0}createAnalyser(){return node()}createGain(){return node()}createMediaStreamSource(){path='capture';return node()}createMediaElementSource(el){assert.notEqual(el,audio);path='copy';return node()}async resume(){this.state='running'}async suspend(){this.state='suspended'}async close(){this.state='closed'}}
 const copies=[]
 const makeAudio=()=>{stats.copies++;const events={};const c={currentTime:audio.currentTime,readyState:4,addEventListener:(n,f)=>events[n]=f,removeAttribute(){stats.releases++},load(){},pause(){},play(){stats.plays++;return pendingError?Promise.reject(Object.assign(Error('analysis playback'),{name:pendingError==='gesture'?'NotAllowedError':'NotSupportedError'})):Promise.resolve()}};copies.push(c);return c}
 const analysis=createAudioAnalysis(audio,{Context,Stream:undefined,makeAudio,now:()=>time})
 return {audio,analysis,handlers,stats,copies,at:v=>time=v,nativeSignal:v=>nativeSignal=v,trackAvailable:v=>trackAvailable=v,copyError:v=>pendingError=v}
}
test('all-zero capture is not called live and recovers using one inaudible analysis copy',async()=>{
 const f=fixture();await f.analysis.activate();assert.equal(f.analysis.sample().live,false);f.at(1300);f.analysis.sample();assert.equal(f.stats.captures,2);assert.equal(f.stats.copies,0);f.at(1400);f.analysis.sample();f.at(2700);f.analysis.sample();await Promise.resolve();await Promise.resolve();const s=f.analysis.sample();assert.equal(s.path,'copy');assert.equal(s.live,true);assert.ok(s.energy>0&&s.rawPeak>0);assert.equal(f.stats.copies,1);assert.equal(f.stats.plays,1)
 for(let i=0;i<20;i++)f.analysis.sample();assert.equal(f.stats.copies,1);assert.equal(f.audio.currentTime,12);assert.equal(f.audio.paused,false);f.analysis.dispose();assert.equal(f.stats.releases,1)
})
test('source replacement and pause resume discard stale capture but keep one audio context',async()=>{
 const f=fixture();f.nativeSignal(true);await f.analysis.activate();assert.ok(f.analysis.sample().live);f.audio.src='https://media.example/next';f.handlers.emptied();f.handlers.loadedmetadata();assert.ok(f.analysis.sample().live);assert.equal(f.stats.captures,2)
 f.analysis.suspend();await f.analysis.activate();assert.ok(f.analysis.sample().live);assert.equal(f.stats.captures,3);assert.equal(f.stats.contexts,1);f.analysis.dispose();assert.deepEqual(f.handlers,{})
})
test('browsers without element capture can analyze a separate media element without rerouting playback',async()=>{
 const f=fixture({native:false});await f.analysis.activate();const s=f.analysis.sample();assert.equal(s.live,true);assert.equal(s.path,'copy');assert.equal(f.stats.copies,1);assert.equal(f.audio.src,'https://media.example/song');f.analysis.dispose()
})
test('CORS failure of the analysis copy never changes or stops audible playback',async()=>{
 const f=fixture({native:false,copyError:true});await f.analysis.activate();const s=f.analysis.sample();assert.equal(s.live,false);assert.equal(s.reason,'unavailable');assert.equal(f.audio.paused,false);assert.equal(f.audio.src,'https://media.example/song');for(let i=0;i<30;i++)f.analysis.sample();assert.equal(f.stats.copies,1);f.analysis.dispose()
})

test('one fresh capture recovers a stale stream before opening an analysis copy',async()=>{
 const f=fixture();await f.analysis.activate();assert.equal(f.analysis.sample().live,false);f.at(1300);f.analysis.sample();assert.equal(f.stats.captures,2);assert.equal(f.stats.copies,0);f.nativeSignal(true);f.at(1400);assert.equal(f.analysis.sample().live,true);assert.equal(f.analysis.sample().path,'capture');assert.equal(f.stats.copies,0);f.analysis.dispose()
})

test('asynchronous capture track creation is given time before any second stream is requested',async()=>{
 const f=fixture({trackDelayed:true});f.nativeSignal(true);await f.analysis.activate();assert.equal(f.analysis.sample().live,false);assert.equal(f.stats.copies,0);f.trackAvailable(true);f.handlers.playing();assert.equal(f.analysis.sample().live,true);assert.equal(f.stats.copies,0);f.analysis.dispose()
})

test('an explicit gesture can retry analysis after autoplay permission was denied',async()=>{
 const f=fixture({native:false,copyError:'gesture'});await f.analysis.activate();assert.equal(f.analysis.sample().reason,'gesture');f.copyError(false);await f.analysis.activate();assert.equal(f.analysis.sample().live,true);assert.equal(f.stats.copies,2);assert.equal(f.stats.releases,1);assert.equal(f.stats.contexts,1);f.analysis.dispose()
})
