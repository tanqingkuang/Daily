const { _electron: electron } = require("playwright");
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const testDataFile = path.join(root, "test-data.json");

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
  fs.rmSync(testDataFile, { force: true });
  fs.rmSync(`${testDataFile}.tmp`, { force: true });

  const electronApp = await electron.launch({
    args: ["."],
    cwd: root,
    env: {
      ...process.env,
      DATA_FILE: "test-data.json",
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
        workTypes: ["开发实现"],
        workItems: [
          {
            id: "work-smoke-001",
            name: "每日工作记录工具",
            defaultType: "开发实现",
            description: "用于验证真实空数据流程。",
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
    fs.rmSync(testDataFile, { force: true });
    fs.rmSync(`${testDataFile}.tmp`, { force: true });
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
