# 前端技术设计 · MVP-1.5 广告位

| 项 | 内容 |
|----|------|
| 状态 | 契约已锁死。产品门禁 PASS，老板终验已通过。业务代码另 PR，不写在本修订 |
| 日期 | 2026-10-18 |
| 角色 | 前端 |
| 读者 | 项目经理 / 产品 / 后端 / 测试 |
| 范围 | 只覆盖门户首页 Banner 与运营配置。商家无新页 |
| 本稿边界 | **本修订只锁 §2.4，不改 `apps/`、`packages/`。** 不在本仓复制产品/设计/页面/门禁/后端 TECH 原文 |

对齐权威在 **nongjiale-api** 仓，本仓不另存副本。交互与页面规格仍以 [nongjiale-api#21](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/21) 为准（#20 已作为重复关闭，不再引用）。产品 UI 门禁仍是 [nongjiale-api#19](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/19)。**接口契约只以 [nongjiale-api#22](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/22) 的 `docs/TECH-DESIGN-MVP-1.5-广告位.md` 为准**，锁进下面的 §2.4。路径、动词、字段、公开 `data` 形状不再沿用原草案，也不另写第二套。

| api 仓路径 | 出处 | 本设计怎么用 |
|------------|------|----------------|
| `docs/PRODUCT-MVP-1.5-广告位-范围.md` | 产品范围 | 老板 A★：仅运营、仅首页 Banner、可配、可按市、无支付无统计。验收 C-Ad1～C-Ad5 |
| `docs/DESIGN-MVP-1.5-广告位.md` | [#21](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/21) | 交互与硬锁。排序越小越前；0 隐藏 / 1 静帧 / ≥2 轮播 |
| `docs/UI-PAGES-MVP-1.5-广告位.md` | [#21](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/21) | A-BANNER、A-BANNER-EDIT、P-HOME 增量的信息结构、六态、文案 |
| `docs/GATE-UI-MVP-1.5-广告位-产品.md` | [#19](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/19) | 产品 UI 门禁 **PASS**。老板设计终验按项目经理口径已通过 |
| `docs/TECH-DESIGN-MVP-1.5-广告位.md` | [#22](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/22) | **契约源。** 启停动词、公开 `data` 形状、`sortOrder`、分页与 409 以 §2.4 为准 |

页面规格以 api 仓上述路径和 #21 为准。下面只写前端怎么接现有工程，不重复贴全文。

---

## ① 概要设计

### 1.1 一次结果

运营在后台维护首页 Banner（图、链接、启停、排序、全站或指定已开通市）。游客打开门户首页时，在顶栏之下、搜索和目的地之上看到启用且投放范围合法的条目，并可跳转。没有合法条目时，首页其余模块与现在一样。全站仍然没有支付、买位、曝光或点击看板。

商家端不增加页面，也不增加导航。

### 1.2 端与页面

运营是独立应用（http://localhost:43124），路由与现有 `/guides`、`/cities` 同级，**不再套 `/admin` 前缀**。UI 文档里的 `/admin/banners` 是「运营站」写法；落到 `apps/admin` 时去掉这层前缀。绝对地址是 `http://localhost:43124/banners`。

| 页面 ID | 应用 | 应用内路径 | 鉴权 | 说明 |
|---------|------|------------|------|------|
| P-HOME | `apps/portal` | `/`（已有，不新开路由） | 公开 | 只在现有首页加 Banner 区 |
| A-BANNER | `apps/admin` | `/banners` | 运营登录 | 列表、行内启停、删除 |
| A-BANNER-EDIT | `apps/admin` | `/banners/new`、`/banners/:id` | 运营登录 | 新建与编辑 |

`/banners/new` 必须是独立静态路由，不要收成现有攻略那种 `/guides/:id?`。否则 `new` 会被当成编号。

侧栏新增一项，文案用 **「广告位」**。列表页标题用 **「Banner 管理」**。两项都来自设计稿，导航取短的，页头取页面规格里的标题。建议放在「攻略」和「开城/目的地」之间，仍是 `navItems` 里的一条平级菜单，不新做分组。

商家 `apps/merchant` 的导航保持「门店」「本店意向」。不出现「广告位」「买位」「推广竞价」。

### 1.3 沿用的工程，不新起一套

| 能力 | 现成位置 | 广告位怎么用 |
|------|----------|----------------|
| Vue 3 `<script setup>`、路由、Pinia、Vite | 三端已是这个栈 | 不换框架，不加轮播库，门户不加 Element Plus |
| HTTP | `packages/shared` 的 `createHttpClient`；门户与运营各自的 `api/client.ts` | 仍走 `{ code, message, data }`，`code === 0` 成功。运营带 `nj_admin_token` |
| 运营守卫 | `apps/admin/src/router/guard.ts` 的 `requiresAuth` | Banner 两页挂同一守卫。未登录去 `/login?redirect=` |
| 运营列表手感 | 攻略列表：骨架、空态、`ElMessage`、删除确认 | 密度对齐，不复制攻略的可选 id 路由 |
| 开城 | 运营 `fetchCities`、`CitySummary.openStatus`、`openStatusLabel`、`filterCities` | 表单里只有 `OPEN` 能当新的指定市 |
| 门户目的地 | `fetchRegions`、`destinationRegions` | **只服务 Chip。** Banner 请求和展示集都不读当前 Chip / `regionId` |
| 主色 | `packages/shared` 的 `DEFAULT_BRAND`，以及三端 `--color-brand` | 保持 `#4BA3D9`。指示点用现有 brand token |
| 意向文案 | `INTENT_STATUS_LABEL.CHECKED_IN` | 保持「已入住」。本包不改状态机、不改这个字符串 |

图片本包没有上传接口。攻略封面和房源封面都是 URL 字符串（`coverUrl`）。广告位只保存 http(s) 图片 URL，不复用草案里的 `POST /api/admin/uploads`，也不复用 `coverUrl` 这个字段名。

Banner 列表不进 Pinia。和攻略一样放在页面里。不放进 `site` store。

### 1.4 展示集（写死）

门户首页只渲染 `GET /api/home/banners` 返回的数组。该接口已经只给出启用项，指定市也只含仍为 OPEN 的投放。公开元素没有 `cityOpen`。前端**不再自造**一套「看见 CLOSED 就丢掉」的展示集规则，避免和已经滤好的数组打架。

排序用 `sortOrder` 升序（数字越小越靠前）；同序按 `id` 升序。接口已按此固定 ASC。前端若稳定重排，方向与这条相同，不另起 `sort` 字段或排序参数。

- `scope === ALL` 忽略目的地 Chip，也不读取首页上的 `regionId`。这类条目的 `cityId`、`citySlug`、`cityName` 都是 null
- `scope === CITY` 信任公开数组，不按 Chip、不按 `regionId`、也不再拿地区接口对编号做二次剔除
- 公开元素的 `enabled` 恒为 true。若异常带回 false，该条不渲染。这只处理启用位，不是开城规则

条数：

| 条数 | 表现 |
|------|------|
| 0 | 不挂载 Banner 区，不留空槽，不写「暂无广告」 |
| 1 | 静帧。整图可点。无指示点、无自动切换 |
| ≥2 | 约 5 秒自动下一张，可手动（箭头或触滑、指示点、键盘左右）。悬停、聚焦、或 `prefers-reduced-motion: reduce` 时暂停自动播放；减少动效时仍可手动切，不锁死在第一张 |

位置：`SiteHeader` 仍在 `App.vue`。Banner 是 `HomeView` 里搜索表单和「苏中目的地」之前的第一块。

点击：以 `/` 开头且不是 `//` 的站内路径，同标签页走路由。`http://` 与 `https://` 新标签页，并带 `noopener noreferrer`。

门户拉取 Banner 失败（网络、非 0、HTTP 错误）：**静默不渲染该区**，搜索、目的地、推荐、攻略照常。不要把失败写进首页 feed 的错误态。

### 1.5 硬锁

- 无支付、定金、钱包、收银台、买位、竞价、合同售卖的路由、按钮、字段或文案
- 无曝光、点击、计费页面
- 不改意向状态机。`CHECKED_IN` 对客和运营仍只显示「已入住」（已、入、住三字）。不用「已订立」「已落实」「已落地」「已成交」「已达成」
- 不把田园绿 `#2F6B4F` 当作品牌色
- `CLOSED` 市不能作为新建或保存时的有效指定市
- 列表、详情、商家端、运营工作台内容区都不插广告

### 1.6 本稿明确不做

不写业务组件，不改路由表，不改接口封装，不新增依赖，不把 api 仓的四份文档拷进本仓。

---

## ② 详细设计

### 2.1 门户 P-HOME

首页今天的结构是：顶栏（`SiteHeader`）→ 欢迎语和搜索 → 目的地 Chip → 推荐 → 攻略。Banner 插在顶栏和搜索之间，只改首页这一页的内容顺序，不新路由。

建议落点（实现阶段再动文件，此处只定职责）：

| 职责 | 建议位置 | 行为 |
|------|----------|------|
| 展示 | `apps/portal/src/components/HomeBanner.vue` | 只负责 0/1/≥2 三种表现和点击。不请求接口 |
| 纯函数 | `apps/portal/src/domain/banners.ts` | 展示集过滤、排序、链接分类。用 Vitest，不测像素 |
| 读取 | 门户 `api/readers.ts` 增加 Banner 读取 | 只认 §2.4 字段。公开 `data` 是数组，不是 `{ items }`。单条缺必填字段则跳过，不抛到整页 |
| 请求 | 门户 `api/portal.ts` 增加公开列表函数 | `GET /api/home/banners`，无城市 query。与 `fetchHomeFeed`、`fetchRegions` 分开调用 |
| 装配 | `HomeView.vue` | Banner 的加载状态不复用推荐区那份 `useLoadState` |

加载：请求未完成时可以不占位（优先避免失败后留下空洞）。不要用长时间骨架把搜索顶下去。0 条和失败都是「不渲染」。

单张图片加载失败时，该帧用浅色占位，`alt` 仍在，链接仍可点。不要因为一张图失败就卸掉整个轮播。

`alt`：有运营标题用标题，否则「活动宣传」。默认不做「活动」Caption，也不做「广告 / 赞助」角标。

比例：设计允许 16:9 或 2.5:1。前端选定 **2.5:1** 横幅（`aspect-ratio`），宽屏窄屏都满内容宽，少把搜索顶出首屏。不引入裁切库。

轮播可达性：

- 自动播放周期 5000ms。手动切换后重新计时
- 指针进入、焦点进入区域时暂停
- `prefers-reduced-motion: reduce` 时不要自动播
- 指示点当前帧用 `--color-brand`（`#4BA3D9`）
- 上一张 / 下一张有可访问名称。不要用会每 5 秒播报的强 live region
- 窄屏以触滑为主，指示点保留

链接分类（与运营守卫里「只接受站内路径」同一口径，但广告位允许外链）：

| 形态 | 行为 |
|------|------|
| 单个 `/` 开头，不是 `//`，不含反斜杠 | 同标签页。用路由跳转，保留门户会话。query 和 hash 原样保留，前端不改写成别的参数 |
| `http://` 或 `https://` | `<a target="_blank" rel="noopener noreferrer">` |
| 其他（`javascript:`、`data:`、缺协议等） | 表单阶段就拒绝保存。若接口仍返回这种值：图可以留着，**不要**把它写成可执行链接 |

现门户列表的筛选参数是 `regionId` 和 `tag`，不是 `city=`。运营填写的站内链接按原样跳。配置说明可以提示真实路径，例如 `/listings?regionId=` 或 `/guides/`，但前端不代写、不纠错到 200。

和目的地 Chip 的边界：

- Chip 继续只用 `destinationRegions`：市级 `level` 为 `CITY`（兼容数字 2），`openStatus === CLOSED` 的市（如南通）不进 Chip
- Banner **不**调用 `destinationRegions`，也不用它决定全站或指定市条目是否可见
- 首页没有「当前选中市」的全局状态。即使用户从带 `regionId` 的地址回到 `/`，Banner 请求仍不带城市参数，展示也不按这个参数过滤
- 指定市是否 OPEN、未启用项是否出现，由公开接口过滤。前端不根据地区列表或自造的 `cityOpenStatus` 再剔一遍

门户 `http` 客户端在 401 时会清 `nj_portal_token`。公开 Banner 若被做成 401，会把正在看首页的游客登出。契约要求这条公开接口匿名 **200**（没有条目时 `data` 为 `[]`），不要 401。实现时 Banner 失败不得把首页导航到 `/login`。

### 2.2 运营 A-BANNER

登录与 401 沿用运营守卫和 `describeAdminError`。停用账号沿用现有「账号已停用」离开逻辑。403 用现有「无权访问」，不新做一套角色页。一期客服若与运营同端登录，不单独拆导航；接口若对非运营返回 403，页面展示该错误即可。

列表由服务端固定按 `sortOrder` 升序，前端不传排序参数，也不把列名写成 `sort`。列：缩略图（约 120×48 或 16:9，失败用占位）、标题或截断后的链接、范围 Tag、启用 Tag、排序（`sortOrder`）、操作。

| 范围 | Tag |
|------|-----|
| ALL | 「全站」。Brand soft 底 + Brand 字。`cityOpen` 为 null |
| CITY 且 `cityOpen === true` | 市名，如「扬州」 |
| CITY 且 `cityOpen === false` | 市名，旁注「市已关闭·不对客」。公开首页数组不会包含这条；运营列表仍展示 |

启用 Tag：`success`「启用」；停用用中性 Tag「停用」（与开城列表里未开通的弱化 Tag 同一视觉，不要用新的绿色）。

操作与文案：

| 操作 | 反馈 |
|------|------|
| 新建 | 进入 `/banners/new` |
| 编辑 | 进入 `/banners/:id` |
| 启用 | `POST /api/admin/banners/{id}/enable`，无 body。成功 Toast「已启用」，Tag 改为启用。门户在下次打开或刷新首页时生效，不做长连接。CITY 且市不是 OPEN 时接口 **409**，开关保持停用，页上说明「投放市未开通，请改选全站或其他已开通市」 |
| 停用 | `POST /api/admin/banners/{id}/disable`，无 body。成功 Toast「已停用，首页将不再展示」。两条启停都幂等 |
| 删除 | 确认框「删除后不可恢复，确认删除该 Banner？」确认后 Toast「已删除」，行消失 |
| 列表失败 | 「列表加载失败，请重试」 |
| 空列表 | 「暂无 Banner，点击新建投放」，并给出新建按钮 |

页头说明保留页面规格这一句：「仅影响门户首页 Banner；数字越小越靠前。全站投放与游客所选目的地无关。」

筛选走列表 query，不在前端把全量捞回再滤：`enabled`、`scope`、`keyword` 都可选。响应是与攻略相同的 `PageResult`：`{ items, total, page, pageSize }`。分页 query 用现有运营列表的 `page`、`pageSize`，不另起 `pageNum` / `limit`。不为此新增统计接口。

窄屏：表可横滑，或改成缩略图 + 摘要 + 两个 Tag + 操作。与现有后台表在窄屏的处理同一等级即可。

### 2.3 运营 A-BANNER-EDIT

页头：「新建 Banner」或「编辑 Banner」，另有返回列表。编辑态先拉详情；无此 id 或加载失败时显示「加载失败，请重试」，不要把缺 id 画成空表。

| 字段 | 控件 | 规则 |
|------|------|------|
| 图片 | URL 输入。本包无上传控件 | 必填 http(s)。未填：「请填写图片地址」。禁止把 `blob:` 或相对地址存进去 |
| 链接 | 单行 | 必填。站内 `/` 或 `http(s)://`。旁注「外链将在新标签页打开」。未填：「请填写跳转链接」 |
| 投放范围 | 全站 / 指定市 | 必选，对应 `scope` 的 `ALL` / `CITY`。切到全站时清掉已选市。说明：「全站：所有游客首页可见，与目的地选择无关。指定市：仅该市为开通状态时展示。」 |
| 指定市 | 下拉，仅范围=指定市时出现 | 选项来自 `fetchCities`。只有 `openStatus === OPEN` 可选，写入字段是 `cityId`。`CLOSED` 不出现，或禁用并提示「该市未开通，不能作为投放目标」。未选：「请选择已开通的市」 |
| 排序 | 数字 | 字段名 `sortOrder`。非负整数。新建预填 `100`（接口空值默认也是 100）。旁注「数字越小越靠前」。非法：「请输入整数排序值」 |
| 启用 | 开关 | 新建默认开（接口空值默认 true）。`PUT` 全量时 `enabled` 必填 |

历史数据若指向后来被关闭的市：编辑页显示市名和「市已关闭·不对客」，保存前必须改成全站或另一个 OPEN 市。前端先拦住。行内启用若打到非 OPEN 的指定市，接口对 `POST /{id}/enable` 返回 409，页级错误用「投放市未开通，请改选全站或其他已开通市」。

保存：主按钮，提交中防重复。新建走 `POST /api/admin/banners`，编辑走 `PUT /api/admin/banners/{id}` 全量。成功 Toast「已保存」，回到列表。取消回列表；有未保存修改时可以再问一句，没有修改则直接回。不探测链接是否返回 200。

本包契约没有上传接口。图片只有 URL。保存时必须是 http(s) URL。

表单和帮助里不出现买位、竞价、曝光计费、支付、定金、钱包。

### 2.4 契约（已锁死，源 nongjiale-api#22）

本节取代原 §2.4 草案。契约源是 [nongjiale-api#22](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/22) 的 `docs/TECH-DESIGN-MVP-1.5-广告位.md`。实现只使用下面的路径和字段，不保留 `sort`、`cityOpenStatus`、`cityCode`、`PATCH` 启停、公开 `{ items }`、或 `POST /api/admin/uploads`。响应里若多出点击量、曝光、价格、售卖字段，前端忽略，不做看板。Banner 不带 `version`。

信封与现网一致：`{ code, message, data }`，成功 `code === 0`。运营请求 `Authorization: Bearer <nj_admin_token>`，复用现有 admin client。基址 `VITE_API_BASE`，默认 `http://localhost:8080`。

`scope` 只有 `ALL` | `CITY`。市标识只有 `cityId`（对应运营开城 `CitySummary.id`）。展示用接口带回的 `cityName`，辅以 `citySlug`。门户地区 `RegionItem.id` 不拿来和 `cityId` 对表，前端不做 slug 拼接。

**公开（匿名，门户首页）**

| 项 | 锁死 |
|----|------|
| 方法 | `GET /api/home/banners` |
| 鉴权 | 无登录 |
| 查询 | 无。不要加城市或「当前目的地」，否则全站条目会被 Chip 误伤 |
| 成功 | `data` **就是数组**，不是分页对象，也不是 `{ items }`。0 条为 `[]`，HTTP 200。顺序为 `sortOrder` 升序，同序按 `id` |
| 失败 | 不要用 401。前端对任何失败都隐藏 Banner 区，不挡搜索和意向 |

数组元素：

| 字段 | 约束 |
|------|------|
| `id` | 主键 |
| `title` | 字符串或 null |
| `imageUrl` | http(s) 图片地址 |
| `linkUrl` | 站内路径或 http(s) |
| `scope` | `ALL` 或 `CITY` |
| `cityId` / `citySlug` / `cityName` | `ALL` 时三者都是 null。`CITY` 时带该市 |
| `sortOrder` | 数值，越小越靠前 |
| `enabled` | 恒为 true |

公开数组已经排除未启用项，也已经排除非 OPEN 的指定市。前端不按 `cityOpen`（公开元素没有这个字段）或地区接口再滤一遍。

**运营（仅运营令牌）**

基础路径 `/api/admin/banners`。

| 动作 | 方法 | 说明 |
|------|------|------|
| 列表 | `GET /api/admin/banners` | `data` 为 `PageResult`：`{ items, total, page, pageSize }`。含停用、含 `cityOpen === false` 的历史定向。排序固定 ASC，不接受客户端排序参数。可选 query：`enabled`、`scope`、`keyword`。分页 query 用 `page`、`pageSize` |
| 详情 | `GET /api/admin/banners/{id}` | 编辑页。字段见下表 |
| 新建 | `POST /api/admin/banners` | `imageUrl`、`linkUrl`、`scope` 必填。`title` 可空。`sortOrder` 可空，默认 100。`enabled` 可空，默认 true。`scope=CITY` 时 `cityId` 必填；`ALL` 时不带市 |
| 更新 | `PUT /api/admin/banners/{id}` | 全量保存。字段与创建相同，且 **`enabled` 必填** |
| 启用 | `POST /api/admin/banners/{id}/enable` | 无 body。幂等。目标是 CITY 且该市不是 OPEN 时 **409** |
| 停用 | `POST /api/admin/banners/{id}/disable` | 无 body。幂等 |
| 删除 | `DELETE /api/admin/banners/{id}` | 成功时 `data` 为 `{ id }` |

详情 / 列表元素字段：`id`、`title`（可 null）、`imageUrl`、`linkUrl`、`scope`、`cityId`、`citySlug`、`cityName`、`cityOpen`（`ALL` 时为 null，`CITY` 时为布尔）、`sortOrder`、`enabled`、`createdAt`、`updatedAt`。

`imageUrl` 是 http(s) 字符串，不是二进制。行内启停用上面的 POST 动词，不把图片放进启停 body，也不用 `PATCH`。

没有上传接口。表单只提交图片 URL。不要在前端假造上传成功。

### 2.5 组件与路由对照

| UI 块 | 前端职责 | 不做什么 |
|-------|----------|----------|
| P-HOME Banner 区 | 首页内组件 + 公开 GET | 不新路由；不改顶栏链接；不改推荐 feed |
| A-BANNER | 列表视图 + `/banners` + 侧栏「广告位」 | 不做成攻略可选参数路由 |
| A-BANNER-EDIT | 新建、编辑两个路由共用一个表单视图 | 不在商家端做只读副本 |
| 商家 | 无 | 不改 `apps/merchant/src/router/nav.ts` 的条目 |

运营路由 `meta` 沿用现有写法：`requiresAuth: true`，`pageId` 分别为 `A-BANNER`、`A-BANNER-EDIT`，标题用「Banner 管理」「新建 Banner」「编辑 Banner」。

### 2.6 验收在前端怎么测

实现阶段补测试，不在本设计 PR 里写测试代码。

| ID | 前端可观察结果 | 建议自动化 |
|----|----------------|------------|
| C-Ad1 | 启用 + 全站 + 图 + 链接保存后，首页能看见并能按内外链规则点开 | 链接分类单测；路由与表单校验单测。点选走联调或冒烟 |
| C-Ad2 | 停用后刷新首页，该条不在公开数组里 | 读取时若遇见 `enabled === false` 则丢弃。公开契约下该字段恒为 true，不把这写成开城过滤 |
| C-Ad3 | 两条不同 `sortOrder`，首页顺序与升序一致，轮播从最小 `sortOrder` 开始 | 排序单测，同序比 id |
| C-Ad4 | 扬州 OPEN 定向会出现在公开数组；南通 CLOSED 定向由服务端排除，前端不二次制造展示集。编辑页不能把 CLOSED 市存成有效目标。列表 `cityOpen === false` 提示「市已关闭·不对客」 | 市选项过滤（只留 `OPEN`）；启用 409 的错误文案。不写与接口对打的 CLOSED 剔除函数 |
| C-Ad5 | 门户首页、运营广告页、商家导航没有支付/买位文案和入口；商家导航仍只有现有两项；「已入住」字符串与意向迁移表无 diff | 商家 `navItems` 断言；本包不改 `INTENT_STATUS_LABEL` |

另外：全站条目不因地区数据里有 CLOSED 南通而被前端丢掉。Banner 请求函数不接收 `regionId`。

### 2.7 实现顺序（终验通过之后）

1. 后端 TECH 已收口：§2.4 = nongjiale-api#22。实现不再等待草案确认
2. 门户纯函数与首页 Banner 区（失败隐藏、0/1/≥2）
3. 运营列表、`POST` 启停、删除、表单（只填图片 URL；无上传）
4. 路由与侧栏；商家导航无改动，用测试锁住
5. 按 C-Ad1～C-Ad5 做联调。不测像素

---

## ③ 改动点

### 3.1 设计入库（web#11，已合）

| # | 改动 |
|---|------|
| 1 | 新增本文件 `docs/FE-TECH-DESIGN-MVP-1.5-广告位.md` |
| 2 | `README.md` 增加一行，指向上述设计 |
| 3 | 不把 `PRODUCT` / `DESIGN` / `UI-PAGES` / `GATE-UI` / 后端 TECH 拷进本仓。权威文本留在 nongjiale-api：设计与页面见 #21；UI 门禁见 #19；契约见 #22 |

### 3.1a 本修订（只锁契约）

| # | 改动 |
|---|------|
| 1 | §2.4 从草案改为 api#22 锁死契约 |
| 2 | 正文里与草案冲突的启停动词、`sortOrder`、公开 `data` 数组、分页和 CLOSED 展示边界改成与 §2.4 一致 |
| 3 | `README.md` 那一行改为注明契约源是 nongjiale-api#22 |

无 `apps/` 与 `packages/` diff。不向已合的 web#11 追加提交。

### 3.2 终验通过后的实现改动（本修订不做）

| # | 改动 | 位置 |
|---|------|------|
| 1 | 首页 Banner 区，位于顶栏下、搜索和目的地上 | `apps/portal` 首页与一个展示组件 |
| 2 | 展示集、排序、链接分类的纯函数与单测 | `apps/portal` 的 domain / api |
| 3 | 公开 Banner 读取。失败不进入首页主错误 | 门户 api |
| 4 | 运营路由 `/banners`、`/banners/new`、`/banners/:id` | `apps/admin` 路由。不增加 `/admin` 前缀 |
| 5 | 侧栏「广告位」 | 运营 `navItems` |
| 6 | 列表与编辑视图；文案按 §2.2、§2.3 | `apps/admin` views。Element Plus |
| 7 | 路径常量与 list/detail/create/put/enable/disable/delete | 运营 `api/paths.ts` 与现有 `http.request`。启停是无 body 的 POST，不是 PATCH |
| 8 | 指定市下拉复用开城列表，仅 `OPEN` 可写入 `cityId` | 已有 `fetchCities` |
| 9 | 本包不启用上传。表单只有图片 URL | 不新增 npm 包，不调用不存在的上传路径 |
| 10 | 路由单测覆盖匿名跳登录、运营可打开列表和新建 | 扩展现有 admin `routes.test` |
| 11 | 商家导航测试锁住：无广告位入口 | 不新增商家页面 |

明确不改：意向状态与「已入住」文案、开城 checklist、种子看板、站点配置主色、商家路由、门户列表/详情/攻略、支付相关空缺（继续保持没有）。

---

## ④ 影响点

| 对象 | 影响 |
|------|------|
| 后端 | 契约已由 api#22 收口，前端只按 §2.4 调用：公开 `data` 为数组；运营列表为分页；启停为 `POST /enable` 与 `POST /disable`；CITY 非 OPEN 时 enable 为 409。无支付、无统计字段、无上传、无 `version`。CORS 仍是 43123/43124/43125，不新开端口 |
| 门户 | 只有首页多一块条件渲染。feed、地区、意向、登录态在 Banner 失败时保持原样。全站 Banner 与 Chip 无关 |
| 运营 | 多一个导航和两个路径。守卫、令牌、错误文案、开城数据复用 |
| 商家 | 无页面、无接口、无导航。C-Ad5 巡检要看到这一点 |
| 测试 | C-Ad1～C-Ad5；另加「Banner 失败不挡住搜索」和「CLOSED 市不能保存为指定市」。不改已有「已入住」断言的期望 |
| 产品 / 设计 | UI 门禁已 PASS（api#19，`docs/GATE-UI-MVP-1.5-广告位-产品.md`）。交互以 api#21 的 `docs/DESIGN-MVP-1.5-广告位.md`、`docs/UI-PAGES-MVP-1.5-广告位.md` 为准。本仓实现时不再改轮播规则、排序方向和 Banner 位置 |
| 项目经理 | 排在开城之后、小程序之前。产品门禁 PASS，老板终验已通过。契约收口与业务实现分成两个 PR。本修订只锁 §2.4 |
| 风险 | ① 公开接口若被加上当前市过滤，会把全站 Banner 滤掉。② 0 条仍占位，会把搜索顶下去。③ 外链不用新标签页，访客离开门户。④ 前端再写一套 CLOSED 展示集，会和已经滤好的公开数组冲突。⑤ 公开接口 401 会清掉门户令牌。⑥ 把 `blob:` 或相对图片地址存库后，其他访客看不到图。⑦ 行内启停若仍用 PATCH 或重传整表，和 #22 的幂等动词不一致 |

---

## 契约决定（api#22，已锁死）

| # | 项 | 决定 |
|---|----|------|
| 1 | 路径 | `GET /api/home/banners` 与 `/api/admin/banners` |
| 2 | 市字段 | 只使用 `cityId`。另有只读 `citySlug`、`cityName`。不用 `cityCode`，不把 slug 当必填标识 |
| 3 | 门户地区 id | 不与 `cityId` 对表。公开列表已滤非 OPEN 的指定市，前端不二次剔除 |
| 4 | 分页 | 运营列表是 `PageResult`。公开 `data` 是数组，不分页 |
| 5 | `version` | 没有。PUT 不带版本 |
| 6 | 上传 | 本包不做。只填图片 URL |
| 7 | 公开 GET | 匿名 200。失败只隐藏 Banner，不得 401 清门户令牌 |
| 8 | 启停 | `POST /{id}/enable` 与 `POST /{id}/disable`，无 body，幂等。不用 PATCH |
| 9 | 排序字段 | `sortOrder`。越小越前，同序按 `id` |

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| MVP-1.5 | 2026-10-18 | 首版前端技术设计。对齐 api 仓产品范围、设计、页面规格与 UI 门禁。本仓不复制那些文件。不含业务实现 |
| MVP-1.5a | 2026-10-18 | 设计与页面规格改引 nongjiale-api#21（`docs/DESIGN-MVP-1.5-广告位.md`、`docs/UI-PAGES-MVP-1.5-广告位.md`）。#20 已关闭，不再引用。UI 门禁仍为 api#19 |
| MVP-1.5b | 2026-10-18 | §2.4 草案收口为 nongjiale-api#22 / `docs/TECH-DESIGN-MVP-1.5-广告位.md`。公开 `data` 为数组；排序字段 `sortOrder`；运营列表分页；启停为 POST enable/disable。不含业务代码 |
