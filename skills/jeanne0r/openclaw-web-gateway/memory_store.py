import json
from pathlib import Path
from typing import Any

from config import MEMORY_DIR


class MemoryStore:
    def __init__(self, base_dir: Path | None = None) -> None:
        self.base_dir = base_dir or MEMORY_DIR
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.messages_file = self.base_dir / "messages.jsonl"

    def append_message(self, record: dict[str, Any]) -> None:
        with self.messages_file.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
