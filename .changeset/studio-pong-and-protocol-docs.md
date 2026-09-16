---
'@kubb/studio': patch
---

Renamed the `studio:ping` heartbeat reply to `studio:pong`, matching the ping/pong pattern
`agent:ping` already implies (`StudioPingMessage` is now `StudioPongMessage`,
`isStudioPingMessage` is now `isStudioPongMessage`). This is a wire-protocol change: an agent
running an older `@kubb/studio` and a Studio running the new one won't recognize each other's
heartbeat reply. Update both sides together.

Also documented the full `studio:`/`agent:` message table in `packages/studio/src/protocol/index.ts`,
including why `studio:generate` has no dedicated `agent:generate` reply (its result rides the
`agent:data`/`kubb:generation:end` event stream instead, unlike `studio:save`/`studio:snapshot`,
which reply directly).
