# @kubb/agent

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
