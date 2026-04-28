import { defineConfig } from "vitepress";
import { sidebar } from "./sidebar";

export default defineConfig({
  title: "Elasticsearch 学习笔记",
  description: "按章节拆分的 Elasticsearch 文档站",
  lang: "zh-CN",
  ignoreDeadLinks: true,
  cleanUrls: true,
  srcExclude: ["**/README.md"],
  lastUpdated: false,
  themeConfig: {
    nav: [
      { text: "首页", link: "/" },
      { text: "文档", link: "/chapters/chapter-01/" },
      { text: "单页阅读风格", link: "/legacy/index.html", target: "_blank", rel: "noopener noreferrer" },
      { text: "B站视频", link: "https://www.bilibili.com/video/BV1hh411D7sb" },
      { text: "原文链接", link: "https://blog.csdn.net/u011863024/article/details/115721328" },
    ],
    sidebar,
    socialLinks: [{ icon: "github", link: "https://github.com/xgzit/elastic-md" }],
    outline: {
      level: [2, 4],
      label: "当前页导航",
    },
    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },
    search: {
      provider: "local",
    },
  },
});
