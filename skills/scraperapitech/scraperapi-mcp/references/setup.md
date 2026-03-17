# MCP Server Setup

## Server Variants

ScraperAPI offers two MCP server variants. Detect which is active by checking available tools.

### Remote (Hosted) — recommended

All 22 tools: `scrape`, `google_search`, `google_news`, `google_jobs`, `google_shopping`, `google_maps_search`, `amazon_product`, `amazon_search`, `amazon_offers`, `walmart_search`, `walmart_product`, `walmart_category`, `walmart_reviews`, `ebay_search`, `ebay_product`, `redfin_for_sale`, `redfin_for_rent`, `redfin_search`, `redfin_agent`, `crawler_job_start`, `crawler_job_status`, `crawler_job_delete`.

```json
{
  "mcpServers": {
    "ScraperAPI": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.scraperapi.com/mcp", "--header", "Authorization: Bearer ${SCRAPERAPI_API_KEY}"]
    }
  }
}
```

### Local (Self-Hosted)

Python-based, installed via PyPI (`pip install scraperapi-mcp-server`). **Only the `scrape` tool is available.** Requires Python 3.11+.

```json
{
  "mcpServers": {
    "ScraperAPI": {
      "command": "python",
      "args": ["-m", "scraperapi_mcp_server"],
      "env": {
        "API_KEY": "<YOUR_SCRAPERAPI_API_KEY>"
      }
    }
  }
}
```

## Variant Detection

- If `google_search` or `crawler_job_start` are available → **remote**. Use all 22 tools.
- If only `scrape` is available → **local**. Use `scrape` for everything. For structured Google data, use `scrape` with `autoparse: true` and `outputFormat: "json"` on Google URLs.

API key: direct users to https://www.scraperapi.com/dashboard if needed.
