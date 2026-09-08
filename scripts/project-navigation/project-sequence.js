(() => {
const projectSequence = [
    { file: "cnap-case.html", title: "复杂 B 端系统体验重构", meta: "百度智能云 · 复杂 B 端体验", theme: "cnap" },
    { file: "dodo.html", title: "AI 设计工作流实践与复盘", meta: "AI 产品 · 设计工程化", theme: "dodo" },
    { file: "case.html", title: "主动式 AI 记忆助手", meta: "商汤科技 · 0–1 项目", theme: "remi" },
    { file: "skip-read.html", title: "职场人的阅读学习 APP", meta: "AI 阅读 · 个人知识工作流", theme: "reading" },
    { file: "xiaohongshu.html", title: "小红书本地生活体验升级", meta: "C 端增长 · 转化链路", theme: "xhs" }
  ];

  const buildProjectSequenceNavigation = () => {
    const currentFile = window.location.pathname.split("/").pop();
    const currentIndex = projectSequence.findIndex((project) => project.file === currentFile);
    if (currentIndex < 0 || document.querySelector(".project-sequence-nav")) return;
    document.body.dataset.projectTheme = projectSequence[currentIndex].theme;

    const previous = projectSequence[(currentIndex - 1 + projectSequence.length) % projectSequence.length];
    const next = projectSequence[(currentIndex + 1) % projectSequence.length];
    const section = document.createElement("section");
    section.className = "project-sequence-nav";
    section.setAttribute("aria-label", "浏览其他项目");

    const inner = document.createElement("div");
    inner.className = "project-sequence-inner";

    const heading = document.createElement("div");
    heading.className = "project-sequence-heading";
    heading.innerHTML = `
      <p>继续浏览项目</p>
      <span>${String(currentIndex + 1).padStart(2, "0")} / ${String(projectSequence.length).padStart(2, "0")}</span>
    `;

    const links = document.createElement("div");
    links.className = "project-sequence-links";

    const createProjectLink = (project, direction) => {
      const link = document.createElement("a");
      link.className = `project-sequence-link project-sequence-link--${direction}`;
      link.href = project.file;
      link.setAttribute("aria-label", `${direction === "previous" ? "上一个项目" : "下一个项目"}：${project.title}`);

      const arrow = document.createElement("span");
      arrow.className = "project-sequence-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = direction === "previous" ? "←" : "→";

      const copy = document.createElement("span");
      copy.className = "project-sequence-copy";

      const label = document.createElement("small");
      label.textContent = direction === "previous" ? "上一个项目" : "下一个项目";

      const title = document.createElement("strong");
      title.textContent = project.title;

      const meta = document.createElement("em");
      meta.textContent = project.meta;

      copy.append(label, title, meta);
      if (direction === "previous") link.append(arrow, copy);
      else link.append(copy, arrow);
      return link;
    };

    links.append(createProjectLink(previous, "previous"), createProjectLink(next, "next"));
    inner.append(heading, links);
    section.append(inner);

    const footer = document.querySelector("body > footer");
    if (footer) footer.before(section);
    else document.querySelector("main")?.after(section);
  };

  buildProjectSequenceNavigation();
})();
