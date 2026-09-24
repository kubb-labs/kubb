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

Connects a Kubb project to [Kubb Studio](https://kubb.studio) through typed Cap'n Web RPC over an
authenticated WebSocket. It backs both front ends: the `kubb studio` CLI command and the
`kubblabs/kubb-agent` Docker image. Browser clients use Studio’s HTTP/SSE API, not this socket.

Most people never install this directly. Reach for `kubb studio` instead, which pairs your machine
and runs this for you.

## Installation

```shell
npm install @kubb/studio
```

## Usage

```typescript
import { createFileStorage, runConnection, setStorage } from '@kubb/studio'

// The machine identity lives in this storage, so install it before anything pairs or connects.
setStorage(createFileStorage('./.kubb-cache'))

const outcome = await runConnection({
  credentials: { token: process.env.KUBB_AGENT_TOKEN! },
  clientOptions: () => ({
    configPath: 'kubb.config.ts',
    version: '1.0.0',
    loadConfig: () => loadMyKubbConfig(),
    installLogger: (hooks) => {
      hooks.hook('studio:connected', ({ url }) => console.log(`Connected to ${url}`))
      hooks.hook('studio:reconnecting', ({ delayMs }) => console.log(`Retrying in ${delayMs}ms`))
      hooks.hook('studio:warn', ({ message }) => console.warn(message))
      hooks.hook('studio:error', ({ error }) => console.error(error.message))
    },
  }),
  signal: shutdown.signal,
  // Return a new credential to reconnect with, `null` to stop, or throw to fail the run.
  onTokenRejected: async () => null,
})
```

The runtime discovers nothing on its own: the host injects the config loader, the storage, and its
own version. That is what lets one runtime serve a CLI running in a developer's project and a
container running a fixed plugin set.

## Hosts and the runtime

Three hosts run this package: `kubb studio`, the `kubblabs/kubb-agent` Docker image, and
`kubb studio snapshot` in CI. All three follow the steps below. The runtime owns only the
connection: it doesn't read CI environment variables or print anything, and behaves the same in
every host.

| Step             | `kubb studio`                           | Docker agent                             | `kubb studio snapshot`                   |
| ---------------- | --------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| Machine identity | `setStorage` under `~/.kubb`            | `setStorage` on the Nitro `kubb` mount   | `KUBB_AGENT_SECRET` from the CI identity |
| Credentials      | stored, or `pairAgent({ type: 'cli' })` | stored, or `pairAgent({ type: 'user' })` | `createAgent` with the CI API key        |
| Permissions      | flags and a per-project prompt          | `KUBB_AGENT_ALLOW_*`                     | flags only                               |
| Connection       | `runConnection`                         | `runConnection`                          | `runConnection`                          |
| Token rejected   | pair again once                         | pair again once                          | fail the run                             |
| Output           | renders the `studio:*` hooks            | renders the `studio:*` hooks             | renders the `studio:*` hooks             |

Everything the runtime has to say goes through hooks on the emitter `installLogger` receives:
`studio:connecting`, `studio:connected`, `studio:ready`, `studio:reconnecting`,
`studio:disconnected`, `studio:command:start`, `studio:command:end`, `studio:warn`, and
`studio:error`. When a request is refused for a missing permission, `studio:warn` carries it as
`permission`, and the host adds its own remedy, a CLI flag or an environment variable.

## Permissions

Every permission is off by default, and each covers one trust boundary:

| Option            | What it grants                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `allowWrite`      | Generated files are written to disk. Off means they exist only in memory and stream to Studio. |
| `allowInput`      | An OpenAPI spec sent by Studio replaces the one on disk.                                       |
| `allowExec`       | The formatter, the linter, and `output.postGenerate` run as child processes.                   |
| `allowConfigEdit` | Studio may change plugin options in `kubb.config.ts`.                                          |
| `allowRead`       | Studio may read back the files a generation produced.                                          |

## Connection flow

Both hosts follow the same steps and send the agent's bearer token with every call. `/api/agent` is
the machine-facing surface, singular because the caller is describing itself. The plural
`/api/agents` is the collection a signed-in user manages in the browser, and the runtime never
touches it.

| Step       | Call                                              | What it does                                                                       |
| ---------- | ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Register   | `POST /api/agent/connect`                         | Binds the token to this machine with a `machineToken`. A failure here is not fatal |
| Session    | `POST /api/agent/sessions`                        | Returns `{ url, sessionId, expiresAt }`                                            |
| Connect    | Configured RPC connector on `url`                 | Attaches the typed `AgentApi`/`StudioApi` RPC session                              |
| Disconnect | `POST /api/agent/sessions/{sessionId}/disconnect` | Closes the session on a clean shutdown                                             |

The runtime reconnects on its own when a session drops, and keeps retrying while Studio is
unreachable. Generation progress is a native Cap'n Web `ReadableStream` on the generation
capability; durable job status is read through the HTTP job API.

## Studio job events

`@kubb/studio` exposes a deliberately small public event API. Every live event uses the envelope
`{ version: 1, jobId, type, data, timestamp }`. The native stream preserves order and applies
backpressure; it is not a replay cursor. Job status and the terminal result remain authoritative
after a reconnect.

The stable catalog is `generationEventTypes`: generation and build progress, file processing,
plugin progress, log levels, diagnostics, command-hook output, and the terminal generation summary.
Each `type` is a lifecycle name registered by `@kubb/core`, while `data` is the JSON-safe projection
defined by `GenerationEventPayloads`. AST traversal, live config and adapter objects, storage, and
plugin implementations never leave the agent. New core hooks stay private until Studio explicitly
adds their name and serializer projection.

### Pairing

No host starts with a token, so each one pairs over
[RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) device authorization: it asks
`POST /api/auth/device/code` for a `device_code` and a short `user_code`, shows the code, and polls
`POST /api/agent/token` until someone approves in the browser. Studio mints the token once and stores only its hash, so
nothing can read it back.

`pairAgent` runs that whole flow and hands each code to the host's `onCode` to show. The `type` is
what Studio registers the machine as: `cli` is a `kubb studio` machine any signed-in member can
approve, and `user` or `sandbox` is the Docker image, whose codes only an admin can approve. With
`maxAttempts` above 1 it asks for a fresh code when one expires unapproved. A denial throws
`PairingDeniedError`, an expired code `PairingExpiredError`, and an aborted `signal`
`PairingCanceledError`.

```typescript
import { pairAgent } from '@kubb/studio'

const { token, agent } = await pairAgent({
  type: 'cli',
  name: 'my-project',
  hostname: os.hostname(),
  onCode: (session) => console.log(`Approve ${session.user_code} at ${session.verification_uri}`),
})
```

## Asynchronous jobs

CI and automation queue work with `createJob` and poll with `waitForJob`. Both send the
organization CI API key as `x-api-key`. They do not open a WebSocket.

| Step   | Call                 | What it does                                                          |
| ------ | -------------------- | --------------------------------------------------------------------- |
| Queue  | `POST /api/jobs`     | Accepts a `generation` or `snapshot` job and returns `202` with an id |
| Status | `GET /api/jobs/{id}` | Returns the job until `success`, `failed`, or `canceled`              |

```typescript
import { createJob, waitForJob } from '@kubb/studio'

const job = await createJob({
  studioUrl: 'https://kubb.studio',
  token: process.env.KUBB_TOKEN!,
  type: 'snapshot',
  agentId: agent.id,
  name: '@scope/package',
  version: '1.0.0',
})

const finished = await waitForJob({
  studioUrl: 'https://kubb.studio',
  token: process.env.KUBB_TOKEN!,
  id: job.id,
})

if (finished.status === 'failed') throw new Error(finished.error)
if (finished.status === 'canceled') throw new Error('Studio job was canceled')
const snapshot = finished.snapshot
```

Pass `commit` with a snapshot job, and the finished snapshot carries `changes`: the files added,
changed, and removed since the previous snapshot of the same package on the same agent, and which
snapshot (and commit) that was. `base` is `null` on the first one.

Pass `baseMachineToken`, the machine token of another agent (`machineTokenFrom(id)`), and the
snapshot also carries `branchChanges`: the same comparison against that agent's latest snapshot of
the package. `kubb studio snapshot` passes the agent a CI run on the pull request's base branch
registers under, so a pull request sees what it changes against `main`. `base` is `null` when that
agent has no snapshot yet.

An agent granted `allowRead` with a project on disk also reports `diskChanges`: what the run
generated against what its output directory held before it ran, such as committed generated code.

Runs that share an agent, the same pull request or the same branch, must not overlap: registering
the agent again ends the other run's session. Serialize them per ref, such as a GitHub Actions
`concurrency` group on `github.ref` or a GitLab `resource_group` on `CI_COMMIT_REF_SLUG`.

A snapshot job packs the tarball on the agent, not on Studio. The agent `PUT`s an empty request to
a path Studio provides, gets back a redirect to a short-lived storage URL, and uploads the tarball
there. The storage URL never crosses the RPC socket.

## Protocol

`@kubb/studio/protocol` holds the RPC contracts both ends share, so the agent and Studio compile
against one definition rather than two hand-maintained copies. Its only import is `KubbHooks` from
`@kubb/core`, which the published event names are checked against.

```typescript
import type { AgentApi, GenerationEvent, GenerationRun, RpcConnection, RpcConnector, StudioApi } from '@kubb/studio'
```

Hosts supply an `RpcConnector`, which keeps transport details in the CLI, Docker agent, or Studio
host rather than in the generation runtime. A `GenerationRun.cancel()` call aborts the matching
generation cooperatively, including configured formatter, linter, and `postGenerate` processes.

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
