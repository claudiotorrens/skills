# 前置依赖

## Python 版本

- Python 3.8+

## 必需依赖

```bash
pip install openpyxl pyyaml
```

- **openpyxl**: 用于读写 .xlsx/.xlsm 格式的 Excel 文件
- **pyyaml**: 用于解析 YAML 配置文件

## 可选依赖

```bash
pip install python-calamine
```

- **python-calamine**: 用于读取 .xls/.xlsm 旧格式文件（BIFF 格式）

如果未安装 python-calamine，程序将无法处理 .xls/.xlsm 文件，但可以正常处理 .xlsx/.csv 文件。
