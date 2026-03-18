---
name: articuler
description: AI-powered professional networking assistant. Generate personalized cold emails and outreach playbooks to accelerate career growth and business development.
homepage: https://www.articuler.ai
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["curl"]}}}
---

# Articuler Skill

Craft the perfect cold email and build a structured outreach playbook — all driven by your specific professional goal and LinkedIn profile.

## What This Skill Does

1. **Generate cold emails** — Write personalized outreach emails tailored to each contact's background
2. **Build a playbook** — Create a structured outreach strategy with timing, talking points, and follow-up cadence

## Usage

> **Note:** Step 1 (Email Check) must be completed before calling any other API. The `captcha` returned is required for all subsequent requests.

### Step 1 — Email Check (Required)

Verify the user's email and obtain a `captcha` token required for all subsequent API calls.

```bash
curl --location --request POST 'https://api.articuler.ai/user/send-check' \
--header 'Content-Type: application/json' \
--data '{
  "email": "your@email.com",
  "type": 1
}'
```

#### Parameters

| Field   | Type    | Description                                   |
| ------- | ------- | --------------------------------------------- |
| `email` | string  | The user's email address to verify            |
| `type`  | integer | Verification type, use `1` for standard check |

Save the `captcha` value from the response — it is required in Steps 2 and 3.

---

### Step 2 — Build an Outreach Playbook

Generate a structured multi-step outreach strategy between the user and a target contact.

```bash
curl --location --request POST 'https://api.articuler.ai/user/artclaw/playbook' \
--header 'Content-Type: application/json' \
--data '{
    "email": "your@email.com",
    "captcha": "xxxxxx",
    "linkedin_url": "https://www.linkedin.com/in/your-profile/",
    "target_linkedin_url": "https://www.linkedin.com/in/your-target-profile/",
    "objective": "Want to be a partner"
}'
```

#### Parameters

| Field                 | Type   | Description                                             |
| --------------------- | ------ | ------------------------------------------------------- |
| `email`               | string | The user's verified email (from Step 1)                 |
| `captcha`             | string | Verification token obtained from Step 1                 |
| `linkedin_url`        | string | The user's own LinkedIn profile URL                     |
| `target_linkedin_url` | string | The target contact's LinkedIn profile URL               |
| `objective`           | string | The goal of this outreach (e.g. "Want to be a partner") |

---

### Step 3 — Generate a Cold Email

Generate a personalized cold email based on both LinkedIn profiles and the stated objective.

```bash
curl --location --request POST 'https://api.articuler.ai/user/artclaw/coldemail' \
--header 'Content-Type: application/json' \
--data '{
    "email": "your@email.com",
    "captcha": "xxxxxx",
    "linkedin_url": "https://www.linkedin.com/in/your-profile/",
    "target_linkedin_url": "https://www.linkedin.com/in/your-target-profile/",
    "objective": "Want to be a partner"
}'
```

#### Parameters

| Field                 | Type   | Description                                                           |
| --------------------- | ------ | --------------------------------------------------------------------- |
| `email`               | string | The user's verified email (from Step 1)                               |
| `captcha`             | string | Verification token obtained from Step 1                               |
| `linkedin_url`        | string | The user's own LinkedIn profile URL                                   |
| `target_linkedin_url` | string | The target contact's LinkedIn profile URL                             |
| `objective`           | string | The goal of this cold email (e.g. "Explore investment opportunities") |

---

## MCP Server

Articuler provides an MCP server as an alternative to the REST API above.

**Endpoint:** `https://www.articuler.ai/mcp`

| Tool                  | Description                                                                          |
| --------------------- | ------------------------------------------------------------------------------------ |
| `generate_cold_email` | Generate a personalized cold email given two LinkedIn profiles and an objective      |
| `generate_playbook`   | Generate a multi-step outreach playbook given two LinkedIn profiles and an objective |

---

## Intent Detection

Detect the user's networking intent from their objective to set the right tone and structure:

| Intent        | Keywords                   |
| ------------- | -------------------------- |
| `fundraising` | 融资、投资人、VC、pre-seed |
| `hiring`      | 招聘、合伙人、CTO、团队    |
| `partnership` | 合作、BD、渠道、资源置换   |
| `research`    | 了解行业、调研、趋势       |
| `sales`       | 客户、企业采购、demo       |

---

## Tips

- Always complete the Email Check (Step 1) before making any other API call
- For cold emails, always ask the user to review before sending — never auto-send
- Playbooks work best when both LinkedIn profiles are detailed and up to date
- The more specific the `objective`, the more targeted the output

## Links

- **Articuler:** https://www.articuler.ai
- **ClawhHub Skills Hub:** https://clawhub.ai/skills