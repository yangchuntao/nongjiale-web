# 游客微信小程序

用微信开发者工具导入本目录（含 `project.config.json` 的那一层）。页面在 `miniprogram/`。没有 `pnpm dev` 服务，也不占用 43123–43125。

`project.config.json` 的 `appid` 是空字符串。测试号复制 `project.private.config.sample.json` 为 `project.private.config.json`，只在本机填写 AppID。这个私有文件已 gitignore。AppSecret 只放在后端环境变量 `WECHAT_MINIAPP_SECRET`，不要写进小程序包。

开发者工具可关闭合法域名校验，以便连接默认接口 `http://localhost:8080`。体验版真机不要用 localhost：在本地存储写入 `nj_mp_api_base`（已配置的 https 源）。业务域名配好之前，外链只复制；配好后把 `nj_mp_webview_ready` 设为 `1`。

类型和纯函数：

```bash
pnpm typecheck:miniapp
pnpm test:miniapp
```
