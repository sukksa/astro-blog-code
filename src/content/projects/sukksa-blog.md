---
title: "Sukksa's Blog"
slug: sukksa-blog
published: 2026-10-18
draft: false
order: 100
description: "这个博客本身：Astro + Firefly 主题，静态构建，托管在 Vercel。"
image: ""
status: "published"
tags:
  - Astro
  - 博客
link:
  - label: "Firefly 主题"
    icon: "fa7-brands:github"
    value: "https://github.com/CuteLeaf/Firefly"
  - label: "Astro 文档"
    icon: "material-symbols:menu-book"
    value: "https://docs.astro.build/zh-cn/"
---

## 关于这个站点

一个纯静态的个人博客：内容写在 Markdown 里，构建时生成全部页面，没有后端、没有数据库。

- **框架**：[Astro](https://astro.build/) 7，静态生成
- **主题**：[Firefly](https://github.com/CuteLeaf/Firefly)
- **托管**：Vercel（`dist/` 静态产物）
- **写作**：`pnpm new-post 文章名` 或直接在 `src/content/posts/` 新建 `.md`

## 为什么选静态站

改一篇文章就重建一次，成本几乎为零；但换来的是更快的首屏、更少的维护，以及"整个博客可以放进一个 Git 仓库"这种安心感。
