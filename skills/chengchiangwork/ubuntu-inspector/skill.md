---
name: ubuntu-inspector
version: 1.0.0
description: 专门用于 Ubuntu 系统的健康巡检工具，监控硬件状态、磁盘占用以及网络连通性。
runtime: python
entrypoint: main.py
---

# Ubuntu System Health Inspector

这是一个功能强大的 Ubuntu 系统巡检技能，旨在为 AI Agent 提供实时的宿主机硬件和软件状态监控能力。

## 主要功能特点
1. **CPU 负载监控**：实时获取系统 CPU 使用率及负载情况。
2. **内存分析**：统计可用内存、已用内存以及交换分区状态。
3. **磁盘空间检查**：扫描根目录及挂载点的剩余空间，预防磁盘爆满。
4. **网络连通性测试**：检查核心网关和外部 DNS 的连通性。

## 使用场景
当用户询问“系统现在卡不卡？”、“磁盘还有多少空间？”或者“网络通不通？”时，Agent 会自动调用该技能。

## 工具列表

### get_system_report
该工具无需参数，执行后会返回一段包含上述所有指标的 JSON 格式文本报告。Agent 会根据报告内容生成友好的巡检建议。
