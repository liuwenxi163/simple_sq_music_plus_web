import { test } from 'node:test'
import assert from 'node:assert/strict'
import { auroraResponse } from '../src/listening/aurora-renderer.js'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
test('Aurora reacts to actual bass, RMS and highs, never invents motion on paused or unavailable audio',()=>{
 const silent=auroraResponse({live:false,energy:1,bass:1,highs:1},'aurora'),live=auroraResponse({live:true,energy:.6,bass:.8,highs:.4},'aurora')
 assert.equal(silent.pace,0);assert.ok(live.pace>0);assert.ok(live.amplitude>silent.amplitude);assert.ok(live.brightness>silent.brightness);assert.ok(live.glow>silent.glow)
 assert.equal(auroraResponse({live:true,energy:1,bass:1,highs:1},'still').pace,0)
})
test('Vendored Aurora matches the pinned primary source and retains its license',()=>{
 const root=new URL('../src/vendor/react-bits/aurora/',import.meta.url),info=JSON.parse(readFileSync(new URL('SOURCE.json',root),'utf8'))
 assert.match(info.commit,/^[a-f0-9]{40}$/)
 for(const [name,record] of Object.entries(info.files))assert.equal(createHash('sha256').update(readFileSync(new URL(name,root))).digest('hex'),record.sha256)
 const original=readFileSync(new URL('Aurora.jsx',root),'utf8').replace(/\r\n/g,'\n'),adapted=readFileSync(new URL('shaders.js',root),'utf8').replace(/\r\n/g,'\n')
 for(const name of ['VERTEX','FRAGMENT']){const marker='const '+name+' = `',start=original.indexOf(marker)+marker.length,shader=original.slice(start,original.indexOf('`;',start));assert.ok(adapted.includes(shader))}
})
