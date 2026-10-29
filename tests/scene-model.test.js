import {test} from 'node:test'
import assert from 'node:assert/strict'
import {scenePalette,createSceneClock,spectrumBars,starField,orbitShape} from '../src/listening/scene-model.js'
const frame=()=>({live:true,levels:new Float32Array(64),peaks:new Float32Array(64),waveform:new Float32Array(128),energy:.4,bass:.5})
const layout={width:1748,height:966,dockY:774,cover:{x:300,y:118,width:440,height:440}}
test('spectral geometry follows only the actual input bands and never fabricates heights without audio',()=>{
 const s=frame();s.levels[9]=.8;s.peaks[9]=.9;const bars=spectrumBars(s,layout);assert.equal(bars.length,64);assert.equal(bars.filter(b=>b.height>0).length,1);assert.ok(bars[9].height>0&&bars[9].peak>bars[9].height);assert.ok(bars.every(b=>b.base<layout.dockY&&b.x>=0&&b.x<=layout.width));s.live=false;assert.ok(spectrumBars(s,layout).every(b=>b.height===0&&b.peak===0))
})
test('radial wave closes without a seam and responds to the changed frequency band',()=>{
 const s=frame(),before=orbitShape(s,layout),i=18;s.levels[9]=1;const after=orbitShape(s,layout);assert.deepEqual(after.points[0],after.points.at(-1));assert.notEqual(after.points[i].x,before.points[i].x);assert.deepEqual(after.points[50],before.points[50]);assert.ok(after.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));s.live=false;assert.deepEqual(orbitShape(s,layout).points,before.points)
})
test('star flight has deterministic depth, bounded particle count and actual frequency-linked brightness',()=>{
 const s=frame(),a=starField(s,layout,0),b=starField(s,layout,2);assert.ok(a.length<=420);assert.deepEqual(a,starField(s,layout,0));assert.notEqual(a[10].x,b[10].x);s.levels[10]=1;assert.ok(starField(s,layout,0)[10].alpha>a[10].alpha);assert.ok(b.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.r<=4.2));assert.ok(starField(s,{...layout,width:390,height:844},0).length<=180)
})
test('mode motion stops on pause and does not jump after a hidden interval or mode switch',()=>{
 const c=createSceneClock();assert.equal(c.step(100,true,'stars'),0);assert.equal(c.step(600,true,'stars'),.5);assert.equal(c.step(700,false,'stars'),.5);assert.equal(c.step(100000,false,'stars'),.5);assert.equal(c.step(100100,true,'stars'),.5);assert.equal(c.step(100600,true,'stars'),1);assert.equal(c.step(101000,true,'orbit'),1)
})
test('platform scene palettes do not mutate the shared artwork palette',()=>{
 const album=[[.3,.5,.7],[.4,.6,.8],[.5,.4,.7]],before=JSON.stringify(album);assert.notDeepEqual(scenePalette('curtain',album),scenePalette('spectrum',album));assert.notDeepEqual(scenePalette('stars',album),scenePalette('curtain',album));assert.equal(JSON.stringify(album),before)
})

test('frequency bars stay below the actual song text and above the playback timeline',()=>{
 const s=frame();s.levels.fill(1);s.peaks.fill(1);const bars=spectrumBars(s,{...layout,recordBottom:688,rail:{y:736,height:24}});assert.ok(bars.every(b=>b.base-b.height>=703&&b.base<=755))
})

test('dark artwork still yields a visible orbital line without modifying the original artwork palette',()=>{
 const dark=[[.2,.04,.01],[.09,.02,.01],[.12,.06,.01]],copy=JSON.stringify(dark),visible=scenePalette('orbit',dark);assert.ok(visible.every(c=>Math.max(...c)>=.8));assert.equal(JSON.stringify(dark),copy)
})

test('music-dependent travel speed integrates smoothly instead of changing particle position with each loudness sample',()=>{
 const c=createSceneClock();c.step(0,true,'stars',1);assert.equal(c.step(500,true,'stars',2),1);assert.equal(c.step(1000,true,'stars',.5),1.25)
})
