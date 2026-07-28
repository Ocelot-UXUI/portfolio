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
  skills: ["技能", "查看、启用和管理你的专属 Skill。", "assets/navigation/image_4.png"],
  artifacts: ["产物", "查找 dodo 在任务中生成的文档、图片与代码。", "assets/navigation/image_5.png"],
  automation: ["自动化任务", "管理定时运行、事件触发和持续执行的任务。", "assets/navigation/image_6.png"],
  settings: ["设置", "管理模型、通知和工作区偏好。", "assets/navigation/image_7.png"]
};

let conversations = [
  { id: 1, title: "设计评审报告优化", source: "专属工区", favorite: true, pinned: true },
  { id: 2, title: "Dodo 导航区状态梳理", source: "专属工区", favorite: false, pinned: false },
  { id: 3, title: "CNAP 用户调研结论", source: "网页端", favorite: true, pinned: false },
  { id: 4, title: "作品集首页动效调整", source: "网页端", favorite: false, pinned: false },
  { id: 5, title: "访谈记录总结", source: "飞书", favorite: false, pinned: false },
  { id: 6, title: "竞品分析资料整理", source: "飞书", favorite: false, pinned: false }
];

const sourceIcons = {
  "专属工区": "assets/navigation/image_23.png",
  "网页端": "assets/navigation/image_22.png",
  "飞书": "assets/navigation/image_3.png"
};

const prompt = document.querySelector("#prompt");
const promptForm = document.querySelector("[data-prompt-form]");
const sendButton = document.querySelector(".send-button");
const homeView = document.querySelector("[data-home-view]");
const placeholderView = document.querySelector("[data-placeholder-view]");
const gearGrid = document.querySelector("[data-gear-grid]");
const modelButton = document.querySelector("[data-model-button]");
const modelMenu = document.querySelector("[data-model-menu]");
const sidebar = document.querySelector("#sidebar");
const backdrop = document.querySelector("[data-sidebar-backdrop]");
const toast = document.querySelector("[data-toast]");
const conversationList = document.querySelector("[data-conversation-list]");
const floatingMenu = document.querySelector("[data-floating-menu]");
const workspaceModal = document.querySelector("[data-workspace-modal]");
const workspaceForm = document.querySelector("[data-workspace-form]");
let gearSetIndex = 0;
let conversationTab = "all";
let conversationFilter = "all";
let multiSelectMode = false;
let selectedConversations = new Set();
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
  return items;
}

function conversationRow(item) {
  return `
    <div class="conversation-row" data-conversation-id="${item.id}">
      <button class="conversation-item" type="button" data-conversation="${escapeHTML(item.title)}">
        ${multiSelectMode ? `<span class="conversation-check ${selectedConversations.has(item.id) ? "is-checked" : ""}" aria-hidden="true"><img src="assets/navigation/${selectedConversations.has(item.id) ? "image_38.png" : "image_36.png"}" alt="" /></span>` : ""}
        ${item.favorite ? '<span class="favorite-mark" aria-label="已收藏"><img src="assets/navigation/image_18.png" alt="" /></span>' : ""}
        <span>${escapeHTML(item.title)}</span>
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
  placeholderView.hidden = true;
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("is-active"));
  closeMobileSidebar();
}

function showSection(section) {
  const [title, copy, icon] = sectionCopy[section];
  homeView.hidden = true;
  placeholderView.hidden = false;
  placeholderView.querySelector("[data-placeholder-title]").textContent = title;
  placeholderView.querySelector("[data-placeholder-copy]").textContent = copy;
  placeholderView.querySelector("[data-placeholder-icon]").innerHTML = `<img src="${icon}" alt="" />`;
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
      <img src="assets/navigation/image_22.png" alt="" /><span>${escapeHTML(name)}</span>
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
  const query = window.prompt("搜索对话");
  if (query === null) return;
  const match = conversations.find((item) => item.title.includes(query.trim()));
  showToast(match ? `找到：${match.title}` : "未找到相关对话");
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
    closeMobileSidebar();
  }
});

renderGear();
renderConversations();
