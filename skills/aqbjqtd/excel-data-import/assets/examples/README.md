# Excel Data Import - 完整示例

本目录包含可直接运行的示例，用于快速了解技能功能。

## 快速体验

```bash
cd assets/examples
python3 ../../scripts/excel_import.py quick_start.yaml --dry-run
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `quick_start.yaml` | 最简导入配置（含校验+转换+默认值） |
| `source_sample.xlsx` | 示例源数据（5条员工记录） |
| `example_config.yaml` | 基础配置示例 |
| `example_directory_import.yaml` | 目录批量导入示例 |
| `example_multiple_sources.yaml` | 多源导入示例 |

## 预期输出

```
[DRY RUN] 预览模式：只分析，不写入
✓ 目标文件不存在，已自动创建模板: output_sample.xlsx
✓ 源数据: 5列, 表头行1
✓ 共读取 5 条有效源数据
✓ 数据导入完成: 共处理 5 条记录
  新增: 5 条, 更新: 0 条, 跳过: 0 条
```
