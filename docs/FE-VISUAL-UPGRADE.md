# 前端观感改版 · MVP-0

不改流程、字段、状态机、路由和 API 契约。主色保持 `#4BA3D9` / hover `#3A8FC4` / soft `#E8F4FC` / 页底 `#F4F8FB`。`CHECKED_IN` 只展示「已入住」。没有支付、定金或收银台入口。

## 概要设计

三端继续用各自的 `tokens.css`，不抽共享样式包。品牌三色、页底、字阶、间距和 Element Plus 的 light/dark 阶都走 CSS 变量。实心主按钮字色用 `--color-on-brand`（默认浅蓝底为 `#1A1A1A`），盖过 Element Plus 写死的白字。门户补齐顶栏、Hero、Chip、卡片、列表筛选和详情 CTA。运营入驻队列页顶放三张工作台卡，分别进入意向、入驻、上下架队列，不新开路由。运营和商家登录共用居中白卡。空态、骨架和意向 Banner 用现有组件收口。

## 详细设计

1. Token：Brand、hover、soft、页底、字号、字重、间距、圆角、阴影、状态 soft 色、`--color-brand-light-*` / `--color-brand-dark-2`。`applyBrandColor` 同步 `--el-color-primary`、`light-3/5/7/8/9`、`dark-2` 和 rgb。
2. 实心主按钮：门户 `.btn-primary` 与运营/商家 `button.el-button.el-button--primary`（排除 plain/text/link）强制 `color: var(--color-on-brand, #1a1a1a)`。文字按钮和描边按钮仍用 Brand 字。
3. 门户首页：顶栏单行 64px；Hero 浅渐变；搜索按钮「找农家乐」；目的地 Chip，无数据时「目的地即将开通」并链到列表；推荐卡 16:10，无图占位高 180px、Caption「暂无图片」居中；攻略封面 3:2。
4. 列表：左筛至少 220px，窄屏收成顶部抽屉。地区和价格用 Chip，选中 Brand 实心反白。排序用 Segmented。收起和清空用文字按钮。结果为横卡。
5. 详情：对客标签只来自 `portalVisitorTags`（可留「首页推荐」和特色；不渲染排序 N、上架态）。无图为约 4:3、高度不超过 360px 的 soft 占位。主按钮「提交意向」在窄屏为底部固定栏、宽屏为右侧 sticky，旁有幽灵「拨打电话」和与 Banner 同语义的非锁房短句；中部 Banner 默认可收起。登录回跳仍带房源 id。套餐到交通为白卡片，段间距 16。不可订时按钮变灰，旁侧红字。列表对客说明不出现「上架」。首页仅有省时显示「按地区挑选（更多目的地即将开通）」，有区则出区 Chip。
6. 意向 Tag：`CONFIRMED` 三端为 info（信息蓝底加描边，不用 Element Plus primary）。已关闭为中性灰。门户「我的意向」Tag 为 `fit-content` chip，不拉满整卡。商家详情状态单元格始终渲染 `el-tag`。
7. 登录：页底 `#F4F8FB`，白卡垂直居中，站名 Caption 在标题上，标题用 Brand。输入 focus 为 2px Brand 环。登录按钮高 44、全宽。
8. 后台：侧栏当前项 Brand Soft 加左边线。表头用页底色。入驻页三张 SummaryCard。商家门店改为卡片，没有「新建门店」。

## 改动点

- `packages/shared/src/brand.ts`：`elementPrimaryVars`、`mixWithBlack`，`applyBrandColor` 写入 Element Plus 色阶。
- 三端 `styles/tokens.css`，运营/商家 `base.css`、`admin.css`、`merchant.css`，门户 `portal.css`。
- 门户：顶栏、首页、列表、详情、房源卡、攻略卡。
- 运营：登录、入驻队列三卡、意向 Tag、侧栏和表头、房源编辑推荐区。
- 商家：登录、门店卡、门店编辑分组、意向 Tag 与详情状态格。
- `CHECKED_IN` 文案表未改，仍只输出「已入住」。

## 影响点

- 只影响观感。查询参数、提交字段、状态迁移、路由和接口路径不变。
- 站点配置改主色后，门户和后台通过 `applyBrandColor` 读到新的 primary 与 light/dark 阶。过深或过艳仍按产品抽检 VA-5 记问题。
- 详情不再展示运营芯片；上架与否仍由 `canSubmitIntent` 决定按钮是否可点。
- 工作台数字是现有列表接口的待处理总数，失败时显示「—」，不新增接口。
- 静态包可用 `VITE_API_BASE=http://106.12.204.206:8080` 重打。
