import { startPlayback } from './playback.js'
import { createAudioFeatures } from './audio-features.js'

/** Keep the original three-open retry budget, including a non-CORS fallback.
 * Analysis captures a copy of playback and never reroutes the audible element. */
export async function startVisualPlayback(audio, url, options = {}) {
  audio.crossOrigin = 'anonymous'
  try { await startPlayback(audio, url, { ...options, maxAttempts: 1 }) }
  catch (error) {
    if (options.isCurrent?.() === false || ['AbortError', 'NotAllowedError'].includes(error.name) || audio.error?.code === 3) throw error
    if (!['NotSupportedError', 'NetworkError', 'TimeoutError'].includes(error.name) && ![2, 4].includes(audio.error?.code)) throw error
    audio.removeAttribute('crossorigin')
    await startPlayback(audio, url, { ...options, maxAttempts: 2 })
  }
}

export function createAudioAnalysis(audio, { Context = globalThis.AudioContext || globalThis.webkitAudioContext, Stream = globalThis.MediaStream, makeAudio = () => document.createElement('audio'), now = () => performance.now() } = {}) {
  let context, source, analyser, muted, stream, bins, samples, linkedTrack, disposed=false, wanted=false, captureFailed=false, features=createAudioFeatures(), activation
  let copy, copySource, copyStarted=false, copyFailure='', copyAttempted=false, zeroSince=null, captureRetried=false, path='capture', epoch=0, recoveries=0
  const attachEvents=['playing','loadedmetadata'],resetEvents=['seeking','pause','waiting']
  function reset(){features.reset();zeroSince=null}
  function releaseCapture(){source?.disconnect();source=null;linkedTrack=null;stream?.removeEventListener?.('addtrack',attach);stream?.removeEventListener?.('removetrack',attach);stream=null}
  function releaseCopy(){if(copy){copy.pause();copy.removeAttribute('src');copy.load()}copySource?.disconnect();copySource=null;copy=null;copyStarted=false;copyFailure=''}
  function changed(){epoch++;releaseCapture();releaseCopy();copyAttempted=false;captureRetried=false;captureFailed=false;path='capture';reset()}
  function attach(){
    if(!context||disposed||!wanted||path==='copy')return
    try{
      const capture=audio.captureStream||audio.mozCaptureStream;if(!capture)return
      if(!stream){stream=capture.call(audio);stream.addEventListener?.('addtrack',attach);stream.addEventListener?.('removetrack',attach)}
      const track=stream.getAudioTracks().find(t=>t.readyState!=='ended'&&!t.muted)
      if(source&&track===linkedTrack)return
      source?.disconnect();source=null;linkedTrack=track;reset();if(!track)return
      // Select this live track explicitly: createMediaStreamSource otherwise picks by track ID.
      source=context.createMediaStreamSource(Stream?new Stream([track]):stream);source.connect(analyser);captureFailed=false
    }catch{captureFailed=true;source?.disconnect();source=null;linkedTrack=null;reset()}
  }
  async function startCopy(){
    if(disposed||!wanted||copyAttempted)return
    copyAttempted=true;const request=epoch,url=audio.currentSrc||audio.src
    if(!url||!context?.createMediaElementSource){copyFailure='unavailable';return}
    try{
      // A separate inaudible element keeps the audible player outside Web Audio, including CORS failures.
      copy=makeAudio();copy.crossOrigin='anonymous';copy.preload='auto';copy.src=url;copy.volume=1;copy.muted=false
      copySource=context.createMediaElementSource(copy);copySource.connect(analyser)
      path='copy';releaseCapture();recoveries++;reset()
      const element=copy
      copy.addEventListener('error',()=>{if(request===epoch&&copy===element){copyFailure='unavailable';copyStarted=false}})
      copy.addEventListener('loadedmetadata',()=>{if(request!==epoch||copy!==element)return;try{copy.currentTime=audio.currentTime||0;copy.playbackRate=audio.playbackRate||1}catch{}})
      await copy.play()
      if(disposed||!wanted||request!==epoch)return
      copyStarted=true;copyFailure=''
    }catch(e){if(request===epoch&&!disposed){const reason=e.name==='NotAllowedError'?'gesture':'unavailable';if(reason!=='gesture')releaseCopy();copyStarted=false;copyFailure=reason}}
  }
  async function activate(){
    if(disposed||!Context)return false
    wanted=true;if(activation)return activation
    activation=(async()=>{try{
      if(!context){
        context=new Context();analyser=context.createAnalyser();analyser.fftSize=4096;analyser.smoothingTimeConstant=.12;analyser.minDecibels=-90;analyser.maxDecibels=-18
        bins=new Uint8Array(analyser.frequencyBinCount);samples=new Float32Array(analyser.fftSize);features=createAudioFeatures({sampleRate:context.sampleRate||48000,fftSize:analyser.fftSize})
        muted=context.createGain();muted.gain.value=0;analyser.connect(muted);muted.connect(context.destination)
        attachEvents.forEach(n=>audio.addEventListener(n,attach));resetEvents.forEach(n=>audio.addEventListener(n,reset));audio.addEventListener('emptied',changed)
      }
      await context.resume();if(disposed||!wanted)return false
      if(copyFailure==='gesture'){copyFailure='';copyAttempted=false;releaseCopy();path='capture'}
      attach();if(!(audio.captureStream||audio.mozCaptureStream)||captureFailed)await startCopy()
      return context.state==='running'
    }catch{return false}})().finally(()=>{activation=null})
    return activation
  }
  function recoverCapture(time){
    if(zeroSince===null)zeroSince=time
    if(time-zeroSince>=1200&&!copyAttempted){if(!captureRetried){captureRetried=true;releaseCapture();attach();recoveries++}else startCopy()}
  }
  function sample(){
    const silent=reason=>({...features.reset(),live:false,reason,path,rawPeak:0,clock:context?.currentTime||0,recoveries})
    if(!Context)return silent('unavailable')
    if(!wanted||context?.state!=='running')return silent('waiting')
    if(audio.paused||audio.seeking||audio.ended||audio.readyState<3){reset();return silent('paused')}
    if(copyFailure)return silent(copyFailure)
    if(path==='copy'){
      if(!copyStarted||copy?.readyState<3)return silent('recovering')
      const drift=Math.abs(copy.currentTime-audio.currentTime)
      if(drift>.3){try{copy.currentTime=audio.currentTime}catch{};reset();return silent('recovering')}
      copy.playbackRate=audio.playbackRate||1
    }else if(!source||linkedTrack?.muted){if(captureFailed||linkedTrack?.muted)startCopy();else recoverCapture(now());return silent(copyFailure||'recovering')}
    try{
      analyser.getByteFrequencyData(bins);samples.fill(0);analyser.getFloatTimeDomainData?.(samples)
      const time=now();let rawPeak=0,nonzero=false
      for(const v of samples)rawPeak=Math.max(rawPeak,Math.abs(v))
      for(const v of bins)if(v>0){nonzero=true;break}
      if(!nonzero&&rawPeak<.0000001){
        if(path==='capture')recoverCapture(time)
        return silent(path==='copy'?'silent':'recovering')
      }
      zeroSince=null
      return {...features.sample(bins,samples,time),live:true,reason:'live',path,rawPeak,clock:context.currentTime||0,recoveries}
    }catch{return silent('unavailable')}
  }
  function suspend(){wanted=false;changed();context?.suspend().catch(()=>{})}
  function dispose(){disposed=true;wanted=false;changed();attachEvents.forEach(n=>audio.removeEventListener(n,attach));resetEvents.forEach(n=>audio.removeEventListener(n,reset));audio.removeEventListener('emptied',changed);analyser?.disconnect();muted?.disconnect();context?.close().catch(()=>{})}
  return {activate,sample,suspend,dispose}
}
