const gearSets = [
  [
    { title: "灵感画板", copy: "把零散素材整理成可继续探索的视觉方向", image: "image_25.png", border: "#f2d6b7" },
    { title: "百度文化宝典", copy: "查询公司文化、制度与常用内部知识", image: "image_26.png", border: "#cbe8c5" },
    { title: "深度研究锦囊", copy: "围绕一个主题完成资料检索与结构化研究", image: "image_28.png", border: "#bfd8f6" }
  ],
  [
    { title: "用户访谈助手", copy: "从访谈记录中提炼痛点、行为与机会点", image: "image_26.png", border: "#cbe8c5" },
    { title: "方案评审官", copy: "检查设计目标、状态覆盖和交付完整性", image: "image_28.png", border: "#bfd8f6" },
    { title: "灵感画板", copy: "把零散素材整理成可继续探索的视觉方向", image: "image_25.png", border: "#f2d6b7" }
  ]
];

const sectionCopy = {
  knowledge: ["知识", "集中管理 dodo 可以调用的文档、资料和个人知识。", "assets/navigation/image_3.png"],
  artifacts: ["产物", "查找 dodo 在任务中生成的文档、图片与代码。", "assets/navigation/image_5.png"],
  automation: ["自动化任务", "管理定时运行、事件触发和持续执行的任务。", "assets/navigation/image_6.png"],
  settings: ["设置", "管理模型、通知和工作区偏好。", "assets/navigation/image_7.png"]
};

let skills = [
  { id: 1, category: "personal", name: "设计评审", description: "从目标、交互和视觉维度检查设计方案", icon: "image_12.png", enabled: true, editable: true },
  { id: 2, category: "personal", name: "用户访谈总结", description: "提炼访谈中的痛点、行为模式和机会点", icon: "image_15.png", enabled: true, editable: true },
  { id: 3, category: "personal", name: "竞品分析", description: "对比产品策略、核心功能和体验差异", icon: "image_17.png", enabled: false, editable: true },
  { id: 4, category: "personal", name: "作品集故事", description: "把项目过程整理成清晰、有证据的案例故事", icon: "image_18.png", enabled: true, editable: true },
  { id: 5, category: "personal", name: "数据洞察", description: "从业务数据中定位体验问题和设计机会", icon: "image_19.png", enabled: false, editable: true },
  { id: 6, category: "team", name: "团队设计规范", description: "查询团队组件、样式与交付规范", icon: "image_38.png", enabled: true, editable: false },
  { id: 7, category: "team", name: "需求预审", description: "检查需求目标、边界与异常状态是否完整", icon: "image_49.png", enabled: true, editable: false },
  { id: 8, category: "builtIn", name: "dodo-ip-emoji-creato-2.0", description: "dodo IP 表情包创作工具。触发词：dodo emoji 表情、dodo IP 表情…", icon: "image_12.png", enabled: true, editable: false },
  { id: 9, category: "builtIn", name: "product-iteration-planner", description: "产品功能上线后的二次迭代分析助手。支持灵活的材料准备方式", icon: "image_15.png", enabled: false, editable: false },
  { id: 10, category: "builtIn", name: "dodo-ip-emoji-creato-2.0", description: "dodo IP 表情包创作工具。触发词：dodo emoji 表情、dodo IP 表情…", icon: "image_17.png", enabled: true, editable: false },
  { id: 11, category: "builtIn", name: "product-iteration-planner", description: "产品功能上线后的二次迭代分析助手。支持灵活的材料准备方式", icon: "image_19.png", enabled: false, editable: false }
];

let artifacts = [
  { id: 1, name: "snake.html", type: "HTML", size: "12.96 KB", date: "2025-12-25 00:23", favorite: false, asset: "code-preview.png" },
  { id: 2, name: "dodo骑马.png", type: "图片", size: "12.96 KB", date: "2025-12-25 00:23", favorite: false, asset: "horse-preview-2.png" },
  { id: 3, name: "53ae4364_产品设计技术文档_V1.0.pdf", type: "PDF", size: "12.96 KB", date: "2025-12-25 00:23", favorite: false, asset: "document-preview-2.png" },
  { id: 4, name: "53ae4364_产品设计技术文档_V1.0.pdf", type: "PDF", size: "12.96 KB", date: "2025-12-25 00:23", favorite: false, asset: "document-preview.png" },
  { id: 5, name: "snake.html", type: "HTML", size: "12.96 KB", date: "2025-12-25 00:23", favorite: false, asset: "code-preview.png" },
  { id: 6, name: "dodo骑马.png", type: "图片", size: "12.96 KB", date: "2025-12-25 00:23", favorite: true, asset: "character-preview.png" },
  { id: 7, name: "产品设计技术文档_V1.0.pdf", type: "PDF", size: "12.96 KB", date: "2025-12-25 00:23", favorite: false, asset: "document-preview-2.png" },
  { id: 8, name: "dodo骑马.png", type: "图片", size: "12.96 KB", date: "2025-12-25 00:23", favorite: false, asset: "horse-preview-2.png" }
];
let recycleBin = [];
let artifactTotalCount = 82;
let artifactFavoriteOnly = false;
let artifactLayout = "grid";
let artifactQuery = "";
let pendingArtifactDeleteId = null;
let activeArtifactMenuId = null;

const recommendedSkillPages = [
  [
    { name: "龙虾社区", description: "这里是龙虾专属的效率社区——“龙虾充电站”…", mark: "", uses: "10" },
    { name: "daily-ai-news", description: "龙虾每日 AI 热点推送，包含图片和查看原文", mark: "", uses: "10" },
    { name: "每日热榜", description: "每日热榜技能 - 查询微博、知乎、B 站、抖音等…", mark: "", uses: "10" }
  ],
  [
    { name: "企业搜索", description: "百度企业内部六类信息检索与分析", mark: "", uses: "10" },
    { name: "龙虾社区", description: "发现龙虾专属的效率经验和实用技巧", mark: "", uses: "10" },
    { name: "文档摘要", description: "读取长文档并给出重点、风险和行动项", mark: "", uses: "10" }
  ]
];

let conversations = [
  { id: 1, title: "dodo，我是不会使用 AI 产品的小白用户，请介绍你拥有什么功能", source: "客户端", icon: "source-web.svg", favorite: false, pinned: true },
  { id: 2, title: "如流单聊·wangxinyang", source: "客户端", icon: "source-web.svg", favorite: false, pinned: false },
  { id: 3, title: "AI 行业资讯日报", source: "自动化任务", icon: "source-alarm.svg", favorite: false, pinned: false },
  { id: 4, title: "设计系统规范转 Figma 结构化 Markdown", source: "客户端", icon: "source-book.svg", favorite: true, pinned: false },
  { id: 5, title: "Web 端设计系统规范文档", source: "如流端", icon: "source-book.svg", favorite: false, pinned: false },
  { id: 6, title: "次级模型无限额自动切换方案", source: "网页端", icon: "source-sphere.svg", favorite: false, pinned: false }
];

const sourceIcons = {
  "客户端": "assets/navigation/source-web.svg",
  "如流端": "assets/navigation/source-book.svg",
  "自动化任务": "assets/navigation/source-alarm.svg",
  "专属工区": "assets/navigation/image_23.png",
  "网页端": "assets/navigation/source-sphere.svg",
  "飞书": "assets/navigation/image_3.png"
};

const prompt = document.querySelector("#prompt");
const promptForm = document.querySelector("[data-prompt-form]");
const sendButton = document.querySelector(".send-button");
const homeView = document.querySelector("[data-home-view]");
const skillsView = document.querySelector("[data-skills-view]");
const artifactsView = document.querySelector("[data-artifacts-view]");
const placeholderView = document.querySelector("[data-placeholder-view]");
const skillsList = document.querySelector("[data-skills-list]");
const skillsCount = document.querySelector("[data-skills-count]");
const skillsSearch = document.querySelector("[data-skills-search]");
const skillCreateButton = document.querySelector("[data-skill-create-button]");
const skillCreateMenu = document.querySelector("[data-skill-create-menu]");
const skillUploadModal = document.querySelector("[data-skill-upload-modal]");
const skillShareModal = document.querySelector("[data-skill-share-modal]");
const skillUploadForm = document.querySelector("[data-skill-upload-form]");
const skillShareForm = document.querySelector("[data-skill-share-form]");
const skillFileInput = document.querySelector("[data-skill-file]");
const skillRecommendations = document.querySelector("[data-skill-recommendations]");
const skillDetailModal = document.querySelector("[data-skill-detail-modal]");
const gearGrid = document.querySelector("[data-gear-grid]");
const modelButton = document.querySelector("[data-model-button]");
const modelMenu = document.querySelector("[data-model-menu]");
const sidebar = document.querySelector("#sidebar");
const sidebarScroll = document.querySelector(".sidebar-scroll");
const backdrop = document.querySelector("[data-sidebar-backdrop]");
const toast = document.querySelector("[data-toast]");
const conversationList = document.querySelector("[data-conversation-list]");
const conversationSearch = document.querySelector("[data-conversation-search]");
const conversationSearchInput = document.querySelector("[data-conversation-search-input]");
const conversationSearchClear = document.querySelector("[data-conversation-search-clear]");
const floatingMenu = document.querySelector("[data-floating-menu]");
const workspaceModal = document.querySelector("[data-workspace-modal]");
const workspaceForm = document.querySelector("[data-workspace-form]");
const artifactGrid = document.querySelector("[data-artifact-grid]");
const artifactDeleteModal = document.querySelector("[data-artifact-delete-modal]");
const recycleModal = document.querySelector("[data-recycle-modal]");
let gearSetIndex = 0;
let conversationTab = "all";
let conversationFilter = "all";
let conversationQuery = "";
let multiSelectMode = false;
let selectedConversations = new Set();
let activeSkillCategory = "builtIn";
let activeSkillPage = 0;
let activeRecommendedSkill = null;
let selectedSkillFile = null;
let activeMenuTarget = null;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1900);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  })[character]);
}

function getVisibleConversations() {
  let items = [...conversations].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  if (conversationTab === "favorite") items = items.filter((item) => item.favorite);
  if (conversationFilter === "pinned") items = items.filter((item) => item.pinned);
  if (conversationFilter === "recent") items = items.slice(0, 3);
  if (conversationQuery) items = items.filter((item) => item.title.toLowerCase().includes(conversationQuery.toLowerCase()));
  return items;
}

function conversationRow(item) {
  return `
    <div class="conversation-row" data-conversation-id="${item.id}">
      <button class="conversation-item" type="button" data-conversation="${escapeHTML(item.title)}">
        ${multiSelectMode ? `<span class="conversation-check ${selectedConversations.has(item.id) ? "is-checked" : ""}" aria-hidden="true"><img src="assets/navigation/${selectedConversations.has(item.id) ? "image_38.png" : "image_36.png"}" alt="" /></span>` : ""}
        <img class="conversation-source-icon" src="assets/navigation/${item.icon || "source-web.svg"}" alt="" />
        <span>${escapeHTML(item.title)}</span>
        ${item.favorite ? '<span class="favorite-mark" aria-label="已收藏"><img src="assets/navigation/conversation-favorite.svg" alt="" /></span>' : ""}
      </button>
      <button class="row-more" type="button" aria-label="${escapeHTML(item.title)}更多操作" data-row-menu="conversation"><img src="assets/navigation/image_43.png" alt="" /></button>
    </div>`;
}

function renderConversations() {
  const items = getVisibleConversations();
  if (!items.length) {
    conversationList.innerHTML = '<div class="conversation-empty">这里还没有符合条件的对话</div>';
    return;
  }

  if (conversationTab === "source") {
    const groups = Object.entries(items.reduce((result, item) => {
      (result[item.source] ||= []).push(item);
      return result;
    }, {}));
    conversationList.innerHTML = groups.map(([source, sourceItems]) => `
      <section class="source-group">
        <div class="source-label"><img src="${sourceIcons[source]}" alt="" /><span>${escapeHTML(source)}</span></div>
        ${sourceItems.map(conversationRow).join("")}
      </section>`).join("");
  } else {
    conversationList.innerHTML = items.map(conversationRow).join("");
  }

  if (multiSelectMode) {
    conversationList.insertAdjacentHTML("beforeend", `
      <div class="bulk-actions"><span>已选择 ${selectedConversations.size} 项</span><button type="button" data-delete-selected>删除</button></div>`);
  }
}

function closeFloatingMenu() {
  floatingMenu.hidden = true;
  floatingMenu.innerHTML = "";
  activeMenuTarget = null;
  document.querySelector("[data-filter-button]").setAttribute("aria-expanded", "false");
}

function openFloatingMenu(anchor, items, target) {
  activeMenuTarget = target;
  floatingMenu.innerHTML = items.map((item) => item.divider
    ? '<div class="menu-divider"></div>'
    : `<button type="button" class="${item.danger ? "is-danger" : ""}" data-menu-action="${item.action}">${item.icon ? `<img src="${item.icon}" alt="" />` : ""}<span>${item.label}</span></button>`
  ).join("");
  floatingMenu.hidden = false;
  const rect = anchor.getBoundingClientRect();
  const menuWidth = 154;
  const left = Math.min(rect.left, window.innerWidth - menuWidth - 8);
  floatingMenu.style.left = `${Math.max(8, left)}px`;
  floatingMenu.style.top = `${Math.min(rect.bottom + 4, window.innerHeight - floatingMenu.offsetHeight - 8)}px`;
}

function skillRow(item) {
  const isBuiltIn = item.category === "builtIn";
  return `
    <article class="skill-row" data-skill-id="${item.id}">
      ${isBuiltIn ? '<span class="skill-icon skill-icon--figma"><img src="assets/skill-center/smile.svg" alt="" /><img src="assets/skill-center/smile-details.svg" alt="" /><img src="assets/skill-center/smile-eyes.svg" alt="" /><img src="assets/skill-center/smile-mouth.svg" alt="" /></span>' : `<span class="skill-icon"><img src="assets/skills/${item.icon}" alt="" /></span>`}
      <div class="skill-copy">
        <h2>${escapeHTML(item.name)}</h2>
        <p>${escapeHTML(item.description)}</p>
      </div>
      <div class="skill-actions">
        ${item.editable ? `
          <button class="skill-action-button" type="button" aria-label="编辑${escapeHTML(item.name)}" data-skill-action="edit"><img src="assets/skills/image_39.png" alt="" /></button>
          <button class="skill-action-button" type="button" aria-label="删除${escapeHTML(item.name)}" data-skill-action="delete"><img src="assets/skills/image_40.png" alt="" /></button>` : ""}
        <button class="skill-toggle ${item.enabled ? "is-enabled" : ""}" type="button" role="switch" aria-checked="${item.enabled}" aria-label="${item.enabled ? "停用" : "启用"}${escapeHTML(item.name)}" data-skill-toggle><span></span></button>
      </div>
    </article>`;
}

function renderRecommendations() {
  const items = recommendedSkillPages[activeSkillPage];
  skillRecommendations.innerHTML = items.map((item, index) => `
    <button class="recommendation-card" type="button" data-recommended-skill="${index}">
      <span class="recommendation-mark"><img src="assets/skill-center/smile.svg" alt="" /><img src="assets/skill-center/smile-details.svg" alt="" /><img src="assets/skill-center/smile-eyes.svg" alt="" /><img src="assets/skill-center/smile-mouth.svg" alt="" /></span>
      <span class="recommendation-copy"><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.description)}</small></span>
      <span class="recommendation-footer"><span>${item.uses} 人已使用</span><b>查看详情 →</b></span>
    </button>`).join("");
  document.querySelectorAll("[data-skill-page]").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.skillPage) === activeSkillPage));
}

function renderSkills() {
  const query = skillsSearch.value.trim().toLowerCase();
  const items = skills.filter((item) => item.category === activeSkillCategory && (
    !query || item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
  ));
  const categoryNames = { personal: "我安装的", team: "来自 Skill 中心的", builtIn: "dodo 内置的" };
  document.querySelector("[data-skill-library-title]").textContent = categoryNames[activeSkillCategory];
  skillsCount.textContent = activeSkillCategory === "builtIn" ? "" : `${items.length} 个技能已启用`;
  document.querySelector("[data-skills-bulk-toggle]").textContent = items.length && items.every((item) => item.enabled) ? "全部关闭" : "全部开启";
  skillsList.innerHTML = items.length
    ? items.map(skillRow).join("")
    : '<div class="skills-empty"><img src="assets/skills/image_35.png" alt="" /><strong>没有找到相关技能</strong><span>试试其他关键词或切换分类</span></div>';
}

function artifactPreview(item) {
  return `<div class="artifact-preview ${item.type === "HTML" ? "is-cover" : "is-contain"}"><img src="assets/artifacts/${item.asset}" alt="${escapeHTML(item.name)}预览" /></div>`;
}

function renderArtifacts() {
  const items = artifacts.filter((item) => (!artifactFavoriteOnly || item.favorite) && (!artifactQuery || item.name.toLowerCase().includes(artifactQuery)));
  document.querySelector("[data-artifact-total]").textContent = `共 ${artifactFavoriteOnly || artifactQuery ? items.length : artifactTotalCount} 个产物`;
  artifactGrid.classList.toggle("is-list", artifactLayout === "list");
  artifactGrid.innerHTML = items.length ? items.map((item) => `
    <article class="artifact-card ${item.favorite ? "is-favorite" : ""}" data-artifact-id="${item.id}">
      <div class="artifact-card-actions"><button type="button" data-artifact-chat aria-label="前往对话" title="前往对话"><img src="assets/artifacts/action-chat.svg" alt="" /></button><button type="button" data-artifact-download aria-label="下载" title="下载"><img src="assets/artifacts/action-download.svg" alt="" /></button><button type="button" data-artifact-fav aria-label="${item.favorite ? "取消收藏" : "收藏"}" title="${item.favorite ? "取消收藏" : "收藏"}"><img src="assets/artifacts/${item.favorite ? "action-favorite.svg" : "action-favorite-off.svg"}" alt="" /></button><button type="button" data-artifact-more aria-label="更多操作" title="更多"><img src="assets/artifacts/action-more.svg" alt="" /></button></div>
      ${artifactPreview(item)}
      <footer><h2>${escapeHTML(item.name)}</h2><div><span>${item.size}</span><time>${item.date}</time></div></footer>
      <div class="artifact-card-menu ${activeArtifactMenuId === item.id ? "is-open" : ""}"><button type="button" data-artifact-delete><img class="artifact-delete-icon" src="assets/artifacts/delete-outline.svg" alt="" /><span>删除</span></button></div>
    </article>`).join("") : '<div class="artifact-empty">没有符合条件的产物</div>';
}

function updateRecycleCount() {
  document.querySelector("[data-recycle-count]").textContent = `(${recycleBin.length})`;
}

function renderRecycleBin() {
  const query = document.querySelector("[data-recycle-search]").value.trim().toLowerCase();
  const items = recycleBin.filter((item) => item.name.toLowerCase().includes(query));
  document.querySelector("[data-recycle-list]").innerHTML = items.length ? items.map((item) => `
    <article class="recycle-item" data-recycle-id="${item.id}"><span class="recycle-file-icon">▧</span><div><strong>${escapeHTML(item.name)}</strong><small>剩余 30 天</small></div><div class="recycle-item-actions"><button type="button" data-artifact-restore>恢复</button><button type="button" data-artifact-purge>彻底删除</button></div></article>`).join("") : '<div class="recycle-empty">手动删除的文件会出现在这里，可恢复或彻底删除</div>';
}

function openSkillDetail(item) {
  activeRecommendedSkill = item;
  document.querySelector("[data-skill-detail-mark]").textContent = item.mark;
  document.querySelector("[data-skill-detail-name]").textContent = item.name;
  document.querySelector("[data-skill-detail-description]").textContent = item.description;
  document.querySelector("[data-skill-detail-uses]").textContent = `已被 ${item.uses} 人使用`;
  const isInstalled = skills.some((skill) => skill.name === item.name);
  document.querySelector("[data-install-recommended-skill]").textContent = isInstalled ? "已安装" : "安装技能";
  skillDetailModal.hidden = false;
}

function closeSkillCreateMenu() {
  skillCreateMenu.hidden = true;
  skillCreateButton.setAttribute("aria-expanded", "false");
}

function resetSkillUploadForm() {
  skillUploadForm.reset();
  selectedSkillFile = null;
  document.querySelector("[data-uploaded-file]").hidden = true;
  document.querySelector("[data-skill-drop-zone]").hidden = false;
  document.querySelector("[data-description-count]").textContent = "0";
  document.querySelector("[data-upload-skill-button]").disabled = true;
}

function closeSkillModals() {
  skillUploadModal.hidden = true;
  skillShareModal.hidden = true;
  resetSkillUploadForm();
  skillShareForm.reset();
  document.querySelector("[data-install-skill-button]").disabled = true;
}

function closeSkillDetail() {
  skillDetailModal.hidden = true;
  activeRecommendedSkill = null;
}

function updateSkillUploadState() {
  document.querySelector("[data-upload-skill-button]").disabled = !(selectedSkillFile && document.querySelector("[data-skill-name]").value.trim());
}

function selectSkillFile(file) {
  if (!file) return;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!['zip', 'skill'].includes(extension)) {
    showToast("仅支持 .zip 或 .skill 格式");
    return;
  }
  selectedSkillFile = file;
  document.querySelector("[data-uploaded-file-name]").textContent = file.name;
  document.querySelector("[data-uploaded-file]").hidden = false;
  document.querySelector("[data-skill-drop-zone]").hidden = true;
  const suggestedName = file.name.replace(/\.(zip|skill)$/i, "");
  const nameInput = document.querySelector("[data-skill-name]");
  if (!nameInput.value) nameInput.value = suggestedName;
  updateSkillUploadState();
}

function renderGear() {
  gearGrid.innerHTML = gearSets[gearSetIndex].map((item) => `
    <button class="gear-card" type="button" style="--card-border:${item.border}" data-gear="${item.title}">
      <span class="gear-card-top">
        <img src="assets/${item.image}" alt="" />
        <strong>${item.title}</strong>
      </span>
      <p>${item.copy}</p>
      <span class="card-arrow"><img src="assets/image_27.png" alt="" /></span>
    </button>
  `).join("");
}

function showHome() {
  homeView.hidden = false;
  skillsView.hidden = true;
  artifactsView.hidden = true;
  placeholderView.hidden = true;
  closeSkillCreateMenu();
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("is-active"));
  closeMobileSidebar();
}

function showSection(section) {
  homeView.hidden = true;
  const isSkills = section === "skills";
  const isArtifacts = section === "artifacts";
  skillsView.hidden = !isSkills;
  artifactsView.hidden = !isArtifacts;
  placeholderView.hidden = isSkills || isArtifacts;
  if (isSkills) {
    renderRecommendations();
    renderSkills();
  } else if (isArtifacts) {
    renderArtifacts();
  } else {
    const [title, copy, icon] = sectionCopy[section];
    placeholderView.querySelector("[data-placeholder-title]").textContent = title;
    placeholderView.querySelector("[data-placeholder-copy]").textContent = copy;
    placeholderView.querySelector("[data-placeholder-icon]").innerHTML = `<img src="${icon}" alt="" />`;
  }
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.section === section);
  });
  closeMobileSidebar();
}

function closeMobileSidebar() {
  sidebar.classList.remove("is-open");
  backdrop.classList.remove("is-visible");
}

function toggleSidebar(event) {
  if (window.matchMedia("(max-width: 760px)").matches || event.currentTarget.classList.contains("mobile-menu")) {
    const isOpen = sidebar.classList.toggle("is-open");
    backdrop.classList.toggle("is-visible", isOpen);
    return;
  }
  const isCollapsed = sidebar.classList.toggle("is-collapsed");
  document.querySelector(".main-stage").classList.toggle("is-expanded", isCollapsed);
  event.currentTarget.setAttribute("aria-label", isCollapsed ? "展开侧栏" : "收起侧栏");
}

prompt.addEventListener("input", () => {
  sendButton.disabled = prompt.value.trim().length === 0;
});

prompt.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !sendButton.disabled) {
    event.preventDefault();
    promptForm.requestSubmit();
  }
});

promptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = prompt.value.trim();
  if (!message) return;
  showToast("消息已发送：" + message.slice(0, 18) + (message.length > 18 ? "…" : ""));
  prompt.value = "";
  sendButton.disabled = true;
});

modelButton.addEventListener("click", () => {
  const isOpen = modelMenu.classList.toggle("is-open");
  modelButton.setAttribute("aria-expanded", String(isOpen));
});

modelMenu.addEventListener("click", (event) => {
  const option = event.target.closest("[data-model]");
  if (!option) return;
  document.querySelector("[data-model-label]").textContent = option.dataset.model;
  modelMenu.classList.remove("is-open");
  modelButton.setAttribute("aria-expanded", "false");
  showToast("已切换至" + option.dataset.model);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".model-picker")) {
    modelMenu.classList.remove("is-open");
    modelButton.setAttribute("aria-expanded", "false");
  }
});

document.querySelectorAll("[data-home]").forEach((button) => button.addEventListener("click", showHome));
document.querySelectorAll("[data-section]").forEach((button) => button.addEventListener("click", () => showSection(button.dataset.section)));
document.querySelectorAll("[data-sidebar-toggle]").forEach((button) => button.addEventListener("click", toggleSidebar));
backdrop.addEventListener("click", closeMobileSidebar);

skillsSearch.addEventListener("input", renderSkills);

document.querySelectorAll("[data-skill-category]").forEach((button) => {
  button.addEventListener("click", () => {
    activeSkillCategory = button.dataset.skillCategory;
    document.querySelectorAll("[data-skill-category]").forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    renderSkills();
  });
});

skillCreateButton.addEventListener("click", (event) => {
  event.stopPropagation();
  const open = skillCreateMenu.hidden;
  skillCreateMenu.hidden = !open;
  skillCreateButton.setAttribute("aria-expanded", String(open));
});

skillCreateMenu.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-create-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.createAction;
  closeSkillCreateMenu();
  if (action === "upload") {
    skillUploadModal.hidden = false;
    document.querySelector("[data-skill-name]").focus();
  }
  if (action === "share") {
    skillShareModal.hidden = false;
    document.querySelector("[data-skill-share-link]").focus();
  }
  if (action === "write") {
    showHome();
    prompt.value = "帮我创建一个技能，它可以：";
    sendButton.disabled = false;
    prompt.focus();
  }
  if (action === "center") showSection("skills");
});

skillRecommendations.addEventListener("click", (event) => {
  const card = event.target.closest("[data-recommended-skill]");
  if (!card) return;
  openSkillDetail(recommendedSkillPages[activeSkillPage][Number(card.dataset.recommendedSkill)]);
});

document.querySelectorAll("[data-skill-page]").forEach((button) => button.addEventListener("click", () => {
  activeSkillPage = Number(button.dataset.skillPage);
  renderRecommendations();
}));

document.querySelector("[data-skills-bulk-toggle]").addEventListener("click", () => {
  const items = skills.filter((item) => item.category === activeSkillCategory);
  const enable = !items.every((item) => item.enabled);
  items.forEach((item) => { item.enabled = enable; });
  renderSkills();
  showToast(enable ? "技能已全部开启" : "技能已全部关闭");
});

document.querySelectorAll("[data-close-skill-detail]").forEach((button) => button.addEventListener("click", closeSkillDetail));
document.querySelector("[data-install-recommended-skill]").addEventListener("click", () => {
  if (!activeRecommendedSkill) return;
  const skillName = activeRecommendedSkill.name;
  if (skills.some((skill) => skill.name === activeRecommendedSkill.name)) {
    showToast("这个技能已经安装了");
    return;
  }
  skills.unshift({ id: Date.now(), category: "personal", name: activeRecommendedSkill.name, description: activeRecommendedSkill.description, icon: "image_38.png", enabled: true, editable: true });
  activeSkillCategory = "personal";
  document.querySelectorAll("[data-skill-category]").forEach((tab) => {
    const active = tab.dataset.skillCategory === "personal";
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  closeSkillDetail();
  renderSkills();
  showToast(`${skillName} 已安装`);
});

skillsList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-skill-id]");
  if (!row) return;
  const item = skills.find((skill) => skill.id === Number(row.dataset.skillId));
  if (!item) return;
  if (event.target.closest("[data-skill-toggle]")) {
    item.enabled = !item.enabled;
    renderSkills();
    showToast(`${item.name}已${item.enabled ? "启用" : "停用"}`);
    return;
  }
  const actionButton = event.target.closest("[data-skill-action]");
  if (!actionButton) return;
  if (actionButton.dataset.skillAction === "delete") {
    skills = skills.filter((skill) => skill.id !== item.id);
    renderSkills();
    showToast(`已删除${item.name}`);
  } else {
    const nextName = window.prompt("修改技能名称", item.name)?.trim();
    if (nextName) {
      item.name = nextName;
      renderSkills();
      showToast("技能信息已更新");
    }
  }
});

document.querySelector("[data-artifact-favorite]").addEventListener("click", (event) => {
  artifactFavoriteOnly = !artifactFavoriteOnly;
  event.currentTarget.classList.toggle("is-active", artifactFavoriteOnly);
  event.currentTarget.textContent = artifactFavoriteOnly ? "★ 仅看收藏" : "☆ 仅看收藏";
  renderArtifacts();
});
document.querySelector("[data-artifact-search]").addEventListener("input", (event) => {
  artifactQuery = event.target.value.trim().toLowerCase();
  renderArtifacts();
});
document.querySelectorAll("[data-artifact-layout]").forEach((button) => button.addEventListener("click", () => {
  artifactLayout = button.dataset.artifactLayout;
  document.querySelectorAll("[data-artifact-layout]").forEach((item) => item.classList.toggle("is-active", item === button));
  renderArtifacts();
}));
document.querySelectorAll("[data-artifact-source]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-artifact-source]").forEach((item) => item.classList.toggle("is-active", item === button));
  document.querySelector("[data-artifact-total]").textContent = button.dataset.artifactSource === "upload" ? "共 42 个上传附件" : `共 ${artifactTotalCount} 个产物`;
}));
artifactGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-artifact-id]");
  if (!card) return;
  const item = artifacts.find((artifact) => artifact.id === Number(card.dataset.artifactId));
  if (!item) return;
  if (event.target.closest("[data-artifact-chat]")) { showToast(`已基于「${item.name}」发起对话`); return; }
  if (event.target.closest("[data-artifact-download]")) { showToast(`正在下载「${item.name}」`); return; }
  if (event.target.closest("[data-artifact-fav]")) { item.favorite = !item.favorite; renderArtifacts(); return; }
  if (event.target.closest("[data-artifact-more]")) { activeArtifactMenuId = activeArtifactMenuId === item.id ? null : item.id; renderArtifacts(); return; }
  if (event.target.closest("[data-artifact-delete]")) { activeArtifactMenuId = null; pendingArtifactDeleteId = item.id; artifactDeleteModal.hidden = false; }
});
document.addEventListener("click", (event) => {
  if (!activeArtifactMenuId || event.target.closest("[data-artifact-more]") || event.target.closest(".artifact-card-menu")) return;
  activeArtifactMenuId = null;
  renderArtifacts();
});
document.querySelectorAll("[data-close-artifact-modal]").forEach((button) => button.addEventListener("click", () => { artifactDeleteModal.hidden = true; pendingArtifactDeleteId = null; }));
document.querySelector("[data-confirm-artifact-delete]").addEventListener("click", () => {
  const item = artifacts.find((artifact) => artifact.id === pendingArtifactDeleteId);
  if (!item) return;
  recycleBin.unshift({ ...item, deletedAt: Date.now() });
  artifacts = artifacts.filter((artifact) => artifact.id !== item.id);
  artifactTotalCount -= 1;
  pendingArtifactDeleteId = null;
  artifactDeleteModal.hidden = true;
  updateRecycleCount();
  renderArtifacts();
  showToast("已删除，可在回收站恢复");
});
document.querySelector("[data-open-recycle]").addEventListener("click", () => { recycleModal.hidden = false; renderRecycleBin(); });
document.querySelectorAll("[data-close-recycle]").forEach((button) => button.addEventListener("click", () => { recycleModal.hidden = true; }));
document.querySelector("[data-recycle-search]").addEventListener("input", renderRecycleBin);
document.querySelector("[data-recycle-list]").addEventListener("click", (event) => {
  const row = event.target.closest("[data-recycle-id]");
  if (!row) return;
  const id = Number(row.dataset.recycleId);
  const item = recycleBin.find((artifact) => artifact.id === id);
  if (!item) return;
  if (event.target.closest("[data-artifact-restore]")) { artifacts.unshift(item); artifactTotalCount += 1; recycleBin = recycleBin.filter((artifact) => artifact.id !== id); updateRecycleCount(); renderRecycleBin(); renderArtifacts(); showToast("文件已恢复"); }
  if (event.target.closest("[data-artifact-purge]")) { recycleBin = recycleBin.filter((artifact) => artifact.id !== id); updateRecycleCount(); renderRecycleBin(); showToast("文件已彻底删除"); }
});

skillFileInput.addEventListener("change", () => selectSkillFile(skillFileInput.files[0]));
document.querySelector("[data-skill-name]").addEventListener("input", updateSkillUploadState);
document.querySelector("[data-skill-description]").addEventListener("input", (event) => {
  document.querySelector("[data-description-count]").textContent = String(event.target.value.length);
});

document.querySelector("[data-skill-drop-zone]").addEventListener("dragover", (event) => {
  event.preventDefault();
  event.currentTarget.classList.add("is-dragging");
});
document.querySelector("[data-skill-drop-zone]").addEventListener("dragleave", (event) => event.currentTarget.classList.remove("is-dragging"));
document.querySelector("[data-skill-drop-zone]").addEventListener("drop", (event) => {
  event.preventDefault();
  event.currentTarget.classList.remove("is-dragging");
  selectSkillFile(event.dataTransfer.files[0]);
});

document.querySelector("[data-remove-skill-file]").addEventListener("click", () => {
  selectedSkillFile = null;
  skillFileInput.value = "";
  document.querySelector("[data-uploaded-file]").hidden = true;
  document.querySelector("[data-skill-drop-zone]").hidden = false;
  updateSkillUploadState();
});

document.querySelectorAll("[data-close-skill-modal]").forEach((button) => button.addEventListener("click", closeSkillModals));

skillUploadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!selectedSkillFile) return;
  const name = document.querySelector("[data-skill-display-name]").value.trim() || document.querySelector("[data-skill-name]").value.trim();
  skills.push({
    id: Date.now(),
    category: "personal",
    name,
    description: document.querySelector("[data-skill-description]").value.trim() || "自定义技能",
    icon: "image_38.png",
    enabled: true,
    editable: true
  });
  activeSkillCategory = "personal";
  document.querySelectorAll("[data-skill-category]").forEach((tab) => {
    const active = tab.dataset.skillCategory === "personal";
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  closeSkillModals();
  renderSkills();
  showToast(`已上传${name}`);
});

const shareLinkInput = document.querySelector("[data-skill-share-link]");
shareLinkInput.addEventListener("input", () => {
  document.querySelector("[data-install-skill-button]").disabled = shareLinkInput.value.trim().length < 4;
});

skillShareForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = shareLinkInput.value.trim();
  if (value.length < 4) return;
  skills.push({ id: Date.now(), category: "personal", name: "共享技能", description: "通过共享链接安装的技能", icon: "image_49.png", enabled: true, editable: true });
  closeSkillModals();
  activeSkillCategory = "personal";
  renderSkills();
  showToast("共享技能安装成功");
});

function toggleGroup(button, content) {
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  content.classList.toggle("is-collapsed", expanded);
}

document.querySelector("[data-group-toggle]").addEventListener("click", (event) => {
  toggleGroup(event.currentTarget, document.querySelector("[data-group-content]"));
});

document.querySelector("[data-conversation-toggle]").addEventListener("click", (event) => {
  toggleGroup(event.currentTarget, document.querySelector("[data-conversation-content]"));
});

document.querySelector("[data-new-chat]").addEventListener("click", () => {
  showHome();
  prompt.value = "";
  sendButton.disabled = true;
  prompt.focus();
});

function updateSidebarScrollState() {
  sidebar.classList.toggle("is-scrolled", sidebarScroll.scrollTop > 0);
}

sidebarScroll.addEventListener("scroll", updateSidebarScrollState, { passive: true });
updateSidebarScrollState();

document.querySelector("[data-add-workspace]").addEventListener("click", () => {
  workspaceModal.hidden = false;
  workspaceForm.querySelector("input").focus();
});

document.querySelectorAll("[data-close-workspace]").forEach((button) => {
  button.addEventListener("click", () => {
    workspaceModal.hidden = true;
    workspaceForm.reset();
  });
});

workspaceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = workspaceForm.querySelector("input");
  const name = input.value.trim();
  if (!name) return;
  const row = document.createElement("div");
  row.className = "workspace-row";
  row.dataset.workspaceRow = "";
  row.innerHTML = `
    <button class="workspace-item" type="button" data-workspace="${escapeHTML(name)}">
      <img src="assets/navigation/workspace-competitor.svg" alt="" /><span>${escapeHTML(name)}</span>
    </button>
    <button class="row-more" type="button" aria-label="${escapeHTML(name)}更多操作" data-row-menu="workspace"><img src="assets/navigation/image_43.png" alt="" /></button>`;
  document.querySelector("[data-group-content]").append(row);
  workspaceModal.hidden = true;
  workspaceForm.reset();
  showToast(`已创建工区：${name}`);
});

document.querySelectorAll("[data-conversation-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    conversationTab = button.dataset.conversationTab;
    document.querySelectorAll("[data-conversation-tab]").forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    renderConversations();
  });
});

document.querySelector("[data-filter-button]").addEventListener("click", (event) => {
  event.stopPropagation();
  const button = event.currentTarget;
  const isOpen = !floatingMenu.hidden && activeMenuTarget?.type === "filter";
  closeFloatingMenu();
  if (!isOpen) {
    button.setAttribute("aria-expanded", "true");
    openFloatingMenu(button, [
      { label: "显示全部", action: "filter-all" },
      { label: "只看置顶", action: "filter-pinned" },
      { label: "最近对话", action: "filter-recent" }
    ], { type: "filter" });
    button.setAttribute("aria-expanded", "true");
  }
});

document.querySelector("[data-refresh-conversations]").addEventListener("click", () => {
  renderConversations();
  showToast("对话列表已刷新");
});

document.querySelector("[data-search-conversations]").addEventListener("click", () => {
  sidebar.classList.add("is-searching");
  conversationSearch.hidden = false;
  conversationSearchInput.focus();
});

conversationSearchInput.addEventListener("input", () => {
  conversationQuery = conversationSearchInput.value.trim();
  conversationSearchClear.hidden = !conversationSearchInput.value;
  renderConversations();
});

conversationSearchClear.addEventListener("click", () => {
  conversationSearchInput.value = "";
  conversationQuery = "";
  conversationSearchClear.hidden = true;
  conversationSearchInput.focus();
  renderConversations();
});

document.querySelector("[data-conversation-search-cancel]").addEventListener("click", () => {
  conversationQuery = "";
  conversationSearchInput.value = "";
  conversationSearchClear.hidden = true;
  conversationSearch.hidden = true;
  sidebar.classList.remove("is-searching");
  renderConversations();
});

document.querySelector("[data-multi-select]").addEventListener("click", () => {
  multiSelectMode = !multiSelectMode;
  selectedConversations.clear();
  renderConversations();
});

sidebar.addEventListener("click", (event) => {
  const workspaceButton = event.target.closest("[data-workspace]");
  if (workspaceButton) {
    document.querySelectorAll("[data-workspace]").forEach((item) => item.classList.remove("is-active"));
    workspaceButton.classList.add("is-active");
    showToast("已进入" + workspaceButton.dataset.workspace);
    return;
  }

  const conversationButton = event.target.closest("[data-conversation]");
  if (conversationButton) {
    const row = conversationButton.closest("[data-conversation-id]");
    if (multiSelectMode && row) {
      const id = Number(row.dataset.conversationId);
      selectedConversations.has(id) ? selectedConversations.delete(id) : selectedConversations.add(id);
      renderConversations();
      return;
    }
    document.querySelectorAll("[data-conversation]").forEach((item) => item.classList.remove("is-active"));
    conversationButton.classList.add("is-active");
    prompt.value = "继续处理：" + conversationButton.dataset.conversation;
    sendButton.disabled = false;
    showHome();
    prompt.focus();
    return;
  }

  const menuButton = event.target.closest("[data-row-menu]");
  if (!menuButton) return;
  event.stopPropagation();
  const row = menuButton.closest(".workspace-row, .conversation-row");
  const isConversation = menuButton.dataset.rowMenu === "conversation";
  const id = isConversation ? Number(row.dataset.conversationId) : null;
  openFloatingMenu(menuButton, [
    { label: isConversation && conversations.find((item) => item.id === id)?.favorite ? "取消收藏" : "收藏", action: "favorite", icon: "assets/navigation/image_63.png" },
    { label: "置顶", action: "pin", icon: "assets/navigation/image_52.png" },
    { label: "重命名", action: "rename", icon: "assets/navigation/image_64.png" },
    { divider: true },
    { label: "删除", action: "delete", danger: true, icon: "assets/navigation/image_40.png" }
  ], { type: menuButton.dataset.rowMenu, row, id });
});

floatingMenu.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-menu-action]");
  if (!actionButton || !activeMenuTarget) return;
  const action = actionButton.dataset.menuAction;

  if (activeMenuTarget.type === "filter") {
    conversationFilter = action.replace("filter-", "");
    renderConversations();
    closeFloatingMenu();
    return;
  }

  if (activeMenuTarget.type === "conversation") {
    const item = conversations.find((conversation) => conversation.id === activeMenuTarget.id);
    if (!item) return;
    if (action === "favorite") item.favorite = !item.favorite;
    if (action === "pin") item.pinned = !item.pinned;
    if (action === "rename") {
      const nextTitle = window.prompt("重命名对话", item.title)?.trim();
      if (nextTitle) item.title = nextTitle;
    }
    if (action === "delete") conversations = conversations.filter((conversation) => conversation.id !== item.id);
    renderConversations();
  } else {
    const label = activeMenuTarget.row.querySelector(".workspace-item span")?.textContent || "当前项目";
    if (action === "rename") {
      const nextLabel = window.prompt("重命名", label)?.trim();
      if (nextLabel) activeMenuTarget.row.querySelector(".workspace-item span").textContent = nextLabel;
    } else if (action === "delete") {
      activeMenuTarget.row.remove();
    } else {
      showToast(`${label}已${action === "pin" ? "置顶" : "收藏"}`);
    }
  }
  closeFloatingMenu();
});

conversationList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-selected]");
  if (!deleteButton) return;
  conversations = conversations.filter((item) => !selectedConversations.has(item.id));
  selectedConversations.clear();
  multiSelectMode = false;
  renderConversations();
  showToast("已删除所选对话");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-floating-menu]") && !event.target.closest("[data-row-menu]") && !event.target.closest("[data-filter-button]")) {
    closeFloatingMenu();
  }
  if (!event.target.closest(".skill-create-wrap")) closeSkillCreateMenu();
});

document.querySelector("[data-profile]").addEventListener("click", () => showToast("个人空间"));
document.querySelector("[data-more]").addEventListener("click", () => showSection("skills"));
document.querySelector("[data-refresh]").addEventListener("click", () => {
  gearSetIndex = (gearSetIndex + 1) % gearSets.length;
  renderGear();
  showToast("已为你换一批装备");
});

gearGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-gear]");
  if (!card) return;
  prompt.value = "使用「" + card.dataset.gear + "」帮我完成：";
  sendButton.disabled = false;
  prompt.focus();
});

window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    showHome();
    prompt.focus();
  }
  if (event.key === "Escape") {
    modelMenu.classList.remove("is-open");
    workspaceModal.hidden = true;
    closeFloatingMenu();
    closeSkillCreateMenu();
    closeSkillModals();
    closeMobileSidebar();
  }
});

renderGear();
renderConversations();
renderSkills();
