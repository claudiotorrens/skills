---
name: 腾讯云资源管理工具
description: 通过自然语言操作腾讯云资源。支持查询、配置、管理等所有腾讯云 API 3.0 产品。
version: v1.0.0
---

## Triggers

激活条件：查询云资源、配置云服务、管理云账户、获取云信息、检查云状态。

## Scope

本 Skill 覆盖**腾讯云资源查询和管理** — 通过 TCCLI 操作云上资源。

**不包括**：本地开发、代码部署、CI/CD 流程 → 使用其他 Skill。

## 安装检查

### 检查是否已安装

```bash
tccli --version
```

如果显示版本号（如 `3.1.55.1`），说明已安装。

### 安装 TCCLI

```bash
pip install tccli
```

### 配置凭证（环境变量）

通过环境变量配置腾讯云 API 密钥：
```bash
export TENCENTCLOUD_SECRET_ID="<用户提供的 SecretId>"
export TENCENTCLOUD_SECRET_KEY="<用户提供的 SecretKey>"
export TENCENTCLOUD_REGION="ap-beijing"
```
请向用户索取 `SecretId` 和 `SecretKey`，**不要使用占位符直接执行**。用户可在 [API 密钥管理](https://console.cloud.tencent.com/cam/capi) 页面获取密钥。

## 使用说明

### 基本语法

```
/tccli <服务> <操作> [选项]
```

### 获取帮助

**查看所有服务**
```
tccli --help
```

**查看特定服务的操作**
```
tccli cvm --help
```

**查看特定操作的参数**
```
tccli cvm describe-instances --help
```

### 常见查询操作

**查询云服务器实例**
```
tccli cvm describe-instances --region ap-beijing
```

**查询云硬盘**
```
tccli cbs describe-disks --region ap-beijing
```

**查询 VPC**
```
tccli vpc describe-vpcs --region ap-beijing
```

**查询 DNS 记录**
```
tccli dnspod describe-records --domain example.com
```

## 一些场景的使用建议(当进行复杂场景操作时、或者需要一些参考时, 可以读取以下文件)
- [云资源的巡检和监控](references/auto-check-resource.md)

## 写操作和高危操作

### 确认机制

对于以下操作，**必须要求用户明确确认**：

**高危操作（需要二次确认）**：
- 删除实例、云硬盘、VPC、DNS 记录
- 修改安全组规则
- 删除数据库

**中危操作（需要单次确认）**：
- 创建、修改资源
- 启动、停止实例
- 修改 DNS 记录

**低风险操作（无需确认）**：
- 查询、列表、获取信息

### 确认流程

1. **提示用户**：清楚地说明将要执行的操作
2. **显示影响**：说明操作的影响范围
3. **等待确认**：要求用户明确输入"确认"或"是"
4. **执行操作**：收到确认后才执行

### 示例

```
用户：删除实例 i-xxxxx
Agent：
⚠️ 警告：即将删除实例 i-xxxxx
- 实例名称：test-server
- 地域：ap-beijing
- 状态：运行中

此操作不可撤销。请确认是否继续？
（输入"确认"继续，或"取消"放弃）
```

## 常见混淆

| 你以为                    | 实际情况                    |
|------------------------|-------------------------|
| "TCCLI 就是腾讯云网页"        | TCCLI 是命令行工具，需要在终端使用    |
| "所有操作都需要确认"            | 查询操作无需确认，修改操作需要谨慎       |
| "help 只能查看英文"          | help 支持中文，用 `--help` 查看 |
| "一个命令只能操作一个资源"         | 支持批量操作，用 filter 和循环     |
| "Lighthouse和CVM是同一个产品" | Lighthouse和CVM是不同的产品    |

## 快速开始

### 查询实例
```
我想查看北京地区的所有云服务器
→ tccli cvm describe-instances --region ap-beijing
```


### 查询 DNS
```
我想查看 example.com 的所有 DNS 记录
→ tccli dnspod describe-records --domain example.com
```

### 查询账户信息
```
我想查看当前账户的基本信息
→ tccli cvm describe-account-attributes --region ap-beijing
```

### 获取帮助
```
我不知道怎么用
→ tccli --help（查看所有服务）
→ tccli cvm --help（查看 CVM 服务的操作）
→ tccli cvm describe-instances --help（查看具体操作的参数）
```

## 安全建议

- **启用 2FA** 保护腾讯云账户
- **定期轮换凭证** — 不要长期使用同一个 Secret Key
- **使用 CAM** 为不同操作创建不同的 IAM 用户
- **启用云审计** 记录所有操作
- **查询优先** — 先用查询操作了解情况，再做修改
- **确认机制** — 高危操作必须要求用户确认

## 常见问题

**Q: 如何查看操作历史？**
A: 启用云审计（CloudAudit），所有操作都会被记录。

**Q: 如何查询特定标签的资源？**
A: 使用 `--filters` 参数，例如 `--filters Name=tag:Environment,Values=production`

**Q: 如何查看可用的地域？**
A: 运行 `tccli cvm describe-regions` 查看所有地域。

**Q: 命令执行失败怎么办？**
A: 检查凭证是否有效、地域是否正确、参数是否完整。用 `--help` 查看参数说明。

**Q: 如何在没有浏览器的机器上登录？**
A: 使用 `tccli auth login --browser no`，然后在有浏览器的机器上完成登录。

## 参考资源

- [TCCLI 官方文档](https://cloud.tencent.com/document/product/440)
- [腾讯云 API 3.0](https://cloud.tencent.com/document/api)
- [访问管理（CAM）](https://cloud.tencent.com/document/product/598)
- [云审计](https://cloud.tencent.com/document/product/629)

---

**版本**：v1.0.0  
**最后更新**：2026-03-19
