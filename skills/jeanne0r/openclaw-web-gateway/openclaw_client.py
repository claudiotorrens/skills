from __future__ import annotations

from dataclasses import dataclass
import requests

from config import (
    OPENCLAW_AGENT,
    OPENCLAW_BASE,
    OPENCLAW_CHANNEL,
    OPENCLAW_MODEL,
    OPENCLAW_TIMEOUT,
    OPENCLAW_TOKEN,
)
from prompts import get_prompt


@dataclass
class ChatResult:
    ok: bool
    reply: str
    status_code: int
    raw: dict | None = None
    error: str | None = None


class OpenClawClient:
    def __init__(
        self,
        base_url: str = OPENCLAW_BASE,
        agent: str = OPENCLAW_AGENT,
        token: str = OPENCLAW_TOKEN,
        channel: str = OPENCLAW_CHANNEL,
        model: str = OPENCLAW_MODEL,
        timeout: float = OPENCLAW_TIMEOUT,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.agent = agent
        self.token = token
        self.channel = channel
        self.model = model
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "x-openclaw-message-channel": self.channel,
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def health(self) -> dict:
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            return {
                "ok": response.ok,
                "status_code": response.status_code,
                "text": response.text[:500],
            }
        except requests.RequestException as exc:
            return {"ok": False, "status_code": 0, "error": str(exc)}

    def chat(self, user: str, message: str) -> ChatResult:
        payload = {
            "model": self.model,
            "stream": False,
            "user": f"{self.channel}:{user.lower()}",
            "messages": [
                {"role": "system", "content": get_prompt(user)},
                {"role": "user", "content": message},
            ],
            "metadata": {
                "agent": self.agent,
                "speaker": user,
                "channel": self.channel,
            },
        }

        try:
            response = requests.post(
                f"{self.base_url}/v1/chat/completions",
                headers=self._headers(),
                json=payload,
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            return ChatResult(
                ok=False,
                reply="",
                status_code=0,
                error=str(exc),
            )

        try:
            data = response.json()
        except ValueError:
            data = {"raw_text": response.text}

        if not response.ok:
            return ChatResult(
                ok=False,
                reply="",
                status_code=response.status_code,
                raw=data,
                error=data.get("error") if isinstance(data, dict) else response.text,
            )

        reply = self._extract_reply(data)
        return ChatResult(ok=True, reply=reply, status_code=response.status_code, raw=data)

    @staticmethod
    def _extract_reply(data: dict) -> str:
        choices = data.get("choices") or []
        if choices:
            message = choices[0].get("message") or {}
            content = message.get("content")
            if isinstance(content, str) and content.strip():
                return content.strip()
        if isinstance(data.get("reply"), str):
            return data["reply"].strip()
        return "No response returned by OpenClaw."
