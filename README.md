# nongjiale-web

苏中农家乐垂直平台前端。Vue 3 + TypeScript + Vite + Vue Router + Pinia 的 pnpm monorepo。门户、商家和运营业务页已接入。运营端另有开城（`/cities`）和种子看板（`/seed-metrics`）；商家端无开城页。

端口、路由、token key 和脚本见 [docs/FRONTEND.md](docs/FRONTEND.md)。脚手架设计见 [docs/FE-1-SCAFFOLD.md](docs/FE-1-SCAFFOLD.md)。门户页面见 [docs/FE-2-PORTAL.md](docs/FE-2-PORTAL.md)。商家页面见 [docs/FE-3-MERCHANT.md](docs/FE-3-MERCHANT.md)。运营页面见 [docs/FE-4-ADMIN.md](docs/FE-4-ADMIN.md)。MVP-1.5 广告位前端技术设计见 [docs/FE-TECH-DESIGN-MVP-1.5-广告位.md](docs/FE-TECH-DESIGN-MVP-1.5-广告位.md)（§2.4 契约已锁死为 nongjiale-api#22）。MVP-2 游客微信小程序在 `apps/miniapp`（原生 WXML / WXSS / TypeScript）。用微信开发者工具导入该目录，不占用 43123–43125，也没有常驻 dev 服务。技术设计见 [docs/FE-TECH-DESIGN-MVP-2-微信小程序.md](docs/FE-TECH-DESIGN-MVP-2-微信小程序.md)。站点品牌配置扩展的前端技术设计见 [docs/FE-TECH-DESIGN-站点品牌配置.md](docs/FE-TECH-DESIGN-站点品牌配置.md)（只锁设计，业务代码另 PR）。`pnpm build`、`pnpm test`、`pnpm typecheck` 仍只覆盖门户、商家、运营和 shared。小程序单独跑 `pnpm typecheck:miniapp` 与 `pnpm test:miniapp`。

```bash
pnpm install
pnpm dev:portal    # http://localhost:43123
pnpm dev:admin     # http://localhost:43124
pnpm dev:merchant  # http://localhost:43125
```

需要 Node.js 22+。接口默认 `http://localhost:8080`。
