import { test } from 'node:test'
import assert from 'node:assert/strict'
import { playbackParams, downloadParams, qualityLabel } from '../src/listening/quality.js'

const song = { id: 'test-song', plugName: 'qqvip', brTypes: ['QQVIP_Flac_2000', 'QQVIP_MP3_320', 'QQVIP_MP3_128'] }

test('highest playback quality is independent from server download settings', () => {
  const playback = playbackParams(song, 'qqvip')
  assert.equal(playback.brType, 'QQVIP_Flac_2000')
  const download = downloadParams(playback, 'qqvip')
  assert.equal('brType' in download, false)
  assert.equal('downloadFormat' in download, false)
  assert.deepEqual(download.brTypes, song.brTypes)
  assert.equal(download.id, song.id)
  assert.equal(song.brType, undefined)
})

test('download uses server settings even if a track carries old format fields', () => {
  const download = downloadParams({ ...song, plugName: '', brType: 'QQVIP_MP3_128', downloadFormat: 'mp3' }, 'qqvip')
  assert.equal(download.plugName, 'qqvip')
  assert.equal('brType' in download, false)
  assert.equal('downloadFormat' in download, false)
})

test('task quality distinguishes lossless from MP3 without claiming Hi-Res', () => {
  assert.equal(qualityLabel('qqvip_flac_2000'), 'FLAC 无损')
  assert.equal(qualityLabel('qqvip_mp3_320'), 'MP3 320 kbps')
  assert.equal(qualityLabel('qqvip_mp3_128'), 'MP3 128 kbps')
})

test('manual playback quality is honored and unavailable choices select highest', () => {
  assert.equal(playbackParams(song, 'qqvip', 'QQVIP_MP3_320').brType, 'QQVIP_MP3_320')
  assert.equal(playbackParams(song, 'qqvip', 'NETEASE_MP3_128').brType, 'QQVIP_Flac_2000')
  assert.equal(playbackParams({...song,brTypes:['QQVIP_MP3_128','QQVIP_MP3_320']},'qqvip').brType,'QQVIP_MP3_320')
})
