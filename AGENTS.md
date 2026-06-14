# Agent Instructions

本文件记录本工程后续维护时必须遵守的协作规则。

## 项目定位

这是一个每日工作时间记录与统计的 Electron 桌面应用。正式使用目录为：

`/Users/zhangmeng/Documents/Baidu/每日工作记录`

该目录中应主要保留：

- `每日工作记录.app`
- `daily-data.json`

开发源码目录为：

`/Users/zhangmeng/Documents/github/daily`

## 提交规则

每次 commit 前必须完成测试。

测试入口：

```bash
npm test
```

当前测试命令会执行：

```bash
node tests/smoke.js
```

测试范围至少覆盖 Electron 应用启动、读取测试 JSON、基础统计展示和 Markdown 导出。若本次改动影响打包、数据保存、窗口生命周期或工作区同步，还必须补充对应验证，并在最终回复中说明验证结果。

## 更新日志

维护 `log.md` 作为版本更新日志。

每次有功能变更、行为调整、数据格式变化、打包方式变化或用户可感知修复时，都必须追加记录。记录应包含：

- 日期
- 变更摘要
- 测试结果
- 是否影响 `daily-data.json` 格式
- 是否已同步到正式使用目录

## 版本号与正式使用目录同步

未经用户明确同意，不得执行以下操作：

- 升级 `package.json` 中的版本号
- 将新构建的应用同步到正式使用目录

正式使用目录路径：

`/Users/zhangmeng/Documents/Baidu/每日工作记录`

如需同步，应先说明将同步的内容和原因，获得用户确认后再执行。

## 数据文件保护

每次更新应用时默认不得修改、覆盖或删除 `daily-data.json`。

唯一例外：本次版本升级确实无法兼容旧 JSON 格式。遇到这种情况必须先：

1. 说明不兼容原因。
2. 给出迁移方案。
3. 备份原 `daily-data.json`。
4. 获得用户明确同意。
5. 执行迁移并在 `log.md` 记录数据格式变化。

