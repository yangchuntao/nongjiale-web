# nongjiale-web

苏中农家乐垂直平台前端。Vue 3 + TypeScript + Vite + Vue Router + Pinia 的 pnpm monorepo。门户、商家和运营业务页已接入。运营端另有开城（`/cities`）和种子看板（`/seed-metrics`）；商家端无开城页。

端口、路由、token key 和脚本见 [docs/FRONTEND.md](docs/FRONTEND.md)。脚手架设计见 [docs/FE-1-SCAFFOLD.md](docs/FE-1-SCAFFOLD.md)。门户页面见 [docs/FE-2-PORTAL.md](docs/FE-2-PORTAL.md)。商家页面见 [docs/FE-3-MERCHANT.md](docs/FE-3-MERCHANT.md)。运营页面见 [docs/FE-4-ADMIN.md](docs/FE-4-ADMIN.md)。

```bash
pnpm install
pnpm dev:portal    # http://localhost:43123
pnpm dev:admin     # http://localhost:43124
pnpm dev:merchant  # http://localhost:43125
```

需要 Node.js 22+。接口默认 `http://localhost:8080`。
