---
name: excel-data-import
description: >
  Import, merge, and transform data from Excel (.xlsx/.csv) files using YAML-driven configuration.
  Use when the user asks to: (1) import data from Excel/CSV into a template,
  (2) batch-process multiple files in a directory, (3) merge/consolidate data from multiple sources,
  (4) map and transform columns with validation rules, (5) do incremental data updates on existing spreadsheets.
  Supports Chinese field names, multi-layer merged cell headers, auto header detection,
  CSV (auto-encoding), custom validators, and multi-source imports.
---

# Excel Data Import

Configuration-driven data import from Excel (.xlsx) and CSV files with field mapping, validation, batch processing, and incremental updates.

## Prerequisites

- Python 3.8+
- Dependencies: `pip3 install openpyxl pyyaml`
- Source files in `.xlsx`, `.xls`, `.xlsm`, `.ods`, or `.csv` format
- YAML configuration file

## Quick Start

### 1. Create a config file (`import_config.yaml`)

```yaml
task_name: "人员信息导入"

source:
  file_path: "data/source.xlsx"
  sheet_name: "Sheet1"
  header_row: 1
  key_field: "身份证号"

target:
  file_path: "templates/template.xlsx"
  sheet_name: "人员信息"
  header_row: 2
  data_start_row: 3
  output_path: "output/result.xlsx"

field_mappings:
  - source: "姓名"
    target: "员工姓名"
    required: true
  - source: "身份证号"
    target: "身份证号码"
    required: true
    validate: "id_card"
  - source: "部门"
    target: "所属部门"
    default: "待分配"

error_handling:
  backup: true
  backup_path: "backups/"
```

### 2. Run the import

```bash
python3 scripts/excel_import.py import_config.yaml
python3 scripts/excel_import.py import_config.yaml --dry-run   # 预览模式
python3 scripts/excel_import.py import_config.yaml --verbose    # 详细输出
python3 scripts/excel_import.py import_config.yaml --no-backup  # 跳过备份
```

## Import Modes

### Single File (default)

Standard one-to-one import from source to target template.

```yaml
source:
  file_path: "data/source.xlsx"
  sheet_name: "Sheet1"
  header_row: 1
  key_field: "学号"
```

### CSV Import

Supports `.csv` files with auto-encoding detection (UTF-8, GBK, GB2312, Latin-1) and auto-delimiter detection (comma, semicolon, tab).

```yaml
source:
  file_path: "data/source.csv"
  header_row: 1
  key_field: "学号"
```

### Legacy Format (.xls/.xlsm)

Requires `python-calamine` (`pip3 install python-calamine`). Falls back gracefully if not installed.

```yaml
source:
  file_path: "data/legacy.xls"
  header_row: 1
  key_field: "学号"
```

### Directory Batch

Process all `.xlsx`/`.csv` files in a directory:

```yaml
source:
  type: "directory"
  directory: "data/imports/"
  pattern: "*.xlsx"
  header_row: 1
  key_field: "学号"
```

### Multi-Source

Multiple source files with optional per-source field mappings:

```yaml
sources:
  - file_path: "input/hr.xlsx"
    sheet_name: "员工"
    field_mappings: [...]  # optional per-source overrides
  - file_path: "input/finance.xlsx"
    sheet_name: "薪资"
```

### Auto Header Detection

Set `header_row: "auto"` to automatically detect the header row (supports multi-layer merged headers):

```yaml
source:
  file_path: "data/complex.xlsx"
  header_row: "auto"
  key_field: "学号"
target:
  file_path: "output/template.xlsx"
  header_row: "auto"
```

### Auto-Create Target Template

If the target file doesn't exist, it will be automatically created from `field_mappings` + `extra_headers`.

## Field Mapping

| Parameter | Type | Description |
|-----------|------|-------------|
| `source` | string | Source field name |
| `target` | string | Target field name |
| `required` | bool | Fail if empty |
| `default` | any | Fallback value |
| `transform` | string | Transform function name |
| `validate` | string | Validation rule name |
| `transform_params` | object | Params for transform |
| `validate_params` | object | Params for validator |

## Built-in Transforms

`strip`, `upper`, `lower`, `title`, `int`, `float`, `date`

Date transform auto-detects common formats (`2024-01-15`, `2024/01/15`, `20240115`, etc.):

```yaml
- source: "入职日期"
  target: "参加工作时间"
  transform: "date"
  transform_params:
    output_format: "%Y年%m月%d日"
```

## Built-in Validators

`required`, `not_empty`, `id_card` (18/15位), `phone`, `email`, `numeric`, `range`, `regex`, `length`

```yaml
- source: "年龄"
  target: "年龄"
  validate: "range"
  validate_params:
    min: 18
    max: 65
```

## CLI Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview mode: analyze and validate without writing any files |
| `--verbose` | Detailed per-record output |
| `--no-backup` | Skip target file backup |

## Key Features

- **Multi-layer merged headers**: Auto-detect and expand merged cell values across header rows
- **Incremental update**: Match by `key_field`, update existing rows or append new ones
- **Validation rollback**: If any field fails validation, the entire row is skipped (no partial writes)
- **Source deduplication**: Duplicate key values across files are automatically merged
- **Style preservation**: Number format retained when overwriting cells
- **JSON report**: Import statistics and error details saved alongside output

## References

Full parameter docs: [references/config-reference.md](references/data-mapping-guide.md)
Advanced features: [references/advanced-features.md](references/advanced-features.md)
Error handling: [references/error-handling.md](references/error-handling.md)
Troubleshooting: [references/troubleshooting.md](references/troubleshooting.md)
