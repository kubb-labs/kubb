---
'@kubb/studio': minor
---

Every agent ↔ Studio WebSocket message is now named with the `kubb:` prefix the generation hooks
already use: `kubb:command`, `kubb:connected`, `kubb:data`, `kubb:config-saved`, `kubb:ping`,
`kubb:pong`, and `kubb:disconnect`. One namespace now covers the whole wire.

This is a breaking protocol change. An agent and a Studio instance have to be on matching versions,
so update both sides together.
