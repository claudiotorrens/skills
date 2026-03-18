---
name: ocas-corvus
description: >
  Exploratory pattern analysis engine. Detects routines, emerging interests,
  anomalies, stalled threads, and cross-domain opportunities from the
  knowledge graph and accumulated activity signals.
---

# Corvus

Corvus is the system's exploratory intelligence engine. It analyzes the knowledge graph and activity signals to discover behavioral patterns, test hypotheses, and produce structured insight proposals supported by evidence.

## When to use

- Detect recurring behavioral patterns and routines
- Identify emerging interests from activity clusters
- Discover anomalies or meaningful deviations from established patterns
- Find cross-domain opportunities connecting previously unrelated entities
- Monitor stalled threads and incomplete activity clusters
- Run periodic analysis during idle cycles

## When not to use

- Web research or fact-checking — use Sift
- OSINT investigations on people — use Scout
- System architecture changes or skill evaluation — use Mentor
- Storing user preferences — use Taste
- Direct communication — use Dispatch

## Core promise

Corvus observes behavioral patterns in the knowledge graph, validates them against evidence, and produces structured insight proposals. It never modifies system architecture or stores preferences directly.

## Commands

- `corvus.analyze.light` — run a light analysis cycle: routine detection, thread monitoring, interest clustering
- `corvus.analyze.deep` — run a deep exploration cycle: cross-domain traversal, hypothesis testing, model refinement
- `corvus.proposals.list` — list current insight proposals with confidence scores
- `corvus.proposals.detail` — show full evidence and reasoning for a specific proposal
- `corvus.hypotheses.list` — list active hypotheses under investigation
- `corvus.status` — return current analysis state: patterns detected, proposals pending, graph coverage

## Operation modes

### Light Analysis Cycle

Runs frequently during idle periods. Focuses on routine detection, thread monitoring, and interest clustering. Low cost, fast execution.

### Deep Exploration Cycle

Runs less frequently during extended idle periods. Performs cross-domain graph traversal, hypothesis testing, and model refinement. Higher cost, produces richer insight proposals.

## Curiosity engine

Corvus prioritizes graph regions for exploration using three internal drives:

- **Novelty** — prefer regions that recently appeared or changed
- **Uncertainty** — prefer entities with many signals but incomplete understanding
- **Prediction error** — prefer patterns where predicted outcomes diverge from observed events

Each drive generates hypotheses. Hypotheses are tested through graph queries and evidence gathering. Validated hypotheses become insight proposals.

## Pattern validation rules

Patterns must pass all validation checks before becoming proposals:

- Minimum signal count met
- Temporal consistency confirmed
- Cross-domain corroboration present
- Falsification attempt completed without contradiction

Patterns failing validation remain internal hypotheses for future evaluation.

## Insight proposal format

Each proposal includes: proposal_id, proposal_type, description, confidence_score, supporting_entities, supporting_relationships, predicted_outcome, suggested_follow_up.

Proposal types: routine_prediction, thread_continuation, opportunity_discovery, anomaly_alert.

Read `references/schemas.md` for exact proposal schema.

## Support file map

- `references/schemas.md` — data contracts for Hypothesis, Pattern, InsightProposal, CuriositySignal, DecisionRecord
- `references/curiosity_engine.md` — curiosity drive mechanics, hypothesis generation, priority scoring
- `references/pattern_engines.md` — detection criteria and validation rules for each engine (routine, thread, interest, opportunity, anomaly)

## Storage layout

```
.corvus/
  config.json
  hypotheses.jsonl
  patterns.jsonl
  proposals.jsonl
  decisions.jsonl
  reports/
```

## Validation rules

- Every insight proposal has at least one evidence reference
- Proposals below confidence threshold are not surfaced
- Light cycles complete within configured time budget
- Journal entries conform to the OCAS journal spec
- Pattern validation checks are documented in decisions.jsonl
