# nongjiale-web

苏中农家乐垂直平台前端。Vue 3 + TypeScript + Vite + Vue Router + Pinia 的 pnpm monorepo。当前是三端脚手架，业务页面尚未开始。

端口、路由、token key 和脚本见 [docs/FRONTEND.md](docs/FRONTEND.md)。脚手架设计见 [docs/FE-1-SCAFFOLD.md](docs/FE-1-SCAFFOLD.md)。

```bash
pnpm install
pnpm dev:portal    # http://localhost:43123
pnpm dev:admin     # http://localhost:43124
pnpm dev:merchant  # http://localhost:43125
```

需要 Node.js 22+。接口默认 `http://localhost:8080`。
