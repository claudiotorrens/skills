from datetime import datetime, UTC

from flask import Blueprint, jsonify, request

from memory_store import MemoryStore
from openclaw_client import OpenClawClient

chat_bp = Blueprint("chat", __name__, url_prefix="/api")
client = OpenClawClient()
memory_store = MemoryStore()


@chat_bp.post("/chat")
def chat() -> tuple:
    payload = request.get_json(silent=True) or {}
    user = str(payload.get("user") or "Family").strip()
    message = str(payload.get("message") or "").strip()

    if not message:
        return jsonify({"ok": False, "error": "message is required"}), 400

    result = client.chat(user=user, message=message)

    if result.ok:
        timestamp = datetime.now(UTC).isoformat()
        memory_store.append_message(
            {"timestamp": timestamp, "user": user, "role": "user", "content": message}
        )
        memory_store.append_message(
            {"timestamp": timestamp, "user": user, "role": "assistant", "content": result.reply}
        )
        return jsonify({"ok": True, "reply": result.reply})

    return (
        jsonify(
            {
                "ok": False,
                "error": result.error or "OpenClaw request failed",
                "status_code": result.status_code,
                "details": result.raw,
            }
        ),
        502,
    )
