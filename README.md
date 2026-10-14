# 农家乐 Web（门户 + 管理后台）

pnpm monorepo：`apps/portal`（游客门户）+ `apps/admin`（运营/客服）+ `packages/shared`（类型）。

对接同机后端：`http://localhost:8080`（见 `nongjiale-api`）。

## 要求

- Node ≥ 18
- pnpm 10（仓库已声明 `packageManager`）

## 安装

```bash
cd /workspace/nongjiale-web
pnpm install
```

## 环境变量

门户 `apps/portal/.env`、后台 `apps/admin/.env` 默认：

```
VITE_API_BASE=http://localhost:8080
VITE_USE_MOCK=false
VITE_CONTACT_PHONE=13651814168   # 仅门户；成功页优先用 /api/config/public
```

## 开发

先启动后端（8080），再：

```bash
# 门户 http://localhost:43123
pnpm dev:portal
# 或
pnpm --filter portal dev

# 后台 http://localhost:43124
pnpm dev:admin
# 或
pnpm --filter admin dev
```

CORS 已放行 `43123` / `43124`。

## 演示账号

| 端 | 账号 | 密码 |
|----|------|------|
| 门户游客 | `13800000001` | `password` |
| 运营 OPERATOR | `operator` | `password` |
| 客服 AGENT | `agent` | `password` |

## 门户主流程（冒烟）

1. 打开 http://localhost:43123 ，登录 `13800000001` / `password`
2. 首页或搜索进入上架房源详情（如 id=1）
3. 「提交预订意向」→ 填日期/人数/联系人 → 提交
4. 成功页展示 **意向 ID** 与客服电话 **13651814168**

无「我的订单」、无支付。

## 文档

- [docs/FRONTEND.md](docs/FRONTEND.md) — 路由、API 约定、字段说明
- 后端契约：`/workspace/nongjiale-api/docs/API.md`

## 冒烟脚本（可选）

门户与后台需已在 43123 / 43124 运行：

```bash
node scripts/smoke-portal.mjs   # 登录→详情→预订→成功页
node scripts/smoke-admin.mjs    # operator 登录→意向列表
```

依赖根目录 `puppeteer-core` + 本机 Chrome。
