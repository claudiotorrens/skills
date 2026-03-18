"""Template loader for CSV documentation generator"""

import os
import re
from typing import Dict, Any, Optional
from pathlib import Path


class TemplateLoader:
    """Load and process document templates"""

    def __init__(self, templates_dir: Optional[str] = None):
        if templates_dir is None:
            # Default to templates directory relative to this file
            self.templates_dir = Path(__file__).parent.parent / "templates"
        else:
            self.templates_dir = Path(templates_dir)

    def load_template(self, doc_type: str) -> str:
        """Load template content by document type"""
        template_file = self.templates_dir / f"{doc_type}.md"

        if not template_file.exists():
            # Check if it's an Excel template
            xlsx_file = self.templates_dir / f"{doc_type}.xlsx"
            if xlsx_file.exists():
                return str(xlsx_file)
            raise FileNotFoundError(f"Template not found: {doc_type}")

        with open(template_file, "r", encoding="utf-8") as f:
            return f.read()

    def load_excel_template(self, doc_type: str) -> str:
        """Load Excel template path"""
        template_file = self.templates_dir / f"{doc_type}.xlsx"

        if not template_file.exists():
            raise FileNotFoundError(f"Excel template not found: {doc_type}")

        return str(template_file)

    def process_template(self, content: str, variables: Dict[str, str]) -> str:
        """Replace template variables with actual values"""
        result = content

        for key, value in variables.items():
            # Replace {VARIABLE} format
            result = result.replace(f"{{{key}}}", value)

            # Also replace $VARIABLE format
            result = result.replace(f"${key}", value)

        return result

    def get_available_templates(self) -> list:
        """Get list of available template types"""
        templates = []

        if not self.templates_dir.exists():
            return templates

        for file in self.templates_dir.iterdir():
            if file.suffix in [".md", ".xlsx"]:
                templates.append(file.stem)

        return sorted(templates)


def process_markdown_table_bilingual(content: str) -> str:
    """Process bilingual markdown tables"""
    lines = content.split("\n")
    result = []

    in_table = False
    header_processed = False

    for line in lines:
        # Check if line is a table separator
        if re.match(r"^\|[\s\-:|]+\|$", line):
            result.append(line)
            continue

        # Table start
        if "|" in line and not in_table:
            in_table = True
            header_processed = False

        # Process table content
        if in_table and "|" in line:
            cells = line.split("|")
            processed_cells = []

            for i, cell in enumerate(cells):
                cell = cell.strip()

                # Check if cell contains bilingual content (has / separator)
                if "/" in cell and not cell.startswith("-"):
                    # Split and format
                    parts = cell.split("/")
                    if len(parts) == 2:
                        cell = f"{parts[0].strip()} / {parts[1].strip()}"
                    elif len(parts) > 2:
                        # Multiple translations
                        cell = " / ".join([p.strip() for p in parts])

                processed_cells.append(cell)

            line = "|".join(processed_cells)

        result.append(line)

    return "\n".join(result)
