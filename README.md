# nongjiale-web

苏中农家乐垂直平台前端。Vue 3 + TypeScript + Vite + Vue Router + Pinia 的 pnpm monorepo。门户和商家业务页已接入，运营端仍是路由壳。

端口、路由、token key 和脚本见 [docs/FRONTEND.md](docs/FRONTEND.md)。脚手架设计见 [docs/FE-1-SCAFFOLD.md](docs/FE-1-SCAFFOLD.md)。门户页面见 [docs/FE-2-PORTAL.md](docs/FE-2-PORTAL.md)。商家页面见 [docs/FE-3-MERCHANT.md](docs/FE-3-MERCHANT.md)。

```bash
pnpm install
pnpm dev:portal    # http://localhost:43123
pnpm dev:admin     # http://localhost:43124
pnpm dev:merchant  # http://localhost:43125
```

需要 Node.js 22+。接口默认 `http://localhost:8080`。
