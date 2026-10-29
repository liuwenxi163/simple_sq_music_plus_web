import {test} from 'node:test'
import assert from 'node:assert/strict'
import {tunnelFrames,terrainContours,prismFacets,waterLines,inkStrokes} from '../src/listening/scene-recipes.js'
import {visualModes} from '../src/listening/playback-origin.js'
import {sceneKinds} from '../src/listening/scene-model.js'
const frame = live => ({live,energy:.5,bass:.6,levels:new Float32Array(64),waveform:new Float32Array(128)})
const layouts=[{width:1748,height:919,cover:{x:300,y:110,width:440,height:440}},{width:390,height:844,cover:{x:30,y:230,width:328,height:328}},{width:844,height:390,cover:{x:120,y:65,width:160,height:160}}]
test('every selectable visual has a unique renderer recipe, with all previous IDs retained',()=>{
  assert.equal(new Set(visualModes.map(v=>sceneKinds[v.id])).size,visualModes.length)
  for(const id of ['aurora','spectrum','curtain','stars','orbit','still'])assert.ok(visualModes.some(v=>v.id===id))
})
test('landscape contours respond to actual bands while unavailable input is neutral',()=>{
  const s=frame(true),l=layouts[0],base=terrainContours(s,l,0);s.levels.fill(1)
  assert.ok(terrainContours(s,l,0)[6].points[20].y<base[6].points[20].y)
  s.live=false;assert.deepEqual(terrainContours(s,l,0),base)
})
test('prismatic facets use current band energy, not random replacement shapes',()=>{
  const s=frame(true),l=layouts[0],base=prismFacets(s,l,0);s.levels[0]=1
  const active=prismFacets(s,l,0);assert.notDeepEqual(active[0],base[0]);assert.deepEqual(active[1],base[1]);s.live=false;assert.deepEqual(prismFacets(s,l,0),base)
})
test('paper strokes use real waveform samples and ignore stale data when inactive',()=>{
  const s=frame(true),l=layouts[0],base=inkStrokes(s,l);s.waveform[8]=.5
  assert.notEqual(inkStrokes(s,l)[0][8].y,base[0][8].y);assert.equal(inkStrokes(s,l)[0][9].y,base[0][9].y);s.live=false;assert.deepEqual(inkStrokes(s,l),base)
})
test('tunnel, terrain, facets, water and ink remain finite and bounded on supported viewports',()=>{
  const s=frame(true);s.levels.fill(1);s.waveform.fill(1)
  for(const l of layouts)for(const phase of [0,30,1e6]){
    const frames=tunnelFrames(s,l,phase);assert.equal(frames.length,11);assert.ok(frames.every(f=>Number.isFinite(f.rx)&&Number.isFinite(f.ry)&&f.rx>0&&f.ry>0))
    const shapes=[...terrainContours(s,l,phase).map(r=>r.points),...prismFacets(s,l,phase).map(r=>r.points),...waterLines(s,l,phase),...inkStrokes(s,l)]
    assert.ok(shapes.flat().every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))
    assert.ok(waterLines(s,l,phase).length<=(l.width<760?18:30))
  }
})
test('water motion is deterministic and live input changes its deformation',()=>{
  const s=frame(true),l=layouts[0],before=waterLines(s,l,0);assert.deepEqual(before,waterLines(s,l,0));assert.notDeepEqual(before,waterLines(s,l,2));s.levels.fill(1);assert.notDeepEqual(before,waterLines(s,l,0))
})
