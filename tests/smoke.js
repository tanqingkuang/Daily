const { _electron: electron } = require("playwright");
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const portableDataDir = path.join(root, ".tmp-portable-data");
const testDataFile = path.join(portableDataDir, "test-data.json");

async function switchView(page, viewName) {
  await page.evaluate((targetView) => {
    document.querySelectorAll(".nav-item").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === targetView);
    });
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("active", view.id === `${targetView}-view`);
    });
  }, viewName);
}

async function main() {
  fs.rmSync(portableDataDir, { recursive: true, force: true });
  fs.mkdirSync(portableDataDir, { recursive: true });

  const electronApp = await electron.launch({
    args: ["."],
    cwd: root,
    env: {
      ...process.env,
      DATA_FILE: "test-data.json",
      PORTABLE_EXECUTABLE_DIR: portableDataDir,
    },
  });
  const page = await electronApp.firstWindow();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  try {
    await page.waitForSelector("#entry-title", { timeout: 10000 });

    const today = new Date().toISOString().slice(0, 10);
    await page.evaluate((date) => {
      return window.dailyWorkStorage.saveState({
        schemaVersion: 1,
        workTypes: ["开发实现", "需求沟通"],
        workItems: [
          {
            id: "work-smoke-001",
            name: "每日工作记录工具",
            defaultType: "开发实现",
            description: "用于验证真实空数据流程。",
          },
          {
            id: "work-smoke-002",
            name: "需求评审",
            defaultType: "需求沟通",
            description: "用于验证关联工作按类型筛选。",
          },
        ],
        records: [
          {
            id: "record-smoke-001",
            date,
            type: "开发实现",
            workItemId: "work-smoke-001",
            content: "Playwright 自验证流程开发。",
            note: "确认新增、统计、导出流程可用。",
            start: "08:30",
            end: "09:15",
          },
        ],
      });
    }, today);
    await page.reload();
    await page.waitForSelector("#entry-title", { timeout: 10000 });
    assert(!(await page.locator(".nav-list").textContent()).includes("JSON 数据"));

    await switchView(page, "record");
    await page.locator('#entry-form select[name="type"]').selectOption("开发实现");
    assert((await page.locator("#work-item-select").textContent()).includes("每日工作记录工具"));
    assert(!(await page.locator("#work-item-select").textContent()).includes("需求评审"));
    await page.locator('#entry-form select[name="type"]').selectOption("需求沟通");
    assert((await page.locator("#work-item-select").textContent()).includes("需求评审"));
    assert(!(await page.locator("#work-item-select").textContent()).includes("每日工作记录工具"));

    await switchView(page, "work-items");
    await page.waitForSelector("#work-map");
    const workMapText = await page.locator("#work-map").textContent();
    assert(workMapText.includes("开发实现"));
    assert(workMapText.includes("每日工作记录工具"));
    assert(workMapText.includes("需求沟通"));
    assert(workMapText.includes("需求评审"));

    await switchView(page, "timeline");
    await page.waitForSelector("#timeline-list");
    assert((await page.locator("#timeline-list").textContent()).includes("Playwright 自验证流程开发。"));

    await switchView(page, "stats");
    assert((await page.locator("#stats-work-table").textContent()).includes("Playwright 自验证流程开发。"));

    await page.getByRole("button", { name: "导出" }).click();
    await page.waitForSelector("#export-markdown");
    const markdown = await page.locator("#export-markdown").inputValue();
    assert(markdown.includes("# 工作统计汇报"));
    assert(markdown.includes("Playwright 自验证流程开发。"));

    const saved = JSON.parse(fs.readFileSync(testDataFile, "utf8"));
    assert.strictEqual(saved.records.length, 1);
    assert.deepStrictEqual(errors, []);
  } finally {
    await electronApp.close();
    fs.rmSync(portableDataDir, { recursive: true, force: true });
  }
}

main()
  .then(() => {
    console.log("Electron smoke test passed.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
