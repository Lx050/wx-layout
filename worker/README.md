# WeChat API Proxy (Cloudflare Worker)

由于微信 API 有 CORS 限制，浏览器无法直接调用。此 Worker 充当中间代理，将前端的请求安全转发到微信服务器。

## 为什么需要代理？

- 微信 `AppSecret` 不能暴露在前端代码中
- 微信 API 不支持跨域（CORS）直接调用
- 代理运行在 Cloudflare 边缘节点，全球加速，免费额度充足

## 部署步骤（5分钟）

### 方式一：Cloudflare Dashboard（推荐新手）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages** → **Create**
3. 选择 **Create Worker**，粘贴 `wechat-proxy.js` 内容，点击 **Deploy**
4. 进入 Worker 详情 → **Settings** → **Variables** → **Add variable**：
   - `WECHAT_APPID` = 你的公众号 AppID
   - `WECHAT_APPSECRET` = 你的公众号 AppSecret
5. （可选）绑定 KV Namespace 用于缓存 token：
   - **KV Namespaces** → **Add binding**，Variable name = `TOKEN_STORE`
6. 复制 Worker URL（如 `https://wechat-proxy.xxx.workers.dev`）

### 方式二：Wrangler CLI

```bash
npm install -g wrangler
wrangler login
wrangler deploy worker/wechat-proxy.js --name wechat-proxy

# 设置 secrets
wrangler secret put WECHAT_APPID
wrangler secret put WECHAT_APPSECRET
```

## 配置到 wx-layout

1. 打开 wx-layout → **设置** → **微信公众号**
2. 启用"图片上传"
3. 填入 **AppID** 和 **代理地址**（Worker URL）
4. 点击"测试连接"确认正常

## 安全说明

- AppSecret 只存在于 CF 环境变量，前端永远看不到
- Worker 只代理白名单内的微信 API 路径
- 建议为 Worker 绑定自定义域名并启用访问限制
