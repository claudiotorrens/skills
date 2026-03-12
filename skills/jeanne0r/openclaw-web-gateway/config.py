from pathlib import Path
import json
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
CONFIG_DIR = BASE_DIR / "config"
MEMORY_DIR = BASE_DIR / "memory"
STATE_FILE = MEMORY_DIR / "state.json"
PARTICIPANTS_FILE = CONFIG_DIR / "participants.json"
PARTICIPANTS_EXAMPLE_FILE = CONFIG_DIR / "participants.example.json"

load_dotenv(BASE_DIR / ".env")

APP_TITLE = os.getenv("APP_TITLE", "OpenClaw Web Gateway")
APP_SUBTITLE = os.getenv("APP_SUBTITLE", "Shared household chat for OpenClaw")

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "5002"))
DEBUG = os.getenv("DEBUG", "false").lower() in {"1", "true", "yes", "on"}

OPENCLAW_BASE = os.getenv("OPENCLAW_BASE", "http://127.0.0.1:18789").rstrip("/")
OPENCLAW_AGENT = os.getenv("OPENCLAW_AGENT", "main")
OPENCLAW_TOKEN = os.getenv("OPENCLAW_TOKEN", "")
OPENCLAW_CHANNEL = os.getenv("OPENCLAW_CHANNEL", "web-gateway")
OPENCLAW_MODEL = os.getenv("OPENCLAW_MODEL", "default")
OPENCLAW_TIMEOUT = float(os.getenv("OPENCLAW_TIMEOUT", "60"))

DEFAULT_USER = os.getenv("DEFAULT_USER", "Family")
GOOGLE_MAPS_EMBED_API_KEY = os.getenv("GOOGLE_MAPS_EMBED_API_KEY", "")

MEMORY_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def load_participants() -> list[dict]:
    source = PARTICIPANTS_FILE if PARTICIPANTS_FILE.exists() else PARTICIPANTS_EXAMPLE_FILE
    if not source.exists():
        return [{"key": "family", "display_name": DEFAULT_USER, "aliases": []}]

    with source.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    if not isinstance(data, list):
        raise ValueError("participants file must contain a JSON array")

    participants: list[dict] = []
    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"participant at index {idx} must be an object")

        key = str(item.get("key") or "").strip()
        display_name = str(item.get("display_name") or key or f"User {idx + 1}").strip()
        aliases = item.get("aliases") or []
        if not isinstance(aliases, list):
            raise ValueError(f"aliases for participant '{display_name}' must be a list")

        participants.append(
            {
                "key": key or display_name.lower().replace(" ", "-"),
                "display_name": display_name,
                "aliases": [str(alias).strip() for alias in aliases if str(alias).strip()],
            }
        )

    return participants
