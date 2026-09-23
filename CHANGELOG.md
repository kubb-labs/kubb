# Changelog

## v5.3.13 — Sep 23, 2026

### @kubb/studio

#### Bug Fixes

- Keep recent generations by job id and snapshot the output directory before each run, so Studio can diff a run against an earlier one or against the files on disk. Agents with a project keep them in `node_modules/.cache/kubb`, so they survive a restart, and sandboxes keep them in memory. `KUBB_AGENT_MAX_GENERATIONS` (default 8), `KUBB_AGENT_MAX_GENERATIONS_MB` (default 100) and `KUBB_AGENT_MAX_SNAPSHOT_MB` (default 50) set the limits. Breaking for the Studio connection: `readFiles` now takes a `jobId` and a `source`, and `GenerateResult.changes` is replaced by `hashes` and `disk.hashes`. `@kubb/core` now exports `cacheStorage`. ([#4090](https://github.com/kubb-labs/kubb/pull/4090), [`7b517b8`](https://github.com/kubb-labs/kubb/commit/7b517b80d2d80a90878e7854528345e3836ebcac))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.12 — Sep 23, 2026

### @kubb/studio

#### Bug Fixes

- Report which files a Studio run added, changed, or removed, and serve the previous run's contents so Studio can show a diff.
  
  - `GenerateResult.changes` maps each path that differs from the session's previous successful run to `added`, `changed`, or `removed`. Unchanged files are left out, and the field is absent on a session's first run.
  - `readFiles` takes `revision: 'previous'` to read the run before the latest one, including files the latest run removed. The previous run is read into memory before the next run starts, so a session that writes to disk can still be diffed after its files are overwritten.
  - A failed run leaves the last successful run as the one to compare against.
  - `FileChange` is exported from `@kubb/studio`. ([#4086](https://github.com/kubb-labs/kubb/pull/4086), [`300186d`](https://github.com/kubb-labs/kubb/commit/300186d94395921012334877c291e8065dd591ef))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.11 — Sep 21, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Generate `Blob` for multipart binary properties after upgrading an OpenAPI 3.0 document to 3.1. ([#4083](https://github.com/kubb-labs/kubb/pull/4083), [`95d93a7`](https://github.com/kubb-labs/kubb/commit/95d93a70c8021bc6aa912be412a3e21b37890bf0))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.10 — Sep 19, 2026

### @kubb/cli

#### Bug Fixes

- Show sponsor tips again for successful `kubb generate` runs and when starting a `kubb studio` session. ([#4077](https://github.com/kubb-labs/kubb/pull/4077), [`15c644e`](https://github.com/kubb-labs/kubb/commit/15c644e427dc7bc522bbf473eba4818bc4ac767c))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.9 — Sep 19, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Update the OpenAPI parser, upgrader, and unplugin dependencies. ([#4068](https://github.com/kubb-labs/kubb/pull/4068), [`d88ab19`](https://github.com/kubb-labs/kubb/commit/d88ab1989b222f8b1012ed046f10bf105139e3e9))

### @kubb/cli

#### Bug Fixes

- Scope Kubb Studio help by subcommand and reject flags passed to the wrong Studio command. ([#4068](https://github.com/kubb-labs/kubb/pull/4068), [`d88ab19`](https://github.com/kubb-labs/kubb/commit/d88ab1989b222f8b1012ed046f10bf105139e3e9))

### kubb

#### Bug Fixes

- Apply the same adapter, parser, and plugin defaults to programmatic `createKubb` builds as the CLI configuration. ([#4072](https://github.com/kubb-labs/kubb/pull/4072), [`4afe194`](https://github.com/kubb-labs/kubb/commit/4afe194a5d88e4ac59813564485e7542d633518c))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.8 — Sep 18, 2026

### @kubb/studio

#### Bug Fixes

- Carry an agent's organization slug through pairing and connecting, so a host can log and trace it
  alongside the agent's own slug.
  
  `PairingResult.agent` and the `studio:connected` hook context gain an optional
  `organizationSlug`, absent for a sandbox or global agent, which has none. `studio:connected` also
  gains `agentSlug`, refreshed on every connect so a rename in Studio shows up without a re-pair.
  Both fields are additive: a host built against an older type just ignores them. ([#4066](https://github.com/kubb-labs/kubb/pull/4066), [`eb5fa50`](https://github.com/kubb-labs/kubb/commit/eb5fa50fedf52a06349813fae039f562225ae240))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.7 — Sep 18, 2026

### @kubb/studio

#### Bug Fixes

- Fix a snapshot package's `package.json` pointing `main`/`module`/`exports['.']` at
  `dist/index.*` even when the generation had no top-level barrel, and add a wildcard
  `exports['./*']` so individual generated files stay importable by path. ([#4064](https://github.com/kubb-labs/kubb/pull/4064), [`d2ce0c4`](https://github.com/kubb-labs/kubb/commit/d2ce0c4af275d7bf89535e64fc0c6bdbfcfaecd1))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.6 — Sep 17, 2026

### @kubb/studio

#### Bug Fixes

- Replace the agent WebSocket command protocol with typed Cap'n Web RPC and remove the legacy JSON envelopes. Agents and Studio must upgrade together; mismatched versions cannot communicate. ([#4061](https://github.com/kubb-labs/kubb/pull/4061), [`f880342`](https://github.com/kubb-labs/kubb/commit/f880342c1dc80611cd4094ced72c7d53e7d46cb5))
- Fix generation and heartbeat lifecycle bugs left over from the Cap'n Web RPC cutover:
  
  - A dropped Studio connection now cancels the in-flight generation instead of letting it finish
    unwatched.
  - Two `startGeneration` calls arriving in the same tick can no longer both start a run.
  - A heartbeat ping that never settles (a half-open socket) now closes the session instead of
    hanging it indefinitely.
  - Removed an unreachable error path left over from the old JSON transport. ([#4061](https://github.com/kubb-labs/kubb/pull/4061), [`f880342`](https://github.com/kubb-labs/kubb/commit/f880342c1dc80611cd4094ced72c7d53e7d46cb5))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.5 — Sep 17, 2026

### @kubb/studio

#### Bug Fixes

- Stop holding a whole generation's output in memory for the life of a Studio session.
  
  `studio:files` and `studio:snapshot` used to read every generated file into one `Record<string,
  string>` the moment a run finished, and kept that map alive until the next generation. A run
  producing gigabytes of source meant the agent process held gigabytes in RAM, whether or not anyone
  ever opened a file or took a snapshot.
  
  The agent now keeps the live `Storage` a run wrote through, plus the list of paths it produced, and
  reads a file's content back from `Storage` only when `studio:files` or `studio:snapshot` actually
  asks for it. A path outside that list is refused before it reaches storage, so this changes nothing
  about what a session can read, only when the read happens. ([#4059](https://github.com/kubb-labs/kubb/pull/4059), [`351e3c9`](https://github.com/kubb-labs/kubb/commit/351e3c9f9822cfb7ffc5ac7d07517394a449f58e))
- Stop streaming generated source over the agent WebSocket by default. Reading it now needs
  `--allow-read` (or `KUBB_AGENT_ALLOW_READ=true`), matching the other four Studio permissions.
  
  Every `kubb studio` session used to send the full text of every generated file on
  `kubb:generation:end`, whether or not anyone in the browser opened one. A spec producing hundreds
  of files could put megabytes of source on the wire per run, and nothing gated it: `allowWrite`,
  `allowConfigEdit`, `allowInput`, and `allowExec` all cover what Studio may do _to_ a project, but
  reading generated output back was never one of the four.
  
  `kubb:generation:end` now carries nothing. Everything it used to carry moved somewhere better:
  
  - The list of generated files is on `kubb:build:end`, which already carried every path and fires
    earlier in a run. Its paths are now relative to the agent's root, matching every other path on
    the wire, where they used to be absolute.
  - The file count is on `kubb:generation:summary`, which already had it and was always the accurate
    number (`kubb:generation:end`'s old count went to 0 for a CI connection).
  - File contents are fetched on demand with a new `studio:files` command, which the browser sends
    when someone opens a file. The agent replies with `agent:files`, refusing unless `allowRead` was
    granted.
  - Peer dependency metadata, previously sent on every generation and round-tripped straight back
    into `studio:snapshot`, now travels with the `agent:snapshot` reply instead, since the CI
    snapshot flow is its only consumer. `studio:snapshot` takes `bundledDependencies` in place of
    `peerDependencies`.
  
  `--allow-read` is off by default everywhere, like every other permission. A sandbox or global
  agent is always granted it, since its output is the only thing it has:
  
  ```shell
  kubb studio --allow-read   # show generated files in the browser
  ```
  
  An older Studio instance talking to this version of the agent (or the reverse) can fail: a snapshot
  build errors because `bundledDependencies` and `peerDependencies` no longer line up between the two
  ends, and a plain session shows an empty editor with no file contents. Point `--url` at a Studio
  build that matches this version.
  
  The in-process `kubb:generation:end` hook (`kubb.hooks.hook('kubb:generation:end', ...)`, or a
  plugin's own listener) is unaffected. It still carries `config`, `storage`, `diagnostics`,
  `status`, `hrStart`, and `filesCreated`, exactly as before. Only the payload this event sends over
  the Studio WebSocket changed. ([#4059](https://github.com/kubb-labs/kubb/pull/4059), [`351e3c9`](https://github.com/kubb-labs/kubb/commit/351e3c9f9822cfb7ffc5ac7d07517394a449f58e))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.4 — Sep 16, 2026

### @kubb/studio

#### Bug Fixes

- Back off while polling a Studio job, so a long snapshot stops exhausting the API key rate limit.
  
  `waitForJob` polled `GET /api/jobs/{id}` every second, starting the instant the job was queued. The
  CLI's `kubb studio snapshot` waits up to 10 minutes by default, which is up to 600 requests against
  a budget of 100 per window. The window only resets after a whole window with no request, so a
  one-second poll could never escape the limit once it hit it, and every later call failed until the
  run gave up. The budget belongs to the organization key, so concurrent CI runs share it.
  
  The first poll now waits two seconds, since a job runs a generation and packs a tarball before it
  can possibly finish. From there the interval doubles to a 30 second ceiling, bringing a 10 minute
  wait down from 600 requests to 22. A 429 pushes the next poll out by the `tryAgainIn` Studio
  returns and never pulls it back in, and `retry: false` stops ofetch retrying a 429 with no delay. ([#4057](https://github.com/kubb-labs/kubb/pull/4057), [`52637b6`](https://github.com/kubb-labs/kubb/commit/52637b617207bd7e51e7f9d5c2220df9de0c4704))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.3 — Sep 16, 2026

### @kubb/studio

#### Bug Fixes

- The agent runtime now packs snapshot tarballs itself. A new `studio:snapshot` command builds the
  npm-installable tarball from the session's most recent generation and uploads it to a Studio
  endpoint, instead of Studio building the tarball on its own server. A snapshot request with no
  prior generation is refused.
  
  A CI connection also keeps generated files off every `kubb:generation:end` reply, since it has no
  UI to render them in. `kubb studio snapshot` and the Studio UI's "Create snapshot" button keep
  working as before, now backed by this protocol message. ([#4052](https://github.com/kubb-labs/kubb/pull/4052), [`19e9c2c`](https://github.com/kubb-labs/kubb/commit/19e9c2c70687f6440cd2d3e74d153edb64491d8d))
- The background reconnect loop's "Retrying connection" and "Reconnect attempt failed" lines, and
  the teardown notice `disconnect()` prints on the way out, now go through `console.error` instead
  of `console.info`/`console.log`, and only print when a host passes a `logLevel` above `silent` to
  `StudioSession`. Previously they always printed unconditionally, which a CI runner that only
  streams a child process's stderr live (such as `kubb-labs/action`) never surfaces, and which
  contradicted `installLogger`'s own "prints nothing when left out" default.
  
  `kubb studio` and `kubb studio snapshot` now pass their `--log-level` flag through, so these lines
  respect the same flag as the rest of the command's output. ([#4052](https://github.com/kubb-labs/kubb/pull/4052), [`19e9c2c`](https://github.com/kubb-labs/kubb/commit/19e9c2c70687f6440cd2d3e74d153edb64491d8d))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.2 — Sep 16, 2026

### @kubb/cli

#### Bug Fixes

- CLI flags are now kebab-case, matching the convention used by most command-line tools.
  
  - `kubb generate --log-level` and `kubb generate --dry-run` replace `--logLevel` and `--dryRun`.
  - `kubb studio --allow-write`, `--allow-config-edit`, `--allow-input`, and `--allow-exec` replace
    `--allowWrite`, `--allowConfigEdit`, `--allowInput`, and `--allowExec`.
  - `kubb init --dry-run` replaces `--dryRun`.
  
  To upgrade, replace any camelCase flag in a script or CI job with its kebab-case name. The CLI
  now rejects an unrecognized flag with an error instead of silently ignoring it.
  
  ```bash
  # Before
  kubb studio --allowWrite --allowExec
  
  # After
  kubb studio --allow-write --allow-exec
  ``` ([#4046](https://github.com/kubb-labs/kubb/pull/4046), [`e5ecdda`](https://github.com/kubb-labs/kubb/commit/e5ecdda06acbd3b99c2716384b2a8ac56eedfad8))

### @kubb/studio

#### Bug Fixes

- Renamed the `studio:ping` heartbeat reply to `studio:pong`, matching the ping/pong pattern
  `agent:ping` already implies (`StudioPingMessage` is now `StudioPongMessage`,
  `isStudioPingMessage` is now `isStudioPongMessage`). This is a wire-protocol change: an agent
  running an older `@kubb/studio` and a Studio running the new one won't recognize each other's
  heartbeat reply. Update both sides together.
  
  Also documented the full `studio:`/`agent:` message table in `packages/studio/src/protocol/index.ts`,
  including why `studio:generate` has no dedicated `agent:generate` reply (its result rides the
  `agent:data`/`kubb:generation:end` event stream instead, unlike `studio:save`/`studio:snapshot`,
  which reply directly). ([#4053](https://github.com/kubb-labs/kubb/pull/4053), [`76dd283`](https://github.com/kubb-labs/kubb/commit/76dd283169ac312c269c398bee64944eee6f5b05))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.1 — Sep 15, 2026

### @kubb/core

#### Bug Fixes

- Report duplicate barrel exports instead of emitting an invalid barrel. ([#4043](https://github.com/kubb-labs/kubb/pull/4043), [`2aad826`](https://github.com/kubb-labs/kubb/commit/2aad826b4f70cd7a82c30c8d6323c4fc7664848c))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.0 — Sep 15, 2026

### @kubb/core

#### Features

- Add an opt-in HTML report with generated files, plugin timings, and diagnostics. ([#4041](https://github.com/kubb-labs/kubb/pull/4041), [`be705de`](https://github.com/kubb-labs/kubb/commit/be705de4279b0fa691e1b1d5ef001ad515b4bafc))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.8 — Sep 15, 2026

### @kubb/cli

#### Bug Fixes

- Add `kubb studio snapshot` to generate and publish a Kubb Studio snapshot from any CI, not only GitHub Actions.
  
  - Registers or reuses a CI agent, connects it, queues a snapshot job, and polls until the tarball is ready.
  - Reads the organization CI API key from `--token` or `KUBB_TOKEN`.
  - Detects the calling CI (GitHub Actions, GitLab CI, Bitbucket Pipelines, CircleCI) to reuse one agent per pull or merge request, or takes an explicit `--id` on any other CI.
  - Prints a summary, or one JSON object with `--json` for a script to read.
  - `@kubb/studio` now also exports `createAgent` and `machineTokenFrom`, so a host can register a CI agent without hand-rolling the request.
  
  ```shell
  KUBB_TOKEN=$KUBB_TOKEN kubb studio snapshot --json
  ``` ([#4038](https://github.com/kubb-labs/kubb/pull/4038), [`4cd9f5e`](https://github.com/kubb-labs/kubb/commit/4cd9f5e311e5dc6edb14287c13db0a5466b4e892))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.7 — Sep 15, 2026

### @kubb/cli

#### Bug Fixes

- Create a separate Kubb Studio agent connection for each project directory while reusing the same agent within that directory. ([`af87dbc`](https://github.com/kubb-labs/kubb/commit/af87dbcc8bd77daabfa1ceb57f17366c83aab9d1))

### @kubb/studio

#### Bug Fixes

- Add `createJob` and `waitForJob` for Studio's async `/api/jobs` endpoints. ([#4035](https://github.com/kubb-labs/kubb/pull/4035), [`5382ff0`](https://github.com/kubb-labs/kubb/commit/5382ff06d685beb03f805e1a5dce4bba37aecb7d))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.6 — Sep 14, 2026

### @kubb/studio

#### Bug Fixes

- Add job ID correlation to Studio commands and streamed agent events. ([`0a1e553`](https://github.com/kubb-labs/kubb/commit/0a1e5537c5d1425af22081a04e51462e78baa947))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.5 — Sep 14, 2026

### @kubb/studio

#### Bug Fixes

- Add a `studio:ready` acknowledgement so a host can tell "the socket is open" apart from "Studio has registered this connection and will dispatch jobs to it".
  
  A connected socket announces itself with `agent:connect` but never waited for a reply, so a job could arrive at Studio moments before the agent was actually registered. `StudioSession` now waits up to 10 seconds for `studio:ready` after sending that handshake and fires a new `studio:ready` hook once it lands, warning instead of failing if an older Studio never sends one. `kubb studio` prints `✓ Ready to receive jobs` once it does. ([#4028](https://github.com/kubb-labs/kubb/pull/4028), [`b93eb64`](https://github.com/kubb-labs/kubb/commit/b93eb640264f2905cf9b47e73c5f3c957938240e))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.4 — Sep 14, 2026

### @kubb/studio

#### Bug Fixes

- Report the package a plugin ships from, so `plugin-ts` reaches Studio as `@kubb/plugin-ts` while a third-party plugin keeps its own name.
  
  The connect payload scoped every plugin name under `@kubb/`, which claimed a third-party plugin as one of Kubb's. It now follows the same rule the dependency check already used. ([#4026](https://github.com/kubb-labs/kubb/pull/4026), [`628c98b`](https://github.com/kubb-labs/kubb/commit/628c98b012cb9b1f91201c7c071fb66c4283f511))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.3 — Sep 13, 2026

### @kubb/cli

#### Bug Fixes

- `kubb generate --watch` now works with URL inputs. A remote document emits no filesystem events, so watch mode polls the URL (every 2 seconds) and regenerates when the response body changes. Each poll request times out after 10 seconds, so a hung server never stalls the watcher. An unreachable server is reported once per outage and polling continues. After recovery, a rebuild only happens when the document actually changed, unless the server was already down at startup, in which case the first successful poll regenerates so the output catches up. Previously `--watch` was silently ignored for URL inputs and the CLI exited after a single build. ([#4022](https://github.com/kubb-labs/kubb/pull/4022), [`5f4fd20`](https://github.com/kubb-labs/kubb/commit/5f4fd2006e828838d221e46588440aaf6705bd38))

### @kubb/studio

#### Bug Fixes

- Report installed peer dependency versions and missing dependencies with each generation result. ([#4021](https://github.com/kubb-labs/kubb/pull/4021), [`6187109`](https://github.com/kubb-labs/kubb/commit/6187109c97bd00d4cf17234b7383a43e84d4b71e))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle), [@tachirodriguez](https://github.com/tachirodriguez)

## v5.2.2 — Sep 11, 2026

### @kubb/adapter-oas

#### Bug Fixes

- A `oneOf`/`anyOf` without a declared OpenAPI `discriminator` now infers one when a property
  carries a distinct single literal value on every branch. `UnionSchemaNode.discriminatorPropertyName`
  is set from that inference, so every printer that narrows on it (`plugin-zod`, `plugin-faker`)
  picks it up without reimplementing the same scan. ([#4019](https://github.com/kubb-labs/kubb/pull/4019), [`c89f215`](https://github.com/kubb-labs/kubb/commit/c89f215e942a8b21294f7f35d83040cf10db951c))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.1 — Sep 10, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Keep a binary response body under `application/octet-stream` typed as a blob instead of falling
  back to `emptySchemaType`. ([#4013](https://github.com/kubb-labs/kubb/pull/4013), [`dd9a902`](https://github.com/kubb-labs/kubb/commit/dd9a902b310b14be77560c79b131f2f08e182727))

### @kubb/core

#### Bug Fixes

- Add a `kubb.dev/sponsors` entry to each published package's `funding` field, alongside the
  existing GitHub Sponsors and Open Collective links. ([#4007](https://github.com/kubb-labs/kubb/pull/4007), [`b063738`](https://github.com/kubb-labs/kubb/commit/b06373881532b71c9316600eaf40f096484fdb51))

### @kubb/studio

#### Bug Fixes

- Trim `@kubb/studio`'s public API to what the `kubb studio` CLI command and the Docker agent
  actually use.
  
  - Removed the unused hook context types `StudioCommandStartContext`, `StudioCommandEndContext`,
    `StudioConnectingContext`, `StudioDisconnectedContext`, `StudioErrorContext`, and
    `StudioWarnContext` from the package's root export. `StudioConnectedContext` stays exported.
    Hook payloads for `studio:connecting`, `studio:command:start`, `studio:command:end`,
    `studio:disconnected`, `studio:warn`, and `studio:error` still type-check through
    `Hookable<KubbHooks>['hook']`, since the underlying types are still declared, just no longer
    importable by name.
  - Removed `ConnectionOutcome` and `TokenRejection` from the root export. Both stay inferable from
    `runConnection`'s return value and `onTokenRejected` callback.
  
  Neither the CLI nor the Docker agent imports any of these by name, so this does not change their
  behavior. A consumer that did import one of them by name gets the same type through inference at
  the call site instead, such as `runConnection`'s return value or a `hooks.hook('studio:warn', ...)`
  callback's parameter. ([#4012](https://github.com/kubb-labs/kubb/pull/4012), [`109abe8`](https://github.com/kubb-labs/kubb/commit/109abe8a05d43cca35e93571456de882acff61e6))

### Contributors

Thanks to everyone who contributed to this release:

[@ghettoDdOS](https://github.com/ghettoDdOS), [@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.0 — Sep 9, 2026

### @kubb/adapter-oas

#### Bug Fixes

- [`5ccc52c`](https://github.com/kubb-labs/kubb/commit/5ccc52cad88cc7aa6943c96105f0ec6d6b2d4106) - Bump `@readme/openapi-parser` to v8. Spec validation behavior is unchanged. ([`5ccc52c`](https://github.com/kubb-labs/kubb/commit/5ccc52cad88cc7aa6943c96105f0ec6d6b2d4106))

### @kubb/ast

#### Features

- Add utilities for resolving object properties through references and intersections and for reading
  literal values from enum schemas. Plugin authors can use these utilities to handle discriminated
  unions without implementing their own schema traversal. ([#3989](https://github.com/kubb-labs/kubb/pull/3989), [`a2b5924`](https://github.com/kubb-labs/kubb/commit/a2b59246e2d26b04da4e0152f92423994f37623c))

### @kubb/cli

#### Bug Fixes

- `kubb init` and `kubb generate --watch` now print plain lines when the terminal cannot carry
  clack's gutter, such as a piped run or CI. They wrote box-drawing and cursor escapes into the
  output before. Spinner steps print as lines there instead of disappearing with the animation. ([#3983](https://github.com/kubb-labs/kubb/pull/3983), [`d1b123e`](https://github.com/kubb-labs/kubb/commit/d1b123e68c62cd7aac146aaa2079badfd1c4a234))
- `kubb mcp` and `kubb validate` now load `@kubb/mcp` and `@kubb/adapter-oas` only when their
  commands run. Every other command, including `kubb --help`, no longer touches either optional peer. ([#3968](https://github.com/kubb-labs/kubb/pull/3968), [`0e4dc40`](https://github.com/kubb-labs/kubb/commit/0e4dc4073c10ae53d98b5619cd2b4fa9e2622d9f))

### @kubb/core

#### Bug Fixes

- Moved shared-utility logic used by only one package out of `@internals/utils` and into that
  package (`@kubb/core`, `@kubb/cli`, `@kubb/kit`). No public API or behavior changed. ([#3968](https://github.com/kubb-labs/kubb/pull/3968), [`0e4dc40`](https://github.com/kubb-labs/kubb/commit/0e4dc4073c10ae53d98b5619cd2b4fa9e2622d9f))

### @kubb/studio

#### Features

- Add the Kubb Studio CLI for connecting a local Kubb project to Kubb Studio. ([#3972](https://github.com/kubb-labs/kubb/pull/3972), [`0cd4c7b`](https://github.com/kubb-labs/kubb/commit/0cd4c7b5033833f9a0db2935fc25a575daecf058))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.1.0 — Sep 3, 2026

### @kubb/adapter-oas

#### Features

- Let `dateType` set `date-time`, `date`, and `time` independently, instead of one value driving all three
  
  Pass an object to represent timestamps as a JS `Date` while keeping date-only and time-only fields as strings, since `Date` cannot round-trip those without inventing a timezone.
  
  ```ts
  adapterOas({
    dateType: {
      dateTime: 'date',
      date: 'string',
      time: 'string',
    },
  })
  ```
  
  The scalar form (`dateType: 'date'`) still applies one value to all three formats. ([#3957](https://github.com/kubb-labs/kubb/pull/3957), [`9fca8e9`](https://github.com/kubb-labs/kubb/commit/9fca8e9ba16f05f29c852123c8696f7b6036c4a9))

#### Bug Fixes

- Explicit `types` fields for each package.json `exports` entry, so that it works with tsconfig.json `moduleResolution: 'bundler'` ([#3964](https://github.com/kubb-labs/kubb/pull/3964), [`be4cd17`](https://github.com/kubb-labs/kubb/commit/be4cd1770a34f547d1f1f60bd165c4228fef5053))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.6 — Sep 2, 2026

### @kubb/cli

#### Bug Fixes

- Adds `--dryRun` to `generate` and `init` to preview a run without writing files, installing packages, formatting, linting, or running post-generate commands. When an AI coding agent runs the CLI, `generate` now uses the plain logger instead of the interactive one, and anonymous telemetry records the agent's name. ([#3951](https://github.com/kubb-labs/kubb/pull/3951), [`9849de3`](https://github.com/kubb-labs/kubb/commit/9849de3387ccfdb4e29c92e42e1e0429f3325c83))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.5 — Aug 31, 2026

### @kubb/core

#### Bug Fixes

- [`2869e6d`](https://github.com/kubb-labs/kubb/commit/2869e6d390265835436e9bd5702852f7c8bb8209) - Avoids duplicate filesystem reads during generated file writes and uses native Node.js promise timers in asynchronous tests. ([`2869e6d`](https://github.com/kubb-labs/kubb/commit/2869e6d390265835436e9bd5702852f7c8bb8209))

## v5.0.4 — Aug 28, 2026

### unplugin-kubb

#### Bug Fixes

- Move `unplugin-kubb` past its squatted npm version range.

  Versions 5.0.1 through 5.0.30 were already published on npm from `unplugin-kubb`'s
  pre-monorepo history and depend on kubb v4, so the package's version was set directly to
  5.0.31 to clear that range. This changeset picks up from that 5.0.31 baseline and puts
  `unplugin-kubb` back through the normal release process, independent of `kubb` and `@kubb/*`. ([#3940](https://github.com/kubb-labs/kubb/pull/3940), [`b45071e`](https://github.com/kubb-labs/kubb/commit/b45071e996d6607c62eaa31c88cc47ab2b5243c5))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.3 — Aug 27, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Keep every discriminator mapping key that targets the same schema, and apply the discriminant to children declared with `allOf` ([#3929](https://github.com/kubb-labs/kubb/pull/3929), [`58d9625`](https://github.com/kubb-labs/kubb/commit/58d96255713042eadefe352103aa517661025297))

### Contributors

Thanks to everyone who contributed to this release:

[@xeoneux](https://github.com/xeoneux)

## v5.0.2 — Aug 24, 2026

### @kubb/kit

#### Bug Fixes

- Fix `Url.toPath` producing route masks that `path-to-regexp` (used by MSW/Express) rejects or misparses:
  
  - A parameter name starting with a character outside `[A-Za-z0-9_]` (e.g. `{$id}`) now sanitizes to a safe capture name instead of keeping the disallowed character.
  - Distinct parameter names that normalize to the same identifier (e.g. `{group-id}` and `{group.id}`) are now deduplicated with an incrementing suffix (`groupId`, `groupId2`) instead of producing two identically named captures. ([#3922](https://github.com/kubb-labs/kubb/pull/3922), [`56a072c`](https://github.com/kubb-labs/kubb/commit/56a072c036e2b5d44fb8ac278ebd0800c583975a))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.1 — Aug 21, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Fix an OpenAPI 3.1 multi-type array collapsing to one type when paired with `format`. `type: ["null", "integer", "string"], format: "int32"` generated `integer | null`, dropping `string`. The multi-type rule now runs before `format`, so each type parses on its own. ([#3916](https://github.com/kubb-labs/kubb/pull/3916), [`3d0098c`](https://github.com/kubb-labs/kubb/commit/3d0098c51be704557f735ec09d50a43218f808dc))
- Fix an OpenAPI 3.1 multi-type array dropping its other types when `null` came first. `type: ["null", "string"]` generated `null` instead of `string | null`, while `type: ["string", "null"]` generated the right type, so the output depended on the order the types happened to be written in. The normalized type now takes the first non-`null` entry, and `type: ["null"]` stays a null schema. ([#3912](https://github.com/kubb-labs/kubb/pull/3912), [`331558e`](https://github.com/kubb-labs/kubb/commit/331558ef615cdd1b6a4701c3c67176ed46370771))

### @kubb/cli

#### Bug Fixes

- Bump `verkit` to 0.4.0 and `@tmcp/transport-stdio` to 0.5.0. ([#3909](https://github.com/kubb-labs/kubb/pull/3909), [`77e95a7`](https://github.com/kubb-labs/kubb/commit/77e95a7ca0ee8c2e9bec5be474205e97bce0a54b))

### @kubb/kit

#### Bug Fixes

- Fix `Url.toPath` producing an invalid Express-style route for a hyphenated path parameter (e.g. `{point-id}` became `:point-id`). `path-to-regexp` treats a hyphen as ending the parameter name, so the generated MSW handler matched `:point` followed by a literal `-id` and rejected valid values. `Url.toPath` now camelCases the parameter name the same way `Url.toTemplateString` already does, so `{point-id}` becomes `:pointId`. ([#3895](https://github.com/kubb-labs/kubb/pull/3895), [`bf9bdc8`](https://github.com/kubb-labs/kubb/commit/bf9bdc823a2fe06225d2a01b93caa618372e6c6b))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0

Kubb v5 rebuilds code generation around adapters, a universal AST, parsers, and storage, and generates code up to 5.4x faster than v4. Config gets shorter, generated client calls change shape, and plugins move to their own repo ([kubb-labs/plugins](https://github.com/kubb-labs/plugins)).

Read the [release blog post](https://kubb.dev/blog/v5) for the highlights, and the [migration guide](https://kubb.dev/docs/5.x/migration) for the full, per-package breaking-change list and upgrade steps.

For prior releases, see [GitHub Releases](https://github.com/kubb-labs/kubb/releases).
