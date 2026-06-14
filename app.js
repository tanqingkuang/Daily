const STORAGE_KEY = "daily-work-tracker-state-v4";
const TYPE_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#dc2626", "#0891b2"];

const seedState = {
  schemaVersion: 1,
  workTypes: [],
  workItems: [],
  records: [],
};

let state = structuredClone(seedState);
let activeStatsRange = "day";
let persistenceMode = "browser";
let dataFilePath = "daily-data.json";

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(seedState);
    const parsed = JSON.parse(saved);
    return {
      workTypes: Array.isArray(parsed.workTypes) ? parsed.workTypes : structuredClone(seedState.workTypes),
      workItems: Array.isArray(parsed.workItems) ? parsed.workItems : structuredClone(seedState.workItems),
      records: Array.isArray(parsed.records) ? parsed.records : structuredClone(seedState.records),
    };
  } catch {
    return structuredClone(seedState);
  }
}

function normalizeState(value) {
  return {
    schemaVersion: 1,
    workTypes: Array.isArray(value?.workTypes) ? value.workTypes : [],
    workItems: Array.isArray(value?.workItems) ? value.workItems : [],
    records: Array.isArray(value?.records) ? value.records : [],
  };
}

function setPersistenceStatus(message, mode = persistenceMode) {
  const status = document.querySelector("#sync-status");
  const detail = document.querySelector("#sync-detail");
  if (status) status.textContent = message;
  if (!detail) return;
  detail.textContent =
    mode === "desktop"
      ? "桌面应用会自动保存到同目录 daily-data.json，关闭窗口即退出。"
      : mode === "server"
        ? "通过本地服务自动保存到 daily-data.json，适合放在百度云盘同步目录。"
        : "当前使用浏览器本地存储；双击启动脚本后可自动写入 daily-data.json。";
}

async function loadStateFromStorage() {
  if (window.dailyWorkStorage) {
    try {
      persistenceMode = "desktop";
      dataFilePath = await window.dailyWorkStorage.getDataFile();
      setPersistenceStatus("桌面应用自动保存", "desktop");
      return normalizeState(await window.dailyWorkStorage.loadState());
    } catch {
      persistenceMode = "browser";
    }
  }

  if (window.location.protocol !== "file:") {
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      if (response.ok) {
        persistenceMode = "server";
        setPersistenceStatus("自动保存到 JSON", "server");
        return normalizeState(await response.json());
      }
    } catch {
      persistenceMode = "browser";
    }
  }

  persistenceMode = "browser";
  setPersistenceStatus("浏览器本地保存", "browser");
  return normalizeState(loadState());
}

async function writeState() {
  const payload = normalizeState(state);
  if (persistenceMode === "desktop") {
    await window.dailyWorkStorage.saveState(payload);
    setPersistenceStatus("已保存到 JSON", "desktop");
    return;
  }

  if (persistenceMode === "server") {
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error("Failed to persist state");
    }
    setPersistenceStatus("已保存到 JSON", "server");
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  setPersistenceStatus("已保存到浏览器", "browser");
}

async function saveState() {
  setPersistenceStatus("正在保存...");
  await writeState();
}

async function persistAndRefresh(afterRefresh) {
  try {
    await saveState();
  } catch {
    alert("保存失败。请确认本地服务仍在运行，然后再试一次。");
    setPersistenceStatus("保存失败");
  }
  refreshUi();
  if (typeof afterRefresh === "function") afterRefresh();
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(dateString) {
  const date = parseDate(dateString);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).format(date);
}

function getRange(range) {
  const baseDate = parseDate(document.querySelector("#timeline-date").value || todayString());
  if (range === "custom") {
    return {
      start: document.querySelector("#stats-start-date").value || formatDate(baseDate),
      end: document.querySelector("#stats-end-date").value || formatDate(baseDate),
    };
  }

  if (range === "day") {
    const date = formatDate(baseDate);
    return { start: date, end: date };
  }

  if (range === "week") {
    const day = baseDate.getDay() || 7;
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - day + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: formatDate(start), end: formatDate(end) };
  }

  if (range === "month") {
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    return { start: formatDate(start), end: formatDate(end) };
  }

  const quarterStartMonth = Math.floor(baseDate.getMonth() / 3) * 3;
  const start = new Date(baseDate.getFullYear(), quarterStartMonth, 1);
  const end = new Date(baseDate.getFullYear(), quarterStartMonth + 3, 0);
  return { start: formatDate(start), end: formatDate(end) };
}

function recordsInRange(range = getRange(activeStatsRange)) {
  return state.records.filter((record) => record.date >= range.start && record.date <= range.end);
}

function getWorkItem(id) {
  return state.workItems.find((item) => item.id === id);
}

function minutesBetween(start, end) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return Math.max(0, endHour * 60 + endMinute - (startHour * 60 + startMinute));
}

function recordMinutes(record) {
  return minutesBetween(record.start, record.end);
}

function formatDuration(start, end) {
  return formatReportDuration(minutesBetween(start, end));
}

function formatReportDuration(minutes) {
  if (minutes < 60) return `${minutes}min`;
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours.toFixed(1)}h`;
}

function nextId(prefix, collection) {
  return `${prefix}-${Date.now().toString(36)}-${String(collection.length + 1).padStart(3, "0")}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getWorkItemsForType(type) {
  return state.workItems.filter((item) => item.defaultType === type);
}

function renderWorkItemSelect(preferredId) {
  const select = document.querySelector("#work-item-select");
  const form = document.querySelector("#entry-form");
  const selectedType = form.elements.type.value;
  const workItems = getWorkItemsForType(selectedType);
  const currentValue = preferredId ?? select.value;

  if (!selectedType) {
    select.innerHTML = `<option value="">请先新建工作类型</option>`;
    return;
  }

  if (workItems.length === 0) {
    select.innerHTML = `<option value="">该类型下暂无关联工作</option>`;
    return;
  }

  select.innerHTML = workItems.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("");
  select.value = workItems.some((item) => item.id === currentValue) ? currentValue : workItems[0].id;
}

function renderTypeSelects() {
  const entryType = document.querySelector('#entry-form select[name="type"]').value;
  const workItemType = document.querySelector("#work-item-type-select").value;
  const options = state.workTypes.map((type) => `<option>${escapeHtml(type)}</option>`).join("");
  document.querySelector('#entry-form select[name="type"]').innerHTML = options;
  document.querySelector("#work-item-type-select").innerHTML = options;
  if (state.workTypes.includes(entryType)) {
    document.querySelector('#entry-form select[name="type"]').value = entryType;
  }
  if (state.workTypes.includes(workItemType)) {
    document.querySelector("#work-item-type-select").value = workItemType;
  }
}

function renderWorkTypes() {
  document.querySelector("#work-type-count").textContent = `${state.workTypes.length} 项`;
}

function renderWorkItems() {
  const map = document.querySelector("#work-map");
  document.querySelector("#work-item-count").textContent = `${state.workItems.length} 项`;
  if (state.workTypes.length === 0) {
    map.innerHTML = `<div class="empty-state">还没有工作类型。先在上方新建一个类型。</div>`;
    return;
  }

  map.innerHTML = state.workTypes
    .map((type) => {
      const typeItems = getWorkItemsForType(type);
      const typeCount = state.records.filter((record) => record.type === type).length;
      const itemsHtml =
        typeItems.length > 0
          ? typeItems
              .map((item) => {
                const count = state.records.filter((record) => record.workItemId === item.id).length;
                return `
                  <article class="work-map-item">
                    <div>
                      <strong>${escapeHtml(item.name)}</strong>
                      <span>${count} 条记录</span>
                    </div>
                    <p>${escapeHtml(item.description || "暂无说明")}</p>
                    <div class="item-actions">
                      <button class="text-button" type="button" data-action="edit-work-item" data-id="${escapeHtml(item.id)}">编辑</button>
                      <button class="text-button danger" type="button" data-action="delete-work-item" data-id="${escapeHtml(item.id)}">删除</button>
                    </div>
                  </article>
                `;
              })
              .join("")
          : `<div class="empty-state compact-empty">这个类型下还没有关联工作。</div>`;
      return `
        <article class="work-map-row">
          <div class="work-map-type">
            <div>
              <strong>${escapeHtml(type)}</strong>
              <span>${typeItems.length} 个工作项 / ${typeCount} 条记录</span>
            </div>
            <div class="item-actions">
              <button class="text-button" type="button" data-action="edit-work-type" data-id="${escapeHtml(type)}">编辑</button>
              <button class="text-button danger" type="button" data-action="delete-work-type" data-id="${escapeHtml(type)}">删除</button>
            </div>
          </div>
          <div class="work-map-items">
            ${itemsHtml}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTimeline() {
  const selectedDate = document.querySelector("#timeline-date").value || todayString();
  const list = document.querySelector("#timeline-list");
  const dayRecords = state.records
    .filter((record) => record.date === selectedDate)
    .sort((a, b) => a.start.localeCompare(b.start));

  if (dayRecords.length === 0) {
    list.innerHTML = `<div class="empty-state">这一天还没有记录。</div>`;
    return;
  }

  list.innerHTML = dayRecords
    .map((record) => {
      const workItem = getWorkItem(record.workItemId);
      return `
        <article class="timeline-item">
          <div class="time-block">
            <strong>${record.start} - ${record.end}</strong><br />
            <span>${formatDuration(record.start, record.end)}</span>
          </div>
          <div class="timeline-main">
            <h4>${workItem?.name ?? "未命名工作"}</h4>
            <p>${record.content}</p>
            ${record.note ? `<p class="note-line">${record.note}</p>` : ""}
            <div class="item-actions">
              <button class="text-button" type="button" data-action="edit-record" data-id="${record.id}">编辑</button>
              <button class="text-button danger" type="button" data-action="delete-record" data-id="${record.id}">删除</button>
            </div>
          </div>
          <span class="tag">${record.type}</span>
        </article>
      `;
    })
    .join("");
}

function getTypeStats(records) {
  const groups = new Map();
  records.forEach((record) => {
    groups.set(record.type, (groups.get(record.type) ?? 0) + recordMinutes(record));
  });
  return Array.from(groups.entries())
    .map(([type, minutes], index) => ({
      type,
      minutes,
      color: TYPE_COLORS[index % TYPE_COLORS.length],
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

function updateSummary() {
  const today = document.querySelector("#timeline-date").value || todayString();
  const dayRecords = state.records.filter((record) => record.date === today);
  const totalMinutes = dayRecords.reduce((sum, record) => sum + recordMinutes(record), 0);
  const typeStats = getTypeStats(dayRecords);

  document.querySelector(".eyebrow").textContent = formatLongDate(today);
  document.querySelector("#today-record-count").textContent = `${dayRecords.length} 条记录`;
  document.querySelector("#total-hours").textContent = formatReportDuration(totalMinutes);
  document.querySelector("#today-main-type").textContent = typeStats[0]?.type ?? "-";
  document.querySelector("#today-note-count").textContent = `${dayRecords.filter((record) => record.note).length} 项`;

  const chart = document.querySelector("#today-mini-chart");
  const legend = document.querySelector("#today-legend");
  chart.innerHTML = totalMinutes
    ? typeStats
        .map((item) => `<span style="--w: ${(item.minutes / totalMinutes) * 100}%; --c: ${item.color}"></span>`)
        .join("")
    : `<span style="--w: 100%; --c: #e5e7eb"></span>`;
  legend.innerHTML = typeStats
    .map((item) => `<span><b style="background:${item.color}"></b>${item.type}</span>`)
    .join("");
}

function renderStats() {
  const range = getRange(activeStatsRange);
  const rangeRecords = recordsInRange(range);
  const totalMinutes = rangeRecords.reduce((sum, record) => sum + recordMinutes(record), 0);
  const typeStats = getTypeStats(rangeRecords);
  const bars = document.querySelector("#stats-type-bars");
  document.querySelector("#stats-type-title").textContent =
    `类型占比（${range.start} 至 ${range.end}，${formatReportDuration(totalMinutes)}）`;

  bars.innerHTML = typeStats.length
    ? typeStats
        .map((item) => {
          const percent = totalMinutes === 0 ? 0 : (item.minutes / totalMinutes) * 100;
          return `<div><span>${item.type}</span><b><i style="width: ${percent}%; background:${item.color}"></i></b><strong>${percent.toFixed(1)}%</strong></div>`;
        })
        .join("")
    : `<div class="empty-state compact">当前范围没有记录。</div>`;

  const workGroups = new Map();
  rangeRecords.forEach((record) => {
    const workItem = getWorkItem(record.workItemId);
    const group = workGroups.get(record.workItemId) ?? {
      name: workItem?.name ?? "未命名工作",
      minutes: 0,
      contents: [],
    };
    group.minutes += recordMinutes(record);
    group.contents.push(record.content);
    workGroups.set(record.workItemId, group);
  });

  const rows = Array.from(workGroups.values()).sort((a, b) => b.minutes - a.minutes);
  document.querySelector("#stats-work-table").innerHTML = rows.length
    ? rows
        .map(
          (row) => `
            <tr>
              <td>${row.name}</td>
              <td>${formatReportDuration(row.minutes)}</td>
              <td>${row.contents.join("；")}</td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="3">当前范围没有记录。</td></tr>`;
}

function groupRecordsForReport(records) {
  const typeGroups = new Map();

  records.forEach((record) => {
    const workItem = getWorkItem(record.workItemId);
    const typeGroup = typeGroups.get(record.type) ?? {
      type: record.type,
      minutes: 0,
      workItems: new Map(),
    };
    const workItemGroup = typeGroup.workItems.get(record.workItemId) ?? {
      name: workItem?.name ?? "未命名工作",
      minutes: 0,
      records: [],
    };

    const minutes = recordMinutes(record);
    workItemGroup.records.push(record);
    workItemGroup.minutes += minutes;
    typeGroup.minutes += minutes;
    typeGroup.workItems.set(record.workItemId, workItemGroup);
    typeGroups.set(record.type, typeGroup);
  });

  return Array.from(typeGroups.values())
    .map((group) => ({
      ...group,
      workItems: Array.from(group.workItems.values()).sort((a, b) => b.minutes - a.minutes),
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

function buildExportMarkdown() {
  const range = getRange(activeStatsRange);
  const typeGroups = groupRecordsForReport(recordsInRange(range));
  const totalMinutes = typeGroups.reduce((sum, group) => sum + group.minutes, 0);
  const lines = [
    "# 工作统计汇报",
    "",
    `统计范围：${range.start} 至 ${range.end}`,
    `总计：${formatReportDuration(totalMinutes)}`,
    "",
  ];

  typeGroups.forEach((typeGroup) => {
    const percent = totalMinutes === 0 ? 0 : (typeGroup.minutes / totalMinutes) * 100;
    lines.push(`## ${typeGroup.type}——${formatReportDuration(typeGroup.minutes)}：${percent.toFixed(1)}%`);
    lines.push("");

    typeGroup.workItems.forEach((workItemGroup, workIndex) => {
      lines.push(`${workIndex + 1}. ${workItemGroup.name}——${formatReportDuration(workItemGroup.minutes)}`);
      workItemGroup.records
        .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
        .forEach((record, recordIndex) => {
          const letter = String.fromCharCode(97 + recordIndex);
          lines.push(`   ${letter}. ${record.content} —— ${formatReportDuration(recordMinutes(record))}`);
        });
      lines.push("");
    });
  });

  return lines.join("\n").trim();
}

function refreshUi() {
  renderTypeSelects();
  renderWorkItemSelect();
  renderWorkTypes();
  renderWorkItems();
  renderTimeline();
  renderStats();
  updateSummary();
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function switchView(viewName) {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === `${viewName}-view`);
  });
}

function resetEntryForm() {
  const form = document.querySelector("#entry-form");
  form.reset();
  form.elements.recordId.value = "";
  form.elements.date.value = document.querySelector("#timeline-date").value || todayString();
  form.elements.type.value = state.workTypes[0] ?? "";
  renderWorkItemSelect();
  form.elements.start.value = "09:30";
  form.elements.end.value = "10:45";
  document.querySelector("#entry-title").textContent = "新增一条工作记录";
  document.querySelector("#entry-submit-label").textContent = "加入今日记录";
}

function fillForm(entry) {
  const form = document.querySelector("#entry-form");
  form.elements.date.value = entry.date ?? document.querySelector("#timeline-date").value;
  form.elements.type.value = entry.type;
  renderWorkItemSelect(entry.workItemId);
  form.elements.workItemId.value = entry.workItemId;
  form.elements.content.value = entry.content;
  form.elements.note.value = entry.note;
  form.elements.start.value = entry.start;
  form.elements.end.value = entry.end;
}

function editRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;
  fillForm(record);
  document.querySelector("#entry-form").elements.recordId.value = id;
  document.querySelector("#entry-title").textContent = "编辑工作记录";
  document.querySelector("#entry-submit-label").textContent = "保存修改";
  switchView("record");
}

async function deleteRecord(id) {
  if (!confirm("确认删除这条工作记录？")) return;
  state.records = state.records.filter((record) => record.id !== id);
  await persistAndRefresh();
}

function resetWorkItemForm() {
  const form = document.querySelector("#work-item-form");
  form.reset();
  form.elements.workItemId.value = "";
  form.elements.name.value = "";
  form.elements.description.value = "";
  form.elements.defaultType.value = state.workTypes[0] ?? "";
  document.querySelector("#work-item-title").textContent = "维护关联工作";
  document.querySelector("#work-item-submit-label").textContent = "新建关联工作";
}

function editWorkItem(id) {
  const item = getWorkItem(id);
  if (!item) return;
  const form = document.querySelector("#work-item-form");
  form.elements.workItemId.value = item.id;
  form.elements.name.value = item.name;
  form.elements.defaultType.value = item.defaultType;
  form.elements.description.value = item.description;
  document.querySelector("#work-item-title").textContent = "编辑关联工作";
  document.querySelector("#work-item-submit-label").textContent = "保存修改";
}

async function deleteWorkItem(id) {
  const used = state.records.some((record) => record.workItemId === id);
  if (used) {
    alert("这个关联工作已经被记录引用，不能直接删除。可以先编辑名称，或者删除相关记录后再删。");
    return;
  }
  if (!confirm("确认删除这个关联工作？")) return;
  state.workItems = state.workItems.filter((item) => item.id !== id);
  await persistAndRefresh();
}

function resetWorkTypeForm() {
  const form = document.querySelector("#work-type-form");
  form.reset();
  form.elements.oldType.value = "";
  form.elements.typeName.value = "";
  document.querySelector("#work-type-title").textContent = "维护工作类型";
  document.querySelector("#work-type-submit-label").textContent = "新建工作类型";
}

function editWorkType(type) {
  const form = document.querySelector("#work-type-form");
  form.elements.oldType.value = type;
  form.elements.typeName.value = type;
  document.querySelector("#work-type-title").textContent = "编辑工作类型";
  document.querySelector("#work-type-submit-label").textContent = "保存修改";
}

async function deleteWorkType(type) {
  const usedByRecords = state.records.some((record) => record.type === type);
  const usedByWorkItems = state.workItems.some((item) => item.defaultType === type);
  if (usedByRecords || usedByWorkItems) {
    alert("这个工作类型已经被记录或关联工作引用，不能直接删除。可以先编辑名称，或调整相关数据后再删。");
    return;
  }
  if (state.workTypes.length <= 1) {
    alert("至少需要保留一个工作类型。");
    return;
  }
  if (!confirm("确认删除这个工作类型？")) return;
  state.workTypes = state.workTypes.filter((item) => item !== type);
  resetWorkTypeForm();
  await persistAndRefresh();
}

function openExportModal() {
  const modal = document.querySelector("#export-modal");
  const textarea = document.querySelector("#export-markdown");
  textarea.value = buildExportMarkdown();
  document.querySelector("#copy-status").textContent = "可复制到汇报文档中继续调整。";
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  textarea.focus();
  textarea.select();
}

function closeExportModal() {
  const modal = document.querySelector("#export-modal");
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

async function copyText(text, statusElement) {
  try {
    await navigator.clipboard.writeText(text);
    statusElement.textContent = "已复制。";
  } catch {
    statusElement.textContent = "复制失败，可手动选中复制。";
  }
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelector("#cancel-entry-edit").addEventListener("click", resetEntryForm);

  document.querySelector("#entry-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = formData.get("recordId");
    if (!formData.get("type")) {
      alert("请先在“关联工作”页面新建一个工作类型。");
      return;
    }
    if (!formData.get("workItemId")) {
      alert("请先在“关联工作”页面为当前工作类型新建一个关联工作。");
      return;
    }
    const selectedWorkItem = getWorkItem(formData.get("workItemId"));
    if (!selectedWorkItem || selectedWorkItem.defaultType !== formData.get("type")) {
      alert("请选择当前工作类型下的关联工作。");
      return;
    }
    if (!formData.get("content").trim()) {
      alert("请填写工作内容。");
      return;
    }
    const nextRecord = {
      id: id || nextId(formData.get("date").replaceAll("-", ""), state.records),
      date: formData.get("date"),
      type: formData.get("type"),
      workItemId: formData.get("workItemId"),
      content: formData.get("content").trim(),
      note: formData.get("note").trim(),
      start: formData.get("start"),
      end: formData.get("end"),
    };

    if (id) {
      state.records = state.records.map((record) => (record.id === id ? nextRecord : record));
    } else {
      state.records.push(nextRecord);
    }

    document.querySelector("#timeline-date").value = nextRecord.date;
    try {
      await saveState();
    } catch {
      alert("保存失败。请确认本地服务仍在运行，然后再试一次。");
      setPersistenceStatus("保存失败");
      return;
    }
    resetEntryForm();
    refreshUi();
    switchView("timeline");
  });

  document.querySelector("#work-item-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = formData.get("workItemId");
    const name = formData.get("name").trim();
    if (state.workTypes.length === 0) {
      alert("请先新建一个工作类型。");
      return;
    }
    if (!name) {
      alert("请填写关联工作名称。");
      return;
    }
    const item = {
      id: id || nextId("work", state.workItems),
      name,
      defaultType: formData.get("defaultType"),
      description: formData.get("description").trim(),
    };

    if (id) {
      state.workItems = state.workItems.map((workItem) => (workItem.id === id ? item : workItem));
    } else {
      state.workItems.push(item);
    }

    try {
      await saveState();
    } catch {
      alert("保存失败。请确认本地服务仍在运行，然后再试一次。");
      setPersistenceStatus("保存失败");
      return;
    }
    refreshUi();
    document.querySelector('#entry-form select[name="type"]').value = item.defaultType;
    renderWorkItemSelect(item.id);
    document.querySelector("#work-item-select").value = item.id;
    resetWorkItemForm();
  });

  document.querySelector("#cancel-work-item-edit").addEventListener("click", resetWorkItemForm);

  document.querySelector("#work-type-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const oldType = formData.get("oldType");
    const typeName = formData.get("typeName").trim();

    if (!typeName) {
      alert("请填写工作类型名称。");
      return;
    }

    if (state.workTypes.includes(typeName) && typeName !== oldType) {
      alert("这个工作类型已经存在。");
      return;
    }

    if (oldType) {
      state.workTypes = state.workTypes.map((type) => (type === oldType ? typeName : type));
      state.records = state.records.map((record) => ({
        ...record,
        type: record.type === oldType ? typeName : record.type,
      }));
      state.workItems = state.workItems.map((item) => ({
        ...item,
        defaultType: item.defaultType === oldType ? typeName : item.defaultType,
      }));
    } else {
      state.workTypes.push(typeName);
    }

    try {
      await saveState();
    } catch {
      alert("保存失败。请确认本地服务仍在运行，然后再试一次。");
      setPersistenceStatus("保存失败");
      return;
    }
    resetWorkTypeForm();
    refreshUi();
  });

  document.querySelector("#cancel-work-type-edit").addEventListener("click", resetWorkTypeForm);

  document.querySelector('#entry-form select[name="type"]').addEventListener("change", () => {
    renderWorkItemSelect();
  });

  document.querySelector("#work-item-select").addEventListener("change", (event) => {
    const item = getWorkItem(event.target.value);
    if (item) {
      document.querySelector("#entry-form").elements.type.value = item.defaultType;
    }
  });

  document.querySelector("#timeline-date").addEventListener("change", () => {
    resetEntryForm();
    refreshUi();
  });

  document.querySelectorAll(".segmented button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".segmented button").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      activeStatsRange = button.dataset.range;
      document.querySelector("#custom-range").classList.toggle("active", activeStatsRange === "custom");
      renderStats();
    });
  });

  document.querySelector("#stats-start-date").addEventListener("change", renderStats);
  document.querySelector("#stats-end-date").addEventListener("change", renderStats);

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "edit-record") editRecord(id);
    if (action === "delete-record") await deleteRecord(id);
    if (action === "edit-work-item") editWorkItem(id);
    if (action === "delete-work-item") await deleteWorkItem(id);
    if (action === "edit-work-type") editWorkType(id);
    if (action === "delete-work-type") await deleteWorkType(id);
  });

  document.querySelector("#export-report").addEventListener("click", openExportModal);
  document.querySelector("#close-export-modal").addEventListener("click", closeExportModal);
  document.querySelector("#copy-export-markdown").addEventListener("click", async () => {
    const textarea = document.querySelector("#export-markdown");
    textarea.select();
    await copyText(textarea.value, document.querySelector("#copy-status"));
  });
  document.querySelector("#export-modal").addEventListener("click", (event) => {
    if (event.target.id === "export-modal") closeExportModal();
  });
}

async function init() {
  state = await loadStateFromStorage();
  const today = todayString();
  document.querySelector("#timeline-date").value = today;
  document.querySelector("#stats-start-date").value = today;
  document.querySelector("#stats-end-date").value = today;
  renderTypeSelects();
  resetEntryForm();
  resetWorkItemForm();
  resetWorkTypeForm();
  bindEvents();
  refreshUi();
}

window.addEventListener("DOMContentLoaded", init);
