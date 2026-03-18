# DevTaskFlow

DevTaskFlow 是一个可共享、可分发的开发任务流水线工具，用于管理版本化开发流程：

- 初始化项目
- 项目看板登记
- 启动版本（新项目首版 / 老项目迭代）
- 环境检查
- 需求分析
- 方案确认
- 代码生成
- 代码审查
- 问题修复
- 部署
- 封版归档

## 安全说明

- `analyze / write / review / fix` 会扫描项目中的部分文件，并将内容发给配置好的 LLM 服务。
- 如果你使用的是外部 LLM endpoint，请默认把它视为“代码出机”。
- 不建议直接对含敏感信息的仓库使用。
- 请优先使用可信、自建、企业内网或经过审计的 endpoint。
- 在运行 `write / fix` 前，请先备份代码仓库。

## 目标

相比旧版 dev-pipeline，DevTaskFlow 重点解决：

- 硬编码密钥
- 依赖不透明
- 入口不统一
- 仅适配单机环境
- 对 OpenClaw 耦合过深

## CLI

推荐命令名：`dtflow`

### 项目管理与本地界面

新增命令：

- `dtflow project-list`：查看当前工作区项目看板
- `dtflow project-status --name <项目名>`：查看单个项目
- `dtflow next-version --version v1.2.3 --bump patch`：计算下一个版本号
- `dtflow dashboard`：生成本地 HTML 看板界面，可直接双击打开
- `dtflow serve --port 8765`：启动本地看板服务

### 归档规范

当前约定：代码仍管理在 `projects/` 文件夹下，但每次封版需要在对应版本目录中归档：

- 文档：`versions/<version>/archive/docs/`
- 源码：`versions/<version>/archive/src/`
- 部署说明：`versions/<version>/docs/DEPLOYMENT.md`

也就是说，`seal` 不只是封状态，还要把 **文档 + 源码 + 部署说明** 一并整理好。

### 建议入口规则

每次启动开发任务，必须先明确项目归属：

1. **新建项目**：先 `dtflow init-project`
2. **启动版本**：再 `dtflow start-version --version vX.Y.Z --new-project`
3. **已有项目迭代**：进入老项目目录后执行 `dtflow start-version --version vX.Y.Z`

这样所有开发任务都会先挂到当前工作区的项目看板（PROJECTS.md），再进入版本流程。

## 当前阶段

第一阶段只实现基础骨架与配置体系，后续再逐步迁移 analyze/write/review/fix 等核心能力。

## 目录结构

```text
skills/devtaskflow/
├── SKILL.md
├── README.md
├── commands/
│   └── dtflow
├── lib/
│   ├── cli.py
│   ├── config.py
│   ├── doctor.py
│   ├── state.py
│   └── scaffold.py
├── templates/
│   ├── config.json
│   └── env.example
└── docs/
    └── ARCHITECTURE.md
```
