---
'@kubb/agent': minor
---

Forward additional Kubb lifecycle events to Studio for full event parity with `@kubb/core`.

The agent now relays `kubb:lifecycle:start`, `kubb:lifecycle:end`, `kubb:build:start`, `kubb:build:end`, `kubb:format:start`, `kubb:format:end`, `kubb:lint:start`, `kubb:lint:end`, and `kubb:generation:summary` over the Studio WebSocket. Studio can now render a complete build timeline (per-config build span, format/lint phases) and final generation summary (duration, file count, failed plugins).
