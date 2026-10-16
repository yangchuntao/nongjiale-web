> FE-2 已把默认主色改为 `#4BA3D9`，并把门户列表查询从 `keyword` 改为 BE-4 的 `tag` 等参数。下文里的 `#2F6B4F` 和 `q` → `keyword` 只记录脚手架当时的做法，现行约定见 `docs/FRONTEND.md` 与 `docs/FE-2-PORTAL.md`。

## ① 概要设计

在本 Origin 空仓上重建前端工程底座：pnpm monorepo，三个 Vue 3 + TypeScript + Vite 应用，外加一个只放契约的共享包。本任务只交付可编译的路由壳、鉴权守卫和 HTTP 封装，不实现业务页面，也不从旧 GitHub 仓 `yangchuntao/nongjiale-web` 拷贝代码。

| 应用 | 包名 | 端口 | UI |
|------|------|------|----|
| 门户 | `@nongjiale/portal` | 43123 | 轻量 CSS + `tokens.css` |
| 运营 | `@nongjiale/admin` | 43124 | Element Plus |
| 商家 | `@nongjiale/merchant` | 43125 | Element Plus |

共享包 `@nongjiale/shared` 只导出类型、fetch 客户端和三端 token key。业务页面、路由表、表单留在各自 app。

接口基址默认 `http://localhost:8080`。响应信封为 `{ code, message, data }`，`code === 0` 表示成功。鉴权头为 `Authorization: Bearer <token>`。三端 token 分 key 存储，禁止共用。

本期明确不做：支付、定金、锁房、结算、业务假数据、登录以外的完整表单。登录页只有手机号 + 密码的表单桩，校验通过后也不写入 token。

意向终态中文为「已入住」，英文码 `CHECKED_IN`。文案表不使用「已落地」「已成交」「已达成」「已落实」。

## ② 详细设计

### 目录

```text
apps/portal/src/{api,router,stores,styles,utils,views,components}
apps/admin/src/{api,router,stores,styles,utils,views,components}
apps/merchant/src/{api,router,stores,styles,utils,views,components}
packages/shared/src/{types.ts,http.ts,token-keys.ts,index.ts}
```

各 app 的 `styles/tokens.css` 提供品牌色、中性色、间距、圆角、阴影、字号和字体栈。站名、主色、客服电话的占位来自环境变量，缺省为「站点名称」、`#2F6B4F`、`400-000-0000`。`site` store 在启动时把主色写到 `--color-brand` 与 `--el-color-primary`。`VITE_USE_MOCK=true` 只打警告，不注入列表或详情假数据。

### HTTP

`createHttpClient({ baseUrl, getToken, onUnauthorized })` 使用 `fetch`。成功时只返回 `data`。`code !== 0` 或 HTTP 非 2xx 时抛 `ApiError`（含 `code` 与 `httpStatus`）。HTTP 401，或信封 `code === 401`，触发 `onUnauthorized`：清本端 token，并 `replace` 到 `/login?redirect=<当前路径>`。请求 `credentials` 为 `omit`。各 app 的 `src/api/client.ts` 绑定自己的 token key 与基址。门户另有 `mapListingSearch`，把 URL 参数 `q` 映射为 `keyword`。

### Token

| Key | 端 |
|-----|----|
| `nj_portal_token` | 门户 |
| `nj_admin_token` | 运营 |
| `nj_merchant_token` | 商家 |

### 路由与守卫

壳页面展示页面标题和「脚手架」，并给出空态说明。需要登录的路由在未登录时进入 `/login?redirect=<原路径>`。`redirect` 只接受站内绝对路径；外链、协议相对地址，以及指向 `/login`、`/register` 的地址会被丢掉。已登录用户再进登录页（门户还包括注册页）时，回到 `redirect` 或该端首页。

门户首页是 `/`。运营 `/` 重定向到 `/applies`，商家 `/` 重定向到 `/stores`。商家路径不带 `/merchant` 前缀。运营攻略使用一条路由 `/guides/:id?`：没有 id 时是列表壳，有 id 时是编辑壳。Vue Router 会让可选参数记录盖过同 URL 的静态记录，因此不再单独注册一条 `/guides`。

登录字段名为 `phone` 与 `password`，不使用用户名。

### 意向状态

共享类型锁定：

| 码 | 中文 |
|----|------|
| `PENDING` | 待跟进 |
| `CONFIRMED` | 已确认 |
| `RESCHEDULED` | 已改期 |
| `CHECKED_IN` | 已入住 |
| `CLOSED` | 已关闭 |

合法迁移只作为类型说明：待跟进 → 已确认 / 已改期 / 已关闭；已确认 → 已入住 / 已关闭；已改期 → 已确认 / 已关闭。前端不实现迁移按钮。

## ③ 改动点

相对本仓原先的根目录单应用（Vite 默认端口、只有首页占位）：

| # | 改动 |
|---|------|
| 1 | 删除根目录 `src/`、`index.html`、Vite/TS 配置和 `package-lock.json`，改为 pnpm workspace |
| 2 | 新增 `apps/portal`、`apps/admin`、`apps/merchant`，端口 43123 / 43124 / 43125 |
| 3 | 新增 `packages/shared`：信封与分页类型、fetch 客户端、三端 token key、意向状态「已入住」 |
| 4 | 三端路由壳、登录守卫、`?redirect=`，以及手机号 + 密码登录桩 |
| 5 | 各 app `styles/tokens.css`；运营/商家引入 Element Plus，并把主色映射到 `--el-color-primary` |
| 6 | 根脚本 `pnpm dev:portal`、`dev:admin`、`dev:merchant`、`build`、`typecheck`、`test` |
| 7 | 新增本文与 `docs/FRONTEND.md`；README 改为 monorepo 入口 |

未改动后端仓库，也未接入真实登录或列表接口。

## ④ 影响点

| 对象 | 影响 |
|------|------|
| 后端 | 联调时 CORS 需放行 `http://localhost:43123`、`43124`、`43125`。登录契约为手机号 + 密码。401 会把对应端打回登录页 |
| 后续前端 | 业务页应替换壳视图，并复用 `@nongjiale/shared` 的 `request` 与 token key。不要把页面放进 shared，也不要合并 token key |
| 测试 | `pnpm test` 覆盖信封解析、401、token 分离、`CHECKED_IN` 文案，以及三端守卫。页面仍是空态，不依赖 8080 有进程 |
| 产品范围 | 脚手架没有支付、锁房、结算入口。注册、入驻、意向提交都还不是可用表单 |
| 本地运行 | 需 Node.js 22+ 与 pnpm 10。三个 dev 脚本会占用固定端口；本任务的验收命令是 `pnpm install`、`pnpm build` 与各 app 的 `vue-tsc --noEmit` |
