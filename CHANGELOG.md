# Changelog

## v5.2.0 — Sep 5, 2026

### @kubb/adapter-oas

#### Bug Fixes

- [`5ccc52c`](https://github.com/kubb-labs/kubb/commit/5ccc52cad88cc7aa6943c96105f0ec6d6b2d4106) - Bump `@readme/openapi-parser` to v8. Spec validation behavior is unchanged. ([`5ccc52c`](https://github.com/kubb-labs/kubb/commit/5ccc52cad88cc7aa6943c96105f0ec6d6b2d4106))

### @kubb/cli

#### Features

- `kubb studio` gains `--allowConfigEdit`, letting Studio change plugin options in your
  `kubb.config.ts`. The CLI asks for it once per project, the same as the other permissions, and
  leaves it off in CI.
  
  It is separate from `--allowWrite`, which covers generated output. Editing the config changes a
  file you wrote by hand, so it is granted on its own. ([#3972](https://github.com/kubb-labs/kubb/pull/3972), [`0cd4c7b`](https://github.com/kubb-labs/kubb/commit/0cd4c7b5033833f9a0db2935fc25a575daecf058))
- `kubb studio` now recovers when Studio rejects the agent token while a session is already live,
  not only at startup: it explains what happened, reopens the browser approval flow, and reconnects
  with the new token. Saved project permissions carry over when the reauthenticated agent keeps the
  same identity and Studio URL, and are asked again when it does not.
  
  An operator-supplied `KUBB_AGENT_TOKEN` is never replaced automatically, and CI or a run without a
  browser exits with instructions to run `kubb studio login`. Ctrl+C now cancels an in-flight
  pairing cleanly instead of leaving it running. ([#3982](https://github.com/kubb-labs/kubb/pull/3982), [`7a1d097`](https://github.com/kubb-labs/kubb/commit/7a1d0978a95faf71a9d9d3ed52c5938906d3059d))

#### Bug Fixes

- `kubb init` and `kubb generate --watch` now print plain lines when the terminal cannot carry
  clack's gutter, such as a piped run or CI. They wrote box-drawing and cursor escapes into the
  output before. Spinner steps print as lines there instead of disappearing with the animation. ([#3983](https://github.com/kubb-labs/kubb/pull/3983), [`d1b123e`](https://github.com/kubb-labs/kubb/commit/d1b123e68c62cd7aac146aaa2079badfd1c4a234))
- Fix `kubb studio` to check for a `kubb.config.ts` before pairing with Studio, instead of after. A
  project with no config now fails fast instead of starting a device-authorization flow it can
  never use. ([#3980](https://github.com/kubb-labs/kubb/pull/3980), [`e957267`](https://github.com/kubb-labs/kubb/commit/e9572679c1a3eb2825b742dcf7712bf1c3bc2aee))
- `kubb mcp` and `kubb validate` now load `@kubb/mcp` and `@kubb/adapter-oas` only when that
  command runs, the same as `kubb studio` already did for `@kubb/studio`. Every other command,
  including `kubb --help`, no longer touches either optional peer.
  
  Also documents `KUBB_HOME`, the env var `kubb studio` already read to relocate its stored
  credential, machine secret, and session cache away from `~/.kubb`. ([#3968](https://github.com/kubb-labs/kubb/pull/3968), [`0e4dc40`](https://github.com/kubb-labs/kubb/commit/0e4dc4073c10ae53d98b5619cd2b4fa9e2622d9f))

### @kubb/core

#### Bug Fixes

- Moved shared-utility logic used by only one package out of `@internals/utils` and into that
  package (`@kubb/core`, `@kubb/cli`, `@kubb/kit`). No public API or behavior changed. ([#3968](https://github.com/kubb-labs/kubb/pull/3968), [`0e4dc40`](https://github.com/kubb-labs/kubb/commit/0e4dc4073c10ae53d98b5619cd2b4fa9e2622d9f))

### @kubb/studio

#### Features

- New `runConnection` keeps a host connected to Studio across token changes: it opens a client,
  waits until the run ends or Studio rejects the token, and reconnects with whatever credential the
  host hands back from `onTokenRejected`. Where credentials live, whether a rejected token may be
  replaced, and how any of it is reported stay with the host.
  
  `kubb studio` runs on it now instead of keeping its own copy of that loop. Its behavior is
  unchanged. ([#3987](https://github.com/kubb-labs/kubb/pull/3987), [`09599a8`](https://github.com/kubb-labs/kubb/commit/09599a8257a6f6ca3c66c6a988ad96409015a46d))
- `createClient` now takes its permissions as one object instead of four loose flags:
  `permissions: { allowWrite, allowConfigEdit, allowInput, allowExec }`. The keys are unchanged, so a
  host moves its existing flags into the object. The new `AgentPermissions` type is exported from
  `@kubb/studio/protocol`, which is the same shape the agent sends on connect. ([#3985](https://github.com/kubb-labs/kubb/pull/3985), [`d4db58e`](https://github.com/kubb-labs/kubb/commit/d4db58e541ec0731ab6f25d24e537fb02efbfae6))
- Let a host pair as something other than the CLI.
  
  `startPairing` takes an optional `clientId` and `agentKind`. It still defaults to
  `kubb-cli`, which `kubb studio login` uses and any signed-in member can approve. A host that pairs
  shared or tier-limited infrastructure, such as the `kubblabs/kubb-agent` image, passes
  `clientId: 'kubb-agent'` and the kind it wants to register as, whose codes only an admin can
  approve.
  
  `pollForPairingToken` now surfaces the server's `error_description` when it has one, so a pairing
  refused for a reason of Studio's own, such as the organization already being at its agent limit,
  says why instead of reporting a generic expiry. ([#3970](https://github.com/kubb-labs/kubb/pull/3970), [`8d0ea41`](https://github.com/kubb-labs/kubb/commit/8d0ea41a820787cf5d1e7ac31a3904cc9a36127d))
- Let Studio change plugin options in a project's `kubb.config.ts`.
  
  A new `save` command carries a list of edits, each one a `set`, `remove`, or `add-plugin`
  `operation`. The agent patches the file's AST rather than regenerating it, so only the values an
  edit names get rewritten. Comments, formatting, and the code you wrote around the config keep their
  own text.
  
  The agent writes nothing unless the host granted `allowConfigEdit`. That permission is separate
  from `allowWrite`, which covers generated output. This one changes a file you wrote by hand, so it
  is granted on its own and never in a sandbox.
  
  The `connected` payload gains `configFile`, which lists every plugin call in the file and flags
  each option as a literal or not. Options holding a function or a reference come back
  `literal: false`, and the agent refuses to overwrite them, so Studio can disable those controls
  instead of hiding them. A config the patcher cannot address, for instance a default export that
  isn't a `defineConfig(...)` call, comes back `managed: false` and says why. ([#3971](https://github.com/kubb-labs/kubb/pull/3971), [`a1467bf`](https://github.com/kubb-labs/kubb/commit/a1467bf3351a82a76999ff6a4c5a7fc1e0b26896))
- Name every Studio WebSocket message after the side that sends it
  
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
  compatibility path for the old ones. ([#3969](https://github.com/kubb-labs/kubb/pull/3969), [`086f633`](https://github.com/kubb-labs/kubb/commit/086f633ad36637c706b439e392b124a4a30181da))
- Let Studio edit an array `defineConfig(...)` and comment a plugin out instead of deleting it.
  
  `ConfigEdit` gains a `config` field that names which entry of an array config it targets, by index
  or by the entry's `name`. Omitted, it targets the only entry, or the first one in an array. The
  `configFile` view now lists every entry as `configs`, each with its own plugins, in place of the
  single flat `plugins` list.
  
  Two new operations, `disable-plugin` and `enable-plugin`, comment a plugin call out and back in.
  The plugin's options stay on disk in the comment, so turning it back on restores them exactly, and
  an `add-plugin` right after does not have to reconstruct them.
  
  `kubb studio`'s `allowedPlugins` now unions the plugins of every config entry, not just the one it
  generates from, so adding a plugin to an entry Studio isn't generating from no longer gets refused
  on the next `generate`. ([#3971](https://github.com/kubb-labs/kubb/pull/3971), [`a1467bf`](https://github.com/kubb-labs/kubb/commit/a1467bf3351a82a76999ff6a4c5a7fc1e0b26896))
- `createClient` now accepts an `onAuthRequired` callback, fired once when Studio rejects a live
  pool's token during background reconnect, after every session in the pool has already stopped. It
  never fires for a token rejected at startup or an ordinary session expiry.
  
  `startPairing` and `pollForPairingToken` accept an optional `signal` to cancel an in-flight
  pairing or poll, rejecting with the new `PairingCanceledError`. ([#3982](https://github.com/kubb-labs/kubb/pull/3982), [`7a1d097`](https://github.com/kubb-labs/kubb/commit/7a1d0978a95faf71a9d9d3ed52c5938906d3059d))
- Add `@kubb/studio`, the client runtime that connects a Kubb project to Kubb Studio, and a
  `kubb studio` command that uses it.
  
  `kubb studio` pairs a machine by showing a code you approve in the browser (an RFC 8628 device
  authorization grant), then streams generation events over the same WebSocket relay the Docker
  agent uses. It runs against the project's own config and its own installed plugins, so no
  container and no pinned plugin set are involved.
  
  Everything is read-only by default: `--allowWrite` writes generated files, `--allowInput`
  accepts a spec from Studio, and `--allowExec` runs the formatter, the linter, and
  `output.postGenerate`. Studio can only configure plugins the local config already imports.
  
  `kubb studio login`, `kubb studio logout`, and `kubb studio status` manage the pairing. ([#3972](https://github.com/kubb-labs/kubb/pull/3972), [`0cd4c7b`](https://github.com/kubb-labs/kubb/commit/0cd4c7b5033833f9a0db2935fc25a575daecf058))

#### Bug Fixes

- Space out `kubb studio` log output with blank lines between setup, connection, and each
  command round trip, so the terminal reads as separate blocks instead of one dense run. ([#3972](https://github.com/kubb-labs/kubb/pull/3972), [`0cd4c7b`](https://github.com/kubb-labs/kubb/commit/0cd4c7b5033833f9a0db2935fc25a575daecf058))
- Studio's HTTP calls now go through `ofetch`. It handles JSON encoding and parsing, throws on a
  non-2xx status, and retries agent registration on its own, which replaces the package's own
  `HttpError` class and its hand-written retry loop.
  
  Registration now retries only what is worth retrying: a network failure or a 5xx, and no longer a
  403, which cannot succeed on a second try with the same machine token. ([#3970](https://github.com/kubb-labs/kubb/pull/3970), [`8d0ea41`](https://github.com/kubb-labs/kubb/commit/8d0ea41a820787cf5d1e7ac31a3904cc9a36127d))
- `ManagedPlugin.options` now carries each writable option's actual value, read straight off the
  `kubb.config.ts` AST, not just whether it's a literal. Studio had nothing to show for a
  `defineConfig(...)` entry it doesn't generate from, since only the entry Studio runs sent real
  option values before this. ([#3971](https://github.com/kubb-labs/kubb/pull/3971), [`a1467bf`](https://github.com/kubb-labs/kubb/commit/a1467bf3351a82a76999ff6a4c5a7fc1e0b26896))
- Fixes saving a config written as a factory with a block body:
  
  ```ts
  export default defineConfig(() => {
    return { plugins: [pluginTs()] }
  })
  ```
  
  This used to fail with `config is not an object literal`. The patcher now reads and writes the
  parsed AST instead of magicast's proxies, which also fixes configs magicast can't proxy at all
  (`defineConfig(isCI ? a : b)`, a template literal) throwing instead of returning a reason.
  
  The `connected` payload now carries the config file at `config.file` instead of a separate
  top-level `configFile`. ([#3971](https://github.com/kubb-labs/kubb/pull/3971), [`a1467bf`](https://github.com/kubb-labs/kubb/commit/a1467bf3351a82a76999ff6a4c5a7fc1e0b26896))

### kubb

#### Features

- Ship `@kubb/studio` with the `kubb` package, so `kubb studio` runs without a second install.
  
  It stays an optional peer of `@kubb/cli`, the same shape `@kubb/mcp` has, so installing the CLI on
  its own still leaves the choice open. What changes is the `kubb` meta package, which now depends on
  it and satisfies that peer for everyone who installs `kubb`.
  
  The runtime still loads only when the command runs, so `kubb --help` and `kubb generate` never
  touch it. ([#3977](https://github.com/kubb-labs/kubb/pull/3977), [`1d53261`](https://github.com/kubb-labs/kubb/commit/1d532611f92b7b1922dc36fd15b8cd4fa7a5d6ff))

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
