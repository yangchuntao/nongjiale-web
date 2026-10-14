# 前端说明

## 结构

```
nongjiale-web/
  apps/portal/     # Vue 3 + TS + Vite + Vue Router 4 + Pinia · 端口 43123
  apps/admin/      # 同上 + Element Plus · 端口 43124
  packages/shared/ # 共享 TypeScript 类型
```

## 统一约定

- 响应：`{ code, message, data }`；`code === 0` 为成功
- 列表：`data: { items, total }`；`page` 从 1 起
- 鉴权：`Authorization: Bearer <token>`
- 门户预订：`POST /api/booking-intents`，请求头带 `Idempotency-Key`（后端幂等键实际为 `userId:homestayId:checkIn`）
- 管理端改意向状态：**`POST /api/admin/intents/{id}/status`**，body `{ status, version, note? }`（不是 PATCH）
- 下架详情：`GET /api/homestays/{id}` → HTTP **410**

## 门户路由

| 路径 | 说明 |
|------|------|
| `/` | 首页 feed |
| `/regions/:slug` | 地区列表 |
| `/search` | 搜索 |
| `/homestays/:id` | 详情；410 展示已下架 |
| `/login?redirect=` | 登录后回跳 |
| `/homestays/:id/book` | 预订意向（需登录） |
| `/booking/success` | 成功页：`intentId` / `intentNo` / `tel` |
| `/homestays/:id/contact` | 咨询留言（需登录） |

不做：`/orders`、支付页。

成功页电话：优先 query `tel`（来自预订响应 `contactPhone`）→ `GET /api/config/public` → `VITE_CONTACT_PHONE`。

## 门户 API 映射

| 功能 | 方法路径 | body / 备注 |
|------|----------|-------------|
| 登录 | `POST /api/auth/login` | `{ phone, password }` → `token, userId, phone, displayName` |
| 我 | `GET /api/auth/me` | |
| 公开配置 | `GET /api/config/public` | `contactPhone` |
| 地区 | `GET /api/regions` | 数组（非 `{items}`） |
| 首页 | `GET /api/home/feed` | `regions, hotHomestays, topics, articles` |
| 列表 | `GET /api/homestays` | 路由 query 用 `q`（搜索页）；请求后端时映射为 `keyword`。另有 `regionId/regionSlug/page/pageSize` |
| 详情 | `GET /api/homestays/{id}` | `rooms, facilities, notice, bookable…` |
| 意向 | `POST /api/booking-intents` | `{ homestayId, checkIn, checkOut, guests, travelMode?, contactName, contactPhone }` → `intentId, intentNo, status, contactPhone` |
| 留言 | `POST /api/contact-messages` | `{ homestayId?, content, contactName, contactPhone }` |

## 管理端

| 功能 | 路径 |
|------|------|
| 登录 | `POST /api/admin/auth/login` `{ username, password }` |
| 仪表盘 | `GET /api/admin/dashboard` → `pendingIntents, pendingMessages` |
| 意向列表/详情 | `GET /api/admin/intents`、`GET /api/admin/intents/{id}` |
| 改状态 | `POST /api/admin/intents/{id}/status` |
| 房源 | `GET /api/admin/homestays`；`POST /api/admin/homestays/{id}/status`（OPERATOR only） |

意向状态：`PENDING` → `CONFIRMED` | `RESCHEDULED` | `CLOSED`。

## 本地冒烟清单

1. `pnpm install`
2. 后端 8080 已起
3. `pnpm --filter portal dev` → 43123
4. 登录 `13800000001` / `password` → 打开上架房源 → 预订 → 成功页见 intent id 与 `tel:13651814168`
5. （可选）`pnpm --filter admin dev` → `operator` / `password` → 意向列表可见新单

## 已知与契约差异（对接时注意）

- `GET /api/regions` 返回 **数组**，不是 `{ items, total }`
- 预订幂等：前端仍发 `Idempotency-Key` 头；服务端按 `userId:homestayId:checkIn` 去重（同日同房同用户重复提交会返回已有意向）
- 房源卡片 `coverUrl` 种子数据可能为 `null`


## 搜索参数

门户搜索页 URL 使用 `?q=`；转发到 `GET /api/homestays` 时使用后端参数名 `keyword`。
