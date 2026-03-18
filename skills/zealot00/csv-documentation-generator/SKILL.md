---
name: csv-documentation-generator
description: Use when generating computer system validation (CSV) documentation for pharmaceutical and medical device industries, including validation plans, URS, FS, IQ/OQ/PQ documents, and traceability matrices.
---

# CSV Documentation Generator

Generate Computerized System Validation (CSV) documentation for pharmaceutical and medical device industries. Supports bilingual (Chinese/English) templates and multiple output formats (Word/Excel).

## When to Use

Use this skill when:
- Creating validation documentation for GMP-regulated systems
- Generating User Requirements Specification (URS) with regulatory compliance checks
- Preparing IQ/OQ/PQ protocols for system qualification
- Creating traceability matrices linking requirements to test cases
- Conducting risk assessments for computerised systems
- Need documentation templates that comply with GAMP 5, 21 CFR Part 11, EU Annex 11

### Supported Systems

| System Type | GAMP Category | Documents |
|-------------|---------------|-----------|
| EDC (Electronic Data Capture) | Category 4/5 | All 12 documents |
| CTMS (Clinical Trial Management) | Category 4 | VP, URS, FS, RA, IQ, OQ, RTM |
| LIMS (Laboratory Information Management) | Category 4/5 | All 12 documents |
| MES (Manufacturing Execution System) | Category 4 | All 12 documents |
| ERP (Enterprise Resource Planning) | Category 4 | VP, URS, RA, IQ, OQ |
| SCADA/DCS | Category 2/3 | VP, URS, IQ, OQ, PQ |
| Custom Software | Category 3/4 | VP, URS, RA, IQ, OQ |

## Quick Start

```bash
# Navigate to skill directory
cd ~/Code/skills/csv-documentation-generator

# Run script - will automatically create virtual environment on first run
python3 scripts/generate.py vp --project "XX系统" --system "EDC v1.0" --output ./output/

# Note: If --category is not specified, interactive GAMP category selection will be prompted
# The script provides bilingual (Chinese/English) guidance based on GAMP 5 Second Edition

# Generate Validation Plan (with category specified)
python3 scripts/generate.py vp --project "XX系统" --system "EDC v1.0" --category 4 --output ./output/

# Generate full validation package
python3 scripts/generate.py all --project "XX系统" --system "MES" --category 4 --output ./validation/
```

### Auto Environment Setup

This skill automatically handles environment setup:
1. **First run**: Automatically creates `.venv` virtual environment in skill directory
2. **Dependencies**: Automatically installs required packages (python-docx, openpyxl, etc.)
3. **Subsequent runs**: Use the already-created virtual environment

This ensures consistent behavior and avoids dependency conflicts.

### Interactive GAMP Category Selection

If `--category` is not specified, the script will prompt with bilingual (Chinese/English) guidance:

```
GAMP 5 (Second Edition) Category Selection:
  [1] Infrastructure Software - 基础设施软件
  [2] Firmware - 固件
  [3] Commercial Off-The-Shelf (COTS) - Non-configured - 商用现货软件 (不可配置)
  [4] Configured COTS - 配置型 COTS 软件 (e.g., EDC, CTMS, LIMS, MES)
  [5] Custom / Critical Application - 定制/关键应用
```

AI agents should guide users to select the appropriate category based on GAMP 5 Second Edition principles.

## Available Commands

| Command | Description | Output Format |
|---------|-------------|---------------|
| `generate.py vp` | Validation Plan | .docx |
| `generate.py urs` | User Requirements Specification | .docx |
| `generate.py fs` | Functional Specification | .docx |
| `generate.py ts` | Technical Specification | .docx |
| `generate.py ra` | Risk Assessment (FMEA) | .docx |
| `generate.py iq` | Installation Qualification | .docx |
| `generate.py oq` | Operational Qualification | .docx |
| `generate.py pq` | Performance Qualification | .docx |
| `generate.py rtm` | Traceability Matrix | .xlsx |
| `generate.py vsr` | Validation Summary Report | .docx |
| `generate.py checklist` | Validation Checklist | .xlsx |
| `generate.py test-case` | Test Case Template | .xlsx |
| `generate.py all` | Full validation package | .docx / .xlsx |

## Command Options

| Option | Description | Required |
|--------|-------------|----------|
| `--project` | Project name | Yes |
| `--system` | System name and version | Yes |
| `--category` | GAMP category (1-5). If not specified, interactive selection will be prompted with bilingual GAMP 5 guidance. | No (will prompt) |
| `--bilingual` | Generate bilingual templates (default: true) | No |
| `--output` | Output directory | Yes |
| `--format` | Output format: docx, xlsx, or both (default: both) | No |

## Template Variables

Common variables used in templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `{PROJECT_NAME}` | Project name | 临床试验系统 |
| `{SYSTEM_NAME}` | System name | EDC v1.0 |
| `{SYSTEM_VERSION}` | System version | 1.0 |
| `{GAMP_CATEGORY}` | GAMP category | 4 |
| `{DOC_ID}` | Document ID | URS-001 |
| `{DATE}` | Document date | 2024-01-01 |
| `{AUTHOR}` | Document author | 张三 |
| `{REVIEWER}` | Reviewer name | 李四 |
| `{APPROVER}` | Approver name | 王五 |

## Regulatory Compliance

### GAMP 5 Categories

| Category | Description | Validation Approach |
|----------|-------------|-------------------|
| 1 | Operating System | Legacy |
| 2 | Firmware | Simplified |
| 3 | Commercial-off-the-shelf (COTS) | Risk-based |
| 4 | Configured COTS | Risk-based |
| 5 | Custom/Critical | Full validation |

### Key Regulatory Requirements

This skill includes compliance checks for:

- **21 CFR Part 11**: Electronic Records and Signatures
  - Audit trail requirements
  - Electronic signature requirements
  - System access controls

- **EU Annex 11**: Computerised Systems
  - Validation requirements
  - Data integrity
  - Change control

- **ALCOA+**: Data Integrity
  - Attributable
  - Legible
  - Contemporaneous
  - Original
  - Accurate (+ Complete, Consistent, Enduring)

## Reference Documents

Reference materials included in `references/` folder:

| File | Description |
|------|-------------|
| `gamp-5.md` | GAMP 5 quick reference guide |
| `21cfr-part11.md` | 21 CFR Part 11 key requirements |
| `annex-11.md` | EU Annex 11 requirements |
| `data-integrity.md` | ALCOA+ data integrity principles |

## Bilingual Format

All templates support Chinese/English bilingual output:

```markdown
## 1. 目的 / Purpose

本文档定义了... / This document defines...
```

Tables use dual-language headers:

| 中文 | English |
|------|---------|
| 验证计划 | Validation Plan |
| 用户需求 | User Requirements |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| python-docx not installed | Run: `pip install python-docx openpyxl` |
| Encoding errors | Ensure UTF-8 encoding in your terminal |
| Template not found | Check you are in the correct directory |

### Getting Help

Run with verbose output:
```bash
python3 scripts/generate.py --help
```

## Examples

### Example 1: Generate URS for CTMS

```bash
python3 scripts/generate.py urs \
  --project "临床试验管理系统" \
  --system "CTMS v2.0" \
  --category 4 \
  --bilingual true \
  --output ./validation/
```

### Example 2: Generate Risk Assessment

```bash
python3 scripts/generate.py ra \
  --project "质量管理系统" \
  --system "QMS v1.5" \
  --category 4 \
  --critical-functions "数据录入,审计追踪,权限控制" \
  --output ./validation/
```

### Example 3: Generate Traceability Matrix

```bash
python3 scripts/generate.py rtm \
  --project "实验室系统" \
  --system "LIMS v3.0" \
  --category 4 \
  --urs-file ./URS-001.md \
  --fs-file ./FS-001.md \
  --output ./validation/
```
