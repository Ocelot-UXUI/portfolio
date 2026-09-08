# 郭昱成｜UX/UI 作品集

这是一个纯静态 HTML 作品集网站，首页统一承载多个项目入口；案例交付物和交互 Demo 分开维护，互不嵌套源码。

**在线浏览：** [ocelot-uxui.github.io/portfolio](https://ocelot-uxui.github.io/portfolio/)

## 项目入口

- [作品集首页](https://ocelot-uxui.github.io/portfolio/)
- [商汤｜主动 AI 记忆助手](https://ocelot-uxui.github.io/portfolio/pages/case.html)
- [百度｜CNAP B 端系统体验重构](https://ocelot-uxui.github.io/portfolio/pages/cnap-case.html)
- [跳读｜职场人阅读学习 APP](https://ocelot-uxui.github.io/portfolio/pages/skip-read.html)
- [小红书｜本地生活项目](https://ocelot-uxui.github.io/portfolio/pages/xiaohongshu.html)
- [设计工具｜评审自检 Skill 与素材导出器](https://ocelot-uxui.github.io/portfolio/pages/design-review-skill.html)

## 目录

```text
.
├── index.html              # 作品集首页
├── pages/                  # 项目交付物页面与 Demo 包装页
├── styles/                 # 全站公共样式与项目导航
├── scripts/                # 全站共享交互脚本
├── assets/                 # 按项目和用途归档的图片、字体与视频素材
├── demos/                  # 独立 Demo 源码，不改变首页入口结构
└── docs/                   # 项目说明文档
```

## 本地页面入口

- `index.html`：项目目录
- `pages/case.html`：Remi AI 案例讲述
- `pages/cnap-research.html`：CNAP 项目交付物
- `demos/workload-demo/index.html`：CNAP 工作负载交互 Demo
- `pages/dodo.html`：Dodo 项目入口
- `pages/skip-read.html`：快速阅读 APP
- `pages/xiaohongshu.html`：小红书本地生活项目

首页中的项目卡片继续指向 `pages/` 下的正式入口；Demo 通过项目页的切换入口进入，公开 URL 保持不变。

## 本地预览

在仓库根目录运行任意静态服务器，例如：

```bash
python3 -m http.server 8000
```

然后打开 <http://localhost:8000>。

## 维护原则

- 不移动或删除已公开的 `index.html`、`pages/` 和 `demos/` 入口。
- Demo 内部资源只放在对应的 `demos/<name>/` 目录，公共作品集导航只复用 `styles/` 和 `scripts/`。
- `agent/*` 等历史开发分支仅用于追溯，不作为线上页面的源码基准。
