# `@kubb/transformer`

High-performance string transformation utilities for Kubb, powered by a
**Rust/NAPI-RS native binary** with a pure JavaScript fallback for
unsupported platforms.

## Why Rust?

String-case transformations (`camelCase`, `pascalCase`, `snakeCase`,
`screamingSnakeCase`) are called thousands of times during code generation
from a single OpenAPI specification.  Moving these hot-path functions to
Rust provides:

- **Compiled regex** – regular expressions are compiled once at binary load
  time and reused across every call (no per-call `RegExp` object allocation).
- **Zero GC pressure** – transformations run entirely inside the Rust heap;
  only the final `String` is transferred back to V8.
- **Faster string manipulation** – Rust's `String`/`str` operations avoid
  JavaScript's UTF-16 encoding overhead for typical ASCII API identifiers.

This is the same pattern used by tools like [Biome](https://biomejs.dev),
[SWC](https://swc.rs), [Rolldown](https://rolldown.rs), and
[LightningCSS](https://lightningcss.dev) to accelerate performance-critical
paths inside Node.js tooling.

## Installation

```bash
pnpm add @kubb/transformer
```

## Usage

```ts
import { camelCase, pascalCase, snakeCase, screamingSnakeCase } from '@kubb/transformer'

camelCase('hello-world')          // 'helloWorld'
pascalCase('hello-world')         // 'HelloWorld'
snakeCase('helloWorld')           // 'hello_world'
screamingSnakeCase('helloWorld')  // 'HELLO_WORLD'

// File-path mode (dot-separated → slash-separated)
camelCase('pet.petId', { isFile: true })   // 'pet/petId'
pascalCase('pet.petId', { isFile: true })  // 'pet/PetId'

// Prefix / suffix
camelCase('tag', { prefix: 'create' })     // 'createTag'
camelCase('tag', { suffix: 'schema' })     // 'tagSchema'
```

## API

### `camelCase(text, options?)`

Converts `text` to camelCase.  Preserves all-uppercase acronyms
(e.g. `HTML`, `HTTPS`).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `isFile` | `boolean` | `false` | Split on `.`, case each segment, join with `/` |
| `prefix` | `string` | `''` | Prepend before casing is applied |
| `suffix` | `string` | `''` | Append before casing is applied |

### `pascalCase(text, options?)`

Converts `text` to PascalCase.  Same options as `camelCase`.

### `snakeCase(text, options?)`

Converts `text` to snake_case.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prefix` | `string` | `''` | Prepend before casing is applied |
| `suffix` | `string` | `''` | Append before casing is applied |

### `screamingSnakeCase(text, options?)`

Converts `text` to SCREAMING_SNAKE_CASE.  Same options as `snakeCase`.

## Architecture

```
packages/transformer/
├── Cargo.toml                  # Rust project (NAPI-RS cdylib)
├── build.rs                    # NAPI-RS build script
├── src/
│   └── lib.rs                  # Rust implementation
├── index.js                    # ESM entry – loads native or fallback
├── index.d.ts                  # TypeScript types
└── fallback.js                 # Pure JS fallback (same behaviour)
```

### Native binary

The Rust code compiles to a platform-specific `.node` shared library using
[NAPI-RS](https://napi.rs).  The naming convention follows the NAPI-RS
standard: `kubb-transformer.<platform>-<arch>[-<libc>].node`.

| Platform | Binary |
|----------|--------|
| Linux x64 glibc | `kubb-transformer.linux-x64-gnu.node` |
| Linux x64 musl | `kubb-transformer.linux-x64-musl.node` |
| Linux arm64 | `kubb-transformer.linux-arm64-gnu.node` |
| macOS x64 | `kubb-transformer.darwin-x64.node` |
| macOS arm64 | `kubb-transformer.darwin-arm64.node` |
| Windows x64 | `kubb-transformer.win32-x64-msvc.node` |

### Building from source

```bash
# Prerequisites: Rust toolchain, @napi-rs/cli
pnpm add -g @napi-rs/cli

# Build for the current platform
cd packages/transformer
napi build --platform --release

# Or use cargo directly (produces libkubb_transformer.so on Linux)
cargo build --release
cp target/release/libkubb_transformer.so kubb-transformer.linux-x64-gnu.node
```

### JavaScript fallback

If no pre-built binary is found for the current platform, `index.js`
transparently falls back to `fallback.js` – a pure JavaScript implementation
with identical behaviour.  This means the package always works, even in
environments where native compilation is not possible (e.g. some CI runners
or edge runtimes).

## Supported Node.js versions

Node.js ≥ 22 (same as the rest of the Kubb monorepo).

## License

MIT
