# Elasticsearch 学习笔记（VitePress 版）

## 开发与构建

```bash
npm run dev
```

- 启动流程：提取原文 -> 本地化图片 -> 章节拆分 -> 启动 VitePress
- 地址：`http://127.0.0.1:5178`

```bash
npm run build
```

- 构建流程：提取原文 -> 本地化图片 -> 章节拆分 -> VitePress 生产构建
- 产物目录：`docs/.vitepress/dist`（构建后会同步复制到仓库根目录 `dist`）

## 关键脚本

- `npm run extract`：从 `article.html` 提取正文到 `public/data/article-content.html`
- `npm run localize:images`：下载并替换正文图片为本地资源
- 图片统一存放在 `docs/public/article-images`（不再保留仓库根目录 `public/assets` 副本）
- `npm run migrate:docs`：按 `h2/h3` 自动拆分为章节与子文档（模块化迁移）

## 模块化迁移架构

目录：`tools/vitepress-migration/`

- `parse-source.js`：解析章节/子章节结构
- `html-to-markdown.js`：HTML 转 Markdown（代码块/表格/图片保真）
- `write-docs.js`：输出 Markdown 页面（不再依赖 HTML 注入）
- `write-sidebar.js`：生成多级 sidebar
- `copy-assets.js`：复制图片资源到 `docs/public`
- `validate.js`：执行内容一致性校验
- `index.js`（`tools/vitepress-migration/index.js`）：编排迁移流程

## 交互说明

- 左侧：章节树（含子文档）
- 右侧：当前页面大纲（VitePress Outline）
- 图片失败兜底与异常面板：`docs/.vitepress/theme/runtime/`
