# 前端技术设计 · MVP-2 微信小程序

| 项 | 内容 |
|----|------|
| 状态 | 技设待产品门禁，再交老板 TECH 终验。终验通过前不写业务码 |
| 日期 | 2026-10-18 |
| 角色 | 前端 |
| 读者 | 项目经理 / 产品 / 后端 / 测试 |
| 范围 | 游客微信小程序（W-B）。商家与运营仍用现有 Web |
| 本稿边界 | **本文件只写技术设计，不改 `apps/`、`packages/`。** 不在本仓复制产品/设计/页面/门禁/用例/测试原文 |

对齐权威在 **nongjiale-api** 仓 main，本仓不另存副本。产品范围是 [nongjiale-api#28](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/28) 的 `docs/PRODUCT-MVP-2-微信小程序-范围.md`（W-B，验收 C-MP1～C-MP8 与 C-MP2b）。用例是 [nongjiale-api#29](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/29)。交互、页面规格与产品 UI 门禁是 [nongjiale-api#30](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/30)（已合 main，设计终验通过）：`docs/DESIGN-MVP-2-微信小程序.md`、`docs/UI-PAGES-MVP-2-微信小程序.md`、`docs/GATE-UI-MVP-2-微信小程序-产品.md`。验收步骤以 api 仓 `docs/TEST-MVP-2-微信小程序.md` 为准。

已落地的门户契约继续沿用，不另写第二套字段：

| 能力 | 契约出处 | 本设计怎么用 |
|------|----------|----------------|
| 首页 Banner | [nongjiale-api#22](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/22) `docs/TECH-DESIGN-MVP-1.5-广告位.md`，本仓 [FE-TECH-DESIGN-MVP-1.5-广告位.md](FE-TECH-DESIGN-MVP-1.5-广告位.md) §2.4 | `GET /api/home/banners`，公开 `data` 为数组 |
| 门店、攻略、意向、登录信封、公开配置 | 门户已接的 BE-4 路径，见 [FE-2-PORTAL.md](FE-2-PORTAL.md) | 小程序只读/写同一组路径和字段 |
| 微信登录、C-MP2b 打通 | **后端 TECH 尚未作为本仓契约源** | 见 §2.6。路径与未打通字段名以 **后端 TECH 合入后** 为准 |

页面文案、信息结构和六态以 api#30 的 UI-PAGES 为准。下面只写前端怎么接到现有工程。

老板已定：先用**测试号 / 体验版**；正式 AppID 后补；AppID 与 Secret **可配置**。Secret 不进本仓，也不进小程序包。

---

## ① 概要设计

### 1.1 一次结果

游客用微信打开苏中农家乐小程序（先是测试号体验版），可以看首页 Banner、目的地、推荐门店和攻略，进列表和门店详情，把详情分享给微信好友并打开同一门店。提交意向、查看本人意向之前要先登录。

登录走微信。小程序账号和门户 Web 是**同一个游客用户**时，两边的意向是同一份服务端数据。尚未打通时，小程序不展示、不合并、不缓存 Web 上的意向，也不把一次 `wx.login` 说成已经同步。

没有支付、定金、锁房。没有商家小程序，没有运营小程序。商家仍用 `apps/merchant`，运营仍用 `apps/admin`。

### 1.2 端与页面

现仓是 pnpm monorepo：`apps/portal`（43123）、`apps/admin`（43124）、`apps/merchant`（43125），外加 `packages/shared`。没有小程序目录，也没有 uni-app / Taro 依赖。

小程序是第四个应用，拟新增 `apps/miniapp`，运行在微信客户端，不占用 43123–43125。页面 ID 对齐 UI-PAGES。下表是工程落点；UI-PAGES 若还有 ID，实现时按该 ID 补路由，不改接口字段。

| 页面 ID | 拟页面路径 | 鉴权 | 数据 |
|---------|------------|------|------|
| MP-HOME | `pages/home/index` | 公开 | 公开配置、Banner、地区、首页 feed |
| MP-LIST | `pages/listings/index` | 公开 | `GET /api/stores` |
| MP-DETAIL | `pages/listings/detail` | 公开 | `GET /api/stores/{id}`；可分享 |
| MP-INTENT-FORM | `pages/intent/form` | 已打通的游客令牌 | 门店详情 + `POST /api/booking-intents` |
| MP-MY-INTENTS | `pages/my/intents` | 已打通的游客令牌 | `GET /api/me/intents` |
| MP-LOGIN | `pages/login/index` | 游客 | 微信登录；未打通时用手机号+密码完成绑定 |
| MP-GUIDE-LIST | `pages/guides/index` | 公开 | `GET /api/articles` |
| MP-GUIDE-DETAIL | `pages/guides/detail` | 公开 | `GET /api/articles/{id}` |

门户另有意向成功页和意向详情（`P-INTENT-SUCCESS`、`P-MY-INTENT-DETAIL`）。UI-PAGES 若给出对应小程序 ID，实现时采用那个 ID。未单列时：提交成功进入 MP-MY-INTENTS，并展示返回的 `intentNo`；从列表进入一条只读详情，仍读 `GET /api/me/intents/{id}`。

底部 tab 以 UI-PAGES 为准。页面规格未单列 tab 时，建议只放「首页」「攻略」「我的」。列表从首页进入，不把商家、运营、入驻申请放进 tab。

### 1.3 技术栈（按仓库现状选定）

选定 **微信原生小程序**（WXML / WXSS / TypeScript），放在 `apps/miniapp`，用微信开发者工具打开该目录。不把三端改成 uni-app 或 Taro，不把门户 Vue 单文件组件搬进小程序。

原因：

- 三端已经是 Vue 3 + Vite，并且各自独立发布。小程序运行时不是浏览器
- `packages/shared` 的 `createHttpClient` 使用 `fetch` 和 `Headers`，不能在小程序里直接跑
- 本包要复用的是接口路径、字段和纯展示规则，不是门户组件
- 原生工程与现有 `pnpm build` 的三端过滤器可以分开，体验版先不进 Web 的 Vite 构建

`pnpm-workspace.yaml` 已包含 `apps/*`。实现阶段在该目录放自己的 `package.json`（建议名 `@nongjiale/miniapp`），本设计 PR 不新增这个目录。

开发方式：微信开发者工具导入 `apps/miniapp`。不增加会常驻的 `pnpm dev:miniapp` 服务。体验版上传走开发者工具或后续的 miniprogram-ci，本设计不引入上传密钥。

类型依赖 `miniprogram-api-typings` 留到实现阶段。本 PR 不改根 `package.json`，也不把小程序放进现有 `pnpm build` / `pnpm test`。

拟目录（实现阶段才创建）：

```text
apps/miniapp/
  project.config.json          # appid 可空，见 §2.2
  project.private.config.json  # 本地测试号 AppID，gitignore
  tsconfig.json
  package.json
  miniprogram/
    app.ts
    app.json
    app.wxss
    sitemap.json
    pages/                     # 上表各页
    api/                       # wx.request，信封与门户相同
    domain/                    # 无界面的校验、排序、链接分类
```

### 1.4 沿用的契约，不新起一套

| 能力 | 现成位置 | 小程序怎么用 |
|------|----------|----------------|
| 响应信封 | `{ code, message, data }`，`code === 0` 成功 | `wx.request` 用同一规则。失败读 `message` |
| 游客令牌 | 门户 `nj_portal_token`，头 `Authorization: Bearer` | 打通成功后，小程序把**同一枚门户访问令牌**放在本地键 `nj_mp_token`。这是微信存储，不是浏览器 localStorage，两边不会自动拷贝 |
| 游客资料 | `GET /api/auth/me` | 打通后预填意向手机。字段仍按门户读取：`id` 或 `userId`、`phone`、`role` |
| Banner | `GET /api/home/banners` | 无城市 query。`data` 是数组。0 隐藏 / 1 静帧 / ≥2 用原生 `swiper`，间隔 5000ms，指示点 `#4BA3D9` |
| 首页 feed | `GET /api/home/feed` | `stores`、`articles`。推荐店按 `homeSort` |
| 地区 | `GET /api/regions` | 目的地 Chip：市级 `level` 为 `CITY`（兼容数字 2）；`openStatus === CLOSED` 的市不进 Chip |
| 门店列表 | `GET /api/stores` | query 只保留门户已有项，见 §2.5 |
| 门店详情 | `GET /api/stores/{id}` | 套餐以 `packageText` 为准 |
| 攻略 | `GET /api/articles`、`GET /api/articles/{id}` | 标题、封面、摘要、正文。正文用文本，不用富文本 HTML |
| 意向 | `POST /api/booking-intents`、`GET /api/me/intents`、`GET /api/me/intents/{id}` | 请求体与门户 `CreateIntentBody` 相同，不带金额 |
| 公开配置 | `GET /api/config/public` | `siteName`、`brandColor`、`contactPhone` |
| 主色 | `DEFAULT_BRAND` = `#4BA3D9` | `app.wxss` 的 `--color-brand`。合法 `brandColor` 可覆盖；缺失时用 `#4BA3D9` |
| 意向文案 | `INTENT_STATUS_LABEL.CHECKED_IN` | 只显示「已入住」。见 §1.5 |
| 接口基址 | 门户默认 `http://localhost:8080` | 小程序配置 `apiBase`，默认同一地址。体验版真机改用已配置的 https 域名 |

Banner、门店、攻略、意向的 JSON 字段名以本节和 §2.5 为准。微信身份字段见 §2.6，未锁死前不写进业务类型。

### 1.5 硬锁

- 无支付、定金、钱包、收银台、锁房、买位的页面、按钮、字段或文案
- 无商家端、无运营端、无入驻申请页。`/merchant/apply` 只留在门户 Web
- `CHECKED_IN` 对客只显示「已入住」（入 U+5165，住 U+4F4F）。不用「已定着」「已订立」「已落实」「已落地」「已成交」「已达成」
- 品牌色用 `#4BA3D9`。不用田园绿 `#2F6B4F` 当作品牌色
- AppSecret、上传密钥、正式或测试号的 Secret 不出现在仓库、小程序包、`project.config.json` 或前端环境示例的真实值里
- 未打通时不请求「我的意向」，不在本地编造与 Web 相同的用户
- 公开接口失败不把游客送进登录页。Banner 失败只隐藏 Banner 区

### 1.6 本稿明确不做

不创建 `apps/miniapp`，不写页面，不改路由，不改接口封装，不新增依赖，不把 api 仓文档拷进本仓，不把 AppID / Secret 的真实值写入任何文件。

---

## ② 详细设计

### 2.1 请求分层

小程序自写一层 `wx.request` 客户端，成功条件与 `createHttpClient` 相同。分两条：

| 客户端 | 何时带令牌 | 401 |
|--------|------------|-----|
| 公开 | 不带 `Authorization` | 不当成登出。页面按空态或错误文案处理；Banner 直接不渲染 |
| 游客 | 仅当本地已有打通后的 `nj_mp_token` | 清掉 `nj_mp_token`，打开 MP-LOGIN，并带上来源页以便完成后返回 |

公开读：`/api/config/public`、`/api/home/banners`、`/api/home/feed`、`/api/regions`、`/api/stores`、`/api/stores/{id}`、`/api/articles`、`/api/articles/{id}`。

要令牌的写和读：`/api/auth/me`、`/api/booking-intents`、`/api/me/intents`、`/api/me/intents/{id}`，以及 §2.6 里打通之后才存在的会话。

基址来自小程序本地配置 `apiBase`，缺省 `http://localhost:8080`。开发者工具可关「校验合法域名」以便连本地。体验版真机不走 localhost，使用后端已部署且已填进微信 request 合法域名的 https 源。正式 AppID 上线前再核对这张域名表，本设计不填写生产域名。

### 2.2 AppID / Secret 配置位

| 配置 | 放哪 | 谁能看见 | 约定 |
|------|------|----------|------|
| 小程序 AppID | 开发者本机 `apps/miniapp/project.private.config.json` 的 `appid`（gitignore） | 微信公开标识，仍然不写进 git | 先填**测试号**。正式 AppID 替换这一处，页面代码不因换号而改 |
| 仓库内 `project.config.json` | 实现阶段的 `appid` 留空字符串 | 可提交 | 避免把某一套测试号写死在主分支 |
| AppSecret | **只在后端环境**，建议变量名 `WX_MINIAPP_SECRET` | 仅服务端 | 小程序用 `wx.login` 拿到 `code`，由后端用 AppID + Secret 换会话。前端没有 Secret 配置项 |
| 后端 AppID | 建议变量名 `WX_MINIAPP_APPID`，与小程序里的测试号成对 | 仅服务端 | 换正式号时与 Secret 一起换，前端不发版改 Secret |

本仓 `.env.example` 不增加 Secret。不提交 `project.private.config.json`。CI 若以后要上传体验版，上传密钥另走运维注入，不进 git。

`code` 只用于换会话，不写入 `nj_mp_token`，不当作游客 id。

### 2.3 页面行为（工程侧）

视觉和文案以 UI-PAGES 为准。这里只定数据和跳转。

**MP-HOME。** 顺序对齐门户首页的信息，具体间距以设计稿为准：Banner → 搜索 / 目的地 → 推荐门店 → 攻略摘要。Banner 规则与门户相同：

| 条数 | 表现 |
|------|------|
| 0 或请求失败 | 不占位，不写「暂无广告」 |
| 1 | 静帧，整图可点 |
| ≥2 | 原生 `swiper` 自动播放约 5 秒，可手滑，指示点用品牌色 |

Banner 不读取当前目的地，请求不带 `regionId`。`scope === ALL` 的 `cityId` / `citySlug` / `cityName` 为 null。公开元素 `enabled === false` 时丢掉该条。排序 `sortOrder` 升序，同序按 `id` 升序。前端不再按 CLOSED 市滤一遍。

链接分类与门户 `classifyBannerLink` 同一口径，落点改成小程序页：

| 形态 | 行为 |
|------|------|
| `/` 或空路径 | MP-HOME |
| `/listings` 及其 query | MP-LIST。保留 `regionId`、`tag`、`priceMin`、`priceMax`、`sort`、`page` |
| `/listings/{id}` | MP-DETAIL |
| `/listings/{id}/intent` | 已打通则 MP-INTENT-FORM，否则先 MP-LOGIN |
| `/guides` | MP-GUIDE-LIST |
| `/guides/{id}` | MP-GUIDE-DETAIL |
| `/my/intents` 及详情路径 | 已打通则对应「我的」页，否则先 MP-LOGIN |
| `/login`、`/register` | MP-LOGIN。小程序不单独做一套只在微信里生效的注册用户 |
| `/merchant/apply` 以及其他站内路径 | 不打开页面。提示「请使用网页端」，可复制门户地址 |
| `http://` 或 `https://` | 不内嵌 `web-view`（体验版未把门户整站配成业务域名，也不把运营站套进小程序）。提示「请在浏览器打开」，可复制链接 |
| 其他（`javascript:`、`data:`、缺协议） | 图可以留着，不做成可点链接 |

**MP-LIST。** query 与门户相同，不新增 `keyword`。URL 上的搜索词在没有 `tag` 时写入 `tag`。`sort` 只接受 `comprehensive`、`price_asc`、`price_desc`。`destinationStatus === CLOSED` 时只显示「该目的地暂未开通」，不渲染门店。分页参数仍是 `page`、`pageSize`（默认 20）。界面可以用触底请求下一页，把结果接在后面；这不改变契约，也不改成游标。

**MP-DETAIL。** 展示 `name`、`coverUrl`、`gallery`、`regionName`、`address`、`phone`、`priceText`（无则用 `priceFrom`）、`packageText`。`packages` 只在有数据时作辅助。对客标签保留「首页推荐」和接口给出的 `testTag`；不展示 `homeSort`、上架态运营词。410 时禁用「提交意向」，文案「房源已下架或不可用」。详情提供分享，见 §2.3 分享。

**MP-INTENT-FORM。** 字段与门户草稿相同：`checkIn`、可选 `checkOut`、可选 `nights`、`guests`、`contactName`、`contactPhone`、可选 `userRemark`。提交 JSON 为 `storeId`、`checkIn`、`guests`、`contactName`、`contactPhone`，有离店或晚数、有备注时再带上对应字段。不附金额。校验规则与门户 `validateIntent` 相同：到店不早于今天、离店晚于到店、晚数与离店一致、11 位手机、联系人必填。已登录时用 `GET /api/auth/me` 的手机预填，允许改。成功后用返回的 `id`、`intentNo`。页上保留「意向不等于已锁房」这类说明（原文以 UI-PAGES 为准）。

**MP-MY-INTENTS。** 只在已打通时请求。状态展示：

| 码 | 文案 |
|----|------|
| `PENDING` | 待跟进 |
| `CONFIRMED` | 已确认 |
| `RESCHEDULED` | 已改期 |
| `CHECKED_IN` | 已入住 |
| `CLOSED` | 已关闭 |

列表和详情没有取消、改状态或支付。他人单据按 404 显示「不存在或无权查看」。

**MP-GUIDE-LIST / MP-GUIDE-DETAIL。** 只展示接口返回的已发布内容。正文按文本渲染。关联市是否开通由接口决定，前端不另做一道城市过滤。

**分享到门店。** MP-DETAIL 实现 `onShareAppMessage`。`path` 为详情页并带门店 `id`（与 `GET /api/stores/{id}` 的 id 相同）。标题用门店 `name`。`imageUrl` 只用 https 封面；没有 https 封面时用默认分享图，不把 http 本地封面传给微信。被分享者打开的是公开详情，不继承分享者的令牌。无支付参数，无分销参数。

**MP-LOGIN。** 见 §2.4。没有「微信里注册一个和 Web 无关的新用户然后假装已同步」。

### 2.4 微信登录与 C-MP2b

C-MP2b 的产品要求：小程序与 Web **同用户**；未打通时不假装同步。身份锚点沿用门户已有的游客（手机号 + 密码注册登录的那一个用户）。小程序不维护第二份用户表，也不用 openid 代替 `GET /api/auth/me` 的用户 id。

体验版流程：

1. 游客在 MP-LOGIN 点微信登录。客户端 `wx.login` 取得 `code`。
2. 客户端把 `code` 交给 §2.6 的登录接口。请求里没有 AppSecret。
3. **已打通：** 响应里的令牌用门户同一读取顺序（字符串本身、`token`、`accessToken`、`access_token`）。写入 `nj_mp_token`，再 `GET /api/auth/me`。之后意向接口与门户 Web 打到同一用户。前端不做两份列表的本地合并。
4. **未打通：** 响应里没有上述令牌。不写 `nj_mp_token`。页面进入绑定：游客输入门户手机号和密码，与本次微信登录一起提交到 §2.6 的绑定接口。绑定成功才写入令牌并拉取 `/api/auth/me`。绑定失败保持未打通。
5. 未打通期间，首页、列表、详情、攻略仍可看。点「提交意向」或「我的意向」回到 MP-LOGIN，说明需要先与网页账号打通。不展示空意向冒充「已经同步且没有订单」。
6. 退出登录只删除本地 `nj_mp_token`。这不是服务端解绑。解绑接口若后端未提供，前端不做。

门户 Web 的 `POST /api/auth/login` 与 `POST /api/auth/register` 保持原样，本包不改 `apps/portal`。在 Web 注册并登录过的游客，到小程序完成第 4 步之后，两边看到同一组 `/api/me/intents`。只在一边登录、另一边从未绑定，则另一边没有会话，也看不到这一边的令牌。

正式 AppID 更换后，已打通关系是否仍然有效由后端按 openid / unionid 决定。前端只认「有没有门户令牌」。

### 2.5 复用字段（已在门户落地）

这些字段小程序直接沿用，不改名。

**Banner 数组元素：** `id`、`title`、`imageUrl`、`linkUrl`、`scope`（`ALL` | `CITY`）、`cityId`、`citySlug`、`cityName`、`sortOrder`、`enabled`。

**门店卡片：** `id`、`name`、`regionId`、`regionName`、`coverUrl`、`priceText`、`priceFrom`、`homeRecommended`、`homeSort`、`testData`、`testTag`、`shelfStatus`。

**门店详情在卡片之外：** `address`、`phone`、`gallery`、`packageText`、`packages`、`facilities`、`features`、`notice`、`trafficText`、`version`。列表在 `destinationStatus === CLOSED` 时还有 `emptyHint`，对客文案「该目的地暂未开通」。

**门店列表 query：** `regionId`、`tag`、`priceMin`、`priceMax`、`sort`、`page`、`pageSize`。

**攻略摘要：** `id`、`title`、`coverUrl`、`summary`。详情另有 `content`。

**创建意向：** `storeId`、`checkIn`、可选 `checkOut`、可选 `nights`、`guests`、`contactName`、`contactPhone`、可选 `userRemark`。

**意向记录：** `id`、`intentNo`、`status`、`storeId`、`storeName`、`checkIn`、`checkOut`、`nights`、`guests`、`contactName`、`contactPhone`、`userRemark`、`createdAt`。

**错误码与门户相同：**

| HTTP | 含义 | 小程序 |
|------|------|--------|
| 401 | 游客接口未登录或令牌失效 | 清 `nj_mp_token`，去 MP-LOGIN |
| 404 | 内容不存在，或意向不属于本人 | 「不存在或无权查看」 |
| 409 | 非法日期一类冲突，不是下架 | 留在意向表，展示 `message` |
| 410 | 下架或不可订。详情与提交意向同一码 | 禁用提交，「房源已下架或不可用」 |
| 400 | 参数 | 展示 `message` |

公开 Banner 保持匿名 200。被做成 401 时，小程序仍不清除已打通的令牌，只隐藏 Banner。

### 2.6 待后端 TECH 锁死（微信登录 / C-MP2b）

本节是**拟议约束**，不是第二套门店或意向字段。后端 TECH 合入后，像 MVP-1.5 对齐 api#22 那样，只修订本节的路径和未打通态字段名。在此之前不写调用代码。

| # | 拟议 | 前端已经定死的行为 |
|---|------|--------------------|
| 1 | 用 `code` 换会话的路径，建议 `POST /api/auth/wechat/miniprogram`，body 只有 `{ code }` | 不传 Secret、openid、unionid |
| 2 | 绑定路径，建议 `POST /api/auth/wechat/miniprogram/bind` | body 至少含门户已有的 `{ phone, password }`，外加后端规定的一次性票据。成功后的令牌形状与 `POST /api/auth/login` 相同 |
| 3 | 未打通时的字段名（票据叫什么、是否有 `linked`） | **没有门户令牌 = 未打通。** 不写本地会话，不调用 `/api/me/*` |
| 4 | openid / unionid 只存在于服务端 | 前端用户主键只用 `/api/auth/me` 的 id |
| 5 | AppID / Secret 用 `WX_MINIAPP_APPID`、`WX_MINIAPP_SECRET` | 前端仓库不提供 Secret |
| 6 | 换正式 AppID 后旧 openid 是否失效 | 前端不迁移本地用户；无令牌就重新登录或绑定 |

不在前端假设：静默注册一个没有手机号的游客、把 openid 填进 `userId`、或在未绑定时返回一个只能看空意向的「半令牌」。

### 2.7 验收在前端怎么测

用例步骤以 api 仓 `docs/TEST-MVP-2-微信小程序.md` 和 api#29 为准，实现阶段再写测试。本设计 PR 不添加测试文件。前端可观察边界：

| ID | 前端可观察结果 |
|----|----------------|
| C-MP1～C-MP8 | 按测试文档逐条对照首页、列表、详情、攻略、分享、意向和登录。接口路径用 §2.5，不另造字段 |
| C-MP2b | 绑定成功后，小程序与 Web 的「我的意向」来自同一 `GET /api/me/intents`。未绑定：本地无令牌，不发该请求，文案不声称已同步 |
| 文案 | `CHECKED_IN` 为「已入住」。全包搜不到支付、定金、锁房入口，也搜不到「已定着」及已落实 / 已落地 / 已订立 / 已成交 / 已达成 |
| 品牌 | 默认主色 `#4BA3D9` |
| 范围 | 商家端、运营端导航与本包无关，无小程序入口 |

纯函数（链接分类、Banner 排序、意向校验、状态文案）可用 Vitest，不测像素。分享和微信登录走体验版手测。

### 2.8 实现顺序（老板 TECH 终验通过之后）

1. 后端 TECH 合入后，把 §2.6 收成锁死路径和字段，再写登录
2. 新增 `apps/miniapp` 工程壳、gitignore、AppID 私有配置说明。仍不提交 Secret
3. `wx.request` 客户端与公开页：首页、列表、详情、攻略
4. 绑定成功后的意向提交和我的意向
5. 详情分享
6. 按 C-MP1～C-MP8 与 C-MP2b 在测试号体验版联调

---

## ③ 改动点

### 3.1 本 PR（只入库设计）

| # | 改动 |
|---|------|
| 1 | 新增本文件 `docs/FE-TECH-DESIGN-MVP-2-微信小程序.md` |
| 2 | `README.md` 增加一行，指向上述设计 |
| 3 | 不把 `PRODUCT` / `DESIGN` / `UI-PAGES` / `GATE-UI` / `TEST` / 后端 TECH 拷进本仓。权威文本留在 nongjiale-api：范围 #28，用例 #29，设计、页面与 UI 门禁 #30 |

无 `apps/` 与 `packages/` diff。无依赖变更。无 AppID、无 Secret。

### 3.2 终验通过后的实现改动（本 PR 不做）

| # | 改动 | 位置 |
|---|------|------|
| 1 | 原生小程序工程与页面路径 | `apps/miniapp` |
| 2 | 公开读与游客令牌两套 `wx.request` | `apps/miniapp` 的 api |
| 3 | Banner、列表 query、意向校验、状态文案的纯函数 | `apps/miniapp` 的 domain，或复用 `packages/shared` 里无 DOM 的 `INTENT_STATUS_LABEL` |
| 4 | 微信登录与绑定 | 仅调用 §2.6 锁死后的路径 |
| 5 | 测试号 AppID 的私有配置与 gitignore | `project.private.config.json` |
| 6 | 「已定着」纳入展示禁用词 | 实现阶段再改 `FORBIDDEN_INTENT_LABELS`。本 PR 不改 `packages/shared` |
| 7 | 体验版手测记录 | 不在本设计 PR |

明确不改：`apps/portal`、`apps/admin`、`apps/merchant` 的页面与路由；门户密码登录；商家与运营令牌；Banner 的 admin 接口；意向状态机；支付相关空缺（继续保持没有）。

---

## ④ 影响点

| 对象 | 影响 |
|------|------|
| 后端 | 门店、攻略、意向、Banner、公开配置继续用现有门户路径。需要新增的只有微信 `code` 换会话和 C-MP2b 绑定，且必须签发**现有游客令牌**。AppSecret 只放服务端 `WX_MINIAPP_SECRET`。无支付字段 |
| 小程序 | 新应用。公开浏览不要求登录。意向和「我的」只在打通后可用 |
| 门户 Web | 本包不改代码。打通之后，Web 与小程序读同一用户的意向。未打通时 Web 会话不受 `wx.login` 影响 |
| 商家 / 运营 | 无小程序，无新页面，无新导航 |
| 测试 | C-MP1～C-MP8、C-MP2b，另加「未打通不请求我的意向」「Banner 失败不登出」「410 不能提交」「无支付文案」。体验版用测试号 |
| 产品 / 设计 | UI 门禁以 api#30 的 `docs/GATE-UI-MVP-2-微信小程序-产品.md` 为准（设计终验已通过）。交互与页面以同 PR 的 DESIGN、UI-PAGES 为准。本仓实现时不改页面 ID |
| 项目经理 | 本 PR 只交付技设，状态是 Ready 供产品门禁。通过后才交老板 TECH 终验。终验通过前禁止业务码。正式 AppID 后补，不挡体验版技设 |
| 风险 | ① 把 Secret 打进小程序包。② 未返回门户令牌时仍写入本地会话，看起来像已同步。③ 用 openid 当用户 id，和 Web 意向对不上。④ Banner 外链用 `web-view` 打开整站。⑤ 公开接口 401 清掉已打通令牌。⑥ 体验版真机仍填 localhost。⑦ 换正式 AppID 后前端自己迁移用户。⑧ 列表另造 `keyword` 或游标参数 |

---

## 契约决定（现况）

| # | 项 | 决定 |
|---|----|------|
| 1 | 门店 / 攻略 / 意向 / Banner / 配置 | 复用 §2.5 路径和字段。契约源是已合入的门户接口与 api#22；后端若修订，以合入后的 TECH 为准 |
| 2 | 微信登录与绑定 | 待 BE TECH 锁死，见 §2.6。不在前端先写死第二套字段 |
| 3 | 令牌 | 打通成功后与 `POST /api/auth/login` 同一形状。本地键 `nj_mp_token` |
| 4 | 未打通 | 无令牌、无「我的意向」请求、不宣称已同步 |
| 5 | AppID | 测试号写在 gitignore 的私有配置。正式号以后替换 |
| 6 | Secret | 仅后端 `WX_MINIAPP_SECRET`。本仓不提交 |
| 7 | 支付 | 没有 |
| 8 | 商家 / 运营 | 仍是 Web |

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| MVP-2 | 2026-10-18 | 首版前端技术设计。对齐 api#28 范围、api#29 用例、api#30 设计/页面/UI 门禁。栈为 `apps/miniapp` 原生小程序。微信登录与 C-MP2b 待后端 TECH 锁死。不含业务实现 |
