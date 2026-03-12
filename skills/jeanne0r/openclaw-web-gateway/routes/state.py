from flask import Blueprint, jsonify

from config import APP_SUBTITLE, APP_TITLE, DEFAULT_USER, GOOGLE_MAPS_EMBED_API_KEY, load_participants
from openclaw_client import OpenClawClient

state_bp = Blueprint("state", __name__, url_prefix="/api")
client = OpenClawClient()


@state_bp.get("/health")
def health() -> tuple:
    upstream = client.health()
    return jsonify({"ok": True, "app": "openclaw-web-gateway", "upstream": upstream})


@state_bp.get("/bootstrap")
def bootstrap() -> tuple:
    participants = load_participants()
    return jsonify(
        {
            "ok": True,
            "app_title": APP_TITLE,
            "app_subtitle": APP_SUBTITLE,
            "default_user": DEFAULT_USER,
            "participants": participants,
            "google_maps_embed_api_key_present": bool(GOOGLE_MAPS_EMBED_API_KEY),
        }
    )
