# 对腾讯云资源进行自动化巡检和监控

> 这是一个 OpenClaw Skill 的应用示例，展示如何利用「腾讯云资源管理工具」Skill 对云上资源进行巡检和监控。


---

## 场景一：监控域名是否到期

### 任务描述

请帮我检查腾讯云账户下所有域名的到期情况。

### 执行步骤

1. 使用 `tccli domain DescribeDomainNameList` 查询账户下所有域名列表
2. 遍历每个域名，检查其到期时间（`ExpirationDate` 字段）
3. 计算距离到期的剩余天数
4. 如果剩余天数不足 **30 天**，标记为告警，输出域名和到期日
5. 汇总输出所有域名的状态（正常 / 即将到期）

---

## 场景二：监控 SSL 证书到期

### 任务描述

请帮我检查腾讯云账户下所有 SSL 证书的到期情况。

### 执行步骤

1. 使用 `tccli ssl DescribeCertificates` 查询所有证书列表
2. 遍历每个证书，关注 `CertificateId`、`Domain`、`CertEndTime` 字段
3. 计算距离到期的剩余天数
4. 如果剩余天数不足 **30 天**，标记为告警
5. 汇总输出所有证书的状态

---

## 场景三：监控云服务器实例状态

### 任务描述

请帮我检查腾讯云账户下所有云服务器实例的运行状态。

### 执行步骤

1. 使用 `tccli cvm DescribeInstances --region ap-beijing` 查询所有实例
2. 遍历每个实例，关注 `InstanceId`、`InstanceName`、`InstanceState` 字段
3. 如果实例状态不是 `RUNNING`，标记为异常并告警
4. 可选：对运行中的实例，使用 `tccli monitor GetMonitorData` 查询 CPU 使用率等监控指标，发现资源使用率异常时告警
5. 汇总输出所有实例的状态

---

## 场景四：监控云硬盘状态

### 任务描述

请帮我检查腾讯云账户下所有云硬盘的状态。

### 执行步骤

1. 使用 `tccli cbs DescribeDisks --region ap-beijing` 查询所有云硬盘
2. 遍历每个云硬盘，关注 `DiskId`、`DiskName`、`DiskState`、`DiskUsage` 字段
3. 如果状态不是 `ATTACHED` 或 `UNATTACHED`，标记为异常并告警
4. 汇总输出所有云硬盘的状态

