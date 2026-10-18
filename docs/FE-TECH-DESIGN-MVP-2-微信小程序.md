# 前端技术设计 · MVP-2 微信小程序

| 项 | 内容 |
|----|------|
| 状态 | 微信登录与 C-MP2b 契约已按 api#32 锁死。产品门禁与老板 TECH 终验通过前不写业务码 |
| 日期 | 2026-10-18 |
| 角色 | 前端 |
| 读者 | 项目经理 / 产品 / 后端 / 测试 |
| 范围 | 游客微信小程序（W-B）。商家与运营仍用现有 Web |
| 本稿边界 | **本文件只写技术设计，不改 `apps/`、`packages/`。** 不在本仓复制产品/设计/页面/门禁/用例/测试原文 |

对齐权威在 **nongjiale-api** 仓，本仓不另存副本。产品范围是 [nongjiale-api#28](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/28) 的 `docs/PRODUCT-MVP-2-微信小程序-范围.md`（W-B，验收 C-MP1～C-MP8 与 C-MP2b）。用例是 [nongjiale-api#29](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/29)。交互、页面规格与产品 UI 门禁是 [nongjiale-api#30](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/30)（已合 main，设计终验通过）：`docs/DESIGN-MVP-2-微信小程序.md`、`docs/UI-PAGES-MVP-2-微信小程序.md`、`docs/GATE-UI-MVP-2-微信小程序-产品.md`。验收步骤以 api 仓 `docs/TEST-MVP-2-微信小程序.md` 为准。

**契约源 = [nongjiale-api#32](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/32) 的 `docs/TECH-DESIGN-MVP-2-微信小程序.md`。** 该 PR 仍是设计稿，尚未合入 main；本仓按已给出的正文锁死，不另写第二套路径或字段。合入 main 后若正文有修订，再像 MVP-1.5 对齐 api#22 那样只改本节引用的契约，不在前端先改字段名。

| 能力 | 契约出处 | 本设计怎么用 |
|------|----------|----------------|
| 首页 Banner | [nongjiale-api#22](https://cursor.com/codebase/andrew-yang/nongjiale-api/pull/22) `docs/TECH-DESIGN-MVP-1.5-广告位.md`，本仓 [FE-TECH-DESIGN-MVP-1.5-广告位.md](FE-TECH-DESIGN-MVP-1.5-广告位.md) §2.4；链接解释以 api#32 为准 | `GET /api/home/banners`，公开 `data` 为数组。不增加 `miniPath` |
| 门店、攻略、意向、网页登录信封、公开配置 | 门户已接路径；找店 `keyword` 与无手机号 403 以 api#32 为准 | 小程序只读/写同一组路径和字段 |
| 微信登录、绑定、解绑、打通状态 | **api#32** `docs/TECH-DESIGN-MVP-2-微信小程序.md` | 见 §2.4、§2.6。路径为 `/api/auth/wechat/login`、`/bind`、`/unbind`、`GET /api/auth/wechat/link` |

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
| MP-HOME | `pages/home/index` | 公开 | 公开配置、Banner、地区。推荐 feed 可选 |
| MP-LIST | 找店 Tab，路径以 UI-PAGES 为准 | 公开 | `GET /api/stores`，搜索只用可选 `keyword` |
| MP-DETAIL | `pages/detail/index` | 公开 | `GET /api/stores/{id}`；分享 path 带 `id` |
| MP-INTENT-FORM | `pages/intent/form` | 已打通的游客令牌 | 门店详情 + `POST /api/booking-intents` |
| MP-MY-INTENTS | `pages/my/intents` | 已打通的游客令牌 | `GET /api/me/intents` |
| MP-LOGIN | `pages/login/index` | 游客 | `POST /api/auth/wechat/login`；未打通再 `bind` |
| MP-GUIDE-LIST | `pages/guides/index` | 公开 | `GET /api/articles` |
| MP-GUIDE-DETAIL | `pages/guides/detail` | 公开 | `GET /api/articles/{id}` |
| MP-WEBVIEW | `pages/webview/index` | 公开 | 仅业务域名已配置时打开 Banner 的 http(s) |

门户另有意向成功页和意向详情（`P-INTENT-SUCCESS`、`P-MY-INTENT-DETAIL`）。UI-PAGES 若给出对应小程序 ID，实现时采用那个 ID。未单列时：提交成功进入 MP-MY-INTENTS，并展示返回的 `intentNo`；从列表进入一条只读详情，仍读 `GET /api/me/intents/{id}`。

底部是 DESIGN 已写的三 Tab。api#32 点名的路径是首页 `/pages/home/index`、详情 `/pages/detail/index`、外链 `/pages/webview/index`。其余页面路径以 UI-PAGES 为准。不把商家、运营、入驻申请放进 tab。

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
| 游客令牌 | 门户 Bearer，头 `Authorization: Bearer` | 微信登录成功体的 `token` 与网页版相同（64 字符十六进制，不含 `Bearer ` 前缀）。只有 `accountLinked=true` 才写入本地键 `nj_mp_token`。这是微信存储，不是浏览器 localStorage |
| 游客资料 | `GET /api/auth/me` | 字段为 `userId`、`phone`、`displayName`、`role`。壳用户 `phone` 为 null。打通后用它预填意向手机 |
| Banner | `GET /api/home/banners` | 无城市 query。`data` 是数组。0 隐藏 / 1 静帧 / ≥2 用原生 `swiper`，间隔 5000ms，指示点 `#4BA3D9` |
| 首页 feed | `GET /api/home/feed` | `stores`、`articles`。推荐店按 `homeSort` |
| 地区 | `GET /api/regions` | 目的地 Chip：市级 `level` 为 `CITY`（兼容数字 2）；`openStatus === CLOSED` 的市不进 Chip |
| 门店列表 | `GET /api/stores` | 已有 query 保持。**唯一增量**是可省略的 `keyword`。不传与今天相同 |
| 门店详情 | `GET /api/stores/{id}` | 套餐以 `packageText` 为准 |
| 攻略 | `GET /api/articles`、`GET /api/articles/{id}` | 标题、封面、摘要、正文。正文用文本，不用富文本 HTML |
| 意向 | `POST /api/booking-intents`、`GET /api/me/intents`、`GET /api/me/intents/{id}` | 请求体与门户 `CreateIntentBody` 相同，不带金额 |
| 公开配置 | `GET /api/config/public` | `siteName`、`brandColor`、`contactPhone` |
| 主色 | `DEFAULT_BRAND` = `#4BA3D9` | `app.wxss` 的 `--color-brand`。合法 `brandColor` 可覆盖；缺失时用 `#4BA3D9` |
| 意向文案 | `INTENT_STATUS_LABEL.CHECKED_IN` | 只显示「已入住」。见 §1.5 |
| 接口基址 | 门户默认 `http://localhost:8080` | 小程序配置 `apiBase`，默认同一地址。体验版真机改用已配置的 https 域名 |

Banner、门店、攻略、意向的 JSON 字段名以本节和 §2.5 为准。微信登录字段以 §2.6 为准，契约源是 api#32。

### 1.5 硬锁

- 无支付、定金、钱包、收银台、锁房、买位的页面、按钮、字段或文案
- 无商家端、无运营端、无入驻申请页。`/merchant/apply` 只留在门户 Web
- `CHECKED_IN` 对客只显示「已入住」（入 U+5165，住 U+4F4F）。不用「已定着」「已订立」「已落实」「已落地」「已成交」「已达成」
- 品牌色用 `#4BA3D9`。不用田园绿 `#2F6B4F` 当作品牌色
- AppSecret、上传密钥、正式或测试号的 Secret 不出现在仓库、小程序包、`project.config.json` 或前端环境示例的真实值里
- `accountLinked=false` 时不把登录令牌写入 `nj_mp_token`，不请求「我的意向」，不宣称已与网页版同步。无手机号不提交意向（接口 403）
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
| 游客 | 仅当本地已有 `accountLinked=true` 的 `nj_mp_token` | 清掉 `nj_mp_token`，打开 MP-LOGIN，并带上来源页以便完成后返回 |
| 登录页内存 | 仅 `accountLinked=false` 时，登录响应的 `token` 留在当页，不落存储 | 绑定或查询打通状态若 401，丢掉这枚内存令牌，不写 `nj_mp_token` |

公开：`POST /api/auth/wechat/login`，以及 `/api/config/public`、`/api/home/banners`、`/api/home/feed`、`/api/regions`、`/api/stores`、`/api/stores/{id}`、`/api/articles`、`/api/articles/{id}`。

要已打通令牌：`GET /api/auth/me`、`POST /api/booking-intents`、`GET /api/me/intents`、`GET /api/me/intents/{id}`。

要微信渠道令牌（已打通用 `nj_mp_token`，未打通用登录页内存令牌）：`POST /api/auth/wechat/bind`、`POST /api/auth/wechat/unbind`、`GET /api/auth/wechat/link`。网页版密码登录的令牌没有 openid，不能绑定或解绑。

基址来自小程序本地配置 `apiBase`，缺省 `http://localhost:8080`。开发者工具可关「校验合法域名」以便连本地。体验版真机不走 localhost，使用后端已部署且已填进微信 request 合法域名的 https 源。正式 AppID 上线前再核对这张域名表，本设计不填写生产域名。

### 2.2 AppID / Secret 配置位

| 配置 | 放哪 | 谁能看见 | 约定 |
|------|------|----------|------|
| 小程序 AppID | 开发者本机 `apps/miniapp/project.private.config.json` 的 `appid`（gitignore） | 微信公开标识，仍然不写进 git | 先填**测试号**。正式 AppID 替换这一处，页面代码不因换号而改 |
| 仓库内 `project.config.json` | 实现阶段的 `appid` 留空字符串 | 可提交 | 避免把某一套测试号写死在主分支 |
| AppSecret | **只在后端环境** `WECHAT_MINIAPP_SECRET` | 仅服务端 | 小程序用 `wx.login` 拿到 `code`，由后端换会话。前端没有 Secret 配置项，不用 `WX_MINIAPP_SECRET` |
| 后端 AppID | `WECHAT_MINIAPP_APP_ID`，与小程序里的测试号成对 | 仅服务端 | 换正式号时与 Secret 一起换。未配置时登录、绑定、解绑为 503「微信登录未配置」 |

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

Banner 的 `linkUrl` 仍是运营在网页后台填的字符串。接口不增加 `miniPath`。小程序按 api#32 解释：

| `linkUrl` | 行为 |
|-----------|------|
| `/` | 切到首页 Tab `/pages/home/index` |
| `/?city={slug}` | 切到找店 Tab。slug 用 `GET /api/regions` 换成 `regionId`。slug 不在 OPEN 市：提示「该目的地暂未开通」，不请求 CLOSED 列表 |
| `http://` 或 `https://` | 业务域名已配置则打开 `/pages/webview/index`；否则弹层复制链接。不把运营站套进小程序 |
| 其他以单个 `/` 开头的路径 | Toast「暂无法在小程序内打开」。不白屏，不挡首页其他入口 |
| `javascript:`、`data:`、缺协议 | 图可以留着，不做成可点链接 |

**MP-LIST。** 搜索只使用可省略的 `keyword`（店名包含）。不传，或 trim 后为空，过滤与今天相同。超过 64 字不提交（接口 400「参数不正确」）。标签、价格、排序仍是网页参数，小程序本包可以不传。`destinationStatus === CLOSED` 时只显示「该目的地暂未开通」，不渲染门店；关键词不能把 CLOSED 市的店带出来。分页参数仍是 `page`、`pageSize`（默认 20）。界面可以用触底请求下一页。

**MP-DETAIL。** 展示 `name`、`coverUrl`、`gallery`、`regionName`、`address`、`phone`、`priceText`（无则用 `priceFrom`）、`packageText`。`packages` 只在有数据时作辅助。对客标签保留「首页推荐」和接口给出的 `testTag`；不展示 `homeSort`、上架态运营词。404 文案「房源不存在」。410 时禁用「提交意向」，文案「已下架或不可用」。详情提供分享，见 §2.3 分享。

**MP-INTENT-FORM。** 字段与门户草稿相同：`checkIn`、可选 `checkOut`、可选 `nights`、`guests`、`contactName`、`contactPhone`、可选 `userRemark`。提交 JSON 为 `storeId`、`checkIn`、`guests`、`contactName`、`contactPhone`，有离店或晚数、有备注时再带上对应字段。不附金额。校验规则与门户 `validateIntent` 相同：到店不早于今天、离店晚于到店、晚数与离店一致、11 位手机、联系人必填。已打通时用 `GET /api/auth/me` 的手机预填，允许改。`phone` 为空或 `accountLinked=false` 时不发 POST。若仍打到接口，403「请先绑定手机号，完成与网页版账号打通后再提交意向」，不产生意向。成功后用返回的 `id`、`intentNo`。页上保留「意向不等于已锁房」这类说明（原文以 UI-PAGES 为准）。不传金额；未知字段会被接口 400「请求体格式不正确」。

**MP-MY-INTENTS。** 只在 `accountLinked=true` 且已写入 `nj_mp_token` 时请求。未打通不发这个请求，也不把空列表说成已经和网页版同步。状态展示：

| 码 | 文案 |
|----|------|
| `PENDING` | 待跟进 |
| `CONFIRMED` | 已确认 |
| `RESCHEDULED` | 已改期 |
| `CHECKED_IN` | 已入住 |
| `CLOSED` | 已关闭 |

列表和详情没有取消、改状态或支付。他人单据按 404「意向不存在」。接口不另发一套中文状态名；`CHECKED_IN` 的码仍是 `CHECKED_IN`，对客只显示「已入住」。

**MP-GUIDE-LIST / MP-GUIDE-DETAIL。** 只展示接口返回的已发布内容。正文按文本渲染。关联市是否开通由接口决定，前端不另做一道城市过滤。

**分享到门店。** MP-DETAIL 实现 `onShareAppMessage`。`path` 为 `/pages/detail/index?id={storeId}`。`storeId` 等于 `GET /api/stores/{id}` 的 `id`（UI 稿里的 `listingId` 就是这个字段）。打开后再请求该详情。410 展示「已下架或不可用」并隐藏提交。无后端分享接口，无计数，无支付参数。朋友圈分享不挡验收。标题用门店 `name`。`imageUrl` 只用 https 封面。被分享者不继承分享者的令牌。

**MP-LOGIN。** 见 §2.4。没有「微信里注册一个和 Web 无关的新用户然后假装已同步」。

### 2.4 微信登录与 C-MP2b

用户主体是 `portal_user.id`（响应字段 `userId`）。打通凭证是手机号。微信侧的 openid 只在服务端，请求体不传 openid、unionid、AppSecret。小程序不维护第二份用户表。不接短信，不用验证码登录。

`code` 来自 `wx.login`，只用一次，交给 `POST /api/auth/wechat/login`。成功 `data` 与网页版登录同一套游客 Bearer，并带打通布尔，见 §2.6。`token` 是原文，请求时加上 `Bearer ` 前缀。

| `accountLinked` | 前端 |
|-----------------|------|
| `true` | 把 `token` 写入 `nj_mp_token`。此后「我的意向」和提交意向都用这枚令牌。两边读的是同一个 `userId`，前端不把两份列表在本地合并 |
| `false` | **不写** `nj_mp_token`。**不请求** `GET /api/me/intents`。不展示「已与网页版同步」或「已经同步且没有订单」。登录页只用内存中的这枚令牌调用绑定或 `GET /api/auth/wechat/link`。提示用 DESIGN 已写的句子：「网页版意向同步即将开通，当前仅显示本端提交的意向」 |

未打通时首页、列表、详情、攻略仍可看。点「提交意向」或「我的意向」进入 MP-LOGIN。无手机号（`phone` 为 null）不调用 `POST /api/booking-intents`。接口对这种壳用户返回 **403**「请先绑定手机号，完成与网页版账号打通后再提交意向」，且不产生单。

绑定用 `POST /api/auth/wechat/bind`，Authorization 带上当前这枚微信登录令牌。两种正文互斥：

| 模式 | 正文 | 何时 |
|------|------|------|
| 微信手机号 | `phoneCode` 必填，`password` 可空 | 按钮 `getPhoneNumber` 的 code |
| 网页版手机号 | `phone` 必填（`^1\d{10}$`），`password` 必填 | 号码和网页版注册号不一致，或新号要开通网页登录。密码 6～64 位 |

绑定成功体与登录相同。`userId` 可能变成网页版那个用户，客户端必须改存响应里的新 `token`，并只在 `accountLinked=true` 时写入 `nj_mp_token`。此后小程序与网页版的「我的意向」是同一次 `GET /api/me/intents` 的结果。

解绑是 `POST /api/auth/wechat/unbind`，无请求体。成功后丢掉本地令牌（响应里没有 `token`）。重新 `wx.login` 得到的是新壳，列表里没有解绑前那个手机号用户的单，直到再次绑定。退出登录若只清本地、不调用解绑，服务端绑定还在；下次微信登录仍按 openid 回到已绑定用户。

门户 Web 的 `POST /api/auth/login` 与 `POST /api/auth/register` 保持原样，本包不改 `apps/portal`。正式 AppID 只换后端的 `WECHAT_MINIAPP_APP_ID` 与 `WECHAT_MINIAPP_SECRET`。体验版 openid 不会自动变成正式版；用户重新登录后再用手机号和密码绑回。前端不迁移本地用户。

### 2.5 复用字段（已在门户落地）

这些字段小程序直接沿用，不改名。

**Banner 数组元素：** `id`、`title`、`imageUrl`、`linkUrl`、`scope`（`ALL` | `CITY`）、`cityId`、`citySlug`、`cityName`、`sortOrder`、`enabled`。

**门店卡片：** `id`、`name`、`regionId`、`regionName`、`coverUrl`、`priceText`、`priceFrom`、`homeRecommended`、`homeSort`、`testData`、`testTag`、`shelfStatus`。

**门店详情在卡片之外：** `address`、`phone`、`gallery`、`packageText`、`packages`、`facilities`、`features`、`notice`、`trafficText`、`version`。列表在 `destinationStatus === CLOSED` 时还有 `emptyHint`，对客文案「该目的地暂未开通」。

**门店列表 query：** 原有 `regionId`、`tag`、`priceMin`、`priceMax`、`sort`、`page`、`pageSize` 保留。api#32 的唯一增量是可选 `keyword`：省略或 trim 后空串等于不传；超过 64 字为 400「参数不正确」；合法值在 OPEN 市且上架的店名上做包含匹配。不新增 `/api/mini/stores`。

**攻略摘要：** `id`、`title`、`coverUrl`、`summary`。详情另有 `content`。

**创建意向：** `storeId`、`checkIn`、可选 `checkOut`、可选 `nights`、`guests`、`contactName`、`contactPhone`、可选 `userRemark`。

**意向记录：** `id`、`intentNo`、`status`、`storeId`、`storeName`、`checkIn`、`checkOut`、`nights`、`guests`、`contactName`、`contactPhone`、`userRemark`、`createdAt`。

**错误码与门户相同：**

| HTTP | 含义 | 小程序 |
|------|------|--------|
| 401 | 未登录、令牌过期，或解绑后继续用这枚微信令牌。文案「未登录」 | 清掉本地或内存中的该令牌，去 MP-LOGIN |
| 401 | 微信 code 失效。文案「微信登录已失效，请重试」 | 留在登录页，可再次 `wx.login` |
| 401 | 手填密码不对。文案「手机号或密码错误」 | 留在绑定表，不改本地已打通令牌 |
| 403 | 无手机号提交意向 | 不产生单。文案「请先绑定手机号，完成与网页版账号打通后再提交意向」 |
| 403 | 商家或运营令牌。文案「无权限」 | 小程序不发放这两类令牌 |
| 404 | 房源不存在「房源不存在」；他人意向「意向不存在」 | 按接口 `message` 展示 |
| 409 | 绑定冲突（已绑其他手机号、该手机号已绑其他微信、壳上已有意向不能合并）或非法日期 | 展示接口 `message`，不把 409 当成下架 |
| 410 | 下架或市未开通。文案「已下架或不可用」 | 禁用提交 |
| 400 | 参数或绑定正文不对 | 展示 `message` |
| 503 | AppID 或 Secret 为空。文案「微信登录未配置」 | 不写成登录成功 |

公开 Banner 保持匿名 200。被做成 401 时，小程序仍不清除已打通的令牌，只隐藏 Banner。

### 2.6 契约（已锁死，源 nongjiale-api#32）

本节取代原先的「待 BE TECH 锁死」草案。不再使用 `POST /api/auth/wechat/miniprogram`、`WX_MINIAPP_APPID`、`WX_MINIAPP_SECRET`。实现只调用下面的路径和字段。api#32 尚未合入 main，正文仍是契约源。

信封与现网一致：`{ code, message, data }`，成功 `code === 0`。基址默认 `http://localhost:8080`。

**POST `/api/auth/wechat/login`**（公开）

请求体只有 `code`（`wx.login` 的 code，必填，最长 128）。不传 Secret。

成功 `data`：`token`、`expiresAt`、`userId`、`role`（`TOURIST`）、`displayName`、`phone`（未绑定为 null）、`phoneBound`、`wechatBound`、`accountLinked`。

`accountLinked=true` 的定义（服务端计算，前端不重算）：该用户 `phone` 非空、密码已设置，且当前 AppID 下有这条 openid。前端只读布尔值。

**POST `/api/auth/wechat/bind`**（游客 Bearer，且令牌来自微信登录）

`phoneCode` 与 `phone`+`password` 两种正文互斥，见 §2.4。成功 `data` 与登录相同。必须改存新 `token`。

**POST `/api/auth/wechat/unbind`**（游客 Bearer，且令牌来自微信登录）

无请求体。成功 `data` 与下面的 link 相同：`wechatBound=false`，`accountLinked=false`，没有 `token`。客户端丢掉本地令牌。

**GET `/api/auth/wechat/link`**（游客 Bearer）

`data`：`userId`、`phone`、`phoneBound`、`wechatBound`、`accountLinked`。未打通提示看这个布尔，不改「我的意向」的字段。`accountLinked=false` 时前端仍不把令牌写入 `nj_mp_token`，也不请求我的意向。

**POST `/api/booking-intents`**

请求体与成功体不变。`phone` 为空时 **403**，message 为「请先绑定手机号，完成与网页版账号打通后再提交意向」，不插入意向。

**环境变量（仅后端）**

`WECHAT_MINIAPP_APP_ID`、`WECHAT_MINIAPP_SECRET`。任一 trim 后为空则微信四个接口 503「微信登录未配置」。前端仓库不提供这两个值。

不在前端假设：用 openid 充当 `userId`、未打通时把壳用户的空意向列表说成网页版已同步、或再做一套令牌字段名。

### 2.7 验收在前端怎么测

用例步骤以 api 仓 `docs/TEST-MVP-2-微信小程序.md` 和 api#29 为准，实现阶段再写测试。本设计 PR 不添加测试文件。前端可观察边界：

| ID | 前端可观察结果 |
|----|----------------|
| C-MP1～C-MP8 | 按测试文档逐条对照首页、列表、详情、攻略、分享、意向和登录。接口路径用 §2.5，不另造字段 |
| C-MP2b | 绑定成功后新 `token` 的 `userId` 与网页版相同，两边的 `intentNo` 来自同一 `GET /api/me/intents`。`accountLinked=false`：不写 `nj_mp_token`，不发该请求，不声称已同步。无手机号提交为 403 |
| 文案 | `CHECKED_IN` 为「已入住」。全包搜不到支付、定金、锁房入口，也搜不到「已定着」及已落实 / 已落地 / 已订立 / 已成交 / 已达成 |
| 品牌 | 默认主色 `#4BA3D9` |
| 范围 | 商家端、运营端导航与本包无关，无小程序入口 |

纯函数（链接分类、Banner 排序、意向校验、状态文案）可用 Vitest，不测像素。分享和微信登录走体验版手测。

### 2.8 实现顺序（老板 TECH 终验通过之后）

1. §2.6 已等于 api#32。老板 TECH 终验通过前仍不写登录代码；若该 PR 合入时改了字段，先改本节再写调用
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
| 3 | 不把 `PRODUCT` / `DESIGN` / `UI-PAGES` / `GATE-UI` / `TEST` / 后端 TECH 拷进本仓。范围 #28，用例 #29，设计、页面与 UI 门禁 #30。微信契约源是 api#32 的 `docs/TECH-DESIGN-MVP-2-微信小程序.md`（PR 未合 main） |

### 3.1a 本修订（只锁契约）

| # | 改动 |
|---|------|
| 1 | 权威表写明契约源 = api#32 |
| 2 | 删除「待 BE TECH」。登录路径改为 `/api/auth/wechat/login`、`/bind`、`/unbind` 与 `GET /api/auth/wechat/link` |
| 3 | 未打通以 `accountLinked=false` 为准：不写 `nj_mp_token`，不请求我的意向，不假装同步。无手机号提交意向为 403 |
| 4 | `GET /api/stores` 增加可选 `keyword`。环境变量改为 `WECHAT_MINIAPP_APP_ID`、`WECHAT_MINIAPP_SECRET` |
| 5 | `CHECKED_IN` 对客仍只显示「已入住」 |

无 `apps/` 与 `packages/` diff。无依赖变更。无 AppID、无 Secret。

### 3.2 终验通过后的实现改动（本 PR 不做）

| # | 改动 | 位置 |
|---|------|------|
| 1 | 原生小程序工程与页面路径 | `apps/miniapp` |
| 2 | 公开读与游客令牌两套 `wx.request` | `apps/miniapp` 的 api |
| 3 | Banner、列表 query、意向校验、状态文案的纯函数 | `apps/miniapp` 的 domain，或复用 `packages/shared` 里无 DOM 的 `INTENT_STATUS_LABEL` |
| 4 | 微信登录、绑定、解绑、打通状态 | 只调用 §2.6 的四个路径 |
| 5 | 测试号 AppID 的私有配置与 gitignore | `project.private.config.json` |
| 6 | 「已定着」纳入展示禁用词 | 实现阶段再改 `FORBIDDEN_INTENT_LABELS`。本 PR 不改 `packages/shared` |
| 7 | 体验版手测记录 | 不在本设计 PR |

明确不改：`apps/portal`、`apps/admin`、`apps/merchant` 的页面与路由；门户密码登录；商家与运营令牌；Banner 的 admin 接口；意向状态机；支付相关空缺（继续保持没有）。

---

## ④ 影响点

| 对象 | 影响 |
|------|------|
| 后端 | 契约源 api#32。微信四个路径签发与网页版相同的游客 Bearer。未打通看 `accountLinked`。无手机号提交意向 403。找店仅多可选 `keyword`。AppID / Secret 为 `WECHAT_MINIAPP_APP_ID`、`WECHAT_MINIAPP_SECRET`。无支付字段 |
| 小程序 | 新应用。公开浏览不要求登录。`accountLinked=false` 不落本地会话、不请求我的意向。意向提交只在已打通且有手机号之后 |
| 门户 Web | 本包不改代码。打通之后，Web 与小程序读同一用户的意向。未打通时 Web 会话不受 `wx.login` 影响 |
| 商家 / 运营 | 无小程序，无新页面，无新导航 |
| 测试 | C-MP1～C-MP8、C-MP2b，另加「未打通不请求我的意向」「Banner 失败不登出」「410 不能提交」「无支付文案」。体验版用测试号 |
| 产品 / 设计 | UI 门禁以 api#30 的 `docs/GATE-UI-MVP-2-微信小程序-产品.md` 为准（设计终验已通过）。交互与页面以同 PR 的 DESIGN、UI-PAGES 为准。本仓实现时不改页面 ID |
| 项目经理 | 本 PR 只交付技设，状态是 Ready 供产品门禁。通过后才交老板 TECH 终验。终验通过前禁止业务码。正式 AppID 后补，不挡体验版技设 |
| 风险 | ① 把 Secret 打进小程序包。② `accountLinked=false` 仍写入 `nj_mp_token` 并请求我的意向，看起来像已同步。③ 用 openid 当 `userId`。④ 绑定成功后不换新 `token`，还在看壳用户。⑤ Banner 外链在未配业务域名时强开 web-view。⑥ 公开接口 401 清掉已打通令牌。⑦ 体验版真机仍填 localhost。⑧ 把 `keyword` 当成必填，或用它去拉 CLOSED 市 |

---

## 契约决定（现况）

| # | 项 | 决定 |
|---|----|------|
| 1 | 契约源 | api#32 的 `docs/TECH-DESIGN-MVP-2-微信小程序.md`。PR 未合 main，仍按该正文 |
| 2 | 微信路径 | `POST /api/auth/wechat/login`、`/bind`、`/unbind`，`GET /api/auth/wechat/link` |
| 3 | 令牌 | `data.token` 与网页版相同的游客 Bearer。仅 `accountLinked=true` 写入 `nj_mp_token` |
| 4 | 未打通 | `accountLinked=false`。不写本地会话，不请求我的意向，不假装同步 |
| 5 | 无手机号意向 | `POST /api/booking-intents` 为 403 |
| 6 | 找店 | `GET /api/stores` 的 `keyword` 仅可选 |
| 7 | 文案 | `CHECKED_IN` 只显示「已入住」 |
| 8 | 环境变量 | 后端 `WECHAT_MINIAPP_APP_ID`、`WECHAT_MINIAPP_SECRET`。本仓不提交 |
| 9 | 支付 / 商家 / 运营 | 没有小程序。商家与运营仍是 Web |

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| MVP-2 | 2026-10-18 | 首版前端技术设计。对齐 api#28 范围、api#29 用例、api#30 设计/页面/UI 门禁。栈为 `apps/miniapp` 原生小程序。不含业务实现 |
| MVP-2a | 2026-10-18 | 登录与 C-MP2b 锁死为 api#32（PR 未合 main）。路径 `/api/auth/wechat/login\|bind\|unbind` 与 `GET /api/auth/wechat/link`。未打通 `accountLinked=false` 不写本地会话。无手机号意向 403。`GET /api/stores` 仅可选 `keyword`。环境变量 `WECHAT_MINIAPP_APP_ID` / `WECHAT_MINIAPP_SECRET`。不含业务代码 |
