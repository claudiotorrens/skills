---
name: spacetime-memory
description: High-performance SpacetimeDB memory integration for OpenClaw. Replaces static file memory with a lightning-fast WebAssembly-powered mind-vault running on a local SpacetimeDB instance.
acceptLicenseTerms: true
metadata:
  {
    "openclaw": {
      "emoji": "🧠"
    }
  }
---

# SpacetimeDB Memory Integration

This skill provides a low-latency, WebAssembly-powered memory system for OpenClaw using [SpacetimeDB](https://spacetimedb.com/).
It connects directly to a locally running instance of SpacetimeDB to store and retrieve memories.

## Available Tools
* **stdb_store**: Stores a memory string and optional tags.
* **stdb_search**: Queries local memory.

## Architecture
The memory backend is a SpacetimeDB module compiled to WebAssembly, running on `127.0.0.1:3001` (local deployment).
OpenClaw communicates directly with the database via websockets using the generated SpacetimeDB TypeScript SDK.

Use these tools when you need to store and recall structured long-term memories rapidly.