# 农家乐 Web（门户 + 管理后台 + 商家中心）

pnpm monorepo：`apps/portal`（游客门户）+ `apps/admin`（运营/客服）+ `apps/merchant`（商家）+ `packages/shared`（类型）。

对接同机后端：`http://localhost:8080`。v1.1 商家增量以 API 契约为准；后端多数新接口尚未实现时，页面走真实 `fetch`，失败显示错误或空态，不使用 mock，也不编造支付结果。

## 要求

- Node ≥ 18
- pnpm 10（仓库已声明 `packageManager`）

## 安装

```bash
pnpm install
```

## 环境变量

三端 `.env` 默认：

```
VITE_API_BASE=http://localhost:8080
VITE_USE_MOCK=false
```

门户另有 `VITE_CONTACT_PHONE=13651814168`，仅在公开配置没有电话时作成功页回退。

## 开发

先启动后端（8080），再：

```bash
# 门户 http://localhost:43123
pnpm dev:portal

# 后台 http://localhost:43124
pnpm dev:admin

# 商家中心 http://localhost:43125
pnpm dev:merchant
```

CORS：当前后端已放行 `43123` / `43124`。商家端本地端口是 **43125**（契约也建议放行 `5175` / `43125`）。在后端把该源加入 `nongjiale.cors-allowed-origins` 之前，浏览器会报跨域，页面显示请求失败。

## 演示账号

| 端 | 账号 | 密码 |
|----|------|------|
| 门户游客 | `13800000001` | `password` |
| 运营 OPERATOR | `operator` | `password` |
| 客服 AGENT | `agent` | `password` |
| 商家 | 实现后种子 | 实现后种子 |

商家 A/B 账号不在本仓库预置。等后端 v1.1 写入种子后再登录商家中心。登录名是手机号，不是运营用户名。

## 门户主流程（冒烟）

1. 打开 http://localhost:43123 ，登录 `13800000001` / `password`
2. 首页或搜索进入上架房源详情（如 id=1）
3. 「提交预订意向」→ 填日期/人数/联系人 → 提交
4. 成功页展示 **意向单号** 与客服电话 **13651814168**

无支付收银台。我的意向、攻略、商家入驻在后端 v1.1 实现前会显示接口错误或空态。

## 文档

- [docs/FRONTEND.md](docs/FRONTEND.md) — 三端路由、接口映射、token 隔离、403/422
- 后端契约：`nongjiale-api` 的 `docs/API.md`（v1.1 商家增量）

## 冒烟脚本（可选）

门户与后台需已在 43123 / 43124 运行：

```bash
node scripts/smoke-portal.mjs   # 登录→详情→预订→成功页
node scripts/smoke-admin.mjs    # operator 登录→意向列表
```

依赖根目录 `puppeteer-core` + 本机 Chrome。
