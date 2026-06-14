const { test, expect } = require("@playwright/test");
const path = require("path");

test("daily work tracker core flow", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(`file://${path.resolve(__dirname, "../index.html")}`);
  await expect(page.getByRole("heading", { name: "新增一条工作记录" })).toBeVisible();

  const today = new Date().toISOString().slice(0, 10);
  await page.locator('select[name="workItemId"]').selectOption({ label: "每日工作记录工具" });
  await page.locator('input[name="date"]').fill(today);
  await page.locator('input[name="start"]').fill("08:30");
  await page.locator('input[name="end"]').fill("09:15");
  await page.locator('textarea[name="content"]').fill("Playwright 自验证流程开发。");
  await page.locator('textarea[name="note"]').fill("确认新增、统计、导出流程可用。");
  await page.getByRole("button", { name: "加入今日记录" }).click();

  await expect(page.getByRole("heading", { name: "今日时间线" })).toBeVisible();
  await expect(page.locator("#timeline-list")).toContainText("Playwright 自验证流程开发。");

  await page.getByRole("button", { name: "统计分析" }).click();
  await expect(page.getByText(/类型占比/)).toBeVisible();
  await expect(page.locator("#stats-work-table")).toContainText("Playwright 自验证流程开发。");

  await page.getByRole("button", { name: "导出" }).click();
  await expect(page.getByRole("dialog", { name: "导出 Markdown 汇报" })).toBeVisible();
  await expect(page.locator("#export-markdown")).toHaveValue(/# 工作统计汇报/);
  await expect(page.locator("#export-markdown")).toHaveValue(/Playwright 自验证流程开发。/);

  expect(errors).toEqual([]);
});
