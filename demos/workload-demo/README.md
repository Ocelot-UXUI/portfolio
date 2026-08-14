# CNAP 工作负载 Demo

页面实现需遵守仓库级 [CNAP Design System](../../design-system/design.md)，运行配置页面模式见 [runtime-config.md](../../design-system/patterns/runtime-config.md)。

基于 Figma `CNAP 备份` 的「视觉 工作负载」方案 1，交互规则参考同文件 `【6.23】工作负载`。

直接打开 `index.html` 即可预览。当前版本包含：工作负载分组折叠/展开、全部收起/展开、搜索、状态与集群筛选、分页和每页条数设置。

## 可复用组件

`components/cnap-select.js` 和 `components/cnap-input.js` 是 CNAP Select/Input 组件的原生 JavaScript 实现，样式位于 `styles.css`。新增页面需要这些组件时，复用现有类名和状态规则，并在页面中先引用组件脚本，再引用页面业务脚本：

```html
<div class="filter-select" data-filter-select="mySelect">
  <button type="button" class="filter-select-trigger" aria-haspopup="listbox" aria-expanded="false">
    <span></span><svg aria-hidden="true"><use href="#i-chevron-down"></use></svg>
  </button>
  <div class="filter-select-menu" role="listbox"></div>
  <select id="mySelect" class="filter-select-native" aria-label="选择内容">
    <option value="all">请选择内容</option>
  </select>
</div>
<script src="./components/cnap-select.js"></script>
<script>CNAPSelect.initAll();</script>
```

组件只负责触发器、下拉选项、状态和原生值同步；具体筛选结果、数据请求和页面状态由各页面自己处理。

筛选区搜索框使用 `cnap-search-input` 类，按 CNAP 大号 Input 组件规范实现：`32px` 高、`8px` 圆角、`16px` 搜索图标，支持默认、悬停、聚焦和禁用状态。
