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
CLI command and the `kubblabs/studio-runner` Docker image.

Most people never install this directly. Reach for `kubb studio` instead, which pairs your machine
and runs this for you.

## Installation

```shell
npm install @kubb/studio
```

## Usage

```typescript
import { Hookable, type KubbHooks } from '@kubb/core'
import { connectRunner, InvalidRunnerTokenError, pairRunner } from '@kubb/studio'

const hooks = new Hookable<KubbHooks>()
hooks.hook('studio:connected', ({ projectSlug }) => console.log(`Connected as ${projectSlug}`))
hooks.hook('studio:warn', ({ message }) => console.warn(message))

let token = await readStoredToken()

for (;;) {
  token ??= (await pairRunner({ type: 'cli', name: 'my-project', hostname, machineId, onCode })).token
  try {
    // Resolves on shutdown, rejects when Studio refuses the token.
    await connectRunner({ token, configPath: 'kubb.config.ts', loadConfigs, version: '1.0.0', hooks, signal })
    break
  } catch (error) {
    if (!(error instanceof InvalidRunnerTokenError)) throw error
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
| `connect.ts`     | `connectRunner`: the socket loop and the `Runner` that serves Studio's calls.    |
| `pair.ts`        | `pairRunner`: RFC 8628 device pairing.                                           |
| `snapshot.ts`    | `createSnapshot` for CI, and packing a generation into an npm tarball.           |
| `generations.ts` | Running a generation and keeping its files and AST for `readFiles`/`readInput`.  |
| `diff.ts`        | The paged line diff `readDiff` serves between two kept sets.                     |

## Connection

`connectRunner` opens `wss://<studio>/api/runner/socket` with the runner's bearer token and an
`x-kubb-instance-id` header. Studio calls `connect(info)` as the first RPC call. `info` says whether
the runner is a sandbox and carries the project slug and Studio's version. From then on the runner pings every
30 seconds, and Studio schedules one job at a time on the socket.

With `allowRead`, the connect payload includes the current `output.path` file list. Studio reads
file contents from disk through `readFiles` when a user opens a file. Sandbox runners have no disk
output, and output paths outside the project root are excluded.

Studio ends a socket on purpose with one of these close codes:

| Code   | Meaning                                       | `connectRunner`                        |
| ------ | --------------------------------------------- | -------------------------------------- |
| `4001` | The token is invalid, expired, or revoked     | Rejects with `InvalidRunnerTokenError` |
| `4002` | Another runner of the same project took over  | Resolves                               |
| `4003` | The runner is older than Studio accepts       | Rejects with `IncompatibleRunnerError` |
| other  | An ordinary drop, `1011` for a Studio failure | Reconnects with jittered backoff       |

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
| `allowRead`       | Studio may read existing output files and the files a generation produced.                     |
| `allowReadAst`    | Studio may read back the parsed spec (the Kubb AST).                                           |

A sandbox never writes or edits config, and always allows reads.

## Pairing

No host starts with a token, so each one pairs over
[RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) device authorization. `pairRunner` asks Studio
for a code, hands it to `onCode` to show, and polls until someone approves it in the browser.

`machineId` is a secret the host keeps for the machine. Studio stores its hash, so the same machine
pairing again rotates one project's token instead of creating a second project. Studio records the
`type` with the project. `cli` is `kubb studio`, which any member can approve. `user` and `sandbox`
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

Snapshots that share an `id` belong to one CI project in Studio. `changes` lists the files added,
changed, and removed since that project's previous snapshot of the package. With `baseId`,
`branchChanges` compares against the latest snapshot of the CI project with that id, such as the base
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
