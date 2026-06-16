# 更新日志

## 未发布

- 日期：2026-06-16
- 变更摘要：新增 GitHub Actions CI 工作流，push、pull request 和手动触发时会在 macOS runner 上执行 `npm ci`、`npm test`、`npm run build:mac`，并上传 macOS app zip 构建产物。
- 测试入口：`npm test`。
- 测试结果：通过。
- 开发目录 app 编译：已执行 `npm run build:mac`。
- `daily-data.json` 格式影响：无。
- 正式使用目录同步：未同步。

## V1.0.4

- 日期：2026-06-16
- 新增记录：时间输入支持 `9:00`、`9：00`（全角）、`9:0`、裸数字等写法，提交时统一归一化为 `HH:MM`。
- 新增记录：新增成功后把结束时间同步为下一条的开始时间，连续录入时只需改结束时间。
- 新增记录：右侧「今日概览」下方新增只读「当日时间线」，压缩展示当日记录，不含编辑/删除操作。
- 新增记录：加入记录后停留在记录页，不再自动跳转到时间线，便于连续录入。
- 界面：导航与视图标题「今日时间线」改为「时间线」（支持选择任意日期）。
- 测试入口：`npm test`。
- 测试结果：通过。
- 开发目录 app 编译：已执行 `npm run build:mac`。
- Windows 构建验证：已执行 `npm run build:win`。
- `daily-data.json` 格式影响：无。

## V1.0.3

- 日期：2026-06-14
- 安全修复：图标脚本改为本地随应用打包，不再运行时加载远程 `unpkg` 脚本。
- 安全修复：时间线、今日类型图例、统计类型占比和统计工作表格中的用户数据统一转义后再渲染。
- 测试入口：`npm test`。
- 测试结果：通过。
- 开发目录 app 编译：已执行 `npm run build:mac`。
- Windows 构建验证：已执行 `npm run build:win`。
- `daily-data.json` 格式影响：无。
- 正式使用目录同步：已同步，且未修改 `daily-data.json`。
- 正式使用目录：`/Users/zhangmeng/Documents/Baidu/每日工作记录`。

## V1.0.2

- 日期：2026-06-14
- 新增记录：关联工作下拉菜单根据当前工作类型筛选，避免跨类型错选。
- 关联工作：页面顺序调整为先维护工作类型、再维护关联工作；已有类型和工作项在底部左右分组展示。
- Windows 发布：验证 macOS 交叉编译 Windows x64 portable 包。
- 测试入口：`npm test`。
- 测试结果：通过。
- 开发目录 app 编译：已执行 `npm run build:mac`。
- Windows 构建验证：已执行 `npm run build:win`，输出 Windows x64 portable 包。
- `daily-data.json` 格式影响：无。
- 正式使用目录同步：未同步。

## V1.0.1

- 日期：2026-06-14
- 调整新增记录表单的开始/结束时间布局，两个时间字段同一行显示。
- 将开始/结束时间输入从原生时间控件改为文本时间输入，避免桌面端显示异常。
- 维护规则新增：每次修改后必须重新编译开发目录 app。
- 测试入口：`npm test`。
- 测试结果：通过。
- 开发目录 app 编译：已执行 `npm run build:mac`。
- `daily-data.json` 格式影响：无。
- 正式使用目录同步：已同步，且未修改 `daily-data.json`。
- 正式使用目录：`/Users/zhangmeng/Documents/Baidu/每日工作记录`。

## V1.0.0

- 日期：2026-06-14
- 初始化 Electron 桌面应用版本。
- 应用数据保存到正式使用目录中的 `daily-data.json`。
- 清理旧的本地网页服务启动方式，保留 Electron 桌面应用源码。
- 应用界面显示版本号 `V1.0.0`。
- 测试入口：`npm test`。
- 测试结果：通过。
- `daily-data.json` 格式影响：无。
- 正式使用目录同步：已同步，且未修改 `daily-data.json`。
- 正式使用目录：`/Users/zhangmeng/Documents/Baidu/每日工作记录`。
