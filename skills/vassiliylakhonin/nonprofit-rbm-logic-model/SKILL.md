---
name: nonprofit-rbm-logic-model
description: Generate donor-ready nonprofit project packages. Use when designing grant proposals, building RBM frameworks, creating logframes, developing MEAL plans, aligning projects with SDGs, preparing donor-ready budgets, or adapting proposals to a specific funder. Also covers GESI, safeguarding, compliance scoring, and JSON-ready outputs.
homepage: https://clawhub.ai/u/vassiliylakhonin
user-invocable: true
metadata: {"openclaw":{"emoji":"🎼","os":["linux","darwin","win32"]}}
---

# Nonprofit Impact Orchestra

Generate professional, human-sounding, donor-ready nonprofit project
packages through a structured workflow that combines strategic analysis,
program design, budgeting, safeguarding, donor adaptation, and final
language polish.

## When to Use

Use this skill when the user needs:

- A grant proposal or project design from scratch
- An RBM results chain, theory of change, or logframe
- A MEAL plan with accountability and learning
- SDG alignment or GESI analysis
- A detailed budget with donor-compliance flags
- Donor-specific proposal adaptation
- A concept note, LOI, or expression of interest
- A pre-submission review or peer-review simulation

## Modes

```text
# Standard
orchestra [project description]

# Express — rapid draft
orchestra --express [description]

# CFP — paste funding call text
orchestra --cfp [paste CFP text]

# Concept note
orchestra --concept [description]

# LOI / EOI
orchestra --loi [description]

# Review an existing proposal
orchestra --review [paste proposal text]

# Simulate donor scoring
orchestra --peer-review [paste proposal or package]

# Compare projects or funders
orchestra --compare [project A] vs [project B]
orchestra --compare donor [Funder A] vs [Funder B] for [project]

# Resume from a later step
orchestra --from=budget
orchestra --from=donor-adapt
orchestra --from=narrative

# Change audience register
orchestra [description] --audience=donor
orchestra [description] --audience=board
orchestra [description] --audience=community

# Multilingual output
orchestra [description] --lang=fr
Intake Template
text
Project name:     |
Location/country: |
Target group:     |
Goal/impact:      |
Budget:           |
Duration:         |
Partners:         |
Donor/funder:     | (name, CFP link, or "unknown")
Audience:         | (donor / board / community)
Language:         | (default: English)
Free-form input also works. Parse it, identify critical gaps, and ask
follow-up questions only when needed.

Examples
text
orchestra Psychosocial support and digital education recovery for children in Gaza, $150k, 18 months, partners — UNRWA & local NGOs, target 1,500 children

orchestra Transboundary water management and climate-resilient irrigation for farmers along the Syr Darya river in Central Asia, $250k, 3 years, co-funding from World Bank / GEF

orchestra Youth-led reconstruction and green skills training in war-affected regions of Ukraine, €180k, partners — local civil society and EU delegations

orchestra Community-based climate adaptation and early warning systems for pastoral communities in the Sahel, $120k, focus on drought resilience and food security
Workflow
Step 1 — Parse and Clarify

Extract:

text
- Project name
- Location
- Target group
- Goal or intended impact
- Budget and duration
- Partners
- Donor or funder
- Audience and language
If CFP mode is used, extract requirements directly from the pasted text.

Calibrate depth by budget:

text
< $50k      → simplified logframe, short budget, light MEAL
$50k–$500k  → full standard package
> $500k     → add procurement, audit trail, financial risk section
Ask clarifying questions only if missing fields would block useful output.

Step 2 — Strategic Context

Produce a strategic context summary covering:

text
- PESTLE
- Stakeholder mapping
- Strategic drivers
- Initial risks and scenarios
Mark factual claims with confidence labels:

text
[HIGH]       — verified or widely supported
[MEDIUM]     — plausible but incomplete or secondary
[UNVERIFIED] — cross-check before submission
If external verification is available, use it for key statistics before
finalizing the section.

text
Checkpoint 1:
"Strategic context ready. Confirm / edit → continue?"
Step 3 — Program Logic

Build:

text
- RBM results chain
- Theory of Change narrative
- Theory of Change diagram
- Logframe matrix
- SMART indicators with baselines and targets
- MEAL plan
- SDG alignment
- GESI analysis
Theory of Change diagram:

text
graph LR
  Inputs --> Activities --> Outputs --> Outcomes --> Impact
MEAL should include:

text
Monitoring      — what is tracked and how
Evaluation      — mid-term and final review logic
Accountability  — beneficiary feedback mechanisms
Learning        — how lessons improve implementation
GESI should include:

text
- Differential impact on women, youth, disabled people, and minorities
- Inclusion measures by activity
- GESI-specific indicators
text
Checkpoint 2:
"RBM, MEAL, GESI and SDG mapping ready. Approve → proceed?"
Step 4 — Do No Harm and Safeguarding

Output a table with:

text
Area | Status | Recommended Action
Review at minimum:

text
- Environmental screening
- PSEA compliance
- Conflict sensitivity / Do No Harm
- Data protection and privacy
- Community consent mechanisms
Use status values:

text
✅ Clear | ⚠️ Review needed | ❌ Missing
Step 5 — Budget Breakdown

If budget detail is requested, provide:

text
- Personnel
- Travel
- Equipment
- Training
- Admin
- Contingency
Use activity-level or year-level breakdown.

Excel-friendly formulas:

text
=SUM(B2:B10)
=IF(admin/total>0.15,"FLAG","OK")
=B2*exchange_rate
Also include:

text
- Admin-cap flag if above 15–20%
- Co-financing / matching funds
- Procurement and audit trail for budgets above $500k
User may say:

text
"add detailed budget"
"skip budget detail"
Step 6 — Draft the Proposal

Draft these sections:

text
- Problem statement and justification
- Objectives and key activities
- Sustainability / exit strategy
- Partnership / MoU structure
- 4–7 funder recommendations with rationale
If the user provides a failed proposal or prior report, extract lessons
learned and integrate them.

Step 7 — Adapt to a Specific Funder

If a donor or funder is named, the skill should:

text
1. Analyze priorities, language, and framing
2. Align objectives and wording
3. Match structure and expected format where possible
4. Flag gaps between project and funder expectations
5. Label adaptation as:
   - [Known guidelines]
   - [Inferred from public sources]
If no funder is specified, produce a neutral, broadly compatible version.

Step 8 — Risks and Scenarios

Produce:

text
- Risk matrix
- Mitigation actions
- 4 scenarios: optimistic, baseline, adverse, black swan
- Early warning indicators
Risk matrix format:

text
Risk | Likelihood | Impact | Mitigation | Owner
text
Checkpoint 3:
"Full draft + budget + donors + risks ready. Final edits?"
Step 9 — Human Impact Narrative

Generate a 200–300 word narrative that:

text
- Uses a realistic composite beneficiary
- Shows before / after change
- Sounds human and credible
- Avoids invented personal details
Step 10 — Natural Language Polish

Apply final editing to the full package:

text
- Remove repetitive AI phrasing
- Improve flow and readability
- Match the requested audience register
Audience register:

text
donor      → formal, evidence-based, results-oriented
board      → concise, strategic, impact-focused
community  → plain-language, accessible, human
Step 11 — Compliance Score

End with a readiness check such as:

text
Compliance Score: XX/100

✅ GESI indicators present
✅ SDG alignment mapped
✅ Safeguarding covered
⚠️ Admin cap needs review
⚠️ Sustainability section could be stronger
❌ Partner MoU missing
Step 12 — Final Delivery Package

text
00. Elevator Pitch
01. Executive Summary
02. Concept Note (if requested)
03. Strategic Context and PESTLE
04. Stakeholder Mapping
05. GESI Analysis
06. Do No Harm / Safeguarding Checklist
07. RBM Chain and Theory of Change
08. Theory of Change Diagram
09. Logframe Matrix
10. MEAL Plan
11. SDG Alignment
12. Detailed Budget Table
13. Co-financing Summary
14. Sustainability and Exit Strategy
15. Proposal Outline
16. Partnership / MoU Structure
17. Donor and Funder Recommendations
18. Risk Matrix and Scenarios
19. Human Impact Narrative
20. Compliance Score
21. Confidence Report
22. Sources and Traceability
23. JSON Export Block
Excel tip:

text
Copy tables → Paste in Excel → Data → Text to Columns → delimiter: |
Confidence Report
Aggregate confidence at the end:

text
HIGH:        stakeholder analysis, logframe structure, SDG mapping
MEDIUM:      baseline statistics, trend interpretation
UNVERIFIED:  flagged figures that require manual review
JSON Schema
json
{
  "project": {},
  "elevator_pitch": "",
  "concept_note": "",
  "strategic_context": {},
  "rbm_chain": {},
  "theory_of_change": {},
  "logframe": [],
  "meal_plan": [],
  "gesi_analysis": {},
  "safeguarding": {},
  "budget": {},
  "co_financing": {},
  "sustainability": {},
  "lessons_learned": {},
  "donors": [],
  "risks": [],
  "sdg_alignment": [],
  "narrative": "",
  "compliance_score": {},
  "confidence_report": {},
  "sources": []
}
Integrated Capabilities
text
global-think-tank-analyst         — strategic context and foresight
humanizer-bak                     — final language polish
nonprofit-ngo-program-design-suite — RBM, ToC, logframe core
grant-finder                      — optional CFP pre-scan
agent-change-safety               — optional regression check
Optional polish shortcut:

text
clawhub install vassiliylakhonin/humanizer-bak
@pi humanize [paste full package] mode:professional
Tips
Use --cfp whenever the actual funding call is available.

Verify all [UNVERIFIED] figures before submission.

Admin costs above 15% are often a rejection risk.

Do not skip GESI or safeguarding for institutional funders.

Run --peer-review before submission to catch weak sections early.

Use --audience=community for beneficiary-facing summaries.

Keep sustainability as strong as the problem statement.

For budgets above $500k, add procurement and audit logic early.

Use --compare donor when choosing between two funding paths.

Reuse the Mermaid theory-of-change diagram in GitHub, Notion, or Obsidian.

Author
Vassiliy Lakhonin — production-ready AI for nonprofits and grants

ClawHub: https://clawhub.ai/u/vassiliylakhonin

GitHub: https://github.com/vassiliylakhonin