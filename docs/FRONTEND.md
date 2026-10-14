# 前端说明

## 结构

```
nongjiale-web/
  apps/portal/       # Vue 3 + TS + Vite + Vue Router 4 + Pinia · 端口 43123
  apps/admin/        # 同上 + Element Plus · 端口 43124
  apps/merchant/     # 同上 + Element Plus · 端口 43125
  packages/shared/   # 共享 TypeScript 类型与状态文案
```

三端登录态分开存放，不能拿一个端的 token 去调另一个端：

| 端 | localStorage | 登录接口 |
|----|----------------|----------|
| 门户 | `nj_portal_token` | `POST /api/auth/login` |
| 运营/客服 | `nj_admin_token` | `POST /api/admin/auth/login` |
| 商家 | `nj_merchant_token` + `nj_merchant_profile` | `POST /api/merchant/auth/login` |

API 基址默认 `http://localhost:8080`（`VITE_API_BASE`）。`VITE_USE_MOCK=false`，代码里没有 mock 数据源。

## 统一约定

- 响应：`{ code, message, data }`；`code === 0` 为成功
- 列表：`data: { items, total }`；`page` 从 1 起
- 鉴权：`Authorization: Bearer <token>`
- 商家接口只信 token 里的 `merchantId`。body/query 里不一致的 `merchantId` 为 **403**；别人的门店/意向按 id 读取为 **404**
- **403**：角色不够。客服做入驻审、上下架审、站点配置、商家账号；商家改意向或写跟进；未改初始密码就调其他商家接口（文案「请先修改初始密码」）
- **422**：看得到资源，但当前状态不允许（已上架再申请上架、上架中删除门店等）
- **409**：版本冲突、重复待审、重复入驻。前端提示失败并重新拉取，不乐观改界面
- 改状态一律 **POST**，不是 PATCH：意向 `POST /api/admin/intents/{id}/status`，房源代上下架 `POST /api/admin/homestays/{id}/status`，资讯 `POST /api/admin/articles/{id}/status`，入驻/上下架审核 `.../approve` 与 `.../reject`
- 商家不能调用门店 status 接口（契约不提供 `POST /api/merchant/stores/{id}/status`）
- 门户预订：`POST /api/booking-intents`，请求头带 `Idempotency-Key`（后端幂等键实际为 `userId:homestayId:checkIn`）
- 下架详情：`GET /api/homestays/{id}` → HTTP **410**
- 后端 v1.1 未实现时，页面展示接口错误和「重试」，列表为空时展示空态。不编造支付、结算或锁房结果

## 门户

| 路径 | 说明 | 接口 |
|------|------|------|
| `/` | 首页：搜索、地区、推荐、攻略入口、信任条 | `GET /api/home/feed` |
| `/regions/:slug` | 地区列表 | `GET /api/homestays` |
| `/search` | 搜索。URL `q` → API `keyword`；预留 `tag`、`sort` | `GET /api/homestays` |
| `/homestays/:id` | 详情；410 展示已下架 | `GET /api/homestays/{id}` |
| `/login?redirect=` | 登录后回跳 | `POST /api/auth/login` |
| `/homestays/:id/book` | 预订意向（需登录） | `POST /api/booking-intents` |
| `/booking/success` | 成功页：单号 + 电话。无支付、无取消 | 配置电话 |
| `/homestays/:id/contact` | 咨询留言（需登录） | `POST /api/contact-messages` |
| `/me/intents` | 我的意向，只读 | `GET /api/me/intents` |
| `/me/intents/:id` | 意向详情，只读，无取消 | `GET /api/me/intents/{id}` |
| `/articles` | 已发布攻略/资讯 | `GET /api/articles` |
| `/articles/:id` | 详情；草稿或不存在显示「内容不存在」 | `GET /api/articles/{id}` |
| `/merchant/apply` | 入驻申请。可上传证照图 | `POST /api/merchant-applications`、`POST /api/merchant-applications/media`、已登录时 `GET /api/me/merchant-application` |

`sort`：`default` 综合、`price` 起价升序、`sales` 销量降序。不选综合时才把 `sort` 发给后端。`tag` 为特色标签精确匹配。

`GET /api/config/public`：读取 `contactPhone`，并兼容新增的 `siteName`、`primaryColor`。缺字段或旧响应只有电话时不报错；主色仅在 `#RRGGBB` 时写入页面。成功页电话优先 query `tel` → 公开配置 → `VITE_CONTACT_PHONE`。

入驻：已有 `PENDING` 或 `APPROVED` 时不再提交。`REJECTED` 可再提。没有申请时 `GET /api/me/merchant-application` 的 404 当作「还没申请」。

## 商家中心 `apps/merchant`

端口 **43125**。侧栏：工作台、门店、上下架申请、意向（只读）、账号。`mustChangePassword=true` 时只能留在改密页。

| 页面 | 接口 |
|------|------|
| 登录 | `POST /api/merchant/auth/login` `{ phone, password }` |
| 当前主体 | `GET /api/merchant/auth/me` |
| 改密 | `POST /api/merchant/auth/password` `{ oldPassword, newPassword }` |
| 工作台 | `GET /api/merchant/dashboard` → `storeCount`、`pendingListingApplications`、`newIntentCount` |
| 门店列表/新建/保存/删除 | `GET/POST /api/merchant/stores`、`GET/PUT/DELETE /api/merchant/stores/{storeId}` |
| 套餐 | `GET/POST /api/merchant/stores/{storeId}/packages`、`PUT/DELETE .../packages/{packageId}` |
| 标签 | `GET/PUT /api/merchant/stores/{storeId}/tags`，body `{ tags }` |
| 上下架申请 | `POST /api/merchant/stores/{storeId}/listing-applications` `{ action: PUBLISH\|UNPUBLISH, note? }` |
| 申请列表/详情 | `GET /api/merchant/listing-applications`、`GET /api/merchant/listing-applications/{id}` |
| 意向列表/详情 | `GET /api/merchant/intents`、`GET /api/merchant/intents/{id}` |

门店可写字段：`name`、`regionId`、`address`、`phone`、`summary`、`coverUrl`、`gallery`、`facilities`、`notice`、`traffic`、`surroundings`、`version`。不提交 `status`、`merchantId`、`salesCount`、`recommendWeight`。保存资料不会让门店变成可订。

意向只展示 `contactPhoneMasked` 和 `noteSummary`。页面没有改状态、写跟进按钮，也不会调用 `POST /api/merchant/intents/{id}/status` 或 `.../notes`。

停用账号登录失败时展示接口文案（「账号已停用，请联系运营」）。演示账号等后端种子，前端不写死手机号和密码。

## 管理端

客服（`AGENT`）侧栏只有工作台、意向、房源。入驻审、上下架审、资讯、商家账号、站点配置直接打开会进入「无权限」，不当成 404。

| 功能 | 路径 | 谁能用 |
|------|------|--------|
| 登录 | `POST /api/admin/auth/login` | 运营、客服 |
| 仪表盘 | `GET /api/admin/dashboard` | 两边都有 `pendingIntents`、`pendingMessages`。运营额外读 `pendingMerchantApplications`、`pendingListingApplications`；缺字段显示「—」，不当成 0。客服不显示审核卡片 |
| 意向 | `GET /api/admin/intents`、`GET /api/admin/intents/{id}`、`POST .../status` | 运营、客服 |
| 房源代上下架 | `GET /api/admin/homestays`、`POST /api/admin/homestays/{id}/status` | 改状态仅运营 |
| 入驻审 | `GET /api/admin/merchant-applications`、`GET .../{id}`、`POST .../approve`、`POST .../reject` `{ reason }` | 仅运营 |
| 上下架审 | `GET /api/admin/listing-applications`、`GET .../{id}`、`POST .../approve`、`POST .../reject` `{ reason }` | 仅运营 |
| 资讯 | `GET/POST /api/admin/articles`、`PUT /api/admin/articles/{id}`、`POST .../status` `{ status: DRAFT\|PUBLISHED }` | 仅运营 |
| 商家账号 | `GET /api/admin/merchants`、`POST .../enabled`、`POST .../reset-password` | 仅运营 |
| 站点配置 | `GET/PUT /api/admin/site-config` | 仅运营 |

通过入驻或重置密码时，`initialPassword` 只在当次响应里展示一次。

意向状态：`PENDING` → `CONFIRMED` | `RESCHEDULED` | `CLOSED`。

房源对客状态：`ON_SALE` 门户可订；`OFF_SALE` / `DRAFT` 详情 410。

## 本地冒烟清单

1. `pnpm install`
2. 后端 8080 已起，且 CORS 包含 `43125`（商家端）
3. `pnpm --filter portal dev` → 43123
4. 登录 `13800000001` / `password` → 打开上架房源 → 预订 → 成功页见单号与电话
5. `pnpm --filter admin dev` → `operator` / `password` 可见审核入口；`agent` / `password` 看不到
6. `pnpm --filter merchant dev` → 43125。种子账号落地前，登录失败是预期表现

## 已知与契约差异（对接时注意）

- `GET /api/regions` 返回 **数组**，不是 `{ items, total }`
- 预订幂等：前端仍发 `Idempotency-Key` 头；服务端按 `userId:homestayId:checkIn` 去重
- 房源卡片 `coverUrl` 种子数据可能为 `null`
- Demo 仪表盘和公开配置在 v1.1 实现前字段较少，前端对缺字段做了兼容
- 搜索页 URL 使用 `?q=`；转发到 `GET /api/homestays` 时使用 `keyword`

## 明确不做

支付收银台、结算/对账/提现、锁房、短信 OTP、IM、问答、专题、地图。这些路径前端不调用。
