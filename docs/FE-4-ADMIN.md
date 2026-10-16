# FE-4 运营端 12 页

日期：2026-10-16。范围是 `apps/admin` 的 12 个业务页。不造列表假数据，不提供支付、定金或锁房，不合并 `main`。

契约以 [nongjiale-api PR #5](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/5) 已合入 main 的 BE-6 / `ADMIN-API.md` 为准。接口基址 `VITE_API_BASE`，默认 `http://localhost:8080`。业务响应信封 `{ code, message, data }`，`code === 0` 成功。运营令牌只放在 `nj_admin_token`，请求头 `Authorization: Bearer`。运营请求不调用门户 `/api/auth` 或商家接口。意向导出是例外：原始 CSV，不走信封。

## ① 概要设计

运营端把 FE-1 的路由壳换成可联调的后台：手机号 + 密码登录、审核入驻、启停商家并重置密码、代编房源（含首页推荐与代上下架）、审核商家上下架申请、跟进意向并导出 CSV、维护攻略、修改站点配置。

页面只渲染接口返回的数据。加载中用骨架，没有数据用空态，失败提供重试。401 清掉运营令牌并回到 `/login?redirect=`。`VITE_USE_MOCK=true` 只打警告，不注入申请、商家、房源或意向。

`homeRecommended` 与 `homeSort` 只出现在房源编辑。入驻队列和上下架队列不编辑推荐。代上下架写入 `PUT /api/admin/stores/{id}` 的 `shelfStatus`，没有单独的 `/shelf`。

意向终态 `CHECKED_IN` 全文展示「已入住」。筛选、详情标签、状态按钮、备注时间线和导出 CSV 都用这一句。文案表不使用「已落地」「已成交」「已达成」「已落实」。

主色沿用浅蓝 `#4BA3D9`，并写入 `--color-brand` 与 `--el-color-primary`。开发地址固定为 http://localhost:43124 。

## ② 详细设计

### 路由

与 `docs/FRONTEND.md` 运营表一致。未登录访问需登录页时进入 `/login?redirect=`。已登录再打开登录页会离开。`redirect` 只接受站内路径。窄屏下侧栏收成抽屉。`/` 重定向到 `/applies`。

| 页 | 路径 | 编号 | 数据 |
|----|------|------|------|
| 登录 | `/login` | A-LOGIN | `POST /api/admin/auth/login`，随后 `GET /api/admin/auth/me` |
| 入驻队列 | `/applies` | A-APPLY-QUEUE | `GET /api/admin/merchant-applies` |
| 入驻详情 | `/applies/:id` | A-APPLY-DETAIL | 详情、通过、驳回 |
| 商家 | `/merchants` | A-MERCHANT | 主体列表、启停、重置密码 |
| 房源列表 | `/listings` | A-LISTING-LIST | `GET /api/admin/stores` |
| 房源编辑 | `/listings/:id` | A-LISTING-EDIT | `GET` / `PUT /api/admin/stores/{id}` |
| 上下架队列 | `/shelf-requests` | A-SHELF-QUEUE | 商家申请的通过与驳回 |
| 意向列表 | `/intents` | A-INTENT-LIST | 筛选与 `GET /api/admin/intents/export` |
| 意向详情 | `/intents/:id` | A-INTENT-DETAIL | 状态迁移与备注 |
| 攻略 | `/guides/:id?` | A-GUIDE-LIST / A-GUIDE-EDIT | 无 id 为列表，`new` 为新建，其他 id 为编辑 |
| 站点配置 | `/site` | A-SITE-CONFIG | `GET` / `PUT /api/admin/site-config` |

### 登录与会话

请求体只有 `{ phone, password }`。成功时 `data` 为：

| 字段 | 说明 |
|------|------|
| `token` | 写入 `nj_admin_token` |
| `expiresAt` | 随会话资料保存，过期仍由接口 401 处理 |
| `adminId` | 运营用户。不是 `adminUserId` |
| `role` | `OPERATOR` 或 `AGENT`。缺省按 `OPERATOR` |
| `displayName` | 顶栏展示 |

登录后再请求 `GET /api/admin/auth/me`，用 `{ adminId, phone, role, displayName }` 补上手机号。刷新页面时，已有令牌会再请求 `/me`。`nj_admin_profile` 不含令牌。`/me` 失败不抹掉刚写入的令牌。

`message` 含「停用」时，页面显示「账号已停用」，并清令牌回到 `/login?disabled=1`。

### 入驻

列表默认 `status=PENDING`。选「全部」时不传 `status`。分页 `page`、`pageSize`（默认 20），`data` 为 `{ items, total, page, pageSize }`。

申请字段：`id`、`orgName`、`contactName`、`contactPhone`、`plannedStoreName`、`regionId`、`description`、`licenseUrls`、`status`、`rejectReason`、`reviewedBy`、`reviewedAt`、`createdAt`、`merchantOrgId`。地区只显示编号。

通过：`POST /api/admin/merchant-applies/{id}/approve`。密码可空，空则 body 为 `{}`，否则 `{ password }`。响应里的 `plainPassword` 只在当次对话框展示，关闭后不留在页面状态。驳回：`POST .../reject`，body `{ reason }`，原因为空不能提交。

### 商家

列表是主体：`GET /api/admin/merchants`。`status` 为 `ACTIVE` 或 `DISABLED`。每行含 `users[]`：`id`、`phone`、`displayName`、`enabled`。

启停：`PATCH /api/admin/merchants/{orgId}`，body 只有 `{ status }`，不与 `enabled` 同发。重置密码：`POST /api/admin/merchants/{orgId}/reset-password`，可选 `{ password }`，同样只展示一次 `plainPassword`。

`POST /api/admin/merchants/{orgId}/stores` 已登记为代建门店路径。12 页没有代建表单，也不猜测请求体。

### 房源

筛选：`shelfStatus`、`regionId`、`merchantOrgId`、`homeRecommended`、`name`、`page`、`pageSize`。`shelfStatus` 为 `DRAFT`、`OFF_SHELF`、`ON_SHELF`。

保存是 `PUT /api/admin/stores/{id}`，必须带 `version`。可同时写资料、`homeRecommended`、`homeSort` 和 `shelfStatus`。字段名是 `homeRecommended` / `homeSort`，不使用 `homeRecommendSort`。代上架、代下架只改 `shelfStatus` 后走同一次 PUT，不进商家申请队列。

### 上下架申请

`GET /api/admin/shelf-applications`，默认待审。通过：`POST /api/admin/shelf-applications/{id}/approve`，无 body。驳回：`POST .../reject`，body `{ reason }`。

### 意向

筛选：`status`、`storeId`、`merchantOrgId`、`checkInFrom`、`checkInTo`、`createdFrom`、`createdTo`、`page`、`pageSize`。不用 `from`、`to`、`keyword`。

改状态：`POST /api/admin/intents/{id}/status`，body `{ targetStatus, version, note? }`。合法迁移沿用共享表：待跟进可到已确认、已改期、已关闭；已确认可到已入住、已关闭；已改期可到已确认、已关闭；已入住和已关闭没有下一状态。关闭前有确认框。追加备注：`POST .../notes`，body `{ note }`。时间线字段：`id`、`adminId`、`action`（`STATUS_CHANGE` 或 `COMMENT`）、`fromStatus`、`toStatus`、`note`、`createdAt`。

状态文案：

| 码 | 文案 | Tag |
|----|------|-----|
| `PENDING` | 待跟进 | warning |
| `CONFIRMED` | 已确认 | primary |
| `RESCHEDULED` | 已改期 | warning |
| `CHECKED_IN` | 已入住 | success |
| `CLOSED` | 已关闭 | 中性 |

`status === CHECKED_IN` 时忽略接口 `statusLabel`，固定「已入住」。`statusLabel` 若是「已落地」「已成交」「已达成」或「已落实」，也改成「已入住」。

导出：`GET /api/admin/intents/export`，查询与列表筛选相同，不带分页。响应必须是原始 CSV。前端再把上述四个旧词替换成「已入住」。列是单号、店名、日期、人数、状态、联系人、手机、更新时间，没有佣金。

### 攻略与站点

攻略写入字段是 `body`。读取时 `body` 为空则用 `content`。状态只提交 `DRAFT` 或 `PUBLISHED`。删除用 `DELETE /api/admin/articles/{id}`。

站点配置读写 `{ siteName, brandColor, contactPhone }`。`brandColor` 须为 `#` 加 6 位十六进制，保存前规范成大写。保存成功后立刻套用到运营端主色。

### 错误与空态

| 情况 | 呈现 |
|------|------|
| 401 | 清 `nj_admin_token` 与 `nj_admin_profile`，到 `/login?redirect=` |
| 停用 | 「账号已停用」 |
| 403 其他 | 接口 `message` |
| 404 | 不存在或无权查看 |
| 409 | 接口说明，常见为版本冲突 |
| 400 | 接口 `message` |
| 导出非 CSV | 「导出响应不是原始 CSV」 |
| 网络失败 | 「网络异常，请稍后重试」 |
| 入驻 / 上下架空 | 「暂无待审」/「暂无待审申请」 |
| 意向空 | 「无匹配意向」 |
| 商家 / 房源 / 攻略空 | 「暂无商家」/「暂无房源」/「暂无攻略」 |

运营模块不把 410 当成下架码。下架看 `shelfStatus`。

## ③ 改动点

| # | 改动 |
|---|------|
| 1 | 十二个路由从壳视图换成业务页；删除运营 `ShellView`、`GuideShell` |
| 2 | 登录写入 `nj_admin_token`，并请求 `/api/admin/auth/me` |
| 3 | 入驻、商家、房源、上下架、意向、攻略、站点按 api#5 路径接线 |
| 4 | 房源 PUT 使用 `homeRecommended`、`homeSort`、`shelfStatus`、`version`，去掉 `homeRecommendSort` 和单独 `/shelf` |
| 5 | 启停只发 `{ status }`；一次性密码只在对话框展示 |
| 6 | `CHECKED_IN` 文案表与展示层一律「已入住」，导出 CSV 同样改写旧词 |
| 7 | 更新 `docs/FRONTEND.md`、README，并新增本文 |

未改门户和商家的业务请求，也未打开业务 mock。

## ④ 影响点

| 对象 | 影响 |
|------|------|
| 后端 | 联调依赖已合入 main 的 [nongjiale-api PR #5](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/5)。CORS 放行 `http://localhost:43124` |
| 文案 | Java 侧 `CHECKED_IN` 的 `statusLabel` 已热修为「已入住」。前端文案表同步为「已入住」。若响应或 CSV 仍带回「已落地」等旧词，展示层改写后再画到页面和文件 |
| 房源 | 推荐字段归房源编辑。代上下架与保存是同一次 PUT。缺 `version` 不能提交 |
| 商家 | 重置密码和开通的 `plainPassword` 只出现一次。代建门店只有路径，没有表单 |
| 意向 | 导出不是信封。前端按当前筛选导出，并假定后端按这些条件返回全量，不按页截断 |
| 攻略 | `ADMIN-API` 未单列正文字段。写入用 `body`，读取兼容 `content` |
| 站点 | 若 `data` 仍是旧的键值数组，读取 `site.name`、`site.brand_color`、`site.contact_phone`。保存始终提交对象三字段 |
| 产品 | 无支付、无锁房、无站内佣金计算。对客沟通仍强调意向未锁房 |
| 测试 | `pnpm test` 不依赖 8080。单测锁定路径、`adminId`、PUT 字段、`targetStatus`、`CHECKED_IN` 为「已入住」，以及 CSV 不含旧词和佣金 |

## 路由与 API 对照

| 方法 | 路径 | 运营用途 |
|------|------|----------|
| POST | `/api/admin/auth/login` | `{ phone, password }` |
| GET | `/api/admin/auth/me` | 当前运营用户 |
| GET | `/api/admin/merchant-applies` | 入驻队列 |
| GET | `/api/admin/merchant-applies/{id}` | 入驻详情 |
| POST | `/api/admin/merchant-applies/{id}/approve` | 可选 `{ password }`，响应含 `plainPassword` |
| POST | `/api/admin/merchant-applies/{id}/reject` | `{ reason }` |
| GET | `/api/admin/merchants` | 主体分页 |
| PATCH | `/api/admin/merchants/{orgId}` | `{ status: ACTIVE \| DISABLED }` |
| POST | `/api/admin/merchants/{orgId}/reset-password` | 可选 `{ password }` |
| POST | `/api/admin/merchants/{orgId}/stores` | 代建路径已登记，页面不提交 |
| GET / PUT | `/api/admin/stores`、`/api/admin/stores/{id}` | 列表与代编。PUT 含推荐与 `shelfStatus` |
| GET | `/api/admin/shelf-applications` | 上下架申请 |
| POST | `/api/admin/shelf-applications/{id}/approve` | 无 body |
| POST | `/api/admin/shelf-applications/{id}/reject` | `{ reason }` |
| GET | `/api/admin/intents` | 意向分页 |
| GET | `/api/admin/intents/export` | 原始 CSV |
| GET | `/api/admin/intents/{id}` | 意向详情 |
| POST | `/api/admin/intents/{id}/status` | `{ targetStatus, version, note? }` |
| POST | `/api/admin/intents/{id}/notes` | `{ note }` |
| GET / POST | `/api/admin/articles` | 攻略列表与新建 |
| GET / PUT / DELETE | `/api/admin/articles/{id}` | 攻略详情、保存、删除 |
| GET / PUT | `/api/admin/site-config` | `siteName`、`brandColor`、`contactPhone` |

## 相对规划壳已改掉的差异

规划壳按 TECH-DESIGN §2.3.2 预留过一些字段。api#5 的实际 DTO 不是那样。当前实现已按下列差异校正：

| 规划壳 | api#5 实际 | 前端 |
|--------|------------|------|
| 登录用户字段可能写成 `adminUserId` | `adminId` | 只读 `adminId` |
| 可选、不稳定的 `/me` | 有 `GET /api/admin/auth/me` | 登录后和刷新时请求 |
| 推荐字段 `homeRecommendSort` | `homeRecommended` 与 `homeSort` | PUT 与列表筛选只用这两个名字 |
| 代上下架单独 `POST .../shelf` | `PUT` 门店的 `shelfStatus` | 代上架、代下架并入同一次 PUT |
| 启停可能同时发 `status` 与 `enabled` | 二选一 | 只发 `{ status }` |
| 开通密码只在请求里 | 响应 `plainPassword` 只返回一次 | 对话框展示后丢弃 |
| 意向改状态字段不统一 | `{ targetStatus, note?, version }` | 按该 body 提交 |
| 意向筛选 `from` / `to` / `keyword` | `checkInFrom`、`checkInTo`、`createdFrom`、`createdTo`、`storeId`、`merchantOrgId` | 查询只用这些名字 |
| 导出走信封 JSON | 原始 CSV，列无佣金 | 单独 `fetch`，拒绝以 `{` 开头的正文 |
| `CHECKED_IN` 曾被写成「已落地」 | Java 热修后的 label 为「已入住」 | 文案表与映射一律「已入住」 |
| 站点配置键值列表 | 对象三字段，主色 `#` + 6 hex | 保存对象；主色规范成大写 |

本地查看运营端：

```bash
pnpm install
pnpm dev:admin
```

开发地址是 http://localhost:43124 。接口默认 http://localhost:8080 。
