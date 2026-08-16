# CNAP Design System

> 来源：Figma 文件 `GRkvwNuoeXDYxS7yJ3Bpru`，节点 `467:7514`「基础间距规则」
> 提取范围：运行配置页面的整体尺寸、间距、表单模块、常用控件尺寸和页面组合规则。
> 用途：CNAP demo 后续页面实现的视觉 SSOT。页面具体业务内容仍以对应 Figma 页面为准。

## 一、全局设计基调

- 使用轻量、密集、可扫描的云平台管理台风格。
- 配置页面由面包屑、页面标题、分栏导航、分组标题和设置项列表组成。
- 设置项优先采用“左侧名称与说明、右侧控件”的横向结构，不使用两列营销式表单布局。
- 复杂配置通过分组、分隔线和辅助说明展开层级；不把所有字段压缩在同一行。

## 二、色彩系统

| Token 名称 | 值 | 用途 |
|---|---|---|
| `color-text-primary` | `#181818` | 页面标题、正文、字段名称 |
| `color-text-secondary` | `#545454` | 辅助正文、单位、次要信息 |
| `color-text-tertiary` | `#8F8F8F` | 描述文字、导航辅助文字 |
| `color-text-placeholder` | `#BFBFBF` | 输入框占位文本 |
| `color-text-disabled` | `#CCCCCC` | 禁用控件文字 |
| `color-border-default` | `#D9D9D9` | 输入框、选择器、按钮默认边框 |
| `color-border-divider` | `#E8E8E8` | 设置项和模块分隔线 |
| `color-bg-disabled` | `#F7F7F7` | 禁用输入框背景 |
| `color-bg-selected` | `#E6FAF1` | 导航或配置树当前选中态 |
| `color-brand-light` | `#A7F3CF` | CNAP 绿色强调、深色主按钮文字 |

## 三、字体系统

| Token 名称 | 字体 | 字重 | 字号 | 行高 | 用途 |
|---|---|---:|---:|---:|---|
| `font-body` | PingFang SC | 400 | 14px | 22px | 正文、字段名称、控件文本 |
| `font-helper` | PingFang SC | 400 | 12px | 18px | 字段说明、辅助信息、导航辅助文字 |
| `font-page-title` | PingFang SC | 600 | 24px | 32px | 页面标题 |
| `font-section-title` | PingFang SC | 500 | 16px | 24px | 分组标题 |

## 四、间距与尺寸

### 4.1 基础间距

| Token 名称 | 值 | 用途 |
|---|---:|---|
| `spacing-xs` | 4px | 图标与文字的紧邻间距 |
| `spacing-s` | 8px | 单行组件组合、组件与文字之间 |
| `spacing-m` | 12px | 控件内部横向 padding、较小模块间距 |
| `spacing-l` | 16px | 卡片内边距、分组之间、设置项左右内缩 |
| `spacing-xl` | 24px | 页面模块之间 |
| `spacing-2xl` | 32px | 页面主区左右边距或大区块间距 |

### 4.2 页面与组件尺寸

| Token 名称 | 值 | 用途 |
|---|---:|---|
| `runtime-content-width` | 815px | 运行配置主内容区示例宽度；不是全站固定画布宽度 |
| `runtime-card-padding` | 16px | 设置卡片内部左右 padding |
| `runtime-group-gap` | 16px | “容量与变更”“资源调度”等大分组之间 |
| `control-height-md` | 32px | 默认输入框、Select、Switch 所在控制行 |
| `switch-width` | 32px | 开关宽度；节点中实测高度 20px |
| `recommended-control-width-s` | 80px | 短 Select 或短输入值 |
| `recommended-control-width-m` | 100px | 常规数字输入框 |
| `recommended-control-width-l` | 160px | 较长输入框或组合选择器 |
| `setting-icon-box` | 22px | 设置项左侧图标容器 |

页面示例画布为 `3190px × 2476px`，这是规范页画布尺寸，不得作为业务页面的固定 viewport。业务页面应使用响应式布局；主内容区和控件宽度按上表的页面模式约束。

## 五、圆角、阴影与描边

| Token 名称 | 值 | 用途 |
|---|---|---|
| `radius-sm` | 2px | 复选框等小型图标控件 |
| `radius-md` | 4px | 小型标签、紧凑导航项 |
| `radius-lg` | 8px | 输入框、Select、普通按钮和卡片 |

- 默认描边使用 `1px solid #D9D9D9`。
- 列表分隔线使用 `1px solid #E8E8E8`。
- 当前节点未提供可确认的统一阴影值，不能擅自新增阴影 token。

## 六、组件规范

### Input / InputNumber / Select

| 属性 | 规格 |
|---|---|
| 高度 | 32px |
| 常规圆角 | 8px |
| 默认边框 | `1px solid #D9D9D9` |
| 推荐宽度 | 80px / 100px / 160px |
| 禁用背景 | `#F7F7F7` |

### Switch

| 属性 | 规格 |
|---|---|
| 宽度 | 32px |
| 高度 | 20px |
| 使用位置 | 设置项右侧或子配置行右侧 |

### Setting Row

| 属性 | 规格 |
|---|---|
| 左右内缩 | 16px |
| 左侧图标盒 | 22px × 22px |
| 标题文字 | 14px / 22px |
| 描述文字 | 12px / 18px，只有设计稿需要说明时显示 |
| 右侧控件 | 与行右侧对齐 |
| 分隔线 | `1px solid #E8E8E8` |

## 七、页面模式

运行配置页面模式见 [patterns/runtime-config.md](patterns/runtime-config.md)。

数字输入组件规范见 [docs/design-system/input-number.md](../docs/design-system/input-number.md)。

## 八、AI 生成约束

- 后续 CNAP 配置页必须优先加载本文件和 `patterns/runtime-config.md`。
- 页面内容区不得用规范页的 `3190px` 作为固定宽度。
- 输入框、数字选择器和 Select 默认高度必须为 `32px`。
- 普通组合控件之间、控件与文字之间默认使用 `8px` 间距。
- 配置卡片内部左右 padding 使用 `16px`，大分组之间使用 `16px`。
- 配置项使用横向列表结构：左侧图标和字段说明，右侧控件；不要改成两列表单网格，除非新的 Figma 页面明确如此设计。
- 页面标题、正文、辅助说明分别使用 `24/32px`、`14/22px`、`12/18px`层级。
- 颜色必须优先使用本文件 token，不能随意引入新的高饱和主色。

## 九、待补充范围

本页主要覆盖运行配置页面模式和基础间距。以下内容仍需对应 Figma 规范页后提取：

- 顶部产品导航和一级、二级导航的完整尺寸规范
- Button、Checkbox、Tag、Toast、Modal、Drawer 完整状态
- 表格、分页和数据密度规范
- 图标库命名、尺寸和描边规则
