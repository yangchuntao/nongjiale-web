# 前端工程说明

Vue 3 + TypeScript + Vite + Vue Router + Pinia 的 pnpm monorepo。门户按 BE-4、商家端按 BE-5、运营端按 BE-6 接真实接口。

## 端口

| 应用 | 开发地址 | 接口基址 |
|------|----------|----------|
| 门户 `apps/portal` | http://localhost:43123 | `VITE_API_BASE`，默认 http://localhost:8080 |
| 运营 `apps/admin` | http://localhost:43124 | 同上 |
| 商家 `apps/merchant` | http://localhost:43125 | 同上 |

商家是独立应用，路径不加 `/merchant` 前缀。

## 脚本

在仓库根目录执行：

```bash
pnpm install
pnpm dev:portal
pnpm dev:admin
pnpm dev:merchant
pnpm build
pnpm build:portal
pnpm build:admin
pnpm build:merchant
pnpm typecheck
pnpm test
```

`typecheck` 会在 shared 上跑 `tsc --noEmit`，并在三个 app 上跑 `vue-tsc --noEmit`（含 `tsconfig.node.json`）。`build` 会先做各 app 的类型检查，再执行 `vite build`。

需要 Node.js 22 或更高版本，包管理器为 pnpm 10。

## Token keys

三端分开存储，不要混用：

| Key | 应用 |
|-----|------|
| `nj_portal_token` | 门户 |
| `nj_admin_token` | 运营 |
| `nj_merchant_token` | 商家 |

游客小程序不使用上面三枚浏览器 token。已打通的微信登录令牌只写入微信存储 `nj_mp_token`。`accountLinked=false` 时不写这枚键。

## 微信小程序

`apps/miniapp` 是原生小程序，用微信开发者工具导入该目录。`project.config.json` 的 `appid` 留空。测试号写在本地 `project.private.config.json`（已 gitignore）。不要把 AppSecret、上传密钥写进仓库。

接口基址默认 `http://localhost:8080`。体验版真机把本地存储 `nj_mp_api_base` 设成已配置的 https 源。业务域名未配置时，Banner 外链只复制，不打开 web-view；配好后把本地存储 `nj_mp_webview_ready` 设为 `1`。

根脚本 `pnpm build`、`pnpm test`、`pnpm typecheck` 不包含小程序。单独检查：

```bash
pnpm typecheck:miniapp
pnpm test:miniapp
```

常量在 `@nongjiale/shared` 的 `TOKEN_KEYS`。

## 环境变量

每个 app 有 `.env.example`。未提供 `.env` 时使用下列默认值：

```bash
VITE_API_BASE=http://localhost:8080
VITE_USE_MOCK=false
VITE_SITE_NAME=站点名称
VITE_PRIMARY_COLOR=#4BA3D9
VITE_CONTACT_PHONE=400-000-0000
```

`VITE_USE_MOCK=true` 不会打开假数据。站名、主色、客服电话只作为占位。门户启动后请求 `GET /api/config/public`，用返回的 `siteName`、`brandColor`、`contactPhone` 覆盖占位。`brandColor` 写入 `--color-brand` 和 `--el-color-primary`。配置缺失或请求失败时回退环境变量，主色再回退 `#4BA3D9`。默认主色不再使用 `#2F6B4F`。

## HTTP

共享 `createHttpClient`：

- 请求头 `Accept: application/json`
- 有 token 时附加 `Authorization: Bearer <token>`
- 响应必须是 `{ code, message, data }`
- `code === 0` 时返回 `data`
- 否则抛 `ApiError`
- 401 时清除本端 token，并跳到 `/login?redirect=`

门户对房源可用性的错误码：

| HTTP | 含义 | 门户表现 |
|------|------|----------|
| 410 | 下架或不可订。详情 `GET /api/stores/{id}` 与提交意向 `POST /api/booking-intents` 使用同一码 | 禁用提交，文案「房源已下架或不可用」 |
| 409 | 非法日期等冲突或校验，不表示下架 | 留在意向表，展示接口说明，改完可再提交 |
| 404 | 房源不存在，或意向不属于本人 | 「不存在或无权查看」一类文案 |
| 401 | 未登录 | 清 `nj_portal_token`，进入 `/login?redirect=` |

门户房源列表只发送 BE-4 已有参数：`regionId`、`tag`、`priceMin`、`priceMax`、`sort`、`page`、`pageSize`。没有 `keyword`。首页搜索和列表里的 `q` 会当成 `tag`；若 URL 已有 `tag`，以 `tag` 为准。`sort` 只接受 `comprehensive`、`price_asc`、`price_desc`。

## 意向状态

`CHECKED_IN` 的中文是「已入住」。不要写成「已订立」「已落实」「已落地」「已成交」或「已达成」。运营端若收到旧的 `statusLabel`，展示层仍改成「已入住」。

## 路由

未登录访问需登录的页面时，进入该端 `/login?redirect=<原路径>`。已登录再打开登录页会离开登录页。门户的注册页同样只对未登录游客开放。

### 门户（43123）

| 路径 | 鉴权 | 说明 |
|------|------|------|
| `/` | 公开 | 首页。目的地 Chip 用 `GET /api/regions`（市级 `level` 为 `CITY`，兼容数字 2；`CLOSED` 市如南通不展示）；推荐与攻略来自 `GET /api/home/feed` |
| `/listings` | 公开 | 房源列表。页码分页，筛选写入 URL。`destinationStatus=CLOSED` 时只显示「该目的地暂未开通」，不渲染返回的房源 |
| `/listings/:id` | 公开 | 房源详情。套餐以 `packageText` 为准。410 与下架相同，不提供提交意向 |
| `/login` | 游客；已登录则离开 | 手机号 + 密码，令牌写入 `nj_portal_token` |
| `/register` | 游客；已登录则离开 | 手机号 + 密码注册 |
| `/listings/:id/intent` | 需登录 | 提交意向。无支付、无锁房 |
| `/intents/:id/success` | 需登录 | 意向成功，展示单号与客服电话 |
| `/my/intents` | 需登录 | 我的意向 |
| `/my/intents/:id` | 需登录 | 意向详情。他人单据按接口 404 显示无权查看 |
| `/guides` | 公开 | 已发布攻略列表。关联市未开通的攻略不由前端另筛，列表跟随接口 |
| `/guides/:id` | 公开 | 攻略详情。直链在接口返回 200 时仍可打开 |
| `/merchant/apply` | 公开 | 入驻申请。可在已登录时预填手机 |

### 商家（43125）

登录是 `POST /api/merchant/auth/login`，请求体 `{ phone, password }`。令牌只写入 `nj_merchant_token`，不调用门户或运营接口，也没有 `GET /api/merchant/auth/me`。登录响应里的主体和显示名记在 `nj_merchant_profile`，这不是第三套令牌。

停用账号返回 403，`message` 为「商家已停用」或「账号已停用」。页面统一显示「账号已停用，请联系运营」。

没有新建门店。保存门店的 PUT 只提交 BE-5 白名单，不带 `homeRecommended`、`homeSort`、`shelfStatus`。意向只读，手机按接口已脱敏的值展示。`CHECKED_IN` 显示「已入住」。

| 路径 | 鉴权 | 说明 |
|------|------|------|
| `/login` | 游客；已登录则去 `/stores` | 手机号 + 密码 |
| `/stores` | 需登录 | 本主体门店，含下架店 |
| `/stores/:id` | 需登录 | 编辑资料。推荐字段只读，不提交 |
| `/stores/:id/shelf` | 需登录 | 申请上架或下架，待审时不能重复提交 |
| `/intents` | 需登录 | 本店意向，只读 |
| `/intents/:id` | 需登录 | 意向详情，只读 |

`/` 重定向到 `/stores`。页面与接口对照见 [FE-3-MERCHANT.md](FE-3-MERCHANT.md)。

### 运营（43124）

登录是 `POST /api/admin/auth/login`，请求体 `{ phone, password }`。令牌只写入 `nj_admin_token`。`GET /api/admin/auth/me` 返回 `{ adminId, phone, role, displayName }`，角色是 `OPERATOR` 或 `AGENT`。显示名记在 `nj_admin_profile`，这不是令牌。

契约以 [nongjiale-api PR #5](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/5) 为准。`CHECKED_IN` 在筛选、详情、状态按钮和导出里都显示「已入住」。页面与接口对照见 [FE-4-ADMIN.md](FE-4-ADMIN.md)。

| 路径 | 鉴权 | 说明 |
|------|------|------|
| `/login` | 游客；已登录则去 `/applies` 或 `redirect` | 手机号 + 密码 |
| `/applies` | 需登录 | 入驻队列。默认待审 |
| `/applies/:id` | 需登录 | 通过或驳回。驳回原因必填 |
| `/merchants` | 需登录 | 商家主体启停、重置密码 |
| `/listings` | 需登录 | 房源列表 |
| `/listings/:id` | 需登录 | 代编资料、首页推荐、代上下架 |
| `/shelf-requests` | 需登录 | 商家上下架申请 |
| `/intents` | 需登录 | 意向筛选与导出 CSV |
| `/intents/:id` | 需登录 | 状态机与备注时间线 |
| `/guides/:id?` | 需登录 | 无 id 为攻略列表；`new` 为新建；其他 id 为编辑 |
| `/cities` | 需登录 | 开城列表。`GET /api/admin/cities` |
| `/cities/:cityId` | 需登录 | 单市开通/关城。①④⑤手勾，②③按计数只读 |
| `/seed-metrics` | 需登录 | 种子看板。按市汇总，行不下钻；可导出 CSV |
| `/site` | 需登录 | 站名、主色、客服电话 |

`/` 重定向到 `/applies`。

## 设计令牌

`apps/*/src/styles/tokens.css` 定义浅蓝主色、间距、圆角、字体：

| 变量 | 默认 |
|------|------|
| `--color-brand` | `#4BA3D9` |
| `--color-brand-hover` | `#3A8FC4` |
| `--color-brand-soft` | `#E8F4FC` |
| `--color-surface-muted` | `#F4F8FB` |
| `--color-on-brand` | `#1A1A1A`（浅蓝底上的按钮字；深色主色会改成白字） |

运营端和商家端通过 Element Plus，并把 `--el-color-primary` 指到 `--color-brand`。主按钮字色跟随 `--color-on-brand`，避免浅蓝底配白字对比不足。

门户页面用轻量 CSS，不引入 Element Plus。意向相关页展示非锁房说明。意向状态 `CHECKED_IN` 只显示「已入住」。详情没有支付、定金或锁房入口。门户对照见 [FE-2-PORTAL.md](FE-2-PORTAL.md)，商家对照见 [FE-3-MERCHANT.md](FE-3-MERCHANT.md)，运营对照见 [FE-4-ADMIN.md](FE-4-ADMIN.md)。
