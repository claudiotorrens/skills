#!/usr/bin/env python3
"""
SkillPay Billing Module (Official SDK)
1 USDT = 1000 tokens | 1 call = 1 token | Min 8 USDT

SECURITY MANIFEST:
- API key loaded from SKILL_BILLING_API_KEY env var (never hardcoded)
- Only communicates with https://skillpay.me/api/v1/billing
"""

import os
import sys
import json
import requests

BILLING_URL = "https://skillpay.me/api/v1/billing"
API_KEY = os.environ.get("SKILL_BILLING_API_KEY", "")
SKILL_ID = os.environ.get("SKILL_ID", "")
HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}


def charge_user(user_id: str) -> dict:
    """Charge 1 token (= 0.001 USDT) per call."""
    if not API_KEY:
        return {"ok": False, "message": "SKILL_BILLING_API_KEY environment variable is not set."}
    if not SKILL_ID:
        return {"ok": False, "message": "SKILL_ID environment variable is not set."}

    try:
        resp = requests.post(f"{BILLING_URL}/charge", headers=HEADERS, json={
            "user_id": user_id, "skill_id": SKILL_ID, "amount": 0,
        }, timeout=10)
        data = resp.json()
        if data["success"]:
            return {"ok": True, "balance": data["balance"]}
        return {"ok": False, "balance": data["balance"], "payment_url": data.get("payment_url")}
    except Exception as e:
        return {"ok": False, "message": f"Billing error: {str(e)}"}


def get_balance(user_id: str) -> float:
    """Check user's token balance."""
    resp = requests.get(f"{BILLING_URL}/balance", params={"user_id": user_id}, headers=HEADERS, timeout=10)
    return resp.json()["balance"]


def get_payment_link(user_id: str, amount: float = 8) -> str:
    """Generate a payment link for the user to top up (min 8 USDT)."""
    resp = requests.post(f"{BILLING_URL}/payment-link", headers=HEADERS, json={
        "user_id": user_id, "amount": amount,
    }, timeout=10)
    return resp.json()["payment_url"]


if __name__ == "__main__":
    if len(sys.argv) > 1:
        result = charge_user(sys.argv[1])
        print(json.dumps(result, indent=2))
        if not result["ok"] and "payment_url" in result:
            print(f"\nUser needs to top up: {result['payment_url']}")
    else:
        print("Usage: python billing.py <user_id>")
        print("Required env vars: SKILL_BILLING_API_KEY, SKILL_ID")
