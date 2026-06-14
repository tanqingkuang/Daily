const STORAGE_KEY = "daily-work-tracker-state-v1";
const WORK_TYPES = ["开发实现", "需求沟通", "问题排查", "文档整理", "会议同步", "学习研究"];
const TYPE_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#dc2626", "#0891b2"];

const seedState = {
  workItems: [
    {
      id: "work-001",
      name: "每日工作记录工具",
      defaultType: "开发实现",
      description: "记录、统计和 JSON 本地存储方案。",
    },
    {
      id: "work-002",
      name: "客户需求整理",
      defaultType: "需求沟通",
      description: "整理客户反馈、需求优先级和待确认问题。",
    },
    {
      id: "work-003",
      name: "线上问题排查",
      defaultType: "问题排查",
      description: "定位线上异常、记录处理过程和结果。",
    },
    {
      id: "work-004",
      name: "同步方案说明",
      defaultType: "文档整理",
      description: "说明百度云盘同步目录、备份和文件结构。",
    },
    {
      id: "work-005",
      name: "A 项目",
      defaultType: "开发实现",
      description: "示例：同一项目分多天完成开发和优化，导出时合并为一项。",
    },
  ],
  records: [
    {
      id: "20260614-001",
      date: "2026-06-14",
      type: "需求沟通",
      workItemId: "work-002",
      content: "整理了 6 条待确认需求，并标记优先级。",
      note: "其中 2 条需要下次会议确认边界。",
      start: "09:00",
      end: "10:30",
    },
    {
      id: "20260614-002",
      date: "2026-06-14",
      type: "开发实现",
      workItemId: "work-001",
      content: "完成首版 UI demo 的表单、时间线和统计视图。",
      note: "先验证使用流程，再决定真实文件读写方式。",
      start: "10:40",
      end: "12:10",
    },
    {
      id: "20260614-003",
      date: "2026-06-14",
      type: "问题排查",
      workItemId: "work-003",
      content: "定位到导入参数缺失导致的异常。",
      note: "需要补一条参数校验。",
      start: "14:00",
      end: "15:05",
    },
    {
      id: "20260614-004",
      date: "2026-06-14",
      type: "文档整理",
      workItemId: "work-004",
      content: "补充 JSON 文件放置和备份说明。",
      note: "后续要加自动备份提醒。",
      start: "16:20",
      end: "17:15",
    },
    {
      id: "20260613-001",
      date: "2026-06-13",
      type: "开发实现",
      workItemId: "work-001",
      content: "分析每日记录工具的 JSON 结构和统计字段。",
      note: "这条用于展示跨天同一工作项的内容合并。",
      start: "19:10",
      end: "20:00",
    },
    {
      id: "20260608-001",
      date: "2026-06-08",
      type: "开发实现",
      workItemId: "work-005",
      content: "完成 IT 模块的基础开发。",
      note: "周报导出时会和同项目后续优化合并。",
      start: "10:00",
      end: "11:40",
    },
    {
      id: "20260610-001",
      date: "2026-06-10",
      type: "开发实现",
      workItemId: "work-005",
      content: "优化 IT 模块的数据处理流程。",
      note: "和周一记录属于同一个关联工作。",
      start: "15:00",
      end: "16:20",
    },
  ],
};

const sampleEntries = [
  {
    type: "开发实现",
    workItemId: "work-001",
    content: "完成首版 UI 结构：新增记录、今日时间线、统计分析、JSON 预览。",
    note: "下一步需要确认关联工作维护方式和统计合并规则。",
    start: "09:30",
    end: "10:45",
  },
  {
    type: "需求沟通",
    workItemId: "work-002",
    content: "确认统计按开始时间所在日期归档，跨天记录后续单独处理。",
    note: "先不做复杂排班，只记录已完成工作。",
    start: "11:00",
    end: "11:35",
  },
  {
    type: "学习研究",
    workItemId: "work-001",
    content: "研究本地 JSON 存储和浏览器文件访问方案。",
    note: "真实版本可选择手动导入导出，或使用浏览器文件权限。",
    start: "19:20",
    end: "20:10",
  },
];

let state = loadState();
let sampleIndex = 0;
let activeStatsRange = "day";

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(seedState);
    const parsed = JSON.parse(saved);
    return {
      workItems: Array.isArray(parsed.workItems) ? parsed.workItems : structuredClone(seedState.workItems),
      records: Array.isArray(parsed.records) ? parsed.records : structuredClone(seedState.records),
    };
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function renderWorkItemSelect() {
  const select = document.querySelector("#work-item-select");
  select.innerHTML = state.workItems
    .map((item) => `<option value="${item.id}">${item.name}</option>`)
    .join("");
}

function renderWorkItems() {
  const list = document.querySelector("#work-item-list");
  document.querySelector("#work-item-count").textContent = `${state.workItems.length} 项`;
  list.innerHTML = state.workItems
    .map((item) => {
      const count = state.records.filter((record) => record.workItemId === item.id).length;
      return `
        <article class="work-item-card">
          <div>
            <strong>${item.name}</strong>
            <span>${item.defaultType}</span>
          </div>
          <p>${item.description || "暂无说明"}</p>
          <div class="item-actions">
            <small>${count} 条记录</small>
            <button class="text-button" type="button" data-action="edit-work-item" data-id="${item.id}">编辑</button>
            <button class="text-button danger" type="button" data-action="delete-work-item" data-id="${item.id}">删除</button>
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

function renderJson() {
  const data = {
    schemaVersion: 1,
    storage: {
      browserStorageKey: STORAGE_KEY,
      note: "当前纯前端版本保存在浏览器 localStorage；浏览器不能静默写入同目录 JSON 文件。",
    },
    workItems: state.workItems,
    records: state.records,
  };
  document.querySelector("#json-preview").textContent = JSON.stringify(data, null, 2);
}

function refreshUi() {
  renderWorkItemSelect();
  renderWorkItems();
  renderTimeline();
  renderStats();
  renderJson();
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
  form.elements.start.value = "09:30";
  form.elements.end.value = "10:45";
  document.querySelector("#entry-title").textContent = "新增一条工作记录";
  document.querySelector("#entry-submit-label").textContent = "加入今日记录";
}

function fillForm(entry) {
  const form = document.querySelector("#entry-form");
  form.elements.date.value = entry.date ?? document.querySelector("#timeline-date").value;
  form.elements.type.value = entry.type;
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

function deleteRecord(id) {
  if (!confirm("确认删除这条工作记录？")) return;
  state.records = state.records.filter((record) => record.id !== id);
  saveState();
  refreshUi();
}

function resetWorkItemForm() {
  const form = document.querySelector("#work-item-form");
  form.reset();
  form.elements.workItemId.value = "";
  form.elements.name.value = "";
  form.elements.description.value = "";
  form.elements.defaultType.value = WORK_TYPES[0];
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

function deleteWorkItem(id) {
  const used = state.records.some((record) => record.workItemId === id);
  if (used) {
    alert("这个关联工作已经被记录引用，不能直接删除。可以先编辑名称，或者删除相关记录后再删。");
    return;
  }
  if (!confirm("确认删除这个关联工作？")) return;
  state.workItems = state.workItems.filter((item) => item.id !== id);
  saveState();
  refreshUi();
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

  document.querySelector("#fill-sample").addEventListener("click", () => {
    fillForm({
      ...sampleEntries[sampleIndex % sampleEntries.length],
      date: document.querySelector("#timeline-date").value || todayString(),
    });
    sampleIndex += 1;
  });

  document.querySelector("#cancel-entry-edit").addEventListener("click", resetEntryForm);

  document.querySelector("#entry-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = formData.get("recordId");
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
    saveState();
    resetEntryForm();
    refreshUi();
    switchView("timeline");
  });

  document.querySelector("#work-item-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = formData.get("workItemId");
    const item = {
      id: id || nextId("work", state.workItems),
      name: formData.get("name").trim(),
      defaultType: formData.get("defaultType"),
      description: formData.get("description").trim(),
    };

    if (id) {
      state.workItems = state.workItems.map((workItem) => (workItem.id === id ? item : workItem));
    } else {
      state.workItems.push(item);
    }

    saveState();
    refreshUi();
    document.querySelector("#work-item-select").value = item.id;
    resetWorkItemForm();
    switchView("record");
  });

  document.querySelector("#cancel-work-item-edit").addEventListener("click", resetWorkItemForm);

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

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "edit-record") editRecord(id);
    if (action === "delete-record") deleteRecord(id);
    if (action === "edit-work-item") editWorkItem(id);
    if (action === "delete-work-item") deleteWorkItem(id);
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
  document.querySelector("#copy-json").addEventListener("click", async () => {
    await copyText(document.querySelector("#json-preview").textContent, document.querySelector("#copy-json span"));
    setTimeout(() => {
      document.querySelector("#copy-json span").textContent = "复制";
    }, 1200);
  });
}

function init() {
  const today = todayString();
  document.querySelector("#timeline-date").value = today;
  document.querySelector("#stats-start-date").value = today;
  document.querySelector("#stats-end-date").value = today;
  resetEntryForm();
  resetWorkItemForm();
  bindEvents();
  refreshUi();
}

window.addEventListener("DOMContentLoaded", init);
