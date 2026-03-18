# 安装确认 / Installation Qualification (IQ)

| 属性 / Attribute | 内容 / Content |
|-----------------|----------------|
| 文档编号 / Document ID | {DOC_ID} |
| 版本 / Version | {VERSION} |
| 日期 / Date | {DATE} |
| 作者 / Author | {AUTHOR} |
| 审核 / Reviewer | {REVIEWER} |
| 批准 / Approver | {APPROVER} |
| 系统名称 / System Name | {SYSTEM_NAME} |
| 系统版本 / System Version | {SYSTEM_VERSION} |
| GAMP 分类 / GAMP Category | Category {GAMP_CATEGORY} |

---

## 1. 目的 / Purpose

本文档验证 {SYSTEM_NAME} 系统（版本: {SYSTEM_VERSION}）的硬件、软件和网络环境已正确安装和配置，所有组件符合设计规格要求，满足后续验证测试的前置条件。

This document verifies that the hardware, software, and network environment for {SYSTEM_NAME} have been properly installed and configured according to specifications.

## 2. 范围 / Scope

### 2.1 IQ 确认范围 / IQ Scope

IQ 确认范围包括以下方面:

| 类别 / Category | 项目 / Items | 优先级 / Priority |
|---------------|-------------|------------------|
| 硬件 / Hardware | 服务器、存储、网络设备 | [必须] |
| 操作系统 / OS | 系统安装和配置 | [必须] |
| 中间件 / Middleware | Web服务器、数据库等 | [必须] |
| 应用软件 / Application | 应用程序安装 | [必须] |
| 网络配置 / Network | 防火墙、端口、路由 | [必须] |
| 安全配置 / Security | 用户、权限、策略 | [必须] |
| 备份系统 / Backup | 备份软件和策略 | [应该] |
| 监控组件 / Monitoring | 监控agent和配置 | [应该] |

### 2.2 排除范围 / Excluded Scope

以下项目不在IQ确认范围内:

- [ ] 业务功能测试 (属于OQ/PQ)
- [ ] 性能测试 (属于PQ)
- [ ] 用户接受测试

### 2.3 参考文档 / Reference Documents

| 文档 / Document | 文档编号 / Document ID | 版本 / Version |
|---------------|---------------------|---------------|
| 技术规格 / TS | | |
| 风险评估 / RA | | |
| 网络架构图 / Network Diagram | | |

## 3. 环境信息 / Environment Information

### 3.1 硬件环境 / Hardware Environment

#### 3.1.1 服务器清单 / Server Inventory

| 序号 | 主机名 / Hostname | IP地址 | 角色 | 硬件配置 | 厂商 | 序列号 |
|------|-----------------|--------|------|---------|------|-------|
| 1 | | | 应用服务器 | CPU: , 内存: , 磁盘: | | |
| 2 | | | 数据库服务器 | CPU: , 内存: , 磁盘: | | |
| 3 | | | 缓存服务器 | CPU: , 内存: , 磁盘: | | |

#### 3.1.2 网络设备 / Network Equipment

| 序号 | 设备类型 | 型号 | IP地址 | 端口 | 用途 |
|------|---------|------|--------|------|------|
| 1 | 交换机 | | | | |
| 2 | 防火墙 | | | | |
| 3 | 负载均衡器 | | | | |

### 3.2 软件环境 / Software Environment

#### 3.2.1 操作系统 / Operating Systems

| 序号 | 主机名 | 操作系统 | 版本 | 内核版本 | 安装日期 |
|------|--------|---------|------|---------|---------|
| 1 | | CentOS/Ubuntu | | | |
| 2 | | CentOS/Ubuntu | | | |

#### 3.2.2 中间件 / Middleware

| 序号 | 中间件类型 | 软件名称 | 版本 | 端口 | 状态 |
|------|-----------|---------|------|------|------|
| 1 | Web服务器 | Nginx | | 80,443 | 运行中 |
| 2 | 数据库 | PostgreSQL | | 5432 | 运行中 |
| 3 | 缓存 | Redis | | 6379 | 运行中 |

#### 3.2.3 应用程序 / Application Software

| 序号 | 应用名称 | 版本 | 安装路径 | 端口 | 状态 |
|------|---------|------|---------|------|------|
| 1 | {SYSTEM_NAME} | {SYSTEM_VERSION} | | 8080 | 运行中 |

## 4. IQ 确认检查项 / IQ Check Items

### 4.1 硬件确认 / Hardware Qualification

#### 4.1.1 服务器硬件检查 / Server Hardware Check

| 序号 | 检查项目 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|---------|---------|---------|------|------|
| IQ-HW-001 | 服务器型号/品牌 | [型号] | | [Pass]/[Fail] | |
| IQ-HW-002 | CPU规格 | [规格] | | [Pass]/[Fail] | 核心数: |
| IQ-HW-003 | 内存容量 | ≥ [要求] GB | | [Pass]/[Fail] | 实际: GB |
| IQ-HW-004 | 系统盘容量 | ≥ [要求] GB | | [Pass]/[Fail] | 实际: GB |
| IQ-HW-005 | 数据盘容量 | ≥ [要求] GB | | [Pass]/[Fail] | 实际: GB |
| IQ-HW-006 | 网卡数量 | ≥ 1 | | [Pass]/[Fail] | |
| IQ-HW-007 | RAID配置 | [RAID1/RAID5/RAID10] | | [Pass]/[Fail] | |
| IQ-HW-008 | 服务器序列号 | 与清单一致 | | [Pass]/[Fail] | |

#### 4.1.2 存储设备检查 / Storage Check

| 序号 | 检查项目 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|---------|---------|---------|------|------|
| IQ-ST-001 | 存储类型 | SSD/HDD | | [Pass]/[Fail] | |
| IQ-ST-002 | 总存储容量 | ≥ [要求] TB | | [Pass]/[Fail] | |
| IQ-ST-003 | 存储可用空间 | ≥ [要求] GB | | [Pass]/[Fail] | |

### 4.2 操作系统确认 / OS Qualification

#### 4.2.1 系统安装检查 / OS Installation Check

| 序号 | 检查项目 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|---------|---------|---------|------|------|
| IQ-OS-001 | 操作系统类型 | CentOS 7+ / Ubuntu 22.04+ | | [Pass]/[Fail] | |
| IQ-OS-002 | 操作系统版本 | [版本号] | | [Pass]/[Fail] | |
| IQ-OS-003 | 系统主机名 | [主机名] | | [Pass]/[Fail] | |
| IQ-OS-004 | IP地址配置 | [IP地址] | | [Pass]/[Fail] | |
| IQ-OS-005 | 子网掩码 | [子网掩码] | | [Pass]/[Fail] | |
| IQ-OS-006 | 网关配置 | [网关] | | [Pass]/[Fail] | |
| IQ-OS-007 | DNS配置 | [DNS服务器] | | [Pass]/[Fail] | |
| IQ-OS-008 | 时区设置 | Asia/Shanghai (UTC+8) | | [Pass]/[Fail] | |
| IQ-OS-009 | 系统语言 | zh_CN.UTF-8 | | [Pass]/[Fail] | |

#### 4.2.2 系统补丁检查 / OS Patches Check

| 序号 | 检查项目 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|---------|---------|---------|------|------|
| IQ-OS-010 | 安全补丁级别 | 最新安全补丁 | | [Pass]/[Fail] | |
| IQ-OS-011 | 系统更新状态 | 已安装所有更新 | | [Pass]/[Fail] | |

#### 4.2.3 系统资源检查 / System Resources Check

| 序号 | 检查项目 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|---------|---------|---------|------|------|
| IQ-OS-012 | 磁盘空间 (/) | ≥ 20GB可用 | | [Pass]/[Fail] | |
| IQ-OS-013 | 磁盘空间 (/home) | ≥ 10GB可用 | | [Pass]/[Fail] | |
| IQ-OS-014 | 内存使用率 | < 70% | | [Pass]/[Fail] | |
| IQ-OS-015 | CPU负载 | < 80% | | [Pass]/[Fail] | |

### 4.3 中间件确认 / Middleware Qualification

#### 4.3.1 数据库确认 / Database Qualification

| 序号 | 检查项目 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|---------|---------|---------|------|------|
| IQ-DB-001 | 数据库类型 | PostgreSQL 14+ | | [Pass]/[Fail] | |
| IQ-DB-002 | 数据库版本 | [版本号] | | [Pass]/[Fail] | |
| IQ-DB-003 | 数据库端口 | 5432 | | [Pass]/[Fail] | |
| IQ-DB-004 | 数据库服务状态 | Running | | [Pass]/[Fail] | |
| IQ-DB-005 | 数据库字符集 | UTF8 | | [Pass]/[Fail] | |
| IQ-DB-006 | 数据库监听地址 | 0.0.0.0 或指定IP | | [Pass]/[Fail] | |
| IQ-DB-007 | 数据库连接数 | ≥ [要求] | | [Pass]/[Fail] | |
| IQ-DB-008 | 数据库存储路径 | [路径] | | [Pass]/[Fail] | |

#### 4.3.2 缓存服务确认 / Cache Qualification

| 序号 | 检查项目 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|---------|---------|---------|------|------|
| IQ-CA-001 | 缓存服务类型 | Redis 6+ | | [Pass]/[Fail] | |
| IQ-CA-002 | 缓存服务版本 | [版本号] | | [Pass]/[Fail] | |
| IQ-CA-003 | 缓存服务端口 | 6379 | | [Pass]/[Fail] | |
| IQ-CA-004 | 缓存服务状态 | Running | | [Pass]/[Fail] | |
| IQ-CA-005 | 缓存最大内存 | ≥ [要求] MB | | [Pass]/[Fail] | |

#### 4.3.3 Web服务器确认 / Web Server Qualification

| 序号 | 检查项目 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|---------|---------|---------|------|------|
| IQ-WEB-001 | Web服务器类型 | Nginx 1.20+ | | [Pass]/[Fail] | |
| IQ-WEB-002 | Web服务器版本 | [版本号] | | [Pass]/[Fail] | |
| IQ-WEB-003 | HTTP端口 | 80 | | [Pass]/[Fail] | |
| IQ-WEB-004 | HTTPS端口 | 443 | | [Pass]/[Fail] | |
| IQ-WEB-005 | SSL证书 | 有效 | | [Pass]/[Fail] | 有效期至: |
| IQ-WEB-006 | 服务状态 | Running | | [Pass]/[Fail] | |

### 4.4 应用程序确认 / Application Qualification

#### 4.4.1 应用安装检查 / Application Installation Check

| 序号 | 检查项目 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|---------|---------|---------|------|------|
| IQ-APP-001 | 应用名称 | {SYSTEM_NAME} | | [Pass]/[Fail] | |
| IQ-APP-002 | 应用版本 | {SYSTEM_VERSION} | | [Pass]/[Fail] | |
| IQ-APP-003 | 安装路径 | [路径] | | [Pass]/[Fail] | |
| IQ-APP-004 | 配置文件 | 存在且正确 | | [Pass]/[Fail] | |
| IQ-APP-005 | 依赖库完整性 | 所有依赖完整 | | [Pass]/[Fail] | |
| IQ-APP-006 | 文件权限 | 正确设置 | | [Pass]/[Fail] | |
| IQ-APP-007 | 应用端口 | [端口号] | | [Pass]/[Fail] | |
| IQ-APP-008 | 应用服务状态 | Running | | [Pass]/[Fail] | |
| IQ-APP-009 | 启动用户 | [用户名] | | [Pass]/[Fail] | |

#### 4.4.2 应用健康检查 / Application Health Check

| 序号 | 检查项目 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|---------|---------|---------|------|------|
| IQ-APP-010 | 健康检查接口 | 返回200 | | [Pass]/[Fail] | URL: |
| IQ-APP-011 | 数据库连接 | 正常 | | [Pass]/[Fail] | |
| IQ-APP-012 | 缓存连接 | 正常 | | [Pass]/[Fail] | |
| IQ-APP-013 | 应用日志 | 可正常写入 | | [Pass]/[Fail] | |

### 4.5 网络配置确认 / Network Configuration

#### 4.5.1 网络连通性检查 / Network Connectivity Check

| 序号 | 检查项目 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|---------|---------|---------|------|------|
| IQ-NET-001 | 内网连通性 | 通 | | [Pass]/[Fail] | 目标: |
| IQ-NET-002 | 外网连通性 | 通 | | [Pass]/[Fail] | 目标: |
| IQ-NET-003 | DNS解析 | 正常 | | [Pass]/[Fail] | |
| IQ-NET-004 | 端口监听 | 所有必需端口监听 | | [Pass]/[Fail] | |

#### 4.5.2 防火墙配置检查 / Firewall Check

| 序号 | 检查项目 | 预期结果 | 状态 | 备注 |
|------|---------|---------|------|------|
| IQ-FW-001 | 防火墙状态 | 已启用/已禁用 | [Pass]/[Fail] | |
| IQ-FW-002 | 必需端口开放 | 80,443,22,5432 | [Pass]/[Fail] | |
| IQ-FW-003 | SSH访问限制 | 已限制 | [Pass]/[Fail] | |

### 4.6 安全配置确认 / Security Configuration

#### 4.6.1 用户和权限检查 / User and Permission Check

| 序号 | 检查项目 | 预期结果 | 状态 | 备注 |
|------|---------|---------|------|------|
| IQ-SEC-001 | 应用运行用户 | 非root用户 | [Pass]/[Fail] | |
| IQ-SEC-002 | 文件权限 | 正确设置 | [Pass]/[Fail] | |
| IQ-SEC-003 | SSH密钥认证 | 已启用 | [Pass]/[Fail] | |
| IQ-SEC-004 | 密码策略 | 已配置 | [Pass]/[Fail] | |

#### 4.6.2 SSL/TLS检查 / SSL/TLS Check

| 序号 | 检查项目 | 预期结果 | 状态 | 备注 |
|------|---------|---------|------|------|
| IQ-SSL-001 | TLS版本 | TLS 1.2+ | [Pass]/[Fail] | |
| IQ-SSL-002 | 证书有效期 | > 30天 | [Pass]/[Fail] | |
| IQ-SSL-003 | 证书链 | 完整 | [Pass]/[Fail] | |

### 4.7 备份配置确认 / Backup Configuration

| 序号 | 检查项目 | 预期结果 | 状态 | 备注 |
|------|---------|---------|------|------|
| IQ-BAK-001 | 备份脚本存在 | 是 | [Pass]/[Fail] | |
| IQ-BAK-002 | 备份计划 | 已配置 | [Pass]/[Fail] | |
| IQ-BAK-003 | 备份存储位置 | 已设置 | [Pass]/[Fail] | |

### 4.8 监控配置确认 / Monitoring Configuration

| 序号 | 检查项目 | 预期结果 | 状态 | 备注 |
|------|---------|---------|------|------|
| IQ-MON-001 | 监控agent | 已安装 | [Pass]/[Fail] | |
| IQ-MON-002 | 监控指标 | CPU/内存/磁盘/网络 | [Pass]/[Fail] | |
| IQ-MON-003 | 告警配置 | 已配置 | [Pass]/[Fail] | |

## 5. IQ 总结 / IQ Summary

### 5.1 测试结果统计 / Test Results Summary

| 项目 / Item | 总数 / Total | 通过 / Pass | 失败 / Fail | 通过率 / Pass Rate |
|------------|-------------|------------|------------|-------------------|
| 硬件 / Hardware | 8 | | | |
| 操作系统 / OS | 15 | | | |
| 中间件 / Middleware | 11 | | | |
| 应用程序 / Application | 13 | | | |
| 网络 / Network | 4 | | | |
| 安全 / Security | 7 | | | |
| 备份 / Backup | 3 | | | |
| 监控 / Monitoring | 3 | | | |
| **总计 / Total** | | | | |

### 5.2 偏差记录 / Deviation Records

| 偏差编号 | 检查项 | 描述 | 影响评估 | 纠正措施 | 状态 | 关闭日期 |
|---------|--------|------|---------|---------|------|---------|
| IQ-DEV-001 | | | | | Open/Closed | |

## 6. 结论 / Conclusion

### 6.1 IQ 结论 / IQ Conclusion

| 项目 / Item | 结果 / Result |
|------------|-------------|
| IQ 测试完成日期 / IQ Completion Date | |
| IQ 测试结果 / IQ Result | [Pass]/[Fail]/[Conditional Pass] |
| 总检查项数 | |
| 通过项数 | |
| 失败项数 | |
| 通过率 | |

### 6.2 后续行动 / Next Actions

| 行动 / Action | 负责方 / Owner | 计划日期 / Planned Date |
|--------------|---------------|------------------------|
| | | |

### 6.3 最终结论 / Final Conclusion

- [ ] 系统安装符合技术规格要求
- [ ] 所有关键组件已正确安装和配置
- [ ] 网络和安全配置已验证
- [ ] 环境满足进入OQ测试的前置条件

**结论: 系统 [可以/不可以] 进入 OQ 阶段**

## 7. 批准 / Approval

| 角色 / Role | 签名 / Signature | 日期 / Date |
|-------------|-----------------|-------------|
| 测试工程师 / Test Engineer | | |
| IT 负责人 / IT Lead | | |
| 系统负责人 / System Owner | | |
| QA 审核员 / QA Reviewer | | |
| QA 批准人 / QA Approver | | |
