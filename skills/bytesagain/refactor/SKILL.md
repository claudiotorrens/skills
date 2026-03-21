---
name: refactor
version: "1.0.0"
description: "Analyze code quality and suggest refactoring improvements using static analysis. Use when cleaning up or improving codebases."
author: BytesAgain
homepage: https://bytesagain.com
source: https://github.com/bytesagain/ai-skills
tags: [refactor, code-quality, static-analysis, complexity, clean-code]
---

# Refactor — Code Refactoring Suggestions Tool

Analyze source code for quality issues, measure complexity, detect dead code, and generate actionable refactoring suggestions. Supports rename, extract method/function, inline, and move refactoring patterns. Tracks refactoring history and generates reports. Built for developers who want to systematically improve code quality.

## Prerequisites

- Python 3.8+
- `bash` shell
- Source code files accessible from the filesystem

## Data Storage

All refactoring analysis results and history are stored in `~/.refactor/data.jsonl` as newline-delimited JSON. Each record captures the file analyzed, metrics, suggestions, and timestamps.

Configuration is stored in `~/.refactor/config.json`.

## Commands

### `analyze`
Perform a thorough analysis of a source file or directory. Reports code metrics, potential issues, and refactoring opportunities.

```
REFACTOR_FILE=./src/main.py bash scripts/script.sh analyze
```

### `rename`
Suggest or record a rename refactoring for a symbol (variable, function, class). Tracks old and new names with file locations.

```
REFACTOR_FILE=./src/main.py REFACTOR_OLD_NAME="getData" REFACTOR_NEW_NAME="fetchUserData" REFACTOR_SYMBOL_TYPE=function bash scripts/script.sh rename
```

### `extract`
Suggest extracting a code block into a new function or method. Specify the file, line range, and suggested function name.

```
REFACTOR_FILE=./src/main.py REFACTOR_START_LINE=45 REFACTOR_END_LINE=62 REFACTOR_NEW_NAME="validateInput" bash scripts/script.sh extract
```

### `inline`
Suggest inlining a function, variable, or constant that is used only once or adds unnecessary indirection.

```
REFACTOR_FILE=./src/utils.py REFACTOR_SYMBOL="tempVar" REFACTOR_SYMBOL_TYPE=variable bash scripts/script.sh inline
```

### `move`
Suggest moving a function, class, or block of code to a different file or module for better organization.

```
REFACTOR_FILE=./src/main.py REFACTOR_SYMBOL="UserValidator" REFACTOR_TARGET="./src/validators.py" bash scripts/script.sh move
```

### `dead-code`
Scan for dead code: unused imports, unreachable code blocks, unused variables, and functions never called.

```
REFACTOR_FILE=./src/ REFACTOR_RECURSIVE=true bash scripts/script.sh dead-code
```

### `complexity`
Calculate cyclomatic complexity for functions in a file. Flags functions exceeding the configured threshold.

```
REFACTOR_FILE=./src/main.py REFACTOR_THRESHOLD=10 bash scripts/script.sh complexity
```

### `report`
Generate a thorough refactoring report for a file or project. Includes all metrics, suggestions, and priority rankings.

```
REFACTOR_FILE=./src/ REFACTOR_FORMAT=text bash scripts/script.sh report
```

### `config`
View or update configuration (complexity threshold, ignored patterns, report format, language hints).

```
REFACTOR_KEY=complexity_threshold REFACTOR_VALUE=15 bash scripts/script.sh config
```

### `export`
Export refactoring history and analysis results to JSON or Markdown.

```
REFACTOR_OUTPUT=/tmp/refactor-report.md REFACTOR_FORMAT=markdown bash scripts/script.sh export
```

### `help`
Show usage information and available commands.

```
bash scripts/script.sh help
```

### `version`
Display the current version of the refactor skill.

```
bash scripts/script.sh version
```

## Examples

```bash
# Analyze a Python file
REFACTOR_FILE=./src/app.py bash scripts/script.sh analyze

# Check complexity of all functions
REFACTOR_FILE=./src/app.py REFACTOR_THRESHOLD=8 bash scripts/script.sh complexity

# Find dead code in a directory
REFACTOR_FILE=./src/ REFACTOR_RECURSIVE=true bash scripts/script.sh dead-code

# Generate a full report
REFACTOR_FILE=./src/ REFACTOR_FORMAT=text bash scripts/script.sh report
```

## Metrics Calculated

- **Cyclomatic Complexity**: Number of independent paths through code
- **Lines of Code (LOC)**: Total, code, comment, and blank lines
- **Function Count**: Number of functions/methods per file
- **Nesting Depth**: Maximum nesting level in functions
- **Dead Code Score**: Percentage of potentially unused code
- **Maintainability Index**: Composite score based on complexity, LOC, and coupling

## Supported Languages

Primary support for Python. Basic line-counting and structural analysis for JavaScript, TypeScript, Go, Java, and shell scripts.

## Notes

- Analysis is static only — no code execution occurs.
- The tool suggests refactorings but does not modify source files.
- All suggestions are stored in JSONL for tracking and follow-up.
- Use `config` to tune complexity thresholds and ignore patterns.

---

Powered by BytesAgain | bytesagain.com | hello@bytesagain.com
