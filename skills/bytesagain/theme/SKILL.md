---
name: theme
version: "1.0.0"
description: "Generate and manage UI color themes using CLI tools. Use when you need to create, preview, apply, import, or export dark/light mode themes, palettes,"
author: BytesAgain
homepage: https://bytesagain.com
source: https://github.com/bytesagain/ai-skills
tags:
  - theme
  - design
  - colors
  - ui
  - dark-mode
---

# Theme — UI Theme Generation and Management

A thorough CLI tool for creating, managing, and exporting UI color themes. Supports light/dark mode generation, color palette creation, theme previewing, design token export, random theme generation, and full CRUD operations on saved themes.

## Prerequisites

- Python 3.8+
- Bash shell

## Data Storage

All theme data is persisted in `~/.theme/data.jsonl`. Each line is a JSON object representing a theme with its name, colors, mode, and metadata. Themes include primary, secondary, background, surface, text, error, warning, success, and info colors.

## Commands

Run all commands via the script at `scripts/script.sh`.

### `create`
Create a new theme with specified colors.
```bash
bash scripts/script.sh create <theme_name> --primary "#6200EE" --secondary "#03DAC6" [--background "#FFFFFF"] [--surface "#F5F5F5"] [--text "#212121"] [--mode light]
```

### `apply`
Mark a theme as active/applied.
```bash
bash scripts/script.sh apply <theme_name>
```

### `list`
List all saved themes.
```bash
bash scripts/script.sh list [--format table|json] [--mode dark|light]
```

### `edit`
Edit properties of an existing theme.
```bash
bash scripts/script.sh edit <theme_name> [--primary "#BB86FC"] [--secondary "#03DAC6"] [--mode dark] [--rename new_name]
```

### `export`
Export a theme to CSS, JSON, SCSS, or Tailwind format.
```bash
bash scripts/script.sh export <theme_name> [--format css|json|scss|tailwind] [--output theme.css]
```

### `import`
Import a theme from a JSON file.
```bash
bash scripts/script.sh import <file_path> [--name override_name]
```

### `preview`
Preview a theme with colored terminal output or generate HTML preview.
```bash
bash scripts/script.sh preview <theme_name> [--html] [--output preview.html]
```

### `dark`
Auto-generate a dark mode variant from an existing theme.
```bash
bash scripts/script.sh dark <theme_name> [--name dark_variant_name] [--save]
```

### `light`
Auto-generate a light mode variant from an existing theme.
```bash
bash scripts/script.sh light <theme_name> [--name light_variant_name] [--save]
```

### `palette`
Generate a color palette from a base color (complementary, analogous, triadic, etc.).
```bash
bash scripts/script.sh palette <base_color> [--type complementary|analogous|triadic|split-complementary] [--count 5]
```

### `random`
Generate a random theme with harmonious colors.
```bash
bash scripts/script.sh random [--mode dark|light] [--name random_theme] [--save]
```

### `help`
Show usage information and available commands.
```bash
bash scripts/script.sh help
```

### `version`
Show the current version of the theme tool.
```bash
bash scripts/script.sh version
```

## Workflow Example

```bash
# Create a light theme
bash scripts/script.sh create ocean --primary "#0077B6" --secondary "#00B4D8" --mode light

# Auto-generate dark variant
bash scripts/script.sh dark ocean --name ocean-dark --save

# Preview it
bash scripts/script.sh preview ocean-dark

# Generate a palette
bash scripts/script.sh palette "#0077B6" --type analogous --count 5

# Export as CSS custom properties
bash scripts/script.sh export ocean --format css --output ocean-theme.css

# Generate random theme
bash scripts/script.sh random --mode dark --name midnight --save
```

## Export Formats

- **CSS**: Custom properties (`:root { --primary: #6200EE; }`)
- **SCSS**: Variables (`$primary: #6200EE;`)
- **JSON**: Structured object for programmatic use
- **Tailwind**: Tailwind config `extend.colors` object

## Notes

- Dark/light mode auto-generation adjusts luminance, contrast, and saturation.
- Random themes use color harmony algorithms for aesthetically pleasing results.
- Palette generation supports multiple color theory models.
- All themes are portable via export/import.

---

Powered by BytesAgain | bytesagain.com | hello@bytesagain.com
