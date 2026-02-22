# @kubb/agent

## 4.27.2

### Patch Changes

- [#2545](https://github.com/kubb-labs/kubb/pull/2545) [`1e9e020`](https://github.com/kubb-labs/kubb/commit/1e9e020b96d9e1c1bb36b71e7ba31184164848e4) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Replace dynamic `await import()` calls in `resolvePlugins` with static imports for all supported kubb plugins.

- Updated dependencies []:
  - @kubb/core@4.27.2
  - @kubb/plugin-client@4.27.2
  - @kubb/plugin-cypress@4.27.2
  - @kubb/plugin-faker@4.27.2
  - @kubb/plugin-mcp@4.27.2
  - @kubb/plugin-msw@4.27.2
  - @kubb/plugin-oas@4.27.2
  - @kubb/plugin-react-query@4.27.2
  - @kubb/plugin-redoc@4.27.2
  - @kubb/plugin-solid-query@4.27.2
  - @kubb/plugin-svelte-query@4.27.2
  - @kubb/plugin-swr@4.27.2
  - @kubb/plugin-ts@4.27.2
  - @kubb/plugin-vue-query@4.27.2
  - @kubb/plugin-zod@4.27.2

## 4.27.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.27.1
  - @kubb/plugin-client@4.27.1
  - @kubb/plugin-cypress@4.27.1
  - @kubb/plugin-faker@4.27.1
  - @kubb/plugin-mcp@4.27.1
  - @kubb/plugin-msw@4.27.1
  - @kubb/plugin-oas@4.27.1
  - @kubb/plugin-react-query@4.27.1
  - @kubb/plugin-redoc@4.27.1
  - @kubb/plugin-solid-query@4.27.1
  - @kubb/plugin-svelte-query@4.27.1
  - @kubb/plugin-swr@4.27.1
  - @kubb/plugin-ts@4.27.1
  - @kubb/plugin-vue-query@4.27.1
  - @kubb/plugin-zod@4.27.1

## 4.27.0

### Minor Changes

- [#2536](https://github.com/kubb-labs/kubb/pull/2536) [`bd0feb0`](https://github.com/kubb-labs/kubb/commit/bd0feb0872255852f324e30f046e29a74ccf99b1) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `--allow-write` and `--allow-all` CLI flags (and corresponding `KUBB_ALLOW_WRITE` / `KUBB_ALLOW_ALL` env variables) to `kubb agent start`.
  - `--allow-write` / `KUBB_ALLOW_WRITE=true` – opt-in to writing generated files to the filesystem. When not set, the kubb config runs with `output.write: false` and the Studio config patch is not persisted.
  - `--allow-all` / `KUBB_ALLOW_ALL=true` – grant all permissions; implies `--allow-write`.

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.27.0
  - @kubb/plugin-client@4.27.0
  - @kubb/plugin-cypress@4.27.0
  - @kubb/plugin-faker@4.27.0
  - @kubb/plugin-msw@4.27.0
  - @kubb/plugin-oas@4.27.0
  - @kubb/plugin-react-query@4.27.0
  - @kubb/plugin-redoc@4.27.0
  - @kubb/plugin-solid-query@4.27.0
  - @kubb/plugin-svelte-query@4.27.0
  - @kubb/plugin-swr@4.27.0
  - @kubb/plugin-ts@4.27.0
  - @kubb/plugin-vue-query@4.27.0
  - @kubb/plugin-zod@4.27.0

## 4.26.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.26.1

## 4.26.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.26.0

## 4.25.2

### Patch Changes

- [`bc04350`](https://github.com/kubb-labs/kubb/commit/bc04350926cf552f959a12b48acc90bda825a425) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use of ws to support node 20

- Updated dependencies []:
  - @kubb/core@4.25.2

## 4.25.1

### Patch Changes

- [`8a295d7`](https://github.com/kubb-labs/kubb/commit/8a295d7481e386f3689d8e0d698f91c0282907a3) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Correct use of jiti (dynamic import of babel cannot be used in nitro)

- Updated dependencies []:
  - @kubb/core@4.25.1

## 4.25.0

### Minor Changes

- [#2484](https://github.com/kubb-labs/kubb/pull/2484) [`3b8136a`](https://github.com/kubb-labs/kubb/commit/3b8136aa713a336ff5bc5c2d1b105ba4299eec2b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - WebSocket integration for Kubb Studio connectivity

  Add bidirectional WebSocket communication between Kubb Agent and Kubb Studio. The agent now automatically connects to Studio on startup when `KUBB_STUDIO_URL` and `KUBB_AGENT_TOKEN` environment variables are set.

  Features:
  - Persistent WebSocket connection with automatic reconnection
  - Real-time streaming of generation events to Studio
  - Command handling for `generate` and `connect` commands from Studio
  - Session caching for faster reconnects (24-hour expiration)
  - Graceful shutdown with disconnect notifications
  - SHA-512 token hashing for secure session storage
  - Configurable retry intervals with keep-alive pings

  See the [@kubb/agent documentation](/packages/agent/README.md) for setup and usage details.

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.25.0

## 4.24.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.24.1

## 4.24.0

### Minor Changes

- [#2481](https://github.com/kubb-labs/kubb/pull/2481) [`2daf389`](https://github.com/kubb-labs/kubb/commit/2daf389856c5270b8676f3605d74467620700bc9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add Agent server package with HTTP-based code generation capabilities and new `kubb agent start` command for running an HTTP server.

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.24.0
