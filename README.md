# wx-layout

微信公众号版式装配引擎 — 纯前端，开箱即用，无需登录，无需后端。

**在线使用：** https://YOUR_ORG.github.io/wx-layout/

## 功能

- 输入文本 / 上传 DOCX → 自动解析内容块
- 丰富的样式模板库（标题样式、正文样式、SVG 装饰）
- TipTap 富文本编辑器（支持 Slash 命令、拖拽排序）
- 一键生成微信公众号 HTML，支持导出
- 微信图片上传（需配置 Cloudflare Worker 代理）
- 资产库本地持久化（IndexedDB + localStorage）
- GitHub Pages 静态部署，零运维

## 快速开始

```bash
git clone https://github.com/YOUR_ORG/wx-layout
cd wx-layout
npm install
npm run dev
```

## 微信图片上传配置

由于微信 API 有 CORS 限制，需要自部署一个轻量代理：

1. 部署 `worker/wechat-proxy.js` 到 Cloudflare Workers（免费，5分钟）
2. 详见 [worker/README.md](worker/README.md)
3. 将 Worker URL 填入应用设置页

## 部署到 GitHub Pages

1. Fork 本仓库
2. 仓库 Settings → Pages → Source: **GitHub Actions**
3. 推送代码，自动构建部署

## 技术栈

- Vue 3 + Vite 4 + Pinia + TypeScript
- TipTap 2.x（富文本编辑器）
- TailwindCSS 3
- Cloudflare Workers（可选，用于微信 API 代理）

## License

MIT
