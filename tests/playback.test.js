import { test } from 'node:test'
import assert from 'node:assert/strict'
import { startPlayback } from '../src/listening/playback.js'

function fakeAudio(outcomes) {
  return { src: '', calls: 0, loads: [], pauses: 0, error: null,
    load() { this.loads.push(this.src); this.error = null },
    pause() { this.pauses++ },
    play() { const result = outcomes[Math.min(this.calls++, outcomes.length - 1)]; if (result instanceof Error) { this.error = { code: result.mediaCode || 4 }; return Promise.reject(result) } return result }
  }
}
function failure(name, mediaCode = 4) { const e = new Error('test'); e.name = name; e.mediaCode = mediaCode; return e }
const immediate = async () => {}

test('reopens the same authorized URL after a transient source failure', async () => {
  const a = fakeAudio([failure('NotSupportedError'), undefined])
  await startPlayback(a, '/authorized-source', { wait: immediate })
  assert.equal(a.calls, 2)
  assert.deepEqual(a.loads, ['/authorized-source', '/authorized-source'])
})
test('bounds source retries to three attempts', async () => {
  const a = fakeAudio([failure('NetworkError', 2)])
  await assert.rejects(startPlayback(a, '/source', { wait: immediate }))
  assert.equal(a.calls, 3)
})
test('does not retry an autoplay permission failure', async () => {
  const a = fakeAudio([failure('NotAllowedError')])
  await assert.rejects(startPlayback(a, '/source', { wait: immediate }))
  assert.equal(a.calls, 1)
})
test('does not loop on a genuine decoding failure', async () => {
  const a = fakeAudio([failure('NotSupportedError', 3)])
  await assert.rejects(startPlayback(a, '/source', { wait: immediate }))
  assert.equal(a.calls, 1)
})
test('a new song cancels the previous retry without pausing the new song', async () => {
  const a = fakeAudio([failure('NetworkError', 2)]); let current = true
  await assert.rejects(startPlayback(a, '/old', { isCurrent: () => current, wait: async () => { current = false } }), { name: 'AbortError' })
  assert.equal(a.calls, 1)
  assert.equal(a.pauses, 0)
})
test('an unresolved native play promise has a bounded wait', async () => {
  const a = fakeAudio([new Promise(() => {})])
  await assert.rejects(startPlayback(a, '/source', { wait: immediate, timeoutMs: 5 }), { name: 'TimeoutError' })
  assert.equal(a.calls, 3)
  assert.equal(a.pauses, 5)
})
