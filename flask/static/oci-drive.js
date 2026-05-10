(function () {
  const rawData = Array.isArray(window.OCI_DRIVE_DATA) ? window.OCI_DRIVE_DATA : [];
  const body = document.body;
  const state = {
    query: "",
    sort: "newest",
    view: window.localStorage.getItem("oci-drive-view") || "grid"
  };

  const typeMap = [
    { match: ["png", "jpg", "jpeg", "gif", "webp", "svg"], label: "Image", icon: "image", color: "#516f88" },
    { match: ["pdf"], label: "PDF", icon: "file-text", color: "#8f3a31" },
    { match: ["zip", "tar", "gz", "rar", "7z"], label: "Archive", icon: "file-archive", color: "#6d6682" },
    { match: ["csv", "xls", "xlsx"], label: "Sheet", icon: "table-2", color: "#3f7573" },
    { match: ["ppt", "pptx"], label: "Slides", icon: "file-chart-column", color: "#a66f16" },
    { match: ["py", "js", "ts", "json", "yaml", "yml", "html", "css", "sh", "sql"], label: "Code", icon: "file-code-2", color: "#526b48" },
    { match: ["mp4", "mov", "avi", "mkv"], label: "Video", icon: "film", color: "#765b75" },
    { match: ["mp3", "wav", "m4a"], label: "Audio", icon: "audio-lines", color: "#8a5f33" },
    { match: ["doc", "docx", "txt", "md"], label: "Document", icon: "file-text", color: "#4f5965" }
  ];

  const files = rawData.map(normalizeRecord).filter((file) => file.name || file.link);

  document.addEventListener("DOMContentLoaded", function () {
    initView();
    initSearch();
    initSort();
    initModal();
    initUploadInputs();
    render();
    refreshIcons();
  });

  function normalizeRecord(item, index) {
    const parsedName = extractNameAndLink(item.Name || "");
    const link = item.Link || parsedName.link || "";
    const name = parsedName.name || nameFromLink(link) || "Workshop file";
    const extension = getExtension(name);
    const meta = getTypeMeta(extension);

    return {
      id: `file-${index}`,
      name,
      date: item.Date || "",
      timestamp: parseWorkshopDate(item.Date),
      link,
      extension: extension || "file",
      type: meta.label,
      icon: meta.icon,
      color: meta.color
    };
  }

  function extractNameAndLink(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value);
    const anchor = template.content.querySelector("a");

    if (!anchor) {
      return {
        name: String(value).trim(),
        link: ""
      };
    }

    return {
      name: anchor.textContent.trim(),
      link: anchor.getAttribute("href") || ""
    };
  }

  function nameFromLink(link) {
    if (!link) {
      return "";
    }

    const path = String(link).split(/[?#]/)[0];
    const lastPart = path.substring(path.lastIndexOf("/") + 1);

    try {
      return decodeURIComponent(lastPart.replace(/\+/g, " "));
    } catch (error) {
      return lastPart;
    }
  }

  function getExtension(name) {
    const cleanName = String(name).split(/[?#]/)[0];
    const dotIndex = cleanName.lastIndexOf(".");

    if (dotIndex < 0 || dotIndex === cleanName.length - 1) {
      return "";
    }

    return cleanName.substring(dotIndex + 1).toLowerCase();
  }

  function getTypeMeta(extension) {
    const found = typeMap.find((item) => item.match.includes(extension));
    return found || { label: extension ? extension.toUpperCase() : "File", icon: "file", color: "#4f5965" };
  }

  function parseWorkshopDate(value) {
    if (!value) {
      return 0;
    }

    const match = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);

    if (!match) {
      const fallback = Date.parse(value);
      return Number.isNaN(fallback) ? 0 : fallback;
    }

    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6]);
    return new Date(year, month, day, hour, minute, second).getTime();
  }

  function initView() {
    setView(state.view);

    document.querySelectorAll("[data-view-button]").forEach((button) => {
      button.addEventListener("click", function () {
        setView(button.dataset.viewButton);
        window.localStorage.setItem("oci-drive-view", state.view);
      });
    });
  }

  function setView(view) {
    state.view = view === "table" ? "table" : "grid";
    body.dataset.view = state.view;

    document.querySelectorAll("[data-view-button]").forEach((button) => {
      button.classList.toggle("active", button.dataset.viewButton === state.view);
    });
  }

  function initSearch() {
    const search = document.getElementById("driveSearch");

    if (!search) {
      return;
    }

    search.addEventListener("input", function () {
      state.query = search.value.trim().toLowerCase();
      render();
    });
  }

  function initSort() {
    const sort = document.getElementById("sortFiles");

    if (!sort) {
      return;
    }

    sort.addEventListener("change", function () {
      state.sort = sort.value;
      render();
    });
  }

  function initModal() {
    const modal = document.getElementById("uploadModal");

    if (!modal) {
      return;
    }

    document.querySelectorAll("[data-open-upload]").forEach((button) => {
      button.addEventListener("click", function () {
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        window.setTimeout(function () {
          const fileInput = document.getElementById("modalFile");
          if (fileInput) {
            fileInput.focus();
          }
        }, 0);
      });
    });

    document.querySelectorAll("[data-close-upload]").forEach((button) => {
      button.addEventListener("click", closeModal);
    });

    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeModal();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
    }
  }

  function initUploadInputs() {
    bindFileName("quickFile", "quickSelected");
    bindFileName("modalFile", "modalSelected");

    const dropzone = document.getElementById("quickUploadForm");
    const quickFile = document.getElementById("quickFile");

    if (!dropzone || !quickFile) {
      return;
    }

    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, function (event) {
        event.preventDefault();
        dropzone.classList.add("dragging");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, function () {
        dropzone.classList.remove("dragging");
      });
    });

    dropzone.addEventListener("drop", function (event) {
      event.preventDefault();

      if (!event.dataTransfer || !event.dataTransfer.files.length) {
        return;
      }

      quickFile.files = event.dataTransfer.files;
      updateSelectedFile(quickFile, document.getElementById("quickSelected"));
    });
  }

  function bindFileName(inputId, outputId) {
    const input = document.getElementById(inputId);
    const output = document.getElementById(outputId);

    if (!input || !output) {
      return;
    }

    input.addEventListener("change", function () {
      updateSelectedFile(input, output);
    });
  }

  function updateSelectedFile(input, output) {
    const file = input.files && input.files[0];
    output.textContent = file ? `${file.name} | ${formatBytes(file.size)}` : "No file selected";
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return "0 KB";
    }

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  }

  function getVisibleFiles() {
    return files
      .filter((file) => {
        if (!state.query) {
          return true;
        }

        const haystack = `${file.name} ${file.date} ${file.link} ${file.type} ${file.extension}`.toLowerCase();
        return haystack.includes(state.query);
      })
      .sort(compareFiles);
  }

  function compareFiles(a, b) {
    if (state.sort === "oldest") {
      return a.timestamp - b.timestamp || a.name.localeCompare(b.name);
    }

    if (state.sort === "name") {
      return a.name.localeCompare(b.name);
    }

    if (state.sort === "type") {
      return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
    }

    return b.timestamp - a.timestamp || a.name.localeCompare(b.name);
  }

  function render() {
    const visibleFiles = getVisibleFiles();
    renderMetrics();
    renderResultCount(visibleFiles.length);
    renderGrid(visibleFiles);
    renderTable(visibleFiles);
    toggleEmptyState(visibleFiles.length === 0);
    refreshIcons();
  }

  function renderMetrics() {
    setText("metricTotal", files.length);
    setText("storageTotal", files.length);
    setText("storageSummary", files.length === 1 ? "1 file available" : `${files.length} files available`);

    const latest = files
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    setText("metricLatest", latest && latest.date ? compactDate(latest.date) : "None");
  }

  function compactDate(value) {
    const parts = String(value).split(" ");
    return parts[0] || value;
  }

  function renderResultCount(count) {
    const label = count === 1 ? "1 file" : `${count} files`;
    setText("resultCount", state.query ? `${label} found` : label);
  }

  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  function renderGrid(visibleFiles) {
    const grid = document.getElementById("fileGrid");

    if (!grid) {
      return;
    }

    grid.replaceChildren();

    visibleFiles.forEach((file) => {
      grid.appendChild(createFileCard(file));
    });
  }

  function createFileCard(file) {
    const card = document.createElement("article");
    card.className = "file-card";
    card.style.setProperty("--file-color", file.color);

    const top = document.createElement("div");
    top.className = "file-card-top";

    const typeTile = document.createElement("span");
    typeTile.className = "file-type-tile";
    typeTile.appendChild(createIcon(file.icon));

    const actions = document.createElement("div");
    actions.className = "file-actions";
    actions.appendChild(createOpenLink(file));
    actions.appendChild(createCopyButton(file));

    top.append(typeTile, actions);

    const name = document.createElement("a");
    name.className = "file-name";
    name.href = file.link || "#";
    name.target = "_blank";
    name.rel = "noopener";
    name.textContent = file.name;

    const meta = document.createElement("div");
    meta.className = "file-meta";
    meta.appendChild(createChip(file.type));
    meta.appendChild(createChip(file.date || "No date"));

    const link = document.createElement("div");
    link.className = "file-link";
    link.textContent = file.link || "No link available";

    card.append(top, name, meta, link);
    return card;
  }

  function renderTable(visibleFiles) {
    const tbody = document.getElementById("fileTableBody");

    if (!tbody) {
      return;
    }

    tbody.replaceChildren();

    visibleFiles.forEach((file) => {
      const row = document.createElement("tr");
      row.style.setProperty("--file-color", file.color);

      const nameCell = document.createElement("td");
      const nameWrap = document.createElement("div");
      nameWrap.className = "table-name";

      const typeTile = document.createElement("span");
      typeTile.className = "file-type-tile";
      typeTile.appendChild(createIcon(file.icon));

      const nameLink = document.createElement("a");
      nameLink.href = file.link || "#";
      nameLink.target = "_blank";
      nameLink.rel = "noopener";
      nameLink.textContent = file.name;

      nameWrap.append(typeTile, nameLink);
      nameCell.appendChild(nameWrap);

      const typeCell = document.createElement("td");
      const type = document.createElement("span");
      type.className = "table-type";
      type.textContent = file.type;
      typeCell.appendChild(type);

      const dateCell = document.createElement("td");
      dateCell.textContent = file.date || "No date";

      const linkCell = document.createElement("td");
      linkCell.className = "file-link";
      linkCell.textContent = file.link || "No link available";

      const actionCell = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "file-actions";
      actions.appendChild(createOpenLink(file));
      actions.appendChild(createCopyButton(file));
      actionCell.appendChild(actions);

      row.append(nameCell, typeCell, dateCell, linkCell, actionCell);
      tbody.appendChild(row);
    });
  }

  function createChip(text) {
    const chip = document.createElement("span");
    chip.className = "file-chip";
    chip.textContent = text;
    return chip;
  }

  function createOpenLink(file) {
    const link = document.createElement("a");
    link.className = "mini-button";
    link.href = file.link || "#";
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", `Open ${file.name}`);
    link.title = "Open";
    link.appendChild(createIcon("external-link"));
    return link;
  }

  function createCopyButton(file) {
    const button = document.createElement("button");
    button.className = "mini-button";
    button.type = "button";
    button.setAttribute("aria-label", `Copy link for ${file.name}`);
    button.title = "Copy link";
    button.appendChild(createIcon("copy"));

    button.addEventListener("click", function () {
      copyLink(file.link);
    });

    return button;
  }

  function createIcon(name) {
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", name);
    return icon;
  }

  function toggleEmptyState(isEmpty) {
    const empty = document.getElementById("emptyState");
    body.classList.toggle("empty-results", isEmpty);

    if (empty) {
      empty.hidden = !isEmpty;
    }
  }

  function copyLink(link) {
    if (!link) {
      showToast("No link available");
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(link)
        .then(function () {
          showToast("Link copied");
        })
        .catch(function () {
          fallbackCopy(link);
        });
      return;
    }

    fallbackCopy(link);
  }

  function fallbackCopy(link) {
    const textarea = document.createElement("textarea");
    textarea.value = link;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      showToast("Link copied");
    } catch (error) {
      showToast("Copy failed");
    }

    textarea.remove();
  }

  function showToast(message) {
    const toast = document.getElementById("copyToast");

    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.hidden = true;
    }, 1800);
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }
})();
