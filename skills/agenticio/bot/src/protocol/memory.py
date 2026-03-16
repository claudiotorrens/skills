import json, os

MEMORY_PATH = os.path.expanduser("~/.bot_memory")
os.makedirs(MEMORY_PATH, exist_ok=True)

def save_memory(agent_id: str, data: dict):
    path = os.path.join(MEMORY_PATH, f"{agent_id}.json")
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def load_memory(agent_id: str):
    path = os.path.join(MEMORY_PATH, f"{agent_id}.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {}
