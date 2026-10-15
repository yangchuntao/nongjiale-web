# 苏中种子 / Suzhong Seed

农家乐垂直平台前端空仓。技术栈为 Vue 3、Vite、TypeScript。正式版从零开始。

Empty frontend repository for a Chinese rural farmstay (农家乐) marketplace. Stack: Vue 3, Vite, and TypeScript. The production app starts from zero.

当前仓库只包含可运行的骨架：Vue Router 4、Pinia，以及一个占位首页。没有房源列表、详情、商家端或管理端。

This repository is a runnable skeleton only: Vue Router 4, Pinia, and one placeholder home view. There are no listing, detail, merchant, or admin pages.

## 技术栈 / Stack

- Vue 3 + TypeScript
- Vite
- Vue Router 4
- Pinia
- 单文件组件，使用 `<script setup>` / Single-file components with `<script setup>`

## 本地运行 / Run locally

需要 Node.js 22 或更高版本。

Node.js 22 or newer is required.

```bash
npm install
npm run dev
```

开发服务器默认地址为 `http://127.0.0.1:5173`。

The dev server defaults to `http://127.0.0.1:5173`.

## 构建 / Build

```bash
npm install
npm run build
```

构建产物在 `dist/`。本地预览：

Output is written to `dist/`. Preview it locally with:

```bash
npm run preview
```

## 目录 / Layout

```text
src/
  main.ts            创建应用，挂载 Pinia 与路由 / create the app, install Pinia and the router
  App.vue            渲染路由出口 / render the router outlet
  router/index.ts    仅注册首页路由 / home route only
  stores/app.ts      占位用的应用状态 / placeholder app state
  views/HomeView.vue 占位首页 / placeholder home view
```
