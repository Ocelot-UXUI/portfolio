# 继承自组件规范

适用范围：运行配置中带有左侧圆形继承 icon 的配置项，包括镜像构建、资源规格、运行、卷挂载、端口、健康检查和凭证管理。

## 核心规则

- 每一个可配置项都是一个独立 scope。scope 只能覆盖本行或本小组自己的控件，不能把相邻配置项包进来。
- 每个 scope 只有一个继承 icon。icon 必须是 `button.runtime-setting-icon`，并且位于 scope 的直接子级；复杂小组的 icon 位于该小组标题的直接子级。
- 点击某个 icon 只切换当前 scope：进入本地覆盖时解锁当前 scope 内的 input、select、textarea、switch 和 action button；其他 scope 保持原状态。
- 初始状态为继承：控件 disabled，继承 icon 可点击，scope 显示禁用态。
- 本地覆盖状态：控件 enabled，icon 显示 active 状态；再次点击先进入恢复确认态，再次确认后恢复初始值和继承状态。
- 继承 icon 的 tooltip 文案必须说明当前继承层级和点击后的结果，不能复用整组配置的状态文案。

## 镜像构建映射

镜像构建中以下项目分别是独立 scope：

`镜像来源`、`基础镜像`、`预装组件`、`自定义 Dockerfile 命令`、`代码库`、`部署路径`、`启动命令`、`默认参数`、`压缩格式`、`多平台构建`。

`基础镜像` 的 scope 只包含基础镜像 tabs、卡片和版本选择；不能包含镜像来源、预装组件或后续构建配置。

## 实现约束

- 初始化逻辑必须按 scope 查询继承 icon，禁止把整个 `.runtime-image-list` 作为一个继承 scope。
- 动态添加的配置行必须在插入 DOM 后再初始化继承状态。
- 删除或移动配置行时，必须保持该行的 icon、控件和 tooltip 在同一个 scope 内。
- 新增设计稿区域时，先确认层级边界，再复用 `setupRuntimeFieldActivation()`；不能通过扩大已有 scope 来快速覆盖新内容。
