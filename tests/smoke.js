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
            name: "每日工作记录工具 <script>bad()</script>",
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
            content: "<b>Playwright 自验证流程开发。</b>",
            note: '<img src=x onerror="window.__xss = true">确认新增、统计、导出流程可用。',
            start: "08:30",
            end: "09:15",
          },
        ],
      });
    }, today);
    await page.reload();
    await page.waitForSelector("#entry-title", { timeout: 10000 });
    assert.strictEqual(await page.locator('script[src^="https://unpkg.com"]').count(), 0);
    assert(!(await page.locator(".nav-list").textContent()).includes("JSON 数据"));

    // 时间输入归一化：兼容 9:00 / 9：00 / 9:0 / 裸数字等写法
    const timeCases = await page.evaluate(() => {
      const inputs = ["09:00", "9:00", "9：00", "9:0", "9", "930", "0930", " 9:00 ", "12:5", "25:00", "9:99", "abc", ""];
      return inputs.map((value) => [value, window.normalizeTime(value)]);
    });
    const expectedTimes = {
      "09:00": "09:00",
      "9:00": "09:00",
      "9：00": "09:00",
      "9:0": "09:00",
      "9": "09:00",
      "930": "09:30",
      "0930": "09:30",
      " 9:00 ": "09:00",
      "12:5": "12:05",
      "25:00": null,
      "9:99": null,
      abc: null,
      "": null,
    };
    for (const [input, output] of timeCases) {
      assert.strictEqual(output, expectedTimes[input], `normalizeTime(${JSON.stringify(input)}) => ${JSON.stringify(output)}`);
    }

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
    assert((await page.locator("#timeline-list").textContent()).includes("<b>Playwright 自验证流程开发。</b>"));
    assert.strictEqual(await page.locator("#timeline-list img").count(), 0);
    assert.strictEqual(await page.locator("#timeline-list script").count(), 0);

    await switchView(page, "stats");
    assert((await page.locator("#stats-work-table").textContent()).includes("Playwright 自验证流程开发。"));
    assert((await page.locator("#stats-work-table").textContent()).includes("<b>Playwright 自验证流程开发。</b>"));
    assert.strictEqual(await page.locator("#stats-work-table b").count(), 0);
    assert.strictEqual(await page.locator("#stats-work-table img").count(), 0);

    await page.getByRole("button", { name: "导出" }).click();
    await page.waitForSelector("#export-markdown");
    const markdown = await page.locator("#export-markdown").inputValue();
    assert(markdown.includes("# 工作统计汇报"));
    assert(markdown.includes("Playwright 自验证流程开发。"));

    // 新增记录端到端：宽松时间写法应被归一化，结束时间应同步到下次开始时间
    await page.locator("#close-export-modal").click();
    await switchView(page, "record");
    await page.locator('#entry-form select[name="type"]').selectOption("需求沟通");
    await page.locator("#work-item-select").selectOption("work-smoke-002");
    await page.locator('#entry-form textarea[name="content"]').fill("验证宽松时间输入与时间同步。");
    await page.locator('#entry-form input[name="start"]').fill("9:5");
    await page.locator('#entry-form input[name="end"]').fill("10:5");
    await page.locator('#entry-form button[type="submit"]').click();
    // 新增后应停留在记录页，不自动跳转到时间线
    await page.waitForFunction(
      () => document.querySelector("#record-mini-timeline").textContent.includes("需求评审"),
      { timeout: 10000 }
    );
    assert(await page.locator("#record-view.active").count(), "新增后应停留在记录页");
    assert.strictEqual(await page.locator("#timeline-view.active").count(), 0);

    // 提交成功后，开始时间应同步为刚才的结束时间（10:05）
    assert.strictEqual(await page.locator('#entry-form input[name="start"]').inputValue(), "10:05");

    // 记录页右侧的当日时间线应体现两条记录，且不含编辑/删除操作
    const miniText = await page.locator("#record-mini-timeline").textContent();
    assert(miniText.includes("每日工作记录工具"));
    assert(miniText.includes("需求评审"));
    assert(miniText.includes("09:05-10:05"));
    assert.strictEqual(await page.locator("#record-mini-timeline button").count(), 0);

    const saved = JSON.parse(fs.readFileSync(testDataFile, "utf8"));
    assert.strictEqual(saved.records.length, 2);
    const addedRecord = saved.records.find((record) => record.id !== "record-smoke-001");
    assert(addedRecord, "应写入新增记录");
    assert.strictEqual(addedRecord.start, "09:05");
    assert.strictEqual(addedRecord.end, "10:05");
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
