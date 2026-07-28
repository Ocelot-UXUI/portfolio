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
  knowledge: ["知识", "集中管理 dodo 可以调用的文档、资料和个人知识。", "◫"],
  skills: ["技能", "查看、启用和管理你的专属 Skill。", "⌁"],
  artifacts: ["产物", "查找 dodo 在任务中生成的文档、图片与代码。", "▤"],
  settings: ["设置", "管理模型、通知和工作区偏好。", "⚙"]
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
let gearSetIndex = 0;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1900);
}

function renderGear() {
  gearGrid.innerHTML = gearSets[gearSetIndex].map((item) => `
    <button class="gear-card" type="button" style="--card-border:${item.border}" data-gear="${item.title}">
      <span class="gear-card-top">
        <img src="assets/${item.image}" alt="" />
        <strong>${item.title}</strong>
      </span>
      <p>${item.copy}</p>
      <span class="card-arrow">›</span>
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
  placeholderView.querySelector("[data-placeholder-icon]").textContent = icon;
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

document.querySelector("[data-group-toggle]").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  document.querySelector("[data-group-content]").classList.toggle("is-collapsed", expanded);
});

document.querySelectorAll("[data-workspace]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-workspace]").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    showToast("已进入" + button.dataset.workspace);
  });
});

document.querySelectorAll("[data-conversation]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-conversation]").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    prompt.value = "继续处理：" + button.dataset.conversation;
    sendButton.disabled = false;
    showHome();
    prompt.focus();
  });
});

document.querySelector("[data-new-chat]").addEventListener("click", () => {
  showHome();
  prompt.value = "";
  sendButton.disabled = true;
  prompt.focus();
});

document.querySelector("[data-add-workspace]").addEventListener("click", () => showToast("新建工区入口已打开"));
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
    closeMobileSidebar();
  }
});

renderGear();
