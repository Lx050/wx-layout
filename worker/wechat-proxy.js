/**
 * wx-layout Cloudflare Worker — WeChat API 代理
 *
 * 一键部署步骤：
 * 1. 登录 https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. 粘贴此文件内容，点击 Deploy
 * 3. 在 Worker 设置 → Environment Variables 中添加：
 *    - WECHAT_APPID     = wx_xxxxxxxxxxxxxxxx
 *    - WECHAT_APPSECRET = 你的 AppSecret（保密！）
 * 4. 将 Worker URL 填入 wx-layout 设置页 → 微信公众号 → 代理地址
 *
 * 安全说明：
 * - AppSecret 仅存在于 CF 环境变量，不会暴露到前端
 * - Worker 仅转发授权的微信 API 端点
 * - 建议在 CF Dashboard 中绑定自定义域名
 */

const ALLOWED_PATHS = [
  '/cgi-bin/token',
  '/cgi-bin/media/upload',
  '/cgi-bin/material/add_material',
  '/cgi-bin/draft/add',
  '/cgi-bin/draft/update',
]

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // 健康检查端点（设置页测试连接用）
    if (url.pathname === '/ping') {
      return new Response(JSON.stringify({ ok: true, service: 'wx-layout-proxy' }), {
        headers: corsHeaders('application/json'),
      })
    }

    // 只允许代理授权路径
    const isAllowed = ALLOWED_PATHS.some(p => url.pathname.startsWith(p))
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Forbidden path' }), {
        status: 403,
        headers: corsHeaders('application/json'),
      })
    }

    // 注入 access_token（从 CF KV 缓存或重新获取）
    const token = await getAccessToken(env)
    if (!token) {
      return new Response(JSON.stringify({ error: 'Failed to get access token' }), {
        status: 500,
        headers: corsHeaders('application/json'),
      })
    }

    // 转发到微信 API
    const targetUrl = new URL(`https://api.weixin.qq.com${url.pathname}${url.search}`)
    if (!targetUrl.searchParams.has('access_token')) {
      targetUrl.searchParams.set('access_token', token)
    }

    const proxyReq = new Request(targetUrl.toString(), {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
      },
      body: request.method !== 'GET' ? request.body : undefined,
    })

    const resp = await fetch(proxyReq)
    const body = await resp.text()

    return new Response(body, {
      status: resp.status,
      headers: corsHeaders(resp.headers.get('Content-Type') || 'application/json'),
    })
  }
}

// ── Token 管理 ──────────────────────────────────────────────────
// 需要在 CF Dashboard 绑定 KV Namespace: TOKEN_STORE
async function getAccessToken(env) {
  // 从 KV 读取缓存 token
  if (env.TOKEN_STORE) {
    const cached = await env.TOKEN_STORE.get('wechat_token', 'json')
    if (cached && cached.expires_at > Date.now() + 60_000) {
      return cached.access_token
    }
  }

  // 重新获取
  const resp = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${env.WECHAT_APPID}&secret=${env.WECHAT_APPSECRET}`
  )
  const data = await resp.json()
  if (!data.access_token) return null

  // 缓存到 KV（有效期 7100 秒，比官方 7200 秒略短）
  if (env.TOKEN_STORE) {
    await env.TOKEN_STORE.put('wechat_token', JSON.stringify({
      access_token: data.access_token,
      expires_at: Date.now() + 7100_000,
    }), { expirationTtl: 7100 })
  }

  return data.access_token
}

function corsHeaders(contentType) {
  return {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}
