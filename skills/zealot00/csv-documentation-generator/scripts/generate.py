#!/usr/bin/env python3
"""CSV Documentation Generator - Main Entry Point

Generate Computerized System Validation (CSV) documentation
for pharmaceutical and medical device industries.

Usage:
    python3 generate.py vp --project "Project" --system "System v1.0" --category 4 --output ./output/
    python3 generate.py urs --project "Project" --system "System" --category 4 --bilingual true
    python3 generate.py all --project "Project" --system "System" --category 4 --output ./validation/
"""

import argparse
import sys
import os
import subprocess
import venv
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from config import Config, get_gamp_category_description
from template_loader import TemplateLoader
from word_generator import WordGenerator
from excel_generator import ExcelGenerator


def get_skill_root():
    """Get the skill root directory"""
    return Path(__file__).parent.parent


def is_in_venv():
    """Check if running in a virtual environment"""
    return hasattr(sys, "real_prefix") or (
        hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix
    )


def ensure_venv():
    """Ensure virtual environment exists and is activated"""
    skill_root = get_skill_root()
    venv_path = skill_root / ".venv"
    venv_python = venv_path / "bin" / "python"

    # Check if venv already exists
    if venv_path.exists() and venv_python.exists():
        return str(venv_path)

    print("\n" + "=" * 60)
    print("Setting up virtual environment...")
    print("=" * 60)

    # Create venv
    venv.create(skill_root / ".venv", with_pip=True)

    # Install dependencies
    print("\nInstalling dependencies...")
    pip_path = venv_path / "bin" / "pip"

    try:
        subprocess.run(
            [str(pip_path), "install", "-r", "requirements.txt"],
            cwd=skill_root,
            check=True,
        )
        print("Dependencies installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Warning: Failed to install dependencies: {e}")
        print("You may need to install them manually:")
        print(f"  cd {skill_root}")
        print(f"  source {venv_path}/bin/activate")
        print(f"  pip install -r requirements.txt")

    return str(venv_path)


def get_python_executable():
    """Get the appropriate Python executable"""
    skill_root = get_skill_root()
    venv_python = skill_root / ".venv" / "bin" / "python"

    if venv_python.exists():
        return str(venv_python)

    # Fallback to system python
    return sys.executable


def prompt_gamp_category() -> int:
    """Prompt user to select GAMP category with bilingual guidance"""

    print("\n" + "=" * 60)
    print("GAMP 5 (Second Edition) Category Selection / GAMP 5 分类选择")
    print("=" * 60)

    categories = {
        1: {
            "name": "Infrastructure Software",
            "name_cn": "基础设施软件",
            "examples": "Operating systems, databases, middleware",
            "examples_cn": "操作系统、数据库、中间件",
            "approach": "Limited verification",
            "approach_cn": "有限验证",
        },
        2: {
            "name": "Firmware",
            "name_cn": "固件",
            "examples": "Firmware in industrial controllers",
            "examples_cn": "工业控制器中的固件",
            "approach": "Simplified approach",
            "approach_cn": "简化方法",
        },
        3: {
            "name": "Commercial Off-The-Shelf (COTS) - Non-configured",
            "name_cn": "商用现货软件 (不可配置)",
            "examples": "Standard software used as-is, no configuration",
            "examples_cn": "直接使用的标准软件，无配置",
            "approach": "Risk-based verification",
            "approach_cn": "基于风险的验证",
        },
        4: {
            "name": "Configured COTS",
            "name_cn": "配置型 COTS 软件",
            "examples": "EDC, CTMS, LIMS, MES configured for specific use",
            "examples_cn": "为特定用途配置的 EDC、CTMS、LIMS、MES",
            "approach": "Risk-based verification with focus on configuration",
            "approach_cn": "重点关注配置的基于风险验证",
        },
        5: {
            "name": "Custom / Critical Application",
            "name_cn": "定制/关键应用",
            "examples": "Custom-built systems, critical systems with patient impact",
            "examples_cn": "定制开发系统、影响患者的关键系统",
            "approach": "Full lifecycle validation",
            "approach_cn": "完整生命周期验证",
        },
    }

    print("\nPlease select the GAMP category for your system:")
    print("请为您的系统选择 GAMP 分类:\n")

    for cat_id, info in categories.items():
        print(f"  [{cat_id}] {info['name']} / {info['name_cn']}")
        print(f"       Examples / 示例: {info['examples']} / {info['examples_cn']}")
        print(f"       Approach / 方法: {info['approach']} / {info['approach_cn']}")
        print()

    while True:
        try:
            choice = input("Enter category number (1-5) / 输入分类编号 (1-5): ").strip()
            if choice in ["1", "2", "3", "4", "5"]:
                return int(choice)
            else:
                print(
                    "Invalid input. Please enter 1, 2, 3, 4, or 5 / 无效输入，请输入 1, 2, 3, 4 或 5"
                )
        except (KeyboardInterrupt, EOFError):
            print("\nUsing default category 4 / 使用默认分类 4")
            return 4


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="CSV Documentation Generator - Generate validation documents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 generate.py vp --project "临床系统" --system "EDC v1.0" --category 4 --output ./output/
  python3 generate.py urs --system "CTMS" --bilingual true --output ./doc/
  python3 generate.py all --project "XX系统" --system "MES" --category 4 --output ./validation/
        """,
    )

    parser.add_argument(
        "doc_type",
        choices=[
            "vp",
            "urs",
            "fs",
            "ts",
            "ra",
            "iq",
            "oq",
            "pq",
            "rtm",
            "vsr",
            "checklist",
            "test-case",
            "all",
        ],
        help="Document type to generate",
    )

    parser.add_argument(
        "--project", "-p", default="[Project Name]", help="Project name"
    )

    parser.add_argument(
        "--system", "-s", default="[System Name v1.0]", help="System name and version"
    )

    parser.add_argument(
        "--category",
        "-c",
        type=int,
        default=None,
        choices=[1, 2, 3, 4, 5],
        help="GAMP category (1-5). If not specified, interactive selection will be prompted.",
    )

    parser.add_argument(
        "--bilingual",
        "-b",
        default=True,
        type=bool,
        help="Generate bilingual templates (default: True)",
    )

    parser.add_argument("--output", "-o", default="./output", help="Output directory")

    parser.add_argument(
        "--format",
        "-f",
        choices=["docx", "xlsx", "both"],
        default="both",
        help="Output format",
    )

    parser.add_argument("--doc-id", default="[DOC-XXX]", help="Document ID")

    parser.add_argument("--version", default="1.0", help="Document version")

    parser.add_argument("--author", default="[Author]", help="Document author")

    parser.add_argument("--reviewer", default="[Reviewer]", help="Document reviewer")

    parser.add_argument("--approver", default="[Approver]", help="Document approver")

    parser.add_argument(
        "--critical-functions",
        default="数据录入,审计追踪,权限控制",
        help="Critical functions (comma-separated)",
    )

    return parser.parse_args()


def generate_document(doc_type: str, config: Config):
    """Generate a single document"""

    # Get template loader
    template_loader = TemplateLoader()

    # Get document info
    doc_info = Config.get_document_info(doc_type)
    variables = config.get_variables()
    variables["DOC_TYPE_NAME"] = doc_info["name"]
    variables["DOC_TYPE_NAME_CN"] = doc_info["name_cn"]
    variables["DOC_TYPE"] = doc_type.upper()

    # Determine format
    format_type = doc_info.get("format", "docx")
    if config.format == "both":
        generate_formats = [format_type] if format_type != "both" else ["docx", "xlsx"]
    else:
        generate_formats = [config.format]

    output_files = []

    for fmt in generate_formats:
        if fmt == "xlsx":
            # Excel generation
            excel_gen = ExcelGenerator(config.output)
            output_file = excel_gen.generate(doc_type=doc_type, variables=variables)
            output_files.append(output_file)
            print(f"Generated: {output_file}")
        else:
            # Word generation
            try:
                template_content = template_loader.load_template(doc_type)
            except FileNotFoundError:
                print(f"Warning: Template not found for {doc_type}, using default")
                template_content = f"# {doc_info['name']}\n\nDocument: {config.project}\nSystem: {config.system}"

            word_gen = WordGenerator(config.output)
            output_file = word_gen.generate(
                doc_type=doc_type, content=template_content, variables=variables
            )
            output_files.append(output_file)
            print(f"Generated: {output_file}")

    return output_files


def generate_all(config: Config):
    """Generate all documents"""

    doc_types = [
        "vp",
        "urs",
        "fs",
        "ra",
        "iq",
        "oq",
        "pq",
        "vsr",
        "rtm",
        "checklist",
        "test-case",
    ]

    print(f"\nGenerating validation package for: {config.project}")
    print(f"System: {config.system}")
    print(f"Category: {config.category}")
    print(f"Output: {config.output}\n")

    all_files = []

    for doc_type in doc_types:
        try:
            files = generate_document(doc_type, config)
            all_files.extend(files)
        except Exception as e:
            print(f"Error generating {doc_type}: {e}")

    print(f"\n{'=' * 50}")
    print(f"Generated {len(all_files)} documents:")
    for f in all_files:
        print(f"  - {f}")

    return all_files


def main():
    """Main entry point"""

    # Ensure virtual environment
    if not is_in_venv():
        ensure_venv()

    args = parse_args()

    # Prompt for GAMP category if not specified
    if args.category is None:
        args.category = prompt_gamp_category()

    # Create output directory
    Path(args.output).mkdir(parents=True, exist_ok=True)

    # Create config
    config = Config(
        project=args.project,
        system=args.system,
        category=args.category,
        bilingual=args.bilingual,
        output=args.output,
        format=args.format,
        doc_id=args.doc_id,
        version=args.version,
        author=args.author,
        reviewer=args.reviewer,
        approver=args.approver,
        critical_functions=args.critical_functions,
    )

    print(f"CSV Documentation Generator")
    print(f"{'=' * 50}")

    # Generate documents
    if args.doc_type == "all":
        generate_all(config)
    else:
        generate_document(args.doc_type, config)

    print(f"\nDone! Files saved to: {args.output}")


if __name__ == "__main__":
    main()
