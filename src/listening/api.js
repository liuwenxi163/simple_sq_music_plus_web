import userInfoStore from '../stores/user'

export async function api(path, body, method = body === undefined ? 'GET' : 'POST') {
  const user = userInfoStore()
  const response = await fetch('/api' + path, {
    method, headers: { 'Content-Type': 'application/json', ...(user.token ? { sqmusic: user.token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(65000), cache: 'no-store'
  })
  if (response.status === 401 || response.status === 403) {
    user.clearUserInfo()
    throw new Error('登录已过期，请重新登录')
  }
  if (!response.ok) throw new Error('服务暂时不可用，请稍后重试')
  const result = await response.json()
  if (result.code !== 200) throw new Error(result.msg || '请求未完成')
  return result.data ?? result.msg
}

export function parseLyrics(text = '') {
  const lines = []
  for (const line of text.split(/\r?\n/)) {
    const content = line.replace(/\[[^\]]*\]/g, '').trim()
    for (const match of line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)) {
      if (content) lines.push({ time: +match[1] * 60 + +match[2], text: content })
    }
  }
  return lines.sort((a, b) => a.time - b.time)
}

export const formatTime = seconds => Number.isFinite(+seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '0:00'
export const trackKey = t => `${t.local ? 'local' : t.plugName}:${t.id}`
