# Elasticsearch 学习笔记文档站

基于 CSDN 原文数据构建的本地前端文档项目，包含完整章节内容与优化排版。

## 本地运行

```bash
npm run dev
```

默认开启 Vite HMR（修改 `public/` 下文件自动热更新）。

```bash
npm run build
npm run preview
```

默认访问地址：`http://127.0.0.1:5178`

## 数据提取

`article.html` 为抓取后的原始页面源码。可通过下面命令重新提取正文数据：

```bash
npm run extract
npm run localize:images
```

输出文件：

- `public/data/article-content.html`：文档正文 HTML
- `public/data/meta.json`：标题、来源、提取时间等元信息
- `public/assets/article-images/`：本地化后的原文图片资源

## 主要特性

- 经典文档站布局：顶部信息、左侧章节导航、右侧页面导览
- 全文完整落地（按原文正文提取）
- 移动端适配（抽屉式目录）
- 阅读优化：代码块、表格、引用、图片统一样式
