import { defineConfig } from "vitepress";
import { sidebar } from "./sidebar";

export default defineConfig({
  title: "Elasticsearch 学习笔记",
  description: "按章节拆分的 Elasticsearch 文档站",
  lang: "zh-CN",
  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }]],
  ignoreDeadLinks: true,
  cleanUrls: false,
  srcExclude: ["**/README.md"],
  lastUpdated: false,
  markdown: {
    lineNumbers: true,
  },
  themeConfig: {
    nav: [
      { text: "首页", link: "/" },
      { text: "文档", link: "/chapters/chapter-01/" },
      { text: "文档连续阅读", link: "/legacy/index.html", target: "_blank", rel: "noopener noreferrer" },
      { text: "B站视频", link: "https://www.bilibili.com/video/BV1hh411D7sb" },
      { text: "原文链接", link: "https://blog.csdn.net/u011863024/article/details/115721328" },
      { text: "其他笔记", link: "/project-notes-elasticsearch" },
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
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: "搜索文档",
                buttonAriaLabel: "搜索文档",
              },
              modal: {
                noResultsText: "未找到相关结果",
                resetButtonTitle: "清除查询条件",
                footer: {
                  selectText: "选择",
                  navigateText: "切换",
                  closeText: "关闭",
                },
              },
            },
          },
        },
      },
    },
  },
});
