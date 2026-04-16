# @kubb/agent

## 5.0.0-alpha.35

### Patch Changes

- [#3024](https://github.com/kubb-labs/kubb/pull/3024) [`25db26e`](https://github.com/kubb-labs/kubb/commit/25db26eb9a91ab8e43f83df8b94a912067e46ce5) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - ## Prefix all `KubbEvents` event names with `kubb:`

  All event names in the `KubbEvents` interface are now namespaced with the `kubb:` prefix to avoid naming collisions and make the event origin explicit.

  ### Breaking change

  Update all `events.on(...)`, `events.emit(...)`, `events.off(...)`, and `events.once(...)` calls to use the new prefixed event names.

  **Before:**

  ```ts
  events.on('plugin:end', (plugin, { duration }) => { ... })
  events.on('error', (error) => { ... })
  events.on('generation:start', (config) => { ... })
  ```

  **After:**

  ```ts
  events.on('kubb:plugin:end', (plugin, { duration }) => { ... })
  events.on('kubb:error', (error) => { ... })
  events.on('kubb:generation:start', (config) => { ... })
  ```

  ### Full list of renamed events

  | Before                          | After                                |
  | ------------------------------- | ------------------------------------ |
  | `lifecycle:start`               | `kubb:lifecycle:start`               |
  | `lifecycle:end`                 | `kubb:lifecycle:end`                 |
  | `config:start`                  | `kubb:config:start`                  |
  | `config:end`                    | `kubb:config:end`                    |
  | `generation:start`              | `kubb:generation:start`              |
  | `generation:end`                | `kubb:generation:end`                |
  | `generation:summary`            | `kubb:generation:summary`            |
  | `format:start`                  | `kubb:format:start`                  |
  | `format:end`                    | `kubb:format:end`                    |
  | `lint:start`                    | `kubb:lint:start`                    |
  | `lint:end`                      | `kubb:lint:end`                      |
  | `hooks:start`                   | `kubb:hooks:start`                   |
  | `hooks:end`                     | `kubb:hooks:end`                     |
  | `hook:start`                    | `kubb:hook:start`                    |
  | `hook:end`                      | `kubb:hook:end`                      |
  | `version:new`                   | `kubb:version:new`                   |
  | `info`                          | `kubb:info`                          |
  | `error`                         | `kubb:error`                         |
  | `success`                       | `kubb:success`                       |
  | `warn`                          | `kubb:warn`                          |
  | `debug`                         | `kubb:debug`                         |
  | `files:processing:start`        | `kubb:files:processing:start`        |
  | `files:processing:end`          | `kubb:files:processing:end`          |
  | `file:processing:update`        | `kubb:file:processing:update`        |
  | `plugin:start`                  | `kubb:plugin:start`                  |
  | `plugin:end`                    | `kubb:plugin:end`                    |
  | `plugins:hook:progress:start`   | `kubb:plugins:hook:progress:start`   |
  | `plugins:hook:progress:end`     | `kubb:plugins:hook:progress:end`     |
  | `plugins:hook:processing:start` | `kubb:plugins:hook:processing:start` |
  | `plugins:hook:processing:end`   | `kubb:plugins:hook:processing:end`   |

- [#3043](https://github.com/kubb-labs/kubb/pull/3043) [`e877926`](https://github.com/kubb-labs/kubb/commit/e877926222b4e3d56c7ccf07caaf7cdaba71bcd6) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Rename `KubbEvents` to `KubbHooks` and adopt `hooks` as the preferred emitter field.
  - `KubbEvents` is now `KubbHooks` in `@kubb/core`.
  - `driver.hooks` is now the primary emitter API.
  - Build/setup options now prefer `hooks` (`events` is kept as a deprecated alias for compatibility).

- Updated dependencies [[`c8a1efb`](https://github.com/kubb-labs/kubb/commit/c8a1efb4e71d475eb383a93ebf02da9afda33f79), [`25db26e`](https://github.com/kubb-labs/kubb/commit/25db26eb9a91ab8e43f83df8b94a912067e46ce5), [`964067f`](https://github.com/kubb-labs/kubb/commit/964067ff1a21713af2b2c86795ff2ec59a12d0d6), [`e877926`](https://github.com/kubb-labs/kubb/commit/e877926222b4e3d56c7ccf07caaf7cdaba71bcd6)]:
  - @kubb/core@5.0.0-alpha.35
  - @kubb/plugin-oas@5.0.0-alpha.35
  - @kubb/plugin-client@5.0.0-alpha.35
  - @kubb/plugin-cypress@5.0.0-alpha.35
  - @kubb/plugin-faker@5.0.0-alpha.35
  - @kubb/plugin-mcp@5.0.0-alpha.35
  - @kubb/plugin-msw@5.0.0-alpha.35
  - @kubb/plugin-react-query@5.0.0-alpha.35
  - @kubb/plugin-solid-query@5.0.0-alpha.35
  - @kubb/plugin-svelte-query@5.0.0-alpha.35
  - @kubb/plugin-swr@5.0.0-alpha.35
  - @kubb/plugin-vue-query@5.0.0-alpha.35
  - @kubb/adapter-oas@5.0.0-alpha.35
  - @kubb/parser-ts@5.0.0-alpha.35
  - @kubb/plugin-redoc@5.0.0-alpha.35
  - @kubb/plugin-ts@5.0.0-alpha.35
  - @kubb/plugin-zod@5.0.0-alpha.35
  - @kubb/ast@5.0.0-alpha.35

## 5.0.0-alpha.34

### Patch Changes

- Updated dependencies [[`f5099b8`](https://github.com/kubb-labs/kubb/commit/f5099b87f8cf603e70bc15568af2c80f2883661b)]:
  - @kubb/plugin-mcp@5.0.0-alpha.34
  - @kubb/adapter-oas@5.0.0-alpha.34
  - @kubb/ast@5.0.0-alpha.34
  - @kubb/core@5.0.0-alpha.34
  - @kubb/parser-ts@5.0.0-alpha.34
  - @kubb/plugin-client@5.0.0-alpha.34
  - @kubb/plugin-cypress@5.0.0-alpha.34
  - @kubb/plugin-faker@5.0.0-alpha.34
  - @kubb/plugin-msw@5.0.0-alpha.34
  - @kubb/plugin-oas@5.0.0-alpha.34
  - @kubb/plugin-react-query@5.0.0-alpha.34
  - @kubb/plugin-redoc@5.0.0-alpha.34
  - @kubb/plugin-solid-query@5.0.0-alpha.34
  - @kubb/plugin-svelte-query@5.0.0-alpha.34
  - @kubb/plugin-swr@5.0.0-alpha.34
  - @kubb/plugin-ts@5.0.0-alpha.34
  - @kubb/plugin-vue-query@5.0.0-alpha.34
  - @kubb/plugin-zod@5.0.0-alpha.34

## 5.0.0-alpha.33

### Patch Changes

- Updated dependencies [[`3ac7d1f`](https://github.com/kubb-labs/kubb/commit/3ac7d1f9b75099bfe793e35152e5c322e65aa6ad), [`9e6a772`](https://github.com/kubb-labs/kubb/commit/9e6a772c7ca1ee54e931d2dbf0f2448f67707c0e)]:
  - @kubb/core@5.0.0-alpha.33
  - @kubb/adapter-oas@5.0.0-alpha.33
  - @kubb/parser-ts@5.0.0-alpha.33
  - @kubb/plugin-client@5.0.0-alpha.33
  - @kubb/plugin-cypress@5.0.0-alpha.33
  - @kubb/plugin-faker@5.0.0-alpha.33
  - @kubb/plugin-mcp@5.0.0-alpha.33
  - @kubb/plugin-msw@5.0.0-alpha.33
  - @kubb/plugin-oas@5.0.0-alpha.33
  - @kubb/plugin-react-query@5.0.0-alpha.33
  - @kubb/plugin-redoc@5.0.0-alpha.33
  - @kubb/plugin-solid-query@5.0.0-alpha.33
  - @kubb/plugin-svelte-query@5.0.0-alpha.33
  - @kubb/plugin-swr@5.0.0-alpha.33
  - @kubb/plugin-ts@5.0.0-alpha.33
  - @kubb/plugin-vue-query@5.0.0-alpha.33
  - @kubb/plugin-zod@5.0.0-alpha.33
  - @kubb/ast@5.0.0-alpha.33

## 5.0.0-alpha.32

### Patch Changes

- Updated dependencies [[`6c6d2b6`](https://github.com/kubb-labs/kubb/commit/6c6d2b6b9f0dcfc7826cf9000ed835f274a6a7af)]:
  - @kubb/ast@5.0.0-alpha.32
  - @kubb/plugin-ts@5.0.0-alpha.32
  - @kubb/plugin-client@5.0.0-alpha.32
  - @kubb/plugin-cypress@5.0.0-alpha.32
  - @kubb/adapter-oas@5.0.0-alpha.32
  - @kubb/core@5.0.0-alpha.32
  - @kubb/parser-ts@5.0.0-alpha.32
  - @kubb/plugin-mcp@5.0.0-alpha.32
  - @kubb/plugin-oas@5.0.0-alpha.32
  - @kubb/plugin-react-query@5.0.0-alpha.32
  - @kubb/plugin-redoc@5.0.0-alpha.32
  - @kubb/plugin-solid-query@5.0.0-alpha.32
  - @kubb/plugin-svelte-query@5.0.0-alpha.32
  - @kubb/plugin-swr@5.0.0-alpha.32
  - @kubb/plugin-vue-query@5.0.0-alpha.32
  - @kubb/plugin-zod@5.0.0-alpha.32
  - @kubb/plugin-faker@5.0.0-alpha.32
  - @kubb/plugin-msw@5.0.0-alpha.32

## 5.0.0-alpha.31

### Patch Changes

- Updated dependencies [[`6c49d8d`](https://github.com/kubb-labs/kubb/commit/6c49d8d02d7c4bf5341fb6f0114f6aa2ee735e1e)]:
  - @kubb/core@5.0.0-alpha.31
  - @kubb/adapter-oas@5.0.0-alpha.31
  - @kubb/parser-ts@5.0.0-alpha.31
  - @kubb/plugin-client@5.0.0-alpha.31
  - @kubb/plugin-cypress@5.0.0-alpha.31
  - @kubb/plugin-faker@5.0.0-alpha.31
  - @kubb/plugin-mcp@5.0.0-alpha.31
  - @kubb/plugin-msw@5.0.0-alpha.31
  - @kubb/plugin-oas@5.0.0-alpha.31
  - @kubb/plugin-react-query@5.0.0-alpha.31
  - @kubb/plugin-redoc@5.0.0-alpha.31
  - @kubb/plugin-solid-query@5.0.0-alpha.31
  - @kubb/plugin-svelte-query@5.0.0-alpha.31
  - @kubb/plugin-swr@5.0.0-alpha.31
  - @kubb/plugin-ts@5.0.0-alpha.31
  - @kubb/plugin-vue-query@5.0.0-alpha.31
  - @kubb/plugin-zod@5.0.0-alpha.31

## 5.0.0-alpha.30

### Patch Changes

- Updated dependencies [[`e2bc27f`](https://github.com/kubb-labs/kubb/commit/e2bc27f59382a0771c08774933f70c5316636bd7)]:
  - @kubb/core@5.0.0-alpha.30
  - @kubb/plugin-ts@5.0.0-alpha.30
  - @kubb/plugin-zod@5.0.0-alpha.30
  - @kubb/plugin-client@5.0.0-alpha.30
  - @kubb/plugin-cypress@5.0.0-alpha.30
  - @kubb/plugin-mcp@5.0.0-alpha.30
  - @kubb/plugin-redoc@5.0.0-alpha.30
  - @kubb/plugin-faker@5.0.0-alpha.30
  - @kubb/plugin-msw@5.0.0-alpha.30
  - @kubb/plugin-react-query@5.0.0-alpha.30
  - @kubb/plugin-solid-query@5.0.0-alpha.30
  - @kubb/plugin-svelte-query@5.0.0-alpha.30
  - @kubb/plugin-vue-query@5.0.0-alpha.30
  - @kubb/plugin-swr@5.0.0-alpha.30
  - @kubb/plugin-oas@5.0.0-alpha.30

## 5.0.0-alpha.29

### Patch Changes

- Updated dependencies [[`62551ae`](https://github.com/kubb-labs/kubb/commit/62551ae7de327e2a502e5365d5bf56ecb8f21b47)]:
  - @kubb/plugin-client@5.0.0-alpha.29
  - @kubb/plugin-mcp@5.0.0-alpha.29
  - @kubb/plugin-react-query@5.0.0-alpha.29
  - @kubb/plugin-solid-query@5.0.0-alpha.29
  - @kubb/plugin-svelte-query@5.0.0-alpha.29
  - @kubb/plugin-swr@5.0.0-alpha.29
  - @kubb/plugin-vue-query@5.0.0-alpha.29
  - @kubb/core@5.0.0-alpha.29
  - @kubb/plugin-cypress@5.0.0-alpha.29
  - @kubb/plugin-faker@5.0.0-alpha.29
  - @kubb/plugin-msw@5.0.0-alpha.29
  - @kubb/plugin-oas@5.0.0-alpha.29
  - @kubb/plugin-redoc@5.0.0-alpha.29
  - @kubb/plugin-ts@5.0.0-alpha.29
  - @kubb/plugin-zod@5.0.0-alpha.29

## 5.0.0-alpha.28

### Patch Changes

- Updated dependencies [[`d46e725`](https://github.com/kubb-labs/kubb/commit/d46e7255c2419e412ace2e090205d552a885c6ca)]:
  - @kubb/plugin-mcp@5.0.0-alpha.28
  - @kubb/plugin-ts@5.0.0-alpha.28
  - @kubb/plugin-client@5.0.0-alpha.28
  - @kubb/plugin-cypress@5.0.0-alpha.28
  - @kubb/plugin-faker@5.0.0-alpha.28
  - @kubb/plugin-msw@5.0.0-alpha.28
  - @kubb/plugin-react-query@5.0.0-alpha.28
  - @kubb/plugin-solid-query@5.0.0-alpha.28
  - @kubb/plugin-svelte-query@5.0.0-alpha.28
  - @kubb/plugin-swr@5.0.0-alpha.28
  - @kubb/plugin-vue-query@5.0.0-alpha.28
  - @kubb/core@5.0.0-alpha.28
  - @kubb/plugin-oas@5.0.0-alpha.28
  - @kubb/plugin-redoc@5.0.0-alpha.28
  - @kubb/plugin-zod@5.0.0-alpha.28

## 5.0.0-alpha.27

### Patch Changes

- Updated dependencies [[`795cac8`](https://github.com/kubb-labs/kubb/commit/795cac8edd6dd456185b7da90db9fd422c2b8330)]:
  - @kubb/core@5.0.0-alpha.27
  - @kubb/plugin-ts@5.0.0-alpha.27
  - @kubb/plugin-zod@5.0.0-alpha.27
  - @kubb/plugin-cypress@5.0.0-alpha.27
  - @kubb/plugin-client@5.0.0-alpha.27
  - @kubb/plugin-faker@5.0.0-alpha.27
  - @kubb/plugin-mcp@5.0.0-alpha.27
  - @kubb/plugin-msw@5.0.0-alpha.27
  - @kubb/plugin-oas@5.0.0-alpha.27
  - @kubb/plugin-react-query@5.0.0-alpha.27
  - @kubb/plugin-redoc@5.0.0-alpha.27
  - @kubb/plugin-solid-query@5.0.0-alpha.27
  - @kubb/plugin-svelte-query@5.0.0-alpha.27
  - @kubb/plugin-swr@5.0.0-alpha.27
  - @kubb/plugin-vue-query@5.0.0-alpha.27

## 5.0.0-alpha.26

### Patch Changes

- Updated dependencies [[`035a2ea`](https://github.com/kubb-labs/kubb/commit/035a2ea01b88246c8642fead92029a955599f9cd)]:
  - @kubb/plugin-client@5.0.0-alpha.26
  - @kubb/plugin-mcp@5.0.0-alpha.26
  - @kubb/plugin-react-query@5.0.0-alpha.26
  - @kubb/plugin-solid-query@5.0.0-alpha.26
  - @kubb/plugin-svelte-query@5.0.0-alpha.26
  - @kubb/plugin-swr@5.0.0-alpha.26
  - @kubb/plugin-vue-query@5.0.0-alpha.26
  - @kubb/core@5.0.0-alpha.26
  - @kubb/plugin-cypress@5.0.0-alpha.26
  - @kubb/plugin-faker@5.0.0-alpha.26
  - @kubb/plugin-msw@5.0.0-alpha.26
  - @kubb/plugin-oas@5.0.0-alpha.26
  - @kubb/plugin-redoc@5.0.0-alpha.26
  - @kubb/plugin-ts@5.0.0-alpha.26
  - @kubb/plugin-zod@5.0.0-alpha.26

## 5.0.0-alpha.25

### Patch Changes

- Updated dependencies [[`7b34c72`](https://github.com/kubb-labs/kubb/commit/7b34c7255a51ea0ababe6ca285703287193e702c), [`c1e9257`](https://github.com/kubb-labs/kubb/commit/c1e92572c04cf82ddb4df2e9e72e1551287a21fa)]:
  - @kubb/plugin-zod@5.0.0-alpha.25
  - @kubb/core@5.0.0-alpha.25
  - @kubb/plugin-ts@5.0.0-alpha.25
  - @kubb/plugin-cypress@5.0.0-alpha.25
  - @kubb/plugin-client@5.0.0-alpha.25
  - @kubb/plugin-mcp@5.0.0-alpha.25
  - @kubb/plugin-react-query@5.0.0-alpha.25
  - @kubb/plugin-solid-query@5.0.0-alpha.25
  - @kubb/plugin-svelte-query@5.0.0-alpha.25
  - @kubb/plugin-swr@5.0.0-alpha.25
  - @kubb/plugin-vue-query@5.0.0-alpha.25
  - @kubb/plugin-faker@5.0.0-alpha.25
  - @kubb/plugin-msw@5.0.0-alpha.25
  - @kubb/plugin-oas@5.0.0-alpha.25
  - @kubb/plugin-redoc@5.0.0-alpha.25

## 5.0.0-alpha.24

### Patch Changes

- Updated dependencies [[`1813534`](https://github.com/kubb-labs/kubb/commit/1813534973ef7fe257d86b01f2223a765cd7c83f)]:
  - @kubb/plugin-cypress@5.0.0-alpha.24
  - @kubb/core@5.0.0-alpha.24
  - @kubb/plugin-client@5.0.0-alpha.24
  - @kubb/plugin-faker@5.0.0-alpha.24
  - @kubb/plugin-mcp@5.0.0-alpha.24
  - @kubb/plugin-msw@5.0.0-alpha.24
  - @kubb/plugin-oas@5.0.0-alpha.24
  - @kubb/plugin-react-query@5.0.0-alpha.24
  - @kubb/plugin-redoc@5.0.0-alpha.24
  - @kubb/plugin-solid-query@5.0.0-alpha.24
  - @kubb/plugin-svelte-query@5.0.0-alpha.24
  - @kubb/plugin-swr@5.0.0-alpha.24
  - @kubb/plugin-ts@5.0.0-alpha.24
  - @kubb/plugin-vue-query@5.0.0-alpha.24
  - @kubb/plugin-zod@5.0.0-alpha.24

## 5.0.0-alpha.23

### Patch Changes

- Updated dependencies [[`8cfa19a`](https://github.com/kubb-labs/kubb/commit/8cfa19adbe681d4466f0ff97a8c14ece8ba1e5d8)]:
  - @kubb/plugin-ts@5.0.0-alpha.23
  - @kubb/core@5.0.0-alpha.23
  - @kubb/plugin-client@5.0.0-alpha.23
  - @kubb/plugin-cypress@5.0.0-alpha.23
  - @kubb/plugin-faker@5.0.0-alpha.23
  - @kubb/plugin-mcp@5.0.0-alpha.23
  - @kubb/plugin-msw@5.0.0-alpha.23
  - @kubb/plugin-react-query@5.0.0-alpha.23
  - @kubb/plugin-solid-query@5.0.0-alpha.23
  - @kubb/plugin-svelte-query@5.0.0-alpha.23
  - @kubb/plugin-swr@5.0.0-alpha.23
  - @kubb/plugin-vue-query@5.0.0-alpha.23
  - @kubb/plugin-zod@5.0.0-alpha.23
  - @kubb/plugin-redoc@5.0.0-alpha.23
  - @kubb/plugin-oas@5.0.0-alpha.23

## 5.0.0-alpha.22

### Patch Changes

- Updated dependencies [[`1792af2`](https://github.com/kubb-labs/kubb/commit/1792af257ef9c7399959319aa4be28a46cb730fe)]:
  - @kubb/plugin-ts@5.0.0-alpha.22
  - @kubb/plugin-client@5.0.0-alpha.22
  - @kubb/plugin-cypress@5.0.0-alpha.22
  - @kubb/plugin-faker@5.0.0-alpha.22
  - @kubb/plugin-mcp@5.0.0-alpha.22
  - @kubb/plugin-msw@5.0.0-alpha.22
  - @kubb/plugin-react-query@5.0.0-alpha.22
  - @kubb/plugin-solid-query@5.0.0-alpha.22
  - @kubb/plugin-svelte-query@5.0.0-alpha.22
  - @kubb/plugin-swr@5.0.0-alpha.22
  - @kubb/plugin-vue-query@5.0.0-alpha.22
  - @kubb/plugin-zod@5.0.0-alpha.22
  - @kubb/core@5.0.0-alpha.22
  - @kubb/plugin-oas@5.0.0-alpha.22
  - @kubb/plugin-redoc@5.0.0-alpha.22

## 5.0.0-alpha.21

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.21
  - @kubb/plugin-client@5.0.0-alpha.21
  - @kubb/plugin-cypress@5.0.0-alpha.21
  - @kubb/plugin-faker@5.0.0-alpha.21
  - @kubb/plugin-mcp@5.0.0-alpha.21
  - @kubb/plugin-msw@5.0.0-alpha.21
  - @kubb/plugin-oas@5.0.0-alpha.21
  - @kubb/plugin-react-query@5.0.0-alpha.21
  - @kubb/plugin-redoc@5.0.0-alpha.21
  - @kubb/plugin-solid-query@5.0.0-alpha.21
  - @kubb/plugin-svelte-query@5.0.0-alpha.21
  - @kubb/plugin-swr@5.0.0-alpha.21
  - @kubb/plugin-ts@5.0.0-alpha.21
  - @kubb/plugin-vue-query@5.0.0-alpha.21
  - @kubb/plugin-zod@5.0.0-alpha.21

## 5.0.0-alpha.20

### Patch Changes

- Updated dependencies [[`f596e47`](https://github.com/kubb-labs/kubb/commit/f596e47e353c18ef11c4531acd12641c52c00435)]:
  - @kubb/core@5.0.0-alpha.20
  - @kubb/plugin-redoc@5.0.0-alpha.20
  - @kubb/plugin-client@5.0.0-alpha.20
  - @kubb/plugin-cypress@5.0.0-alpha.20
  - @kubb/plugin-faker@5.0.0-alpha.20
  - @kubb/plugin-mcp@5.0.0-alpha.20
  - @kubb/plugin-msw@5.0.0-alpha.20
  - @kubb/plugin-oas@5.0.0-alpha.20
  - @kubb/plugin-react-query@5.0.0-alpha.20
  - @kubb/plugin-solid-query@5.0.0-alpha.20
  - @kubb/plugin-svelte-query@5.0.0-alpha.20
  - @kubb/plugin-swr@5.0.0-alpha.20
  - @kubb/plugin-ts@5.0.0-alpha.20
  - @kubb/plugin-vue-query@5.0.0-alpha.20
  - @kubb/plugin-zod@5.0.0-alpha.20

## 5.0.0-alpha.19

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.19
  - @kubb/plugin-client@5.0.0-alpha.19
  - @kubb/plugin-cypress@5.0.0-alpha.19
  - @kubb/plugin-faker@5.0.0-alpha.19
  - @kubb/plugin-mcp@5.0.0-alpha.19
  - @kubb/plugin-msw@5.0.0-alpha.19
  - @kubb/plugin-oas@5.0.0-alpha.19
  - @kubb/plugin-react-query@5.0.0-alpha.19
  - @kubb/plugin-redoc@5.0.0-alpha.19
  - @kubb/plugin-solid-query@5.0.0-alpha.19
  - @kubb/plugin-svelte-query@5.0.0-alpha.19
  - @kubb/plugin-swr@5.0.0-alpha.19
  - @kubb/plugin-ts@5.0.0-alpha.19
  - @kubb/plugin-vue-query@5.0.0-alpha.19
  - @kubb/plugin-zod@5.0.0-alpha.19

## 5.0.0-alpha.18

### Minor Changes

- [#2893](https://github.com/kubb-labs/kubb/pull/2893) [`fa7f554`](https://github.com/kubb-labs/kubb/commit/fa7f55423e9d81773a2f168954bf682a866de65c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Update to TypeScript v6

### Patch Changes

- Updated dependencies [[`fa7f554`](https://github.com/kubb-labs/kubb/commit/fa7f55423e9d81773a2f168954bf682a866de65c)]:
  - @kubb/plugin-svelte-query@5.0.0-alpha.18
  - @kubb/plugin-react-query@5.0.0-alpha.18
  - @kubb/plugin-solid-query@5.0.0-alpha.18
  - @kubb/plugin-vue-query@5.0.0-alpha.18
  - @kubb/plugin-client@5.0.0-alpha.18
  - @kubb/plugin-redoc@5.0.0-alpha.18
  - @kubb/plugin-oas@5.0.0-alpha.18
  - @kubb/plugin-swr@5.0.0-alpha.18
  - @kubb/plugin-ts@5.0.0-alpha.18
  - @kubb/core@5.0.0-alpha.18
  - @kubb/plugin-mcp@5.0.0-alpha.18
  - @kubb/plugin-cypress@5.0.0-alpha.18
  - @kubb/plugin-faker@5.0.0-alpha.18
  - @kubb/plugin-msw@5.0.0-alpha.18
  - @kubb/plugin-zod@5.0.0-alpha.18

## 5.0.0-alpha.17

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.17
  - @kubb/plugin-ts@5.0.0-alpha.17
  - @kubb/plugin-client@5.0.0-alpha.17
  - @kubb/plugin-cypress@5.0.0-alpha.17
  - @kubb/plugin-faker@5.0.0-alpha.17
  - @kubb/plugin-mcp@5.0.0-alpha.17
  - @kubb/plugin-msw@5.0.0-alpha.17
  - @kubb/plugin-oas@5.0.0-alpha.17
  - @kubb/plugin-react-query@5.0.0-alpha.17
  - @kubb/plugin-redoc@5.0.0-alpha.17
  - @kubb/plugin-solid-query@5.0.0-alpha.17
  - @kubb/plugin-svelte-query@5.0.0-alpha.17
  - @kubb/plugin-swr@5.0.0-alpha.17
  - @kubb/plugin-vue-query@5.0.0-alpha.17
  - @kubb/plugin-zod@5.0.0-alpha.17

## 5.0.0-alpha.16

### Patch Changes

- Updated dependencies [[`f1b2596`](https://github.com/kubb-labs/kubb/commit/f1b2596a36adc73de6aeea6f0843786dfc630426)]:
  - @kubb/plugin-ts@5.0.0-alpha.16
  - @kubb/plugin-client@5.0.0-alpha.16
  - @kubb/plugin-cypress@5.0.0-alpha.16
  - @kubb/plugin-faker@5.0.0-alpha.16
  - @kubb/plugin-mcp@5.0.0-alpha.16
  - @kubb/plugin-msw@5.0.0-alpha.16
  - @kubb/plugin-react-query@5.0.0-alpha.16
  - @kubb/plugin-solid-query@5.0.0-alpha.16
  - @kubb/plugin-svelte-query@5.0.0-alpha.16
  - @kubb/plugin-swr@5.0.0-alpha.16
  - @kubb/plugin-vue-query@5.0.0-alpha.16
  - @kubb/plugin-zod@5.0.0-alpha.16
  - @kubb/core@5.0.0-alpha.16
  - @kubb/plugin-oas@5.0.0-alpha.16
  - @kubb/plugin-redoc@5.0.0-alpha.16

## 5.0.0-alpha.15

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.15
  - @kubb/plugin-client@5.0.0-alpha.15
  - @kubb/plugin-cypress@5.0.0-alpha.15
  - @kubb/plugin-faker@5.0.0-alpha.15
  - @kubb/plugin-mcp@5.0.0-alpha.15
  - @kubb/plugin-msw@5.0.0-alpha.15
  - @kubb/plugin-oas@5.0.0-alpha.15
  - @kubb/plugin-react-query@5.0.0-alpha.15
  - @kubb/plugin-redoc@5.0.0-alpha.15
  - @kubb/plugin-solid-query@5.0.0-alpha.15
  - @kubb/plugin-svelte-query@5.0.0-alpha.15
  - @kubb/plugin-swr@5.0.0-alpha.15
  - @kubb/plugin-ts@5.0.0-alpha.15
  - @kubb/plugin-vue-query@5.0.0-alpha.15
  - @kubb/plugin-zod@5.0.0-alpha.15

## 5.0.0-alpha.14

### Patch Changes

- Updated dependencies [[`591977c`](https://github.com/kubb-labs/kubb/commit/591977c5c2f167736d6e43126ed0387a1e5e0ce5)]:
  - @kubb/core@5.0.0-alpha.14
  - @kubb/plugin-ts@5.0.0-alpha.14
  - @kubb/plugin-client@5.0.0-alpha.14
  - @kubb/plugin-cypress@5.0.0-alpha.14
  - @kubb/plugin-faker@5.0.0-alpha.14
  - @kubb/plugin-mcp@5.0.0-alpha.14
  - @kubb/plugin-msw@5.0.0-alpha.14
  - @kubb/plugin-oas@5.0.0-alpha.14
  - @kubb/plugin-react-query@5.0.0-alpha.14
  - @kubb/plugin-redoc@5.0.0-alpha.14
  - @kubb/plugin-solid-query@5.0.0-alpha.14
  - @kubb/plugin-svelte-query@5.0.0-alpha.14
  - @kubb/plugin-swr@5.0.0-alpha.14
  - @kubb/plugin-vue-query@5.0.0-alpha.14
  - @kubb/plugin-zod@5.0.0-alpha.14

## 5.0.0-alpha.13

### Patch Changes

- Updated dependencies [[`975717e`](https://github.com/kubb-labs/kubb/commit/975717e2c8cf8d33f5d9d641be4bb164fd36f423), [`b5d83e2`](https://github.com/kubb-labs/kubb/commit/b5d83e2a2c8a325f953b9e353bdb1b730dbdd305), [`33d0507`](https://github.com/kubb-labs/kubb/commit/33d050714fa24ae6aa1042a8aa12fc4925399007), [`ed7a2cb`](https://github.com/kubb-labs/kubb/commit/ed7a2cb6d008e880a955e8fefc1eee6859c06240), [`68a3bdd`](https://github.com/kubb-labs/kubb/commit/68a3bdd2eb85b3bd78e278ba9e4a0b691b580c7e), [`9968516`](https://github.com/kubb-labs/kubb/commit/99685169dc85f4f23fae6af0872dbd2f13e8012e)]:
  - @kubb/plugin-ts@5.0.0-alpha.13
  - @kubb/core@5.0.0-alpha.13
  - @kubb/plugin-client@5.0.0-alpha.13
  - @kubb/plugin-cypress@5.0.0-alpha.13
  - @kubb/plugin-faker@5.0.0-alpha.13
  - @kubb/plugin-mcp@5.0.0-alpha.13
  - @kubb/plugin-msw@5.0.0-alpha.13
  - @kubb/plugin-react-query@5.0.0-alpha.13
  - @kubb/plugin-solid-query@5.0.0-alpha.13
  - @kubb/plugin-svelte-query@5.0.0-alpha.13
  - @kubb/plugin-swr@5.0.0-alpha.13
  - @kubb/plugin-vue-query@5.0.0-alpha.13
  - @kubb/plugin-zod@5.0.0-alpha.13
  - @kubb/plugin-oas@5.0.0-alpha.13
  - @kubb/plugin-redoc@5.0.0-alpha.13

## 5.0.0-alpha.12

### Patch Changes

- Updated dependencies [[`d97bf00`](https://github.com/kubb-labs/kubb/commit/d97bf007db4fa3a5341463dab0e891afeaf82fff), [`ebe0774`](https://github.com/kubb-labs/kubb/commit/ebe07749c5e3ef16d0e53daf11dd3954a582216b), [`f4105fe`](https://github.com/kubb-labs/kubb/commit/f4105fe44e46ec2846e665fd6079290e6d6ce6c6), [`ebe0774`](https://github.com/kubb-labs/kubb/commit/ebe07749c5e3ef16d0e53daf11dd3954a582216b)]:
  - @kubb/plugin-ts@5.0.0-alpha.12
  - @kubb/plugin-client@5.0.0-alpha.12
  - @kubb/plugin-cypress@5.0.0-alpha.12
  - @kubb/plugin-faker@5.0.0-alpha.12
  - @kubb/plugin-mcp@5.0.0-alpha.12
  - @kubb/plugin-msw@5.0.0-alpha.12
  - @kubb/plugin-react-query@5.0.0-alpha.12
  - @kubb/plugin-solid-query@5.0.0-alpha.12
  - @kubb/plugin-svelte-query@5.0.0-alpha.12
  - @kubb/plugin-swr@5.0.0-alpha.12
  - @kubb/plugin-vue-query@5.0.0-alpha.12
  - @kubb/plugin-zod@5.0.0-alpha.12
  - @kubb/core@5.0.0-alpha.12
  - @kubb/plugin-oas@5.0.0-alpha.12
  - @kubb/plugin-redoc@5.0.0-alpha.12

## 5.0.0-alpha.11

### Patch Changes

- Updated dependencies [[`4cfcb62`](https://github.com/kubb-labs/kubb/commit/4cfcb6290ffa11c93f19345c93906af65ec18339), [`4cfcb62`](https://github.com/kubb-labs/kubb/commit/4cfcb6290ffa11c93f19345c93906af65ec18339)]:
  - @kubb/core@5.0.0-alpha.11
  - @kubb/plugin-oas@5.0.0-alpha.11
  - @kubb/plugin-ts@5.0.0-alpha.11
  - @kubb/plugin-client@5.0.0-alpha.11
  - @kubb/plugin-cypress@5.0.0-alpha.11
  - @kubb/plugin-faker@5.0.0-alpha.11
  - @kubb/plugin-mcp@5.0.0-alpha.11
  - @kubb/plugin-msw@5.0.0-alpha.11
  - @kubb/plugin-react-query@5.0.0-alpha.11
  - @kubb/plugin-redoc@5.0.0-alpha.11
  - @kubb/plugin-solid-query@5.0.0-alpha.11
  - @kubb/plugin-svelte-query@5.0.0-alpha.11
  - @kubb/plugin-swr@5.0.0-alpha.11
  - @kubb/plugin-vue-query@5.0.0-alpha.11
  - @kubb/plugin-zod@5.0.0-alpha.11

## 5.0.0-alpha.10

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.10
  - @kubb/plugin-ts@5.0.0-alpha.10
  - @kubb/plugin-client@5.0.0-alpha.10
  - @kubb/plugin-cypress@5.0.0-alpha.10
  - @kubb/plugin-faker@5.0.0-alpha.10
  - @kubb/plugin-mcp@5.0.0-alpha.10
  - @kubb/plugin-msw@5.0.0-alpha.10
  - @kubb/plugin-oas@5.0.0-alpha.10
  - @kubb/plugin-react-query@5.0.0-alpha.10
  - @kubb/plugin-redoc@5.0.0-alpha.10
  - @kubb/plugin-solid-query@5.0.0-alpha.10
  - @kubb/plugin-svelte-query@5.0.0-alpha.10
  - @kubb/plugin-swr@5.0.0-alpha.10
  - @kubb/plugin-vue-query@5.0.0-alpha.10
  - @kubb/plugin-zod@5.0.0-alpha.10

## 5.0.0-alpha.9

### Patch Changes

- Updated dependencies [[`617aa20`](https://github.com/kubb-labs/kubb/commit/617aa203608222aba2a022ab998ced16f4216ed3)]:
  - @kubb/core@5.0.0-alpha.9
  - @kubb/plugin-client@5.0.0-alpha.9
  - @kubb/plugin-cypress@5.0.0-alpha.9
  - @kubb/plugin-faker@5.0.0-alpha.9
  - @kubb/plugin-mcp@5.0.0-alpha.9
  - @kubb/plugin-msw@5.0.0-alpha.9
  - @kubb/plugin-oas@5.0.0-alpha.9
  - @kubb/plugin-react-query@5.0.0-alpha.9
  - @kubb/plugin-redoc@5.0.0-alpha.9
  - @kubb/plugin-solid-query@5.0.0-alpha.9
  - @kubb/plugin-svelte-query@5.0.0-alpha.9
  - @kubb/plugin-swr@5.0.0-alpha.9
  - @kubb/plugin-ts@5.0.0-alpha.9
  - @kubb/plugin-vue-query@5.0.0-alpha.9
  - @kubb/plugin-zod@5.0.0-alpha.9

## 5.0.0-alpha.8

### Patch Changes

- Updated dependencies [[`978b0d1`](https://github.com/kubb-labs/kubb/commit/978b0d1cb6fadcb08dd71b65bbd1542a02a7a517)]:
  - @kubb/core@5.0.0-alpha.8
  - @kubb/plugin-oas@5.0.0-alpha.8
  - @kubb/plugin-ts@5.0.0-alpha.8
  - @kubb/plugin-client@5.0.0-alpha.8
  - @kubb/plugin-faker@5.0.0-alpha.8
  - @kubb/plugin-zod@5.0.0-alpha.8
  - @kubb/plugin-msw@5.0.0-alpha.8
  - @kubb/plugin-swr@5.0.0-alpha.8
  - @kubb/plugin-react-query@5.0.0-alpha.8
  - @kubb/plugin-vue-query@5.0.0-alpha.8
  - @kubb/plugin-svelte-query@5.0.0-alpha.8
  - @kubb/plugin-solid-query@5.0.0-alpha.8
  - @kubb/plugin-cypress@5.0.0-alpha.8
  - @kubb/plugin-mcp@5.0.0-alpha.8
  - @kubb/plugin-redoc@5.0.0-alpha.8

## 5.0.0-alpha.7

### Patch Changes

- Updated dependencies [[`bf5f955`](https://github.com/kubb-labs/kubb/commit/bf5f955ec285badb0d99a3950b0a880622180ec2)]:
  - @kubb/core@5.0.0-alpha.7
  - @kubb/plugin-oas@5.0.0-alpha.7
  - @kubb/plugin-ts@5.0.0-alpha.7
  - @kubb/plugin-client@5.0.0-alpha.7
  - @kubb/plugin-faker@5.0.0-alpha.7
  - @kubb/plugin-zod@5.0.0-alpha.7
  - @kubb/plugin-msw@5.0.0-alpha.7
  - @kubb/plugin-swr@5.0.0-alpha.7
  - @kubb/plugin-react-query@5.0.0-alpha.7
  - @kubb/plugin-vue-query@5.0.0-alpha.7
  - @kubb/plugin-svelte-query@5.0.0-alpha.7
  - @kubb/plugin-solid-query@5.0.0-alpha.7
  - @kubb/plugin-cypress@5.0.0-alpha.7
  - @kubb/plugin-mcp@5.0.0-alpha.7
  - @kubb/plugin-redoc@5.0.0-alpha.7

## 5.0.0-alpha.6

### Patch Changes

- Updated dependencies [[`0aba63f`](https://github.com/kubb-labs/kubb/commit/0aba63f026e7e93bf1057b7a3740bbfe9ee07c00)]:
  - @kubb/plugin-ts@5.0.0-alpha.6
  - @kubb/plugin-client@5.0.0-alpha.6
  - @kubb/plugin-cypress@5.0.0-alpha.6
  - @kubb/plugin-faker@5.0.0-alpha.6
  - @kubb/plugin-mcp@5.0.0-alpha.6
  - @kubb/plugin-msw@5.0.0-alpha.6
  - @kubb/plugin-react-query@5.0.0-alpha.6
  - @kubb/plugin-solid-query@5.0.0-alpha.6
  - @kubb/plugin-svelte-query@5.0.0-alpha.6
  - @kubb/plugin-swr@5.0.0-alpha.6
  - @kubb/plugin-vue-query@5.0.0-alpha.6
  - @kubb/plugin-zod@5.0.0-alpha.6
  - @kubb/core@5.0.0-alpha.6
  - @kubb/plugin-oas@5.0.0-alpha.6
  - @kubb/plugin-redoc@5.0.0-alpha.6

## 5.0.0-alpha.5

### Patch Changes

- Updated dependencies [[`f373168`](https://github.com/kubb-labs/kubb/commit/f37316845ef3f8753a93e04a946b333ee4e42073)]:
  - @kubb/core@5.0.0-alpha.5
  - @kubb/plugin-ts@5.0.0-alpha.5
  - @kubb/plugin-client@5.0.0-alpha.5
  - @kubb/plugin-cypress@5.0.0-alpha.5
  - @kubb/plugin-faker@5.0.0-alpha.5
  - @kubb/plugin-mcp@5.0.0-alpha.5
  - @kubb/plugin-msw@5.0.0-alpha.5
  - @kubb/plugin-oas@5.0.0-alpha.5
  - @kubb/plugin-react-query@5.0.0-alpha.5
  - @kubb/plugin-redoc@5.0.0-alpha.5
  - @kubb/plugin-solid-query@5.0.0-alpha.5
  - @kubb/plugin-svelte-query@5.0.0-alpha.5
  - @kubb/plugin-swr@5.0.0-alpha.5
  - @kubb/plugin-vue-query@5.0.0-alpha.5
  - @kubb/plugin-zod@5.0.0-alpha.5

## 5.0.0-alpha.4

### Patch Changes

- Updated dependencies [[`64e3d85`](https://github.com/kubb-labs/kubb/commit/64e3d8583c50c073bfe8945dcda5e700d262d9d9)]:
  - @kubb/plugin-oas@5.0.0-alpha.4
  - @kubb/plugin-ts@5.0.0-alpha.4
  - @kubb/core@5.0.0-alpha.4
  - @kubb/plugin-client@5.0.0-alpha.4
  - @kubb/plugin-cypress@5.0.0-alpha.4
  - @kubb/plugin-faker@5.0.0-alpha.4
  - @kubb/plugin-mcp@5.0.0-alpha.4
  - @kubb/plugin-msw@5.0.0-alpha.4
  - @kubb/plugin-react-query@5.0.0-alpha.4
  - @kubb/plugin-redoc@5.0.0-alpha.4
  - @kubb/plugin-solid-query@5.0.0-alpha.4
  - @kubb/plugin-svelte-query@5.0.0-alpha.4
  - @kubb/plugin-swr@5.0.0-alpha.4
  - @kubb/plugin-vue-query@5.0.0-alpha.4
  - @kubb/plugin-zod@5.0.0-alpha.4

## 5.0.0-alpha.3

### Patch Changes

- Updated dependencies [[`827b444`](https://github.com/kubb-labs/kubb/commit/827b444e7c7c62d36ba9eaed7303ed0d18a7fa45)]:
  - @kubb/plugin-ts@5.0.0-alpha.3
  - @kubb/core@5.0.0-alpha.3
  - @kubb/plugin-client@5.0.0-alpha.3
  - @kubb/plugin-cypress@5.0.0-alpha.3
  - @kubb/plugin-faker@5.0.0-alpha.3
  - @kubb/plugin-mcp@5.0.0-alpha.3
  - @kubb/plugin-msw@5.0.0-alpha.3
  - @kubb/plugin-react-query@5.0.0-alpha.3
  - @kubb/plugin-solid-query@5.0.0-alpha.3
  - @kubb/plugin-svelte-query@5.0.0-alpha.3
  - @kubb/plugin-swr@5.0.0-alpha.3
  - @kubb/plugin-vue-query@5.0.0-alpha.3
  - @kubb/plugin-zod@5.0.0-alpha.3
  - @kubb/plugin-oas@5.0.0-alpha.3
  - @kubb/plugin-redoc@5.0.0-alpha.3

## 5.0.0-alpha.2

### Patch Changes

- Updated dependencies [[`4f5a4ef`](https://github.com/kubb-labs/kubb/commit/4f5a4efc6169e9e5ef2cfd629a8ed7ff5714727b)]:
  - @kubb/core@5.0.0-alpha.2
  - @kubb/plugin-oas@5.0.0-alpha.2
  - @kubb/plugin-ts@5.0.0-alpha.2
  - @kubb/plugin-client@5.0.0-alpha.2
  - @kubb/plugin-faker@5.0.0-alpha.2
  - @kubb/plugin-zod@5.0.0-alpha.2
  - @kubb/plugin-msw@5.0.0-alpha.2
  - @kubb/plugin-swr@5.0.0-alpha.2
  - @kubb/plugin-react-query@5.0.0-alpha.2
  - @kubb/plugin-vue-query@5.0.0-alpha.2
  - @kubb/plugin-svelte-query@5.0.0-alpha.2
  - @kubb/plugin-solid-query@5.0.0-alpha.2
  - @kubb/plugin-cypress@5.0.0-alpha.2
  - @kubb/plugin-mcp@5.0.0-alpha.2
  - @kubb/plugin-redoc@5.0.0-alpha.2

## 5.0.0-alpha.1

### Major Changes

- [`a4682ea`](https://github.com/kubb-labs/kubb/commit/a4682ea8896ef7d9ccae1b6e9abd6ed7bcaac073) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - The minimum required Node.js version is 22.

### Patch Changes

- Updated dependencies [[`a4682ea`](https://github.com/kubb-labs/kubb/commit/a4682ea8896ef7d9ccae1b6e9abd6ed7bcaac073)]:
  - @kubb/plugin-svelte-query@5.0.0-alpha.1
  - @kubb/plugin-react-query@5.0.0-alpha.1
  - @kubb/plugin-solid-query@5.0.0-alpha.1
  - @kubb/plugin-vue-query@5.0.0-alpha.1
  - @kubb/plugin-cypress@5.0.0-alpha.1
  - @kubb/plugin-client@5.0.0-alpha.1
  - @kubb/plugin-faker@5.0.0-alpha.1
  - @kubb/plugin-redoc@5.0.0-alpha.1
  - @kubb/plugin-mcp@5.0.0-alpha.1
  - @kubb/plugin-msw@5.0.0-alpha.1
  - @kubb/plugin-oas@5.0.0-alpha.1
  - @kubb/plugin-swr@5.0.0-alpha.1
  - @kubb/plugin-zod@5.0.0-alpha.1
  - @kubb/plugin-ts@5.0.0-alpha.1
  - @kubb/core@5.0.0-alpha.1

## 5.0.0-alpha.0

### Patch Changes

- Updated dependencies [[`2d474ef`](https://github.com/kubb-labs/kubb/commit/2d474ef68bad43e13ec34e762194048cd2a194d9)]:
  - @kubb/core@5.0.0-alpha.0
  - @kubb/plugin-client@5.0.0-alpha.0
  - @kubb/plugin-cypress@5.0.0-alpha.0
  - @kubb/plugin-faker@5.0.0-alpha.0
  - @kubb/plugin-mcp@5.0.0-alpha.0
  - @kubb/plugin-msw@5.0.0-alpha.0
  - @kubb/plugin-oas@5.0.0-alpha.0
  - @kubb/plugin-react-query@5.0.0-alpha.0
  - @kubb/plugin-redoc@5.0.0-alpha.0
  - @kubb/plugin-solid-query@5.0.0-alpha.0
  - @kubb/plugin-svelte-query@5.0.0-alpha.0
  - @kubb/plugin-swr@5.0.0-alpha.0
  - @kubb/plugin-ts@5.0.0-alpha.0
  - @kubb/plugin-vue-query@5.0.0-alpha.0
  - @kubb/plugin-zod@5.0.0-alpha.0

## 4.36.1

### Patch Changes

- Updated dependencies [[`a4ac8d2`](https://github.com/kubb-labs/kubb/commit/a4ac8d28d4b17f5275c3fbe3dedfff0ac3bc3357)]:
  - @kubb/core@4.36.1
  - @kubb/plugin-client@4.36.1
  - @kubb/plugin-cypress@4.36.1
  - @kubb/plugin-faker@4.36.1
  - @kubb/plugin-mcp@4.36.1
  - @kubb/plugin-msw@4.36.1
  - @kubb/plugin-oas@4.36.1
  - @kubb/plugin-react-query@4.36.1
  - @kubb/plugin-redoc@4.36.1
  - @kubb/plugin-solid-query@4.36.1
  - @kubb/plugin-svelte-query@4.36.1
  - @kubb/plugin-swr@4.36.1
  - @kubb/plugin-ts@4.36.1
  - @kubb/plugin-vue-query@4.36.1
  - @kubb/plugin-zod@4.36.1

## 4.36.0

### Patch Changes

- Updated dependencies [[`4e06911`](https://github.com/kubb-labs/kubb/commit/4e0691160314ff3b9054fbba3efcaeb4c9b10008)]:
  - @kubb/core@4.36.0
  - @kubb/plugin-client@4.36.0
  - @kubb/plugin-cypress@4.36.0
  - @kubb/plugin-faker@4.36.0
  - @kubb/plugin-mcp@4.36.0
  - @kubb/plugin-msw@4.36.0
  - @kubb/plugin-oas@4.36.0
  - @kubb/plugin-react-query@4.36.0
  - @kubb/plugin-redoc@4.36.0
  - @kubb/plugin-solid-query@4.36.0
  - @kubb/plugin-svelte-query@4.36.0
  - @kubb/plugin-swr@4.36.0
  - @kubb/plugin-ts@4.36.0
  - @kubb/plugin-vue-query@4.36.0
  - @kubb/plugin-zod@4.36.0

## 4.35.1

### Patch Changes

- Updated dependencies [[`e24fe13`](https://github.com/kubb-labs/kubb/commit/e24fe135aba61f56d3ff218735cb616a627027b9)]:
  - @kubb/plugin-ts@4.35.1
  - @kubb/plugin-client@4.35.1
  - @kubb/plugin-cypress@4.35.1
  - @kubb/plugin-faker@4.35.1
  - @kubb/plugin-mcp@4.35.1
  - @kubb/plugin-msw@4.35.1
  - @kubb/plugin-react-query@4.35.1
  - @kubb/plugin-solid-query@4.35.1
  - @kubb/plugin-svelte-query@4.35.1
  - @kubb/plugin-swr@4.35.1
  - @kubb/plugin-vue-query@4.35.1
  - @kubb/plugin-zod@4.35.1
  - @kubb/core@4.35.1
  - @kubb/plugin-oas@4.35.1
  - @kubb/plugin-redoc@4.35.1

## 4.35.0

### Patch Changes

- Updated dependencies [[`4d8616c`](https://github.com/kubb-labs/kubb/commit/4d8616c7120acea5deb057a2e8fd337bdab6b26d)]:
  - @kubb/plugin-client@4.35.0
  - @kubb/plugin-mcp@4.35.0
  - @kubb/plugin-react-query@4.35.0
  - @kubb/plugin-solid-query@4.35.0
  - @kubb/plugin-svelte-query@4.35.0
  - @kubb/plugin-swr@4.35.0
  - @kubb/plugin-vue-query@4.35.0
  - @kubb/core@4.35.0
  - @kubb/plugin-cypress@4.35.0
  - @kubb/plugin-faker@4.35.0
  - @kubb/plugin-msw@4.35.0
  - @kubb/plugin-oas@4.35.0
  - @kubb/plugin-redoc@4.35.0
  - @kubb/plugin-ts@4.35.0
  - @kubb/plugin-zod@4.35.0

## 4.34.0

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-client@4.34.0
  - @kubb/plugin-cypress@4.34.0
  - @kubb/plugin-faker@4.34.0
  - @kubb/plugin-mcp@4.34.0
  - @kubb/plugin-msw@4.34.0
  - @kubb/plugin-oas@4.34.0
  - @kubb/plugin-react-query@4.34.0
  - @kubb/plugin-redoc@4.34.0
  - @kubb/plugin-solid-query@4.34.0
  - @kubb/plugin-svelte-query@4.34.0
  - @kubb/plugin-swr@4.34.0
  - @kubb/plugin-ts@4.34.0
  - @kubb/plugin-vue-query@4.34.0
  - @kubb/plugin-zod@4.34.0
  - @kubb/core@4.34.0

## 4.33.5

### Patch Changes

- Updated dependencies [[`45b7dc7`](https://github.com/kubb-labs/kubb/commit/45b7dc7939621a29a342af36db34c5f9bee3e155)]:
  - @kubb/plugin-oas@4.33.5
  - @kubb/plugin-client@4.33.5
  - @kubb/plugin-cypress@4.33.5
  - @kubb/plugin-faker@4.33.5
  - @kubb/plugin-mcp@4.33.5
  - @kubb/plugin-msw@4.33.5
  - @kubb/plugin-react-query@4.33.5
  - @kubb/plugin-redoc@4.33.5
  - @kubb/plugin-solid-query@4.33.5
  - @kubb/plugin-svelte-query@4.33.5
  - @kubb/plugin-swr@4.33.5
  - @kubb/plugin-ts@4.33.5
  - @kubb/plugin-vue-query@4.33.5
  - @kubb/plugin-zod@4.33.5
  - @kubb/core@4.33.5

## 4.33.4

### Patch Changes

- Updated dependencies [[`711e6a3`](https://github.com/kubb-labs/kubb/commit/711e6a3fe4373dba49c2dbdbfaa38e0c1bce0d8c)]:
  - @kubb/core@4.33.4
  - @kubb/plugin-client@4.33.4
  - @kubb/plugin-cypress@4.33.4
  - @kubb/plugin-faker@4.33.4
  - @kubb/plugin-mcp@4.33.4
  - @kubb/plugin-msw@4.33.4
  - @kubb/plugin-oas@4.33.4
  - @kubb/plugin-react-query@4.33.4
  - @kubb/plugin-redoc@4.33.4
  - @kubb/plugin-solid-query@4.33.4
  - @kubb/plugin-svelte-query@4.33.4
  - @kubb/plugin-swr@4.33.4
  - @kubb/plugin-ts@4.33.4
  - @kubb/plugin-vue-query@4.33.4
  - @kubb/plugin-zod@4.33.4

## 4.33.3

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-client@4.33.3
  - @kubb/plugin-cypress@4.33.3
  - @kubb/plugin-faker@4.33.3
  - @kubb/plugin-mcp@4.33.3
  - @kubb/plugin-msw@4.33.3
  - @kubb/plugin-oas@4.33.3
  - @kubb/plugin-react-query@4.33.3
  - @kubb/plugin-redoc@4.33.3
  - @kubb/plugin-solid-query@4.33.3
  - @kubb/plugin-svelte-query@4.33.3
  - @kubb/plugin-swr@4.33.3
  - @kubb/plugin-ts@4.33.3
  - @kubb/plugin-vue-query@4.33.3
  - @kubb/plugin-zod@4.33.3
  - @kubb/core@4.33.3

## 4.33.2

### Patch Changes

- Updated dependencies [[`29f6d1b`](https://github.com/kubb-labs/kubb/commit/29f6d1b31e0bc922eb5b0ba8e5149241a3a37305)]:
  - @kubb/plugin-oas@4.33.2
  - @kubb/plugin-zod@4.33.2
  - @kubb/plugin-client@4.33.2
  - @kubb/plugin-cypress@4.33.2
  - @kubb/plugin-faker@4.33.2
  - @kubb/plugin-mcp@4.33.2
  - @kubb/plugin-msw@4.33.2
  - @kubb/plugin-react-query@4.33.2
  - @kubb/plugin-redoc@4.33.2
  - @kubb/plugin-solid-query@4.33.2
  - @kubb/plugin-svelte-query@4.33.2
  - @kubb/plugin-swr@4.33.2
  - @kubb/plugin-ts@4.33.2
  - @kubb/plugin-vue-query@4.33.2
  - @kubb/core@4.33.2

## 4.33.1

### Patch Changes

- Updated dependencies [[`856fa78`](https://github.com/kubb-labs/kubb/commit/856fa78e5cc281ef3cd1b66a38e2deeca69f1b6e)]:
  - @kubb/core@4.33.1
  - @kubb/plugin-oas@4.33.1
  - @kubb/plugin-client@4.33.1
  - @kubb/plugin-cypress@4.33.1
  - @kubb/plugin-faker@4.33.1
  - @kubb/plugin-mcp@4.33.1
  - @kubb/plugin-msw@4.33.1
  - @kubb/plugin-react-query@4.33.1
  - @kubb/plugin-redoc@4.33.1
  - @kubb/plugin-solid-query@4.33.1
  - @kubb/plugin-svelte-query@4.33.1
  - @kubb/plugin-swr@4.33.1
  - @kubb/plugin-ts@4.33.1
  - @kubb/plugin-vue-query@4.33.1
  - @kubb/plugin-zod@4.33.1

## 4.33.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.33.0
  - @kubb/plugin-client@4.33.0
  - @kubb/plugin-cypress@4.33.0
  - @kubb/plugin-faker@4.33.0
  - @kubb/plugin-mcp@4.33.0
  - @kubb/plugin-msw@4.33.0
  - @kubb/plugin-oas@4.33.0
  - @kubb/plugin-react-query@4.33.0
  - @kubb/plugin-redoc@4.33.0
  - @kubb/plugin-solid-query@4.33.0
  - @kubb/plugin-svelte-query@4.33.0
  - @kubb/plugin-swr@4.33.0
  - @kubb/plugin-ts@4.33.0
  - @kubb/plugin-vue-query@4.33.0
  - @kubb/plugin-zod@4.33.0

## 4.32.4

### Patch Changes

- Updated dependencies [[`1f51e6e`](https://github.com/kubb-labs/kubb/commit/1f51e6e4cd8982653c4992929eae009cee1ec2db)]:
  - @kubb/plugin-zod@4.32.4
  - @kubb/plugin-client@4.32.4
  - @kubb/plugin-mcp@4.32.4
  - @kubb/plugin-react-query@4.32.4
  - @kubb/plugin-solid-query@4.32.4
  - @kubb/plugin-svelte-query@4.32.4
  - @kubb/plugin-swr@4.32.4
  - @kubb/plugin-vue-query@4.32.4
  - @kubb/core@4.32.4
  - @kubb/plugin-cypress@4.32.4
  - @kubb/plugin-faker@4.32.4
  - @kubb/plugin-msw@4.32.4
  - @kubb/plugin-oas@4.32.4
  - @kubb/plugin-redoc@4.32.4
  - @kubb/plugin-ts@4.32.4

## 4.32.3

### Patch Changes

- Updated dependencies [[`86ab977`](https://github.com/kubb-labs/kubb/commit/86ab977e360cd9a98746ecc744682b772854cfc4)]:
  - @kubb/plugin-react-query@4.32.3
  - @kubb/plugin-vue-query@4.32.3
  - @kubb/plugin-svelte-query@4.32.3
  - @kubb/plugin-solid-query@4.32.3
  - @kubb/core@4.32.3
  - @kubb/plugin-client@4.32.3
  - @kubb/plugin-cypress@4.32.3
  - @kubb/plugin-faker@4.32.3
  - @kubb/plugin-mcp@4.32.3
  - @kubb/plugin-msw@4.32.3
  - @kubb/plugin-oas@4.32.3
  - @kubb/plugin-redoc@4.32.3
  - @kubb/plugin-swr@4.32.3
  - @kubb/plugin-ts@4.32.3
  - @kubb/plugin-zod@4.32.3

## 4.32.2

### Patch Changes

- Updated dependencies [[`7346e64`](https://github.com/kubb-labs/kubb/commit/7346e645de64892abe4fcd06310639333dbd1f9f)]:
  - @kubb/core@4.32.2
  - @kubb/plugin-client@4.32.2
  - @kubb/plugin-cypress@4.32.2
  - @kubb/plugin-faker@4.32.2
  - @kubb/plugin-mcp@4.32.2
  - @kubb/plugin-msw@4.32.2
  - @kubb/plugin-oas@4.32.2
  - @kubb/plugin-react-query@4.32.2
  - @kubb/plugin-redoc@4.32.2
  - @kubb/plugin-solid-query@4.32.2
  - @kubb/plugin-svelte-query@4.32.2
  - @kubb/plugin-swr@4.32.2
  - @kubb/plugin-ts@4.32.2
  - @kubb/plugin-vue-query@4.32.2
  - @kubb/plugin-zod@4.32.2

## 4.32.1

### Patch Changes

- Updated dependencies [[`df6dba6`](https://github.com/kubb-labs/kubb/commit/df6dba6f16ba62fed751baebb6dec74baae6cae1)]:
  - @kubb/plugin-client@4.32.1
  - @kubb/plugin-mcp@4.32.1
  - @kubb/plugin-react-query@4.32.1
  - @kubb/plugin-solid-query@4.32.1
  - @kubb/plugin-svelte-query@4.32.1
  - @kubb/plugin-swr@4.32.1
  - @kubb/plugin-vue-query@4.32.1
  - @kubb/core@4.32.1
  - @kubb/plugin-cypress@4.32.1
  - @kubb/plugin-faker@4.32.1
  - @kubb/plugin-msw@4.32.1
  - @kubb/plugin-oas@4.32.1
  - @kubb/plugin-redoc@4.32.1
  - @kubb/plugin-ts@4.32.1
  - @kubb/plugin-zod@4.32.1

## 4.32.0

### Patch Changes

- Updated dependencies [[`95c4649`](https://github.com/kubb-labs/kubb/commit/95c4649eb01a0348424c779046d8312a6af09d51)]:
  - @kubb/plugin-oas@4.32.0
  - @kubb/plugin-client@4.32.0
  - @kubb/plugin-cypress@4.32.0
  - @kubb/plugin-faker@4.32.0
  - @kubb/plugin-mcp@4.32.0
  - @kubb/plugin-msw@4.32.0
  - @kubb/plugin-react-query@4.32.0
  - @kubb/plugin-redoc@4.32.0
  - @kubb/plugin-solid-query@4.32.0
  - @kubb/plugin-svelte-query@4.32.0
  - @kubb/plugin-swr@4.32.0
  - @kubb/plugin-ts@4.32.0
  - @kubb/plugin-vue-query@4.32.0
  - @kubb/plugin-zod@4.32.0
  - @kubb/core@4.32.0

## 4.31.6

### Patch Changes

- Updated dependencies [[`4e151b7`](https://github.com/kubb-labs/kubb/commit/4e151b7182393d870d51fe5377610e05928ccf14), [`aa720ed`](https://github.com/kubb-labs/kubb/commit/aa720ed09e674d071fe53c43244fa718e3ca2575), [`edfa8fe`](https://github.com/kubb-labs/kubb/commit/edfa8fe016c0ea5bbc4535c68e4cfaeb3a29217b)]:
  - @kubb/plugin-ts@4.31.6
  - @kubb/plugin-faker@4.31.6
  - @kubb/plugin-zod@4.31.6
  - @kubb/plugin-client@4.31.6
  - @kubb/plugin-cypress@4.31.6
  - @kubb/plugin-mcp@4.31.6
  - @kubb/plugin-msw@4.31.6
  - @kubb/plugin-react-query@4.31.6
  - @kubb/plugin-solid-query@4.31.6
  - @kubb/plugin-svelte-query@4.31.6
  - @kubb/plugin-swr@4.31.6
  - @kubb/plugin-vue-query@4.31.6
  - @kubb/core@4.31.6
  - @kubb/plugin-oas@4.31.6
  - @kubb/plugin-redoc@4.31.6

## 4.31.5

### Patch Changes

- Updated dependencies [[`b81718f`](https://github.com/kubb-labs/kubb/commit/b81718fa2410275227fe07345ffa41a4811e0459)]:
  - @kubb/plugin-oas@4.31.5
  - @kubb/plugin-client@4.31.5
  - @kubb/plugin-cypress@4.31.5
  - @kubb/plugin-faker@4.31.5
  - @kubb/plugin-mcp@4.31.5
  - @kubb/plugin-msw@4.31.5
  - @kubb/plugin-react-query@4.31.5
  - @kubb/plugin-redoc@4.31.5
  - @kubb/plugin-solid-query@4.31.5
  - @kubb/plugin-svelte-query@4.31.5
  - @kubb/plugin-swr@4.31.5
  - @kubb/plugin-ts@4.31.5
  - @kubb/plugin-vue-query@4.31.5
  - @kubb/plugin-zod@4.31.5
  - @kubb/core@4.31.5

## 4.31.4

### Patch Changes

- Updated dependencies [[`0a873dd`](https://github.com/kubb-labs/kubb/commit/0a873dd1b37d42167288970aa8f819e8ad5a78a5)]:
  - @kubb/plugin-oas@4.31.4
  - @kubb/plugin-client@4.31.4
  - @kubb/plugin-cypress@4.31.4
  - @kubb/plugin-faker@4.31.4
  - @kubb/plugin-mcp@4.31.4
  - @kubb/plugin-msw@4.31.4
  - @kubb/plugin-react-query@4.31.4
  - @kubb/plugin-redoc@4.31.4
  - @kubb/plugin-solid-query@4.31.4
  - @kubb/plugin-svelte-query@4.31.4
  - @kubb/plugin-swr@4.31.4
  - @kubb/plugin-ts@4.31.4
  - @kubb/plugin-vue-query@4.31.4
  - @kubb/plugin-zod@4.31.4
  - @kubb/core@4.31.4

## 4.31.3

### Patch Changes

- Updated dependencies [[`78925b7`](https://github.com/kubb-labs/kubb/commit/78925b7f302b35312995b7ec6fd119d696275e7a)]:
  - @kubb/plugin-mcp@4.31.3
  - @kubb/core@4.31.3
  - @kubb/plugin-client@4.31.3
  - @kubb/plugin-cypress@4.31.3
  - @kubb/plugin-faker@4.31.3
  - @kubb/plugin-msw@4.31.3
  - @kubb/plugin-oas@4.31.3
  - @kubb/plugin-react-query@4.31.3
  - @kubb/plugin-redoc@4.31.3
  - @kubb/plugin-solid-query@4.31.3
  - @kubb/plugin-svelte-query@4.31.3
  - @kubb/plugin-swr@4.31.3
  - @kubb/plugin-ts@4.31.3
  - @kubb/plugin-vue-query@4.31.3
  - @kubb/plugin-zod@4.31.3

## 4.31.2

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-client@4.31.2
  - @kubb/plugin-cypress@4.31.2
  - @kubb/plugin-faker@4.31.2
  - @kubb/plugin-mcp@4.31.2
  - @kubb/plugin-msw@4.31.2
  - @kubb/plugin-oas@4.31.2
  - @kubb/plugin-react-query@4.31.2
  - @kubb/plugin-redoc@4.31.2
  - @kubb/plugin-solid-query@4.31.2
  - @kubb/plugin-svelte-query@4.31.2
  - @kubb/plugin-swr@4.31.2
  - @kubb/plugin-ts@4.31.2
  - @kubb/plugin-vue-query@4.31.2
  - @kubb/plugin-zod@4.31.2
  - @kubb/core@4.31.2

## 4.31.1

### Patch Changes

- Updated dependencies [[`fa031c4`](https://github.com/kubb-labs/kubb/commit/fa031c4f8d0a259478848f251c771f5aa834610d)]:
  - @kubb/plugin-client@4.31.1
  - @kubb/plugin-mcp@4.31.1
  - @kubb/plugin-react-query@4.31.1
  - @kubb/plugin-solid-query@4.31.1
  - @kubb/plugin-svelte-query@4.31.1
  - @kubb/plugin-swr@4.31.1
  - @kubb/plugin-vue-query@4.31.1
  - @kubb/core@4.31.1
  - @kubb/plugin-cypress@4.31.1
  - @kubb/plugin-faker@4.31.1
  - @kubb/plugin-msw@4.31.1
  - @kubb/plugin-oas@4.31.1
  - @kubb/plugin-redoc@4.31.1
  - @kubb/plugin-ts@4.31.1
  - @kubb/plugin-zod@4.31.1

## 4.31.0

### Patch Changes

- Updated dependencies [[`43626b4`](https://github.com/kubb-labs/kubb/commit/43626b4a7d5e8420bc441b90de06a804a5c9efe1)]:
  - @kubb/plugin-oas@4.31.0
  - @kubb/plugin-client@4.31.0
  - @kubb/plugin-cypress@4.31.0
  - @kubb/plugin-faker@4.31.0
  - @kubb/plugin-mcp@4.31.0
  - @kubb/plugin-msw@4.31.0
  - @kubb/plugin-react-query@4.31.0
  - @kubb/plugin-redoc@4.31.0
  - @kubb/plugin-solid-query@4.31.0
  - @kubb/plugin-svelte-query@4.31.0
  - @kubb/plugin-swr@4.31.0
  - @kubb/plugin-ts@4.31.0
  - @kubb/plugin-vue-query@4.31.0
  - @kubb/plugin-zod@4.31.0
  - @kubb/core@4.31.0

## 4.30.0

### Patch Changes

- Updated dependencies [[`22e1bc5`](https://github.com/kubb-labs/kubb/commit/22e1bc515b5179b41ca63c9b316bf6f041a2a818)]:
  - @kubb/plugin-svelte-query@4.30.0
  - @kubb/plugin-react-query@4.30.0
  - @kubb/plugin-solid-query@4.30.0
  - @kubb/plugin-vue-query@4.30.0
  - @kubb/plugin-swr@4.30.0
  - @kubb/core@4.30.0
  - @kubb/plugin-client@4.30.0
  - @kubb/plugin-cypress@4.30.0
  - @kubb/plugin-faker@4.30.0
  - @kubb/plugin-mcp@4.30.0
  - @kubb/plugin-msw@4.30.0
  - @kubb/plugin-oas@4.30.0
  - @kubb/plugin-redoc@4.30.0
  - @kubb/plugin-ts@4.30.0
  - @kubb/plugin-zod@4.30.0

## 4.29.1

### Patch Changes

- Updated dependencies [[`d6fc5ad`](https://github.com/kubb-labs/kubb/commit/d6fc5ad851195330367ebecbc08e19ec1658ca40)]:
  - @kubb/plugin-ts@4.29.1
  - @kubb/plugin-client@4.29.1
  - @kubb/plugin-cypress@4.29.1
  - @kubb/plugin-faker@4.29.1
  - @kubb/plugin-mcp@4.29.1
  - @kubb/plugin-msw@4.29.1
  - @kubb/plugin-react-query@4.29.1
  - @kubb/plugin-solid-query@4.29.1
  - @kubb/plugin-svelte-query@4.29.1
  - @kubb/plugin-swr@4.29.1
  - @kubb/plugin-vue-query@4.29.1
  - @kubb/plugin-zod@4.29.1
  - @kubb/core@4.29.1
  - @kubb/plugin-oas@4.29.1
  - @kubb/plugin-redoc@4.29.1

## 4.29.0

### Minor Changes

- [#2577](https://github.com/kubb-labs/kubb/pull/2577) [`bb6f915`](https://github.com/kubb-labs/kubb/commit/bb6f915e0c0d59a417b0891b8bcf7bbfe9db502e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use of less packages and/or tiny libraries

### Patch Changes

- [#2577](https://github.com/kubb-labs/kubb/pull/2577) [`9529af1`](https://github.com/kubb-labs/kubb/commit/9529af145dca72991fe7d2a529c717cce0993ea3) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Total size change: -6.7 MB

- Updated dependencies [[`bb6f915`](https://github.com/kubb-labs/kubb/commit/bb6f915e0c0d59a417b0891b8bcf7bbfe9db502e), [`9529af1`](https://github.com/kubb-labs/kubb/commit/9529af145dca72991fe7d2a529c717cce0993ea3)]:
  - @kubb/plugin-svelte-query@4.29.0
  - @kubb/plugin-react-query@4.29.0
  - @kubb/plugin-solid-query@4.29.0
  - @kubb/plugin-vue-query@4.29.0
  - @kubb/plugin-client@4.29.0
  - @kubb/plugin-redoc@4.29.0
  - @kubb/plugin-oas@4.29.0
  - @kubb/plugin-swr@4.29.0
  - @kubb/plugin-ts@4.29.0
  - @kubb/core@4.29.0
  - @kubb/plugin-mcp@4.29.0
  - @kubb/plugin-msw@4.29.0
  - @kubb/plugin-zod@4.29.0
  - @kubb/plugin-cypress@4.29.0
  - @kubb/plugin-faker@4.29.0

## 4.28.1

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-client@4.28.1
  - @kubb/plugin-cypress@4.28.1
  - @kubb/plugin-faker@4.28.1
  - @kubb/plugin-mcp@4.28.1
  - @kubb/plugin-msw@4.28.1
  - @kubb/plugin-oas@4.28.1
  - @kubb/plugin-react-query@4.28.1
  - @kubb/plugin-redoc@4.28.1
  - @kubb/plugin-solid-query@4.28.1
  - @kubb/plugin-svelte-query@4.28.1
  - @kubb/plugin-swr@4.28.1
  - @kubb/plugin-ts@4.28.1
  - @kubb/plugin-vue-query@4.28.1
  - @kubb/plugin-zod@4.28.1
  - @kubb/core@4.28.1

## 4.28.0

### Patch Changes

- Updated dependencies [[`ff5ead8`](https://github.com/kubb-labs/kubb/commit/ff5ead845548b7e695f4f77528113a1b1964c819), [`d34236f`](https://github.com/kubb-labs/kubb/commit/d34236fae3f46f6f0a79b7792898421f5f5a4d9d)]:
  - @kubb/plugin-svelte-query@4.28.0
  - @kubb/plugin-react-query@4.28.0
  - @kubb/plugin-solid-query@4.28.0
  - @kubb/plugin-vue-query@4.28.0
  - @kubb/plugin-oas@4.28.0
  - @kubb/plugin-ts@4.28.0
  - @kubb/plugin-client@4.28.0
  - @kubb/plugin-cypress@4.28.0
  - @kubb/plugin-faker@4.28.0
  - @kubb/plugin-mcp@4.28.0
  - @kubb/plugin-msw@4.28.0
  - @kubb/plugin-redoc@4.28.0
  - @kubb/plugin-swr@4.28.0
  - @kubb/plugin-zod@4.28.0
  - @kubb/core@4.28.0

## 4.27.4

### Patch Changes

- Updated dependencies [[`3690d37`](https://github.com/kubb-labs/kubb/commit/3690d3778cb8e2c48841bf13b73c82c165242ef4)]:
  - @kubb/core@4.27.4
  - @kubb/plugin-client@4.27.4
  - @kubb/plugin-zod@4.27.4
  - @kubb/plugin-cypress@4.27.4
  - @kubb/plugin-faker@4.27.4
  - @kubb/plugin-mcp@4.27.4
  - @kubb/plugin-msw@4.27.4
  - @kubb/plugin-oas@4.27.4
  - @kubb/plugin-react-query@4.27.4
  - @kubb/plugin-redoc@4.27.4
  - @kubb/plugin-solid-query@4.27.4
  - @kubb/plugin-svelte-query@4.27.4
  - @kubb/plugin-swr@4.27.4
  - @kubb/plugin-ts@4.27.4
  - @kubb/plugin-vue-query@4.27.4

## 4.27.3

### Patch Changes

- Updated dependencies [[`2213d3a`](https://github.com/kubb-labs/kubb/commit/2213d3ab14894c96e1f69780ea480b5e3457bf6b), [`669b07e`](https://github.com/kubb-labs/kubb/commit/669b07ed66f0dded0e028a3dfe1c5e669c53e53a)]:
  - @kubb/plugin-client@4.27.3
  - @kubb/plugin-oas@4.27.3
  - @kubb/plugin-mcp@4.27.3
  - @kubb/plugin-react-query@4.27.3
  - @kubb/plugin-solid-query@4.27.3
  - @kubb/plugin-svelte-query@4.27.3
  - @kubb/plugin-swr@4.27.3
  - @kubb/plugin-vue-query@4.27.3
  - @kubb/plugin-cypress@4.27.3
  - @kubb/plugin-faker@4.27.3
  - @kubb/plugin-msw@4.27.3
  - @kubb/plugin-redoc@4.27.3
  - @kubb/plugin-ts@4.27.3
  - @kubb/plugin-zod@4.27.3
  - @kubb/core@4.27.3

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
