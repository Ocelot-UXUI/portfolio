# 作品集吸顶导航维护提纲

本清单用于统一检查顶部导航的布局、颜色、选中态、Hover 动效和滚动吸顶行为。

## 首页导航

- `index.html`
  - Logo：GUOYUCHENG
  - 中部：首页锚点导航
  - 右侧：Contact

## 项目与交付物导航

- `pages/case.html`：主动式 AI 记忆助手项目案例
- `pages/remi.html`：主动式 AI 记忆助手交互 Demo
- `pages/remi-materials.html`：主动式 AI 记忆助手交付物
- `pages/remi-deliverables.html`：主动式 AI 记忆助手交付物兼容入口
- `pages/cnap-research.html`：CNAP 交付物
- `demos/workload-demo/index.html`：CNAP 交互 Demo
- `pages/skip-read.html`：快速阅读 APP
- `pages/xiaohongshu.html`：小红书本地生活
- `pages/dodo.html`：AI 设计工作流实践项目案例
- `pages/dodo-demo.html`：Dodo 正式版交互 Demo
- `pages/dodo-materials.html`：AI 设计工作流项目交付物

## 兼容入口

- `xiaohongshu.html`：立即跳转到 `pages/xiaohongshu.html`，不单独维护视觉状态。
- `pages/dodo-demo-official.html`：立即跳转到 `pages/dodo-demo.html`，保留旧链接兼容。

## 共享实现

- `styles/project-navigation.css`：项目导航布局、状态与 Random Letter Swap 样式。
- `scripts/project-navigation.js`：项目展示标签、选中线与 Random Letter Swap 行为。
- 首页复用上述共享 CSS/JS，避免两套 Hover 动效分叉。

## 不在统一范围内

- Demo 产品内部的业务导航、面包屑、Tab、侧栏和工具栏不属于作品集吸顶导航，不应用作品集文字动效。
- `netlify-dist/` 是构建产物，不作为源文件维护。
