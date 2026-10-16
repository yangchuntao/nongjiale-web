# FE-2 门户业务页

日期：2026-10-15。范围只含 `apps/portal` 的 12 个业务页，以及三端默认主色从田园绿改为浅蓝。不实现运营端、商家端业务页，不造列表假数据，不提供支付、定金或锁房入口，不合并 `main`。

契约以 BE-4 交付说明和已附的 DTO / `StoreController` 为准。接口基址 `VITE_API_BASE`，默认 `http://localhost:8080`。响应信封 `{ code, message, data }`，`code === 0` 成功。游客令牌放在 `nj_portal_token`，请求头 `Authorization: Bearer`。

## ① 概要设计

门户把 FE-1 的路由壳换成可联调的游客流程：看首页和列表、看详情套餐文案、注册登录、提交意向、查看本人意向、读攻略、提交入驻申请。

页面只渲染接口返回的数据。加载中用骨架，空列表用空态和去向，失败提供重试。401 清掉门户令牌并回到 `/login?redirect=`。下架与不可订统一是 HTTP 410：详情和提交意向都禁用提交，并展示「房源已下架或不可用」。409 只留给非法日期等冲突，并留在意向表里改日期，不把它当成下架。404 表示内容不存在或意向不属于本人。

视觉用浅蓝主色和冷灰底，主按钮字色按对比度选择。站点配置的 `brandColor` 可以覆盖 `--color-brand` 和 Element Plus 的 primary。运营端、商家端这次只改令牌、环境变量回退和 favicon，不改业务页。

意向终态继续用 `CHECKED_IN` / 「已入住」。文案不出现「已落地」「已成交」「已达成」「已落实」。意向表、成功页、我的意向和详情都保留「意向不等于已锁房」。

## ② 详细设计

### 路由

与 `docs/FRONTEND.md` 门户表一致，对应 UI-PAGES 的 P-HOME 到 P-MERCHANT-APPLY。未登录访问需登录页时进入 `/login?redirect=`。已登录再打开登录或注册会离开。`redirect` 只接受站内路径。

| 页 | 路径 | 鉴权 | 数据 |
|----|------|------|------|
| 首页 | `/` | 公开 | `GET /api/home/feed`、`GET /api/regions`、`GET /api/config/public` |
| 列表 | `/listings` | 公开 | `GET /api/stores` |
| 详情 | `/listings/:id` | 公开 | `GET /api/stores/{id}` |
| 登录 | `/login` | 游客 | `POST /api/auth/login` |
| 注册 | `/register` | 游客 | `POST /api/auth/register` |
| 意向表 | `/listings/:id/intent` | 登录 | 详情 + `POST /api/booking-intents` |
| 意向成功 | `/intents/:id/success` | 登录本人 | `GET /api/me/intents/{id}` |
| 我的意向 | `/my/intents` | 登录 | `GET /api/me/intents` |
| 意向详情 | `/my/intents/:id` | 登录本人 | `GET /api/me/intents/{id}` |
| 攻略列表 | `/guides` | 公开 | `GET /api/articles` |
| 攻略详情 | `/guides/:id` | 公开 | `GET /api/articles/{id}` |
| 入驻申请 | `/merchant/apply` | 公开 | `POST /api/merchant-applies`，地区来自 `GET /api/regions` |

登录后会再请求 `GET /api/auth/me`，用于意向表和入驻申请预填手机。

### 列表查询

`GET /api/stores` 只带这些参数：

| 参数 | 说明 |
|------|------|
| `regionId` | 地区。服务端包含下级地区 |
| `tag` | 特色。首页搜索框提交后变成这个参数 |
| `priceMin` / `priceMax` | 价格带。页面上的档位只是这两个参数的预设 |
| `sort` | `comprehensive`（综合，即 `home_sort`）、`price_asc`、`price_desc` |
| `page` | 从 1 开始 |
| `pageSize` | 默认 20 |

不传 `keyword`。URL 上的 `q` 仅在没有 `tag` 时写入 `tag`。非法排序和非数字价格会被丢掉。筛选和页码写回 `/listings` 的 query。门户用页码，不用「加载更多」。

### 详情与意向

详情优先展示 `packageText`。`packages` 只在有数据时作为明细辅助；空数组是正常门店。卡片和详情会显示接口给出的 `testTag`（或 `testData` 时的「测试」），以及 `homeRecommended`、`homeSort`、`shelfStatus`。

创建意向的 JSON 对齐 `CreateIntentRequest`：`storeId`、`checkIn`、可选 `checkOut`、可选 `nights`、`guests`、`contactName`、`contactPhone`、可选 `userRemark`。不附带金额字段。到店早于今天、离店不晚于到店、晚数与离店不一致、手机号或联系人缺失，在提交前拦截。成功后用返回的 `id` 进入 `/intents/:id/success`，成功页再读本人意向，展示 `intentNo`。

状态展示：

| 码 | 文案 | Tag |
|----|------|-----|
| `PENDING` | 待跟进 | warning |
| `CONFIRMED` | 已确认 | info |
| `RESCHEDULED` | 已改期 | warning |
| `CHECKED_IN` | 已入住 | success |
| `CLOSED` | 已关闭 | 中性 |

我的意向列表和详情没有取消、改状态或支付按钮。他人意向按 BE-4 的 404 显示「不存在或无权查看」。

### 错误

后端与产品已确认：下架、不可订只用 HTTP **410**，详情拉取和提交意向是同一码。**409 不表示下架或不可订**，只表示非法日期一类冲突（到店早于今天、离店不晚于到店等）。

| 情况 | 呈现 |
|------|------|
| 401 | 清 `nj_portal_token`，到 `/login?redirect=` |
| 409 | 非法日期等冲突。意向页保留已填表单，展示接口 `message`；没有文案时用「日期不符合要求，请修改后再提交」。提交按钮仍可用，改完可以再交 |
| 410 | 详情或提交意向返回下架/不可订。禁用提交，展示「房源已下架或不可用」（接口另有说明时一并展示），并给出「该房源暂不可提交意向」和返回列表。不生成意向 |
| 404 | 房源或攻略不存在，或意向不属于本人 |
| 400 | 展示接口 `message` |
| 网络失败 | 「网络异常，请稍后重试」，可重试 |

### 公开配置与主色

`PublicConfigResponse` 使用 `siteName`、`brandColor`、`contactPhone`。合法的 `brandColor` 覆盖 `--color-brand`、`--el-color-primary`。与默认 `#4BA3D9` 不同时，同时重算 hover 和 soft。按钮字色放在 `--color-on-brand`：默认浅蓝用 `#1A1A1A`，深色主色用 `#FFFFFF`。

三端 `tokens.css`、`.env.example` 和 favicon 背景都改为浅蓝。favicon 图形用深色，避免浅蓝底上看不见。

### 登录、攻略、入驻

登录和注册请求体是 `{ phone, password }`。确认密码只在注册页本地校验，不提交。令牌读取顺序是字符串本身、`token`、`accessToken`、`access_token`。注册若成功但响应里没有令牌，转到登录页，不写入空令牌。

攻略列表和详情只展示已发布内容的标题、封面、摘要和正文。正文按文本渲染，不用 `v-html`。

入驻申请提交这些 JSON 字段：`subjectName`、`contactName`、`contactPhone`、`storeName`、`regionId`，备注非空时加 `remark`。证照是页面上的文件选择位；BE-4 附件没有上传字段，因此不把文件二进制或伪造 URL 放进请求。成功后同页显示「审核中」，并说明不承诺上架时间。

### 测试

单测覆盖主色对比度、列表参数不出现 `keyword`、意向日期与手机校验、409/410/401 文案、`CHECKED_IN` 为「已入住」、首页与地区解析，以及原有路由守卫。测试不依赖 8080 进程，也不往页面填假房源。

## ③ 改动点

| # | 改动 |
|---|------|
| 1 | 三端 `styles/tokens.css`、`env.ts`、`.env.example`、`favicon.svg` 改为浅蓝默认 |
| 2 | `packages/shared` 增加主色常量、对比度字色和 `applyBrandColor` |
| 3 | 门户 `site` store 读取 `/api/config/public` 并覆盖站名、主色、电话 |
| 4 | 门户 12 个路由从壳视图换成业务页；删除门户 `ShellView` |
| 5 | 登录、注册写入 `nj_portal_token`，并拉取 `/api/auth/me` |
| 6 | 列表查询改为 BE-4 参数，去掉 `keyword` |
| 7 | 意向创建、我的意向、攻略、入驻申请接对应接口 |
| 8 | 运营端、商家端主按钮字色跟随 `--color-on-brand`；不改这两端的业务路由 |
| 9 | 更新 `docs/FRONTEND.md`、README，并新增本文 |

## ④ 影响点

| 对象 | 影响 |
|------|------|
| 后端 | 门户联调依赖 BE-4。CORS 需放行 `http://localhost:43123`。游客令牌不能调用运营接口 |
| 运营 / 商家前端 | 默认主色和 favicon 已变。业务页仍是壳，Element primary 会随 `--color-brand` 变化 |
| 列表调用方 | 不要再传 `keyword`。搜索走 `tag` 或现有筛参 |
| 详情 | 验收套餐文案看 `packageText`，不要只看 `packages` |
| 意向 | 没有支付字段。多传金额会被 `CreateIntentRequest` 拒绝。下架/不可订看 410；409 只处理非法日期，前端不再把 409 显示成不可订 |
| 入驻 | 请求字段按页面规格命名。若后端 DTO 用了别的名字，需要按真实记录调整 `MerchantApplyBody`，不能靠假成功数据掩盖 |
| 登录响应 | 若令牌字段不是 `token` / `accessToken` / `access_token`，登录会提示缺少令牌 |
| 产品 | 页面不承诺在线订成、锁房或支付。`CHECKED_IN` 只显示「已入住」 |
| 测试 | `pnpm test` 仍不要求本地 API 进程。空态和错误态要在接口不可用时也能看懂 |

## 路由与 API 对照

| 方法 | 路径 | 门户用途 |
|------|------|----------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 当前游客，预填手机 |
| GET | `/api/config/public` | 站名、`brandColor`、客服电话 |
| GET | `/api/regions` | 首页目的地、列表地区、入驻地区 |
| GET | `/api/home/feed` | 首页推荐店与攻略摘要 |
| GET | `/api/stores` | 列表 |
| GET | `/api/stores/{id}` | 详情。404 不存在；410 下架或不可订，禁用提交 |
| POST | `/api/booking-intents` | 创建 `PENDING` 意向。410 与详情相同，表示下架或不可订；409 仅非法日期等冲突 |
| GET | `/api/me/intents` | 我的意向 |
| GET | `/api/me/intents/{id}` | 成功页与意向详情；非本人 404 |
| GET | `/api/articles` | 攻略列表 |
| GET | `/api/articles/{id}` | 攻略详情 |
| POST | `/api/merchant-applies` | 入驻申请，状态 `PENDING` |

本地查看门户：

```bash
pnpm install
pnpm dev:portal
```

开发地址是 http://localhost:43123 。接口默认 http://localhost:8080 。
