import { test } from 'node:test'
import assert from 'node:assert/strict'
import { playlistSource, playlistKindLabel } from '../src/listening/playlist-source.js'

test('playlist origin uses its metadata even when empty or containing tracks from another platform', () => {
  assert.equal(playlistSource({ source: 'qqvip', tracks: [] }).label, 'QQ 音乐')
  assert.equal(playlistSource({ source: 'netease', tracks: [{ plugName: 'qqvip' }] }).label, '网易云音乐')
  assert.equal(playlistSource({ provider: 'netease' }).id, 'netease')
})

test('local playlist ownership takes precedence over the platforms of its songs', () => {
  assert.equal(playlistSource({ kind: 'local', source: 'qqvip', tracks: [{ plugName: 'qqvip' }] }).label, 'NAS 本地')
  assert.equal(playlistSource({ id: 'local:favorites' }).id, 'local')
})

test('legacy namespaced playlist identities retain their platform and unknown origins are not guessed', () => {
  assert.equal(playlistSource({ id: 'qqvip:123' }).id, 'qqvip')
  assert.equal(playlistSource({ id: 'netease:123' }).id, 'netease')
  assert.equal(playlistSource({ source: 'qq' }).id, 'qqvip')
  assert.equal(playlistSource({ source: 'unsupported', id: 'qqvip:123' }).id, 'unknown')
  assert.equal(playlistSource({ kind: 'owned', tracks: [{ plugName: 'qqvip' }] }).label, '来源未知')
})

test('playlist kinds do not imply a specific platform', () => {
  assert.equal(playlistKindLabel('owned'), '自建歌单')
  assert.equal(playlistKindLabel('likes'), '我喜欢')
  assert.equal(playlistKindLabel('unexpected'), '歌单')
})
