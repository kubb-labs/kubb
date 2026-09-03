---
'@kubb/studio': minor
'@kubb/core': minor
'@kubb/cli': patch
---

Name every Studio WebSocket message after the side that sends it

The protocol had grown three ways to encode direction in a verb: `connect` was answered by
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

`kubb:` now means one thing, generation lifecycle. The events relayed inside an `agent:data` payload
keep their own names, so the envelope says who sent it and the payload says what happened.

The three commands are their own message types, so a handler switches once instead of reading a
`type` and then a nested `command` field. `isCommandMessage` still gates the whole branch.

`agent:disconnect` is new, the mirror of `studio:disconnect`. The agent announces a shutdown so
Studio drops the session instead of waiting out the heartbeat window. Only a shutdown sends it,
since an expired or revoked session was Studio's own decision.

Both sides now report a version. `studio:connect` carries Studio's, `agent:connect` always carries
the runtime's and the host's, and the host prints both, so a mismatch is visible in the terminal
rather than only in the UI.

The connect payload is smaller. Everything about the config sits under one `config` key (`path`,
`file`, `plugins`), and `client` is off the wire, which also stops sending the host's absolute
working directory. `ClientInfo` stays as a local option that picks which remedy a refused-input
warning suggests.

For anyone embedding `@kubb/studio` rather than using the CLI, the runtime no longer writes to the
console. Pass `installLogger` to `createClient` to render the session. It is called once for the
session emitter and once per generation, so one function covers both. Session events arrive on the
`studio:*` hooks now declared in `@kubb/core`, and never reach the wire.

Two packaging fixes came out of this. `@kubb/studio` and `@kubb/core` had no `types` condition in
their `exports` maps, so under `node16` or `nodenext` resolution a consumer got
"Could not find a declaration file" for both the root entry and `@kubb/studio/protocol`.

A Studio instance has to speak the new names, so update both sides together. There is no
compatibility path for the old ones.
