---
name: llm
description: "Build structured prompts, estimate tokens, compare prompt variants, and manage reusable prompt templates."
version: "3.2.0"
author: BytesAgain
homepage: https://bytesagain.com
source: https://github.com/bytesagain/ai-skills
tags:
  - llm
  - prompt-engineering
  - tokens
  - templates
  - evaluation
---

# llm

LLM prompt engineering toolkit. Build structured prompts, compare variations, estimate tokens, manage templates, chain multi-step prompts, and evaluate prompt quality.

## Commands

### prompt

Build a structured prompt from role, context, and task components.

```bash
bash scripts/script.sh prompt --role "senior developer" --context "Python Flask app" --task "write unit tests"
```

### compare

Compare two or more prompt variations side by side with diff output.

```bash
bash scripts/script.sh compare --prompts prompt_a.txt prompt_b.txt
```

### tokenize

Estimate token count for a given text using cl100k_base-compatible counting.

```bash
bash scripts/script.sh tokenize --input "Your prompt text here"
bash scripts/script.sh tokenize --file prompt.txt
```

### template

Manage reusable prompt templates: save, list, load, and delete.

```bash
bash scripts/script.sh template --save my_template --file prompt.txt
bash scripts/script.sh template --list
bash scripts/script.sh template --load my_template
bash scripts/script.sh template --delete my_template
```

### chain

Define and run multi-step prompt chains where each step feeds into the next.

```bash
bash scripts/script.sh chain --steps step1.txt step2.txt step3.txt
bash scripts/script.sh chain --from chain_config.json
```

### evaluate

Score prompt quality based on clarity, specificity, structure, and completeness.

```bash
bash scripts/script.sh evaluate --input "Your prompt text"
bash scripts/script.sh evaluate --file prompt.txt
```

## Output

All commands output to stdout in plain text or JSON (with `--json` flag). Token counts return integers. Evaluate returns a 0-100 score with breakdown. Templates are stored in `~/.llm-skill/templates/`.


## Requirements
- bash 4+

## Feedback

Report issues or suggestions: https://bytesagain.com/feedback/

---

Powered by BytesAgain | bytesagain.com
