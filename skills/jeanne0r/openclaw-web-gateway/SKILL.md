# OpenClaw Web Gateway

A minimal Flask-based web interface for OpenClaw agents.

## Type
interface

## Runtime
python

## Features

- Multi-user chat interface
- OpenClaw HTTP integration
- Persistent UI state
- Simple memory helper
- Optional Google Maps integration

## Requirements

- Python 3.10+
- An OpenClaw instance running locally or remotely

## Installation

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt


Local configuration

Create a local .env file in the project root with the following content:

APP_TITLE=OpenClaw Web Gateway
APP_SUBTITLE=Local chat UI for OpenClaw
HOST=0.0.0.0
PORT=5002
OPENCLAW_BASE_URL=http://127.0.0.1:18789
OPENCLAW_TOKEN=
OPENCLAW_MODEL=default
OPENCLAW_CHANNEL=web-gateway
GOOGLE_MAPS_EMBED_API_KEY=
STATE_FILE=./gateway_state.json
MEMORY_ROOT=~/.openclaw/memory
PARTICIPANTS_FILE=./config/participants.json
DEFAULT_USER=alex

Then create config/participants.json from this example:

[
  {
    "key": "alex",
    "display_name": "Alex",
    "aliases": ["alex", "a"]
  },
  {
    "key": "sam",
    "display_name": "Sam",
    "aliases": ["sam", "s"]
  }
]


Then run:
./run.sh
http://127.0.0.1:5002


Notes

Do not commit your real .env
Do not commit your real config/participants.json
OPENCLAW_TOKEN can be left empty if your gateway does not require authentication


Author

Romain Jeanneret
