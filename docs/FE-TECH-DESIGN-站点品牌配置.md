# 前端技术设计 · 站点品牌配置

| 项 | 内容 |
|----|------|
| 状态 | 前端技术设计。业务代码另 PR，不写在本稿 |
| 日期 | 2026-10-18 |
| 角色 | 前端 |
| 读者 | 项目经理 / 产品 / 后端 / 测试 / 运营 |
| 范围 | 门户 Web、商家 Web 壳、运营 A-SITE-CONFIG、微信小程序如何消费扩展后的站点配置 |
| 本稿边界 | **只新增本设计。不改 `apps/`、`packages/`。** 组件、路由、接口封装、文案常量都不在本 PR |

品牌文案和图片地址都从站点配置来。改字、换标志、清空口号，走运营保存，公开配置下次读取即生效，不靠发版。

---

## ① 概要设计

### 1.1 一次结果

运营在 A-SITE-CONFIG 维护站名、英文名、口号、标志、站点图标、主色、客服电话。保存后后端作废公开配置缓存。门户、商家壳、小程序下一次读取 `GET /api/config/public`，用同一份数据画品牌。

验收时这四件事同时成立：

| 操作 | 用户看见的结果 |
|------|----------------|
| 改站名、英文名、口号、标志 | 门户页头和小程序品牌区跟着变 |
| 清空标志 | 页头 / 开屏品牌区改回站名文字 |
| 清空口号 | 副标题不出现 |
| 清空英文名 | 英文行不出现 |

门户和小程序读同一个公开接口。商家壳只消费其中会画出来的字段，见 §2.4。

### 1.2 键、产品默认、测服种子

产品默认是配置里的种子值，由后端初始化或运营在表单里保存。前端用它们做展示，不把它们写进组件、`app.json`、`index.html` 或环境变量默认值。

| 键 | 产品默认 | 约束 | 空值时 |
|----|----------|------|--------|
| `siteName` | 垛里 | 必填，trim 后 1～64 字 | 保存拦截。公开接口若仍给空，沿用现有占位「站点名称」 |
| `siteNameEn` | Duoli | 选填，trim 后最多 64 字（与站名同一输入上限） | 不渲染英文行 |
| `slogan` | 住进千垛水乡 | 选填，trim 后最多 40 字 | 不渲染副标题 |
| `logoUrl` | 空字符串 | 选填。有值时只能是 `http:` / `https:` | 品牌位显示站名文字 |
| `faviconUrl` | 空字符串 | 选填。有值时只能是 `http:` / `https:` | 先用合法 `logoUrl`，再保留内置 `/favicon.svg` |
| `brandColor` | `#4BA3D9` | 仍是 `#` + 6 位十六进制，保存前规范成大写 | 沿用现有主色回退 |
| `contactPhone` | 400-000-0000 | 规则与现在相同 | 沿用现有电话回退 |

测服推荐种子（运营已把静态文件放到门户主机；仍可在 `/admin/site` 改掉）：

| 键 | 测服种子 |
|----|----------|
| `logoUrl` | `http://106.12.204.206:43123/brand/logo-header.jpg` |
| `faviconUrl` | `http://106.12.204.206:43123/brand/logo-favicon.jpg` |

这两条是站点配置里的 URL，不是组件常量。本地、预发、生产换地址时只改配置。源稿文件名供运营对照，不进运行时：

| 用途 | 源稿 | 测服静态路径 |
|------|------|----------------|
| 横版页头标志 | `logo-final-duoli-header-横版头图.jpg` | `/brand/logo-header.jpg` |
| 方形站点图标 | `logo-final-duoli-favicon-方标.jpg` | `/brand/logo-favicon.jpg` |

横版源稿画面里已经画了站名、英文名和口号。配置字段仍然各自生效：有合法 `logoUrl` 就显示图，有英文名就显示英文行，有口号就显示副标题。实现不按这张图的地址去隐藏文字。若测服上图和字叠在一起，运营把 `logoUrl` 换成不含文字的图，或清空 `siteNameEn` / `slogan`，都通过同一张表单完成。

### 1.3 端与页面

运营应用内路径是 `/site`（`pageId` 为 `A-SITE-CONFIG`）。产品口头的 `/admin/site` 指运营站上的这一页，不在 `apps/admin` 里再加一层 `/admin` 前缀。绝对地址是 `http://localhost:43124/site`。

| 表面 | 应用 | 现成位置 | 品牌上画什么 |
|------|------|----------|----------------|
| 页头品牌位 | `apps/portal` | `SiteHeader.vue` | 标志或站名，加上英文名、口号 |
| 页脚 | `apps/portal` | `App.vue` | 站名文字、客服电话。页脚不放口号 |
| 文档标题 | 门户 / 商家 / 运营 | 各端 `router` `afterEach`、门户 `main.ts` | `{页面标题} · {siteName}` |
| 站点图标 | 三端 Web | 各端 `index.html` 的 `link[rel=icon]`，启动后改 `href` | `faviconUrl`，否则 `logoUrl`，否则 `/favicon.svg` |
| 配置表单 | `apps/admin` | `SiteConfigView.vue`，路由 `/site` | 七个字段的编辑和预览 |
| 运营 / 商家壳 | `apps/admin`、`apps/merchant` | `ConsoleFrame.vue`、登录页 kicker | 标志或站名。不画口号和英文名 |
| 小程序导航标题 | `apps/miniapp` | 首页 `wx.setNavigationBarTitle` | `siteName`。功能页标题保持「找店」「攻略」等 |
| 小程序品牌区 | `apps/miniapp` | 首页、登录页 | 与门户页头同一套：标志或站名，英文名，口号 |

微信后台里的小程序启动图和小程序头像不读站点配置。本设计说的开屏，是配置返回后首页和登录页上的品牌区。

### 1.4 沿用的工程

| 能力 | 现成位置 | 品牌配置怎么用 |
|------|----------|----------------|
| 公开读取 | 门户 `useSiteStore.loadPublic` → `GET /api/config/public` | 同一路径增加四个键。失败时保留已有站名、主色、电话 |
| 运营读写 | `GET` / `PUT /api/admin/site-config`，`readSiteConfig` / `buildSiteConfigBody` | 对象体扩展为七字段。键值数组形状继续认旧键，并认下面的新键 |
| 主色 | `applyBrandColor`、`DEFAULT_BRAND` `#4BA3D9` | 算法不变 |
| 占位 | `DEFAULT_SITE_NAME` = 「站点名称」，`VITE_SITE_NAME` | 配置到达前的占位。不改成产品默认站名 |
| 小程序配置 | `fetchPublicConfig`、`readPublicConfig`、`app.globalData`、`ensureSite` | `globalData` 增加四个字段；首页已会 `setNavigationBarTitle` |
| 商家站名 | `apps/merchant` 的 `useSiteStore` | 今天只吃环境变量。业务 PR 改为启动时读公开配置 |
| HTTP | `createHttpClient`，信封 `{ code, message, data }` | 公开配置这一次 GET 使用 `cache: 'no-store'` |

门户 `packages/shared` 的 `PublicSiteConfig` 现有 `primaryColor`，门户实际读的是 `brandColor`。业务 PR 以 `brandColor` 和本节的四个新键为准，不把展示逻辑接到 `primaryColor` 上。

### 1.5 展示规则

纯函数（业务 PR 放在 `packages/shared`，小程序在自己的 `domain` 里放一份同等实现）根据配置算出可见品牌。组件只渲染这个结果。

| 输出 | 规则 |
|------|------|
| 标题 | `siteName` trim。空则用当前占位「站点名称」 |
| 标志 | `logoUrl` 是 `http:` / `https:` 时用该地址。图片加载失败时改回标题文字 |
| 英文行 | `siteNameEn` trim 后非空才输出 |
| 副标题 | `slogan` trim 后非空才输出 |
| 站点图标 | 合法 `faviconUrl`；否则合法 `logoUrl`；两者都没有则不改 `href`，页上继续是 `/favicon.svg` |

页头品牌链接：有标志时用 `img`，`alt` 为标题；没有标志时用标题文字。英文行在标志（或标题）下方，副标题再在英文行下方。某一行为空，那一行的节点不挂载。

`document.title` 只用标题，不拼英文名和口号。

字数按 trim 之后的 JavaScript 字符串长度计，一个汉字计 1。

### 1.6 硬锁

- `CHECKED_IN` 对客和运营仍显示「已入住」
- 无支付、定金、钱包、收银台的路由、按钮、字段或文案
- 主色默认保持 `#4BA3D9`，不恢复 `#2F6B4F`
- 品牌文案和测服图片地址只出现在配置数据和本设计里。业务组件不写死「垛里」「Duoli」「住进千垛水乡」和 `106.12.204.206` 上的两个 URL
- 清空可选字段要提交空字符串。请求里缺键不等于清空

### 1.7 本稿明确不做

不改业务组件，不改路由，不改接口封装，不改小程序页面，不把测服 URL 写进 `index.html` 或 `app.json`。

---

## ② 详细设计

### 2.1 接口期望

业务 PR 依赖后端先在两条接口的 `data` 上给出下列键。命名与现有 `siteName` / `brandColor` / `contactPhone` 一致，用驼峰。

公开 `GET /api/config/public`（匿名 200）与运营 `GET` / `PUT /api/admin/site-config`：

```json
{
  "siteName": "垛里",
  "siteNameEn": "Duoli",
  "slogan": "住进千垛水乡",
  "logoUrl": "http://106.12.204.206:43123/brand/logo-header.jpg",
  "faviconUrl": "http://106.12.204.206:43123/brand/logo-favicon.jpg",
  "brandColor": "#4BA3D9",
  "contactPhone": "400-000-0000"
}
```

上表是测服种子长什么样。字段缺省或空字符串时，前端按 §1.5 隐藏，不在客户端补产品默认文案。

PUT 体始终带齐七个键。可选键清空时值为 `""`。`brandColor` 仍规范成大写 `#4BA3D9` 这种形式。

若 `data` 仍是键值数组，读取时在现有三键之外再认：

| 数组里的 key | 对象字段 |
|--------------|----------|
| `site.name` | `siteName` |
| `site.name_en` | `siteNameEn` |
| `site.slogan` | `slogan` |
| `site.logo_url` | `logoUrl` |
| `site.favicon_url` | `faviconUrl` |
| `site.brand_color` | `brandColor` |
| `site.contact_phone` | `contactPhone` |

保存始终提交对象，不提交键值数组。

公开接口保持匿名 200。门户的 401 会清 `nj_portal_token`；这条配置请求失败时留在当前页，不把游客送去登录。

### 2.2 门户壳

`useSiteStore` 增加 `nameEn`、`slogan`、`logoUrl`、`faviconUrl`。初值都是空字符串。

`loadPublic` 成功后：

| 字段 | 写入方式 |
|------|----------|
| `siteName`、`contactPhone`、`brandColor` | 与现在相同：非空才覆盖占位 |
| `siteNameEn`、`slogan`、`logoUrl`、`faviconUrl` | 每次成功读取都整字段覆盖。空字符串写回空，用来表达「已清空」 |

失败时这四个新字段保持本次会话里的上一份值；第一次进入尚未成功时保持空，于是英文名、口号、标志都不显示。

`SiteHeader` 的 `.brand` 改为 §1.5 的品牌簇。窄屏下品牌簇可以换行，导航折叠行为保持现状。页脚继续只输出站名文字和客服电话。首页 `欢迎来到{站名}` 继续只用站名，口号不进这句欢迎语。

标志高度不超过顶栏，`object-fit: contain`，并限制最大宽度，避免横图把菜单挤出首屏。`alt` 用站名。`img` 的 `error` 把该次展示退回站名文字。

### 2.3 运营 A-SITE-CONFIG

路由、守卫、`pageId` 不变。表单在现有站名、主色、客服电话下增加四项。

| 字段 | 控件 | 校验 |
|------|------|------|
| 站名 | 单行，`maxlength="64"` | 空：「请填写站名」 |
| 英文名 | 单行，`maxlength="64"` | 可空。超长：「英文名请控制在 64 字以内」 |
| 口号 | 单行，`maxlength="40"` | 可空。超长：「口号请控制在 40 字以内」 |
| 标志 | URL 单行 | 可空。非空且不是 `http:` / `https:`：「请填写 http 或 https 图片地址」 |
| 站点图标 | URL 单行 | 与标志同一条 URL 规则 |
| 主色 / 客服电话 | 现有控件 | 现有文案不变 |

说明文案改为：「保存后门户、商家壳与小程序下次读取公开配置即生效，无需重新发版。英文名或口号留空则不展示；标志留空则显示站名文字。」

预览用 §1.5 的同一纯函数，不另写一套显隐。预览里能看见：有标志时出图、无标志时出站名、口号空时没有副标题。

保存成功仍 Toast「已保存」，并用返回体（返回体为空时用刚提交的对象）更新运营端站点 store 和站点图标。焦点顺序在校验失败时落到第一个错误项：站名、英文名、口号、标志、站点图标、主色、电话。

运营登录页在拿到令牌之前也读公开配置，这样登录页 kicker 和站点图标与门户一致。进入后台后，表单仍以 `GET /api/admin/site-config` 为准。

### 2.4 商家 Web

商家没有独立营销页头。业务 PR 让商家 `useSiteStore` 在启动时调用 `GET /api/config/public`，并套用主色、站名、标志、站点图标。

`ConsoleFrame` 和登录 kicker：有合法标志则显示图（`alt` 为站名），否则显示站名文字。不渲染英文名和口号。`document.title` 仍是 `{页面标题} · {siteName}`。

商家不调用 `/api/admin/site-config`。

### 2.5 小程序导航与品牌区

`PublicConfig`、`readPublicConfig`、`app.globalData`、`SiteView` 增加 `siteNameEn`、`slogan`、`logoUrl`。`faviconUrl` 可以读入，小程序界面不使用它。

`loadSite` 对四个新字段的覆盖规则与门户相同：成功读取时整字段覆盖，空则隐藏。`app.json` 的 `navigationBarTitleText` 保持占位「站点名称」，直到首页 `onShow` 用配置里的站名调用 `wx.setNavigationBarTitle`。不把产品默认站名写进 json。

| 位置 | 行为 |
|------|------|
| 首页导航标题 | `siteName`。现有调用保留 |
| 首页品牌区 | 放在 Banner 之上。标志或站名，其下英文名，再其下口号。空行不占位 |
| 登录页品牌区 | 与首页同一套，替换现在的纯文字站名 |
| 找店、攻略、意向等 | 保留各自页面标题 |
| 底栏 | 文案仍是「首页」「找店」「我的」 |

标志用 `mode="aspectFit"`，宽度不超过品牌区。图片失败时改显示站名。

导航栏背景在拿到合法 `brandColor` 后调用 `wx.setNavigationBarColor`；调用失败时保持 `app.json` 里的 `#4BA3D9`。

### 2.6 `document.title` 与 favicon

三端 Web 的 `afterEach` 继续写 `{页面标题} · {siteName}`。门户 `main.ts` 在 `loadPublic` 完成后再写一次，避免标题停在占位站名上。商家、运营在公开配置返回后同样补写当前路由的标题。

站点图标：

1. 各端 `index.html` 继续指向 `/favicon.svg`，作为脚本运行前的图标。
2. 配置应用时，若 §1.5 给出图标地址，则设置已有 `link[rel="icon"]` 的 `href`。jpg 不标 `image/svg+xml`。
3. 没有合法 `faviconUrl` 和 `logoUrl` 时，把 `href` 设回 `/favicon.svg`。
4. `index.html` 不写测服地址。

### 2.7 缓存与生效

| 环节 | 行为 |
|------|------|
| 运营保存 | `PUT /api/admin/site-config`。后端作废公开配置缓存。前端不另调清缓存接口 |
| 浏览器 | 这一次公开 GET 使用 `cache: 'no-store'`。共享 `RequestOptions` 增加可选 `cache`，只有这条请求传入 |
| 门户 / 商家 / 运营 | 内存中的 Pinia 保存本次结果。不把品牌字段写入 `localStorage` |
| 小程序 | `ensureSite` 继续在页面显示时调用 `loadSite`，从而读到刚保存的配置 |
| 已打开的门户标签 | 下次整页加载或再次进入应用时更新。不做长连接 |

### 2.8 URL 判定

合法资源地址同时满足：`URL` 能解析，协议是 `http:` 或 `https:`。以下都当成空，于是走文字站名或默认图标：

- 空字符串、缺字段
- `javascript:`、`data:`、`blob:`
- 以 `//` 开头的协议相对地址
- 站内相对路径（小程序和另外两个 Web 源不同，相对路径不能当图床）

表单用同一判定拦截保存。读取端再判一次，避免旧数据直接进 `img` 或 `link`。

### 2.9 业务 PR 的测试

单测锁行为，不锁像素，也不要求 8080：

| 用例 | 期望 |
|------|------|
| 七字段对象往返 | `readSiteConfig` / `buildSiteConfigBody` 保留新键；主色仍规范为大写 |
| 清空口号、英文名、标志、图标 | 提交体里是 `""`，不是缺键 |
| 口号 41 字、站名空、主色非法、`javascript:` 图片地址 | 对应中文错误，且不发出 PUT |
| 公开体缺新键 | 英文名、口号、标志、图标都按空处理 |
| 有口号 | 副标题为该字符串 |
| 口号空或只有空白 | 无副标题 |
| 有合法标志 | 品牌位用图，`alt` 为站名 |
| 标志空或图片失败 | 品牌位为站名文字 |
| 仅有合法标志、无图标 | favicon 用标志地址 |
| 两者都空 | favicon 回到 `/favicon.svg` |
| `CHECKED_IN` | 断言仍是「已入住」。本包不改这个字符串 |

组件测试用配置入参传入站名和口号。这些字符串出现在测试夹具和本设计中，不出现在展示组件的字面量里。

### 2.10 实现顺序（后端字段可用之后）

1. 后端在公开接口和运营站点配置上提供 §2.1 的七字段，PUT 后公开读取能看到新值，空字符串能清空
2. `packages/shared` 的可见品牌纯函数、URL 判定，以及公开 GET 的 `cache: 'no-store'`
3. 门户 store、页头、标题、favicon
4. 运营表单、预览、读取和提交体；登录前读公开配置
5. 商家壳读公开配置，并套用站名或标志、主色、favicon
6. 小程序读取、首页导航标题、首页和登录品牌区
7. 按 §2.9 补测试。同步 `docs/FRONTEND.md`、`docs/FE-2-PORTAL.md`、`docs/FE-4-ADMIN.md` 里仍写着三字段的句子

---

## ③ 改动点

### 3.1 本 PR（只设计）

| # | 改动 |
|---|------|
| 1 | 新增 `docs/FE-TECH-DESIGN-站点品牌配置.md` |
| 2 | `README.md` 增加一行，指向上述设计 |

无 `apps/` 与 `packages/` diff。

### 3.2 后端字段就绪后的实现改动（本 PR 不做）

| # | 改动 | 位置 |
|---|------|------|
| 1 | 可见品牌纯函数与 `http(s)` 判定 | `packages/shared`；小程序 `domain` 一份同等实现 |
| 2 | `RequestOptions.cache`，公开配置 GET 传 `no-store` | `packages/shared` 的 HTTP 客户端；门户、商家、小程序的公开配置请求 |
| 3 | store 增加四个字段；空字符串覆盖可选字段 | `apps/portal/src/stores/site.ts` |
| 4 | 页头品牌簇：标志或站名、英文名、口号 | `apps/portal/src/components/SiteHeader.vue` |
| 5 | 配置返回后重写 `document.title`，并切换 favicon | 门户 `main.ts` 与三端守卫；各端保留 `/favicon.svg` 为脚本前图标 |
| 6 | 表单四字段、预览、校验、七字段 PUT | `SiteConfigView.vue`、`api/readers.ts`、`domain/copy.ts` |
| 7 | 登录前读公开配置，保存后更新运营壳 | `apps/admin` 的 `stores/site.ts`、`main.ts` |
| 8 | 商家启动读公开配置；壳和登录页显示标志或站名 | `apps/merchant` 的 store、`main.ts`、`ConsoleFrame.vue`、登录页 |
| 9 | 小程序读取、`globalData`、首页导航标题、首页与登录品牌区 | `apps/miniapp` 的 `api/readers.ts`、`app.ts`、`ui/site.ts`、首页与登录页 |
| 10 | §2.9 的单测 | 运营 `admin.test.ts`、shared、小程序读者测试 |
| 11 | 三字段文档改为七字段 | `docs/FRONTEND.md`、`docs/FE-2-PORTAL.md`、`docs/FE-4-ADMIN.md` |

页脚仍只显示站名文字和客服电话。意向状态、广告位、开城、支付相关空缺都不在这张表里。

---

## ④ 影响点

| 对象 | 影响 |
|------|------|
| 后端 | 业务 PR 开始前，公开 `GET /api/config/public` 与运营 `GET` / `PUT /api/admin/site-config` 都要返回 §2.1 的七个键。PUT 后作废公开配置缓存，下一次公开读取即为新值。空字符串表示清空英文名、口号、标志或图标。测服种子里的 `logoUrl`、`faviconUrl` 使用 §1.2 的两个地址。CORS 仍是 43123 / 43124 / 43125 |
| 门户 | 页头多英文行和副标题，二者可分别不渲染。标志失败或为空时品牌位是站名。页脚和欢迎语仍只用站名。公开配置失败不清游客令牌 |
| 运营 | `/site` 多四个输入。保存后面包屑标题和壳上的站名立即使用返回值。登录页改读公开配置后，未登录也能看到已发布的站名和标志 |
| 商家 | 壳和登录页从公开配置取站名或标志，不再停在环境变量占位。不展示口号。不新增路由 |
| 小程序 | 首页导航标题、首页品牌区、登录品牌区与门户同一份配置。底栏文案和功能页标题不变。微信后台启动图不在本配置内 |
| 站点图标 | 三端 Web 在配置返回后替换 `link[rel=icon]`。小程序不用 `faviconUrl` |
| 测服静态文件 | 标志和图标现由 `http://106.12.204.206:43123/brand/` 提供。换主机或改成 https 时只改配置。横版 jpg 画面含站名和口号时，与配置里的英文名、口号会同时出现；用表单改 URL 或清空文字即可，代码不按文件名分支 |
| 文案 | `CHECKED_IN` 保持「已入住」。本设计不改意向状态机 |
| 产品 | 无支付。改品牌不发版 |
| 测试 | 实现阶段按 §2.9。本 PR 无新测试，因为没有业务代码 |
| 风险 | ① 后端未发字段时，四个新键按空处理，用户只看到占位站名和默认图标。② 可选字段若沿用「非空才覆盖」，清空口号不会在下次读取后消失。③ 把测服 URL 写进组件后，生产换图必须发版。④ 公开配置被缓存时，保存后刷新仍是旧字；所以这条 GET 使用 `no-store`，并由后端作废服务端缓存。⑤ 横版种子图自带文字时，页头会图字各一份。⑥ 测服地址是 `http`。页面若以 `https` 打开，浏览器可能拦截该图；把配置改成 `https` 地址即可，不用改代码 |

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 站点品牌-1 | 2026-10-18 | 首版前端技术设计。覆盖门户、商家壳、运营 `/site`、小程序导航与品牌区。测服种子 `logoUrl`、`faviconUrl` 记入 §1.2。不含业务代码 |
