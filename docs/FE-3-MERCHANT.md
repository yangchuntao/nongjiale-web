# FE-3 商家端 6 页

日期：2026-10-15。范围是 `apps/merchant` 的 6 个业务页。不实现运营端，不造列表假数据，不提供新建门店、支付或改意向入口，不合并 `main`。

契约以 [nongjiale-api PR #4](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/4) 已落地的 BE-5 DTO 为准。接口基址 `VITE_API_BASE`，默认 `http://localhost:8080`。响应信封 `{ code, message, data }`，`code === 0` 成功。商家令牌只放在 `nj_merchant_token`，请求头 `Authorization: Bearer`。商家请求不调用门户 `/api/auth` 或运营接口。

## ① 概要设计

商家端把 FE-1 的路由壳换成可联调的本店后台：手机号 + 密码登录、查看本主体门店、维护资料、申请上下架、只读查看本店意向。

页面只渲染接口返回的数据。加载中用骨架，没有数据用空态，失败提供重试。401 清掉商家令牌并回到 `/login?redirect=`。没有「新建门店」按钮，空列表写明请联系运营代为开通。

编辑页可以只读看到 `homeRecommended` 和 `homeSort`，保存时不提交这两项，也不提交 `shelfStatus`。后端若收到这三项会返回 400。乐观锁冲突是 409，跨主体是 404。

意向终态继续用 `CHECKED_IN` / 「已入住」。列表和详情顶部是「意向由平台客服跟进。意向不等于已锁房。」没有改状态、写备注或查看完整手机号。

主色沿用 FE-2 的浅蓝 `#4BA3D9`。商家端令牌里没有残留的 `#2F6B4F`。

## ② 详细设计

### 路由

与 `docs/FRONTEND.md` 商家表一致。未登录访问需登录页时进入 `/login?redirect=`。已登录再打开登录页会离开。`redirect` 只接受站内路径。窄屏下侧栏收成抽屉。

| 页 | 路径 | 鉴权 | 数据 |
|----|------|------|------|
| 登录 | `/login` | 游客 | `POST /api/merchant/auth/login` |
| 门店列表 | `/stores` | 商家 | `GET /api/merchant/stores`，待审角标来自上下架申请 |
| 门店编辑 | `/stores/:id` | 本主体 | `GET` / `PUT /api/merchant/stores/{id}` |
| 上下架 | `/stores/:id/shelf` | 本主体 | 申请列表 + `POST .../shelf-applications` |
| 意向列表 | `/intents` | 商家 | `GET /api/merchant/intents` |
| 意向详情 | `/intents/:id` | 本店 | `GET /api/merchant/intents/{id}` |

`/` 重定向到 `/stores`。

### 登录与会话

请求体只有 `{ phone, password }`。成功时 `data` 为：

| 字段 | 说明 |
|------|------|
| `token` | 写入 `nj_merchant_token` |
| `expiresAt` | 随会话资料保存，过期仍由接口 401 处理 |
| `merchantUserId` | 商家用户 |
| `merchantOrgId` | 主体 |
| `role` | 必须是 `MERCHANT` |
| `displayName` | 顶栏展示 |

没有 `GET /api/merchant/auth/me`。刷新页面后只靠本地令牌和 `nj_merchant_profile` 恢复显示名，不额外请求当前用户。`nj_merchant_profile` 不含令牌。

403 且 `message` 为「商家已停用」或「账号已停用」时，页面显示「账号已停用，请联系运营」，并清令牌回到登录页。其他 403 展示接口原文，不当成停用。

### 门店

列表和详情使用同一门店形状。分页 `data` 为 `{ items, total, page, pageSize }`，查询参数是 `page`、`pageSize`。列表包含本主体已下架的店。

门店字段：`id`、`merchantOrgId`、`name`、`regionId`、`address`、`phone`、`coverUrl`、`gallery[]`、`priceText`、`priceFrom`、`packageText`、`facilities`、`features`、`notice`、`trafficText`、`shelfStatus`、`homeRecommended`、`homeSort`、`version`。

没有 `packages[]`、`regionName`、`testTag`。地区在列表和编辑里都是地区编号 `regionId`。未知字段忽略。

PUT 请求体只有这些字段：

```json
{
  "name": "",
  "regionId": 0,
  "address": "",
  "phone": "",
  "coverUrl": "",
  "gallery": [],
  "priceText": "",
  "priceFrom": null,
  "packageText": "",
  "facilities": "",
  "features": "",
  "notice": "",
  "trafficText": "",
  "version": 0
}
```

`gallery`、`priceText`、`priceFrom`、`packageText`、`facilities`、`features`、`notice`、`trafficText` 在表单里可空，空字符串或空数组仍会提交，以便清空。`priceFrom` 空着时提交 `null`。`version` 缺失时不允许保存。

保存成功提示「已保存；游客是否可见取决于上架状态」。409 展示接口说明，默认是操作冲突后刷新。404 表示不存在或不是本主体。

首页推荐和排序在表单下方只读展示，不放进 `el-form`，也不出现在 PUT body。

### 上下架

`POST /api/merchant/stores/{id}/shelf-applications` 的请求体是 `{ action: "PUBLISH" | "UNPUBLISH", reason }`。页面要求填写原因。同一门店已有 `PENDING` 时按钮禁用；若仍返回 409，展示接口说明。

`GET /api/merchant/shelf-applications` 可带 `storeId`、`page`、`pageSize`。每条为：

| 字段 | 说明 |
|------|------|
| `id` / `storeId` / `storeName` / `merchantOrgId` | 申请与门店 |
| `action` | `PUBLISH` 或 `UNPUBLISH` |
| `reason` | 申请原因 |
| `status` | `PENDING` / `APPROVED` / `REJECTED` |
| `rejectReason` | 驳回原因 |
| `createdAt` | 时间 |

提交成功提示「已提交，等待运营审核；通过前游客可见性不变」。门店列表用申请里的 `PENDING` 显示待审角标。申请列表失败时不编造角标，门店列表仍可展示。

### 意向

字段与门户意向一致：`id`、`intentNo`、`status`、`storeId`、`storeName`、`checkIn`、`checkOut`、`nights`、`guests`、`contactName`、`contactPhone`、`userRemark`、`createdAt`。

`contactName` 明文。`contactPhone` 以后端已脱敏的值原样展示；若响应里仍是 11 位数字，页面再遮成中间四位。没有改状态、写备注或查看完整号码的接口和按钮。跨主体 404。

状态文案：

| 码 | 文案 | Tag |
|----|------|-----|
| `PENDING` | 待跟进 | warning |
| `CONFIRMED` | 已确认 | primary |
| `RESCHEDULED` | 已改期 | warning |
| `CHECKED_IN` | 已入住 | success |
| `CLOSED` | 已关闭 | 中性 |

### 错误与空态

| 情况 | 呈现 |
|------|------|
| 401 | 清 `nj_merchant_token` 与 `nj_merchant_profile`，到 `/login?redirect=` |
| 403 停用 | 「账号已停用，请联系运营」 |
| 403 其他 | 接口 `message`，例如无权查看 |
| 404 | 不存在或不是本主体 |
| 409 | 门店版本冲突，或同店已有待审上下架申请 |
| 400 | 接口 `message`。保存门店时不应再由推荐字段触发 |
| 网络失败 | 「网络异常，请稍后重试」 |
| 门店空 | 「暂无门店，请联系运营代为开通」 |
| 意向空 | 「暂无意向」 |
| 申请记录空 | 「暂无上下架申请记录」，申请表单仍在 |

`VITE_USE_MOCK=true` 只打警告，不注入门店或意向。

## ③ 改动点

| # | 改动 |
|---|------|
| 1 | 六个路由从壳视图换成业务页；删除商家 `ShellView` |
| 2 | 登录写入 `nj_merchant_token`，会话资料只来自登录响应 |
| 3 | 门店列表、编辑、上下架申请接 BE-5 路径 |
| 4 | PUT 白名单去掉 `regionName`、`packages`、`testTag`，以及 `homeRecommended` / `homeSort` / `shelfStatus` |
| 5 | 意向列表和详情只读，终态显示「已入住」 |
| 6 | 停用文案识别「商家已停用」和「账号已停用」 |
| 7 | 更新 `docs/FRONTEND.md`、README，并新增本文 |

未改门户和运营业务页，也未打开业务 mock。

## ④ 影响点

| 对象 | 影响 |
|------|------|
| 后端 | 联调依赖 nongjiale-api PR #4。CORS 已放行 `http://localhost:43125`。商家令牌不能调用门户或运营接口 |
| 门店编辑 | 多传 `homeRecommended`、`homeSort`、`shelfStatus` 会 400。版本不一致是 409，跨主体是 404 |
| 地区 | 接口没有 `regionName`。页面只编辑 `regionId` |
| 意向 | 没有写接口。手机号不要在前端还原成完整号码 |
| 登录 | 不要请求 `/api/merchant/auth/me`。停用文案是「商家已停用」或「账号已停用」 |
| 运营端 | 仍是路由壳。首页推荐和直接上下架仍在运营端 |
| 产品 | 无新建门店、无支付、无锁房。意向由平台客服跟进 |
| 测试 | `pnpm test` 不依赖 8080。单测锁定 PUT 字段、停用文案、分页形状和只读约束 |

## 路由与 API 对照

| 方法 | 路径 | 商家用途 |
|------|------|----------|
| POST | `/api/merchant/auth/login` | 登录。403 停用 |
| GET | `/api/merchant/stores` | 本主体门店分页，含下架 |
| GET | `/api/merchant/stores/{id}` | 门店详情。跨主体 404 |
| PUT | `/api/merchant/stores/{id}` | 资料 + `version`。不改推荐字段和上架状态 |
| GET | `/api/merchant/shelf-applications` | 申请状态。查询可带 `storeId`、`page`、`pageSize` |
| POST | `/api/merchant/stores/{id}/shelf-applications` | 申请上架或下架。已有 `PENDING` 则 409 |
| GET | `/api/merchant/intents` | 本店意向分页，只读 |
| GET | `/api/merchant/intents/{id}` | 意向详情，只读。跨主体 404 |

明确没有：创建门店、`GET /api/merchant/auth/me`、写意向、查看完整手机、修改首页推荐。

## 相对规划壳已改掉的差异

规划壳曾把地区名称、套餐数组和测试标注算进门店，并把 PUT 写成可带 `regionName`。BE-5 PR #4 的实际 DTO 不是这样。当前实现已按下列差异校正：

| 规划壳 | PR #4 实际 | 前端 |
|--------|------------|------|
| 可选 `GET /api/merchant/auth/me` | 没有这个接口 | 只用登录响应 |
| 门店含 `regionName`、`packages[]`、`testTag` | 没有这些字段 | 不读取、不展示、不提交 |
| 门店未单列 `merchantOrgId` | 有 `merchantOrgId` | 详情只读展示 |
| PUT 可能带推荐字段并由后端忽略 | 带上则 **400** | body 键只保留白名单 |
| 停用文案只写「账号已停用…」 | 「商家已停用」或「账号已停用」 | 两种都识别，页面仍用「账号已停用，请联系运营」 |
| 上下架记录字段不完整 | 含 `storeName`、`merchantOrgId`、`rejectReason` | 按该形状读取 |
| 意向字段用了别名 | 与门户意向字段相同，手机已脱敏 | 只读这些字段 |

若 PR #4 在合入前再改字段名，以该 PR 的 DTO 为准，并回头改 `apps/merchant/src/api/readers.ts` 的白名单。不要用假数据把差异盖住。

本地查看商家端：

```bash
pnpm install
pnpm dev:merchant
```

开发地址是 http://localhost:43125 。接口默认 http://localhost:8080 。
