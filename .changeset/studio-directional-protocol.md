---
'@kubb/studio': minor
'@kubb/cli': patch
---

Name every Studio WebSocket message after the side that sends it, and let the host render the session

The protocol had grown three different ways to encode direction in a verb: `connect` was answered by
`connected`, `save` by `config-saved`, and `ping` by `pong`. Now the name carries the sender, so the
verb only carries the topic.

| Before | After |
| --- | --- |
| `kubb:command` + `command: 'generate' \| 'connect' \| 'save'` | `studio:generate`, `studio:connect`, `studio:save` |
| `kubb:connected` | `agent:connect` |
| `kubb:config-saved` | `agent:save` |
| `kubb:data` | `agent:data` |
| `kubb:ping` | `agent:ping` |
| `kubb:pong` | `studio:ping` |
| `kubb:disconnect` | `studio:disconnect` |
| `kubb:error` (envelope) | `studio:error` |

`kubb:` now means one thing: generation lifecycle. The events relayed inside an `agent:data` payload
keep their own names, so the envelope says who sent it and the payload says what happened.

Also in this release:

- **`agent:disconnect`**, the mirror of `studio:disconnect`. The agent announces a shutdown so
  Studio drops the session immediately instead of waiting out the heartbeat window. Only sent for a
  shutdown, since an expired or revoked session was Studio's own decision.
- **A smaller connect payload.** Everything about the config now lives under one `config` object
  (`config.path`, `config.file`, `config.plugins`), and `client` is gone from the wire, which also
  stops sending the host's absolute working directory. `ClientInfo` stays as a local option, where
  it picks which remedy a refused-input warning suggests.
- **The three commands are their own message types**, so a handler switches once instead of reading
  a `type` and then a nested `command` field. `isCommandMessage` still gates the whole branch.
- **The runtime no longer writes to the console.** Pass `installLogger` to `createClient` to render
  the session; it is called once for the session emitter and once per generation, so one function
  covers both. Session events arrive on the new `studio:*` hooks (`studio:connected`,
  `studio:disconnected`, `studio:command:start`, `studio:command:end`, `studio:warn`,
  `studio:error`), which never reach the wire.

A Studio instance has to speak the new names, so update both sides together. There is no
compatibility path for the old ones.
