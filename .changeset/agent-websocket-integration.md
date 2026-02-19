---
'@kubb/agent': minor
'@kubb/cli': patch
---

WebSocket integration for Kubb Studio connectivity

Add bidirectional WebSocket communication between Kubb Agent and Kubb Studio. The agent now automatically connects to Studio on startup when `KUBB_STUDIO_URL` and `KUBB_AGENT_TOKEN` environment variables are set.

Features:
- Persistent WebSocket connection with automatic reconnection
- Real-time streaming of generation events to Studio
- Command handling for `generate` and `connect` commands from Studio
- Session caching for faster reconnects (24-hour expiration)
- Graceful shutdown with disconnect notifications
- SHA-512 token hashing for secure session storage
- Configurable retry intervals with keep-alive pings

See the [@kubb/agent documentation](/packages/agent/README.md) for setup and usage details.
