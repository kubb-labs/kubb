<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Stars][stars-src]][stars-href]
[![License][license-src]][license-href]
[![Node][node-src]][node-href]

<h4>
<a href="https://kubb.dev" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# @kubb/studio

### Kubb Studio client runtime

Connects a Kubb project to [Kubb Studio](https://kubb.studio) over a WebSocket relay and streams
code generation events as they happen. It backs both front ends: the `kubb studio` CLI command and
the `kubblabs/kubb-agent` Docker image.

Most people never install this directly. Reach for `kubb studio` instead, which pairs your machine
and runs this for you.

## Installation

```shell
npm install @kubb/studio
```

## Usage

```typescript
import { createClient, createFileStorage } from '@kubb/studio'

const client = createClient({
  token: process.env.KUBB_AGENT_TOKEN!,
  configPath: 'kubb.config.ts',
  version: '1.0.0',
  loadConfig: () => loadMyKubbConfig(),
  storage: createFileStorage('./.kubb-cache'),
})

await client.connect()
```

The runtime discovers nothing on its own: the host injects the config loader, the storage, and its
own version. That is what lets one runtime serve a CLI running in a developer's project and a
container running a fixed plugin set.

## Permissions

Every permission is off by default, and each covers one trust boundary:

| Option           | What it grants                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `allowWrite`     | Generated files are written to disk. Off means they exist only in memory and stream to Studio. |
| `allowInput`     | An OpenAPI spec sent by Studio replaces the one on disk.                                       |
| `allowExec`      | The formatter, the linter, and `output.postGenerate` run as child processes.                   |
| `allowedPlugins` | Module specifiers Studio may name in a generate payload. Unset means no restriction.           |

`allowedPlugins` is the one worth setting whenever the host does not control what is installed:
plugins are resolved by `import(name)`, so an unrestricted payload can load any module the project
can reach.

## Connection flow

Both hosts follow the same steps and send the agent's bearer token with every call. `/api/agent` is
the machine-facing surface, singular because the caller is describing itself. The plural
`/api/agents` is the collection a signed-in user manages in the browser, and the runtime never
touches it.

| Step       | Call                                              | What it does                                                                       |
| ---------- | ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Register   | `POST /api/agent/connect`                         | Binds the token to this machine with a `machineToken`. A failure here is not fatal |
| Session    | `POST /api/agent/sessions`                        | Returns `{ wsUrl, sessionId, expiresAt }`                                          |
| Connect    | `WS` on the returned `wsUrl`                      | Streams generation events until the session expires or is revoked                  |
| Disconnect | `POST /api/agent/sessions/{sessionId}/disconnect` | Closes the session on a clean shutdown                                             |

The runtime reconnects on its own when a session drops, and keeps retrying while Studio is
unreachable.

### Pairing

No host starts with a token, so each one pairs over
[RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) device authorization: it asks
`POST /api/auth/device/code` for a `device_code` and a short `user_code`, shows the code, and polls
`POST /api/agent/token` until someone approves in the browser. Studio mints the token once and stores only its hash, so
nothing can read it back.

`startPairing` defaults to the `kubb-cli` client, which `kubb studio login` uses and any signed-in
member can approve. A host that pairs a shared or tier-limited agent passes `clientId: 'kubb-agent'`
and an `agentKind`, whose codes only an admin can approve.

## Protocol

`@kubb/studio/protocol` holds the WebSocket message types shared by both ends, so the agent and
Studio itself compile against one definition rather than two hand-maintained copies.

```typescript
import { type AgentMessage, isDataMessage } from '@kubb/studio/protocol'
```

## Supporting Kubb

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)
- [See sponsorship tiers and our sponsors](https://kubb.dev/sponsors)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

## License

[MIT](https://github.com/kubb-labs/kubb/blob/main/licenses/LICENSE-MIT)

<!-- Badges -->

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/studio.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/studio
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/studio.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/studio
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/studio.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/studio.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/studio
