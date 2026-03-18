#!/usr/bin/env python3
"""
Promarkia API client — run squads, list squads, and fetch run results.

Usage:
    python promarkia_run.py --squad 11 --prompt "Post about AI on LinkedIn"
    python promarkia_run.py --list-squads
    python promarkia_run.py --get-run RUN_ID

Environment:
    PROMARKIA_API_KEY   — Required. Your Promarkia API key (pmk_...).
    PROMARKIA_API_BASE  — Optional. Default: https://apis.promarkia.com
"""

import argparse
import json
import os
import sys

API_BASE = os.environ.get("PROMARKIA_API_BASE", "https://www.promarkia.com").rstrip("/")
API_KEY = os.environ.get("PROMARKIA_API_KEY", "")


def _headers():
    if not API_KEY:
        print("ERROR: PROMARKIA_API_KEY environment variable is not set.", file=sys.stderr)
        print("Get your key at https://www.promarkia.com (sidebar → API Keys).", file=sys.stderr)
        sys.exit(1)
    return {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
    }


def _request(method, path, json_body=None, params=None):
    """Minimal HTTP client using urllib (no external dependencies)."""
    import urllib.request
    import urllib.error
    import urllib.parse

    url = f"{API_BASE}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)

    headers = _headers()
    data = None
    if json_body is not None:
        data = json.dumps(json_body).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=1260) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body.strip() else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            err = json.loads(body)
        except (json.JSONDecodeError, ValueError):
            err = {"error": body}
        print(f"ERROR: HTTP {e.code} — {err.get('description') or err.get('error') or body}", file=sys.stderr)
        sys.exit(1)


def list_squads():
    """Fetch and display available squads."""
    squads = _request("GET", "/api/external/squads")
    print(f"\n{'ID':<6} {'Name':<28} {'Integrations'}")
    print("-" * 70)
    for s in squads:
        integrations = ", ".join(s.get("integrations", []))
        print(f"{s['id']:<6} {s['name']:<28} {integrations}")
    print(f"\n{len(squads)} squads available.\n")


def submit_task(squad_id, prompt, timeout=1200):
    """Submit a task and print the result."""
    print(f"Submitting task to squad {squad_id}...")
    print(f"Prompt: {prompt[:120]}{'...' if len(prompt) > 120 else ''}")
    print(f"Timeout: {timeout}s\n")

    result = _request("POST", "/api/external/tasks", json_body={
        "squadId": str(squad_id),
        "prompt": prompt,
        "timeout": timeout,
    })

    status = result.get("status", "unknown")
    run_id = result.get("runId", "N/A")
    credit_cost = result.get("creditCost", 0)
    total_tokens = result.get("totalTokens", 0)

    print(f"Status: {status}")
    print(f"Run ID: {run_id}")
    print(f"Credits used: {credit_cost} ({total_tokens} tokens)")

    if status == "error":
        print(f"\nError: {result.get('error', 'Unknown error')}", file=sys.stderr)
        sys.exit(1)

    task_result = result.get("result")
    if task_result:
        print(f"\n--- Result ---")
        if isinstance(task_result, dict):
            # Try to extract a readable summary
            messages = task_result.get("messages", [])
            if messages:
                last_msg = messages[-1] if isinstance(messages[-1], dict) else {}
                content = last_msg.get("content", "")
                source = last_msg.get("source", "")
                if content:
                    print(f"[{source}] {content[:2000]}")
                else:
                    print(json.dumps(task_result, indent=2, default=str)[:3000])
            else:
                print(json.dumps(task_result, indent=2, default=str)[:3000])
        else:
            print(str(task_result)[:3000])

    # Also output full JSON to stdout for programmatic use
    print(f"\n--- Full JSON ---")
    print(json.dumps(result, indent=2, default=str))


def get_run(run_id):
    """Fetch and display a previous run result."""
    result = _request("GET", f"/api/external/runs/{run_id}")
    print(json.dumps(result, indent=2, default=str))


def main():
    parser = argparse.ArgumentParser(
        description="Promarkia API client — run AI squads from the command line.",
        epilog="Get your API key at https://www.promarkia.com",
    )
    parser.add_argument("--squad", "-s", type=str, help="Squad ID to run (e.g. 11 for Social Media)")
    parser.add_argument("--prompt", "-p", type=str, help="Task prompt to send to the squad")
    parser.add_argument("--timeout", "-t", type=int, default=1200, help="Max execution time in seconds (default: 1200)")
    parser.add_argument("--list-squads", "-l", action="store_true", help="List available squads")
    parser.add_argument("--get-run", "-g", type=str, metavar="RUN_ID", help="Fetch a previous run result by ID")

    args = parser.parse_args()

    if args.list_squads:
        list_squads()
    elif args.get_run:
        get_run(args.get_run)
    elif args.squad and args.prompt:
        submit_task(args.squad, args.prompt, args.timeout)
    else:
        parser.print_help()
        print("\nExamples:")
        print('  python promarkia_run.py --list-squads')
        print('  python promarkia_run.py --squad 11 --prompt "Post about AI on LinkedIn"')
        print('  python promarkia_run.py --get-run 123456')


if __name__ == "__main__":
    main()
