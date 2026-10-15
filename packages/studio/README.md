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

Kubb Studio client runtime.

Connects a Kubb project to [Kubb Studio](https://kubb.studio) through typed Cap'n Web RPC over one
authenticated WebSocket, and publishes snapshots from CI in one HTTP request. It backs the `kubb studio`
CLI command and the `kubblabs/kubb-agent` Docker image.

Most people never install this directly. Reach for `kubb studio` instead, which pairs your machine
and runs this for you.

## Installation

```shell
npm install @kubb/studio
```

## Usage

```typescript
import { Hookable, type KubbHooks } from '@kubb/core'
import { connectAgent, InvalidAgentTokenError, pairAgent } from '@kubb/studio'

const hooks = new Hookable<KubbHooks>()
hooks.hook('studio:connected', ({ agentSlug }) => console.log(`Connected as ${agentSlug}`))
hooks.hook('studio:warn', ({ message }) => console.warn(message))

let token = await readStoredToken()

for (;;) {
  token ??= (await pairAgent({ type: 'cli', name: 'my-project', hostname, machineId, onCode })).token
  try {
    // Resolves on shutdown, rejects when Studio refuses the token.
    await connectAgent({ token, configPath: 'kubb.config.ts', loadConfig, version: '1.0.0', hooks, signal })
    break
  } catch (error) {
    if (!(error instanceof InvalidAgentTokenError)) throw error
    token = undefined
  }
}
```

The runtime discovers nothing on its own. The host passes the token, the config loader, its own
version, and a hook emitter, and keeps its own credentials. That is what lets one runtime serve a CLI
running in a developer's project and a container running a fixed plugin set.

## Source layout

| File             | What it owns                                                                     |
| ---------------- | -------------------------------------------------------------------------------- |
| `protocol.ts`    | The wire contract Studio compiles against, published as `@kubb/studio/protocol`. |
| `connect.ts`     | `connectAgent`: the socket loop and the `Agent` that serves Studio's calls.      |
| `pair.ts`        | `pairAgent`: RFC 8628 device pairing.                                            |
| `snapshot.ts`    | `createSnapshot` for CI, and packing a generation into an npm tarball.           |
| `generations.ts` | Running a generation and keeping its files and AST for `readFiles`/`readInput`.  |
| `configFile.ts`  | Reading and patching plugin options in `kubb.config.ts`.                         |

## Connection

`connectAgent` opens `wss://<studio>/api/agent/socket` with the agent's bearer token and an
`x-kubb-instance-id` header. Studio calls `connect(info)` as the first RPC call. `info` says whether
the agent is a sandbox and carries its slug and Studio's version. From then on the agent pings every
30 seconds, and Studio schedules one job at a time on the socket.

Studio ends a socket on purpose with one of these close codes:

| Code   | Meaning                                       | `connectAgent`                        |
| ------ | --------------------------------------------- | ------------------------------------- |
| `4001` | The token is invalid, expired, or revoked     | Rejects with `InvalidAgentTokenError` |
| `4002` | Another process of the same agent took over   | Resolves                              |
| `4003` | The agent is older than Studio accepts        | Rejects with `IncompatibleAgentError` |
| other  | An ordinary drop, `1011` for a Studio failure | Reconnects with jittered backoff      |

Everything the runtime has to say goes through the `hooks` emitter: `studio:connected`,
`studio:disconnected`, `studio:reconnecting`, `studio:command`, `studio:warn`, and `studio:error`,
next to the `kubb:*` hooks of each generation. When a request is refused for a missing permission,
`studio:warn` names it as `permission`, so the host can add its own remedy.

## Permissions

Every permission is off by default, and each covers one trust boundary:

| Option            | What it grants                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `allowWrite`      | Generated files are written to disk. Off means they exist only in memory and stream to Studio. |
| `allowExec`       | The formatter, the linter, and `output.postGenerate` run as child processes.                   |
| `allowConfigEdit` | Studio may change plugin options in `kubb.config.ts`.                                          |
| `allowRead`       | Studio may read back the files a generation produced and its parsed spec.                      |

A sandbox never writes or edits config, and always allows reads.

## Pairing

No host starts with a token, so each one pairs over
[RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) device authorization. `pairAgent` asks Studio
for a code, hands it to `onCode` to show, and polls until someone approves it in the browser.

`machineId` is a secret the host keeps for the machine. Studio stores its hash, so the same machine
pairing again rotates one agent's token instead of creating a second agent. Studio records the
`type` with the agent. `cli` is `kubb studio`, which any member can approve. `user` and `sandbox`
are the Docker image, run normally or as a sandbox. Only an admin can approve them. A denial
throws `PairingDeniedError`, an expired code `PairingExpiredError`, and an aborted `signal`
`PairingCanceledError`.

## CI snapshots

`createSnapshot` generates the project like `kubb generate`, with the formatter, the linter, and
`output.postGenerate`. It then packs the output as an npm tarball and sends one
`POST /api/snapshots` with the organization CI API key as `x-api-key`.

```typescript
import { createSnapshot } from '@kubb/studio'

const snapshot = await createSnapshot({
  apiKey: process.env.KUBB_TOKEN!,
  config,
  id: 'gh:123:pr-4',
  name: 'acme/api#4',
  packageName: '@acme/api',
  version: '1.0.0',
  commit: process.env.GITHUB_SHA,
  baseId: 'gh:123:refs/heads/main',
})
```

Snapshots that share an `id` belong to one CI agent in Studio. `changes` lists the files added,
changed, and removed since that agent's previous snapshot of the package. With `baseId`,
`branchChanges` compares against the latest snapshot of the CI agent with that id, such as the base
branch's.

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
