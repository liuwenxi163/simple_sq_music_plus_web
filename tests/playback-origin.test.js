import {test} from 'node:test'
import assert from 'node:assert/strict'
import {playbackOrigin,validVisualMode,visualModes} from '../src/listening/playback-origin.js'
test('NAS badge requires the actual local stream path, not download history',()=>{
  assert.equal(playbackOrigin({local:true},'/api/library/stream/abc?ticket=opaque').kind,'nas')
  assert.equal(playbackOrigin({local:true},'').kind,'pending')
  assert.equal(playbackOrigin({local:false,plugName:'qqvip'},'https://music.example/audio.flac').kind,'online')
  assert.match(playbackOrigin({local:false,plugName:'qqvip'}).detail,/不会把音频保存到 NAS/)
})
test('visual mode preferences accept supported modes and recover from unknown old values',()=>{
  assert.equal(visualModes.length,12)
  for(const mode of visualModes)assert.equal(validVisualMode(mode.id),mode.id)
  assert.equal(validVisualMode('unknown'),'aurora')
})
