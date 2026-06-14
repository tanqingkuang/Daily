# 更新日志

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
