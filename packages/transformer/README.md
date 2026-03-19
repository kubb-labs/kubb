# `@kubb/transformer`

High-performance string transformation utilities for Kubb, powered by a
**Rust/NAPI-RS native binary** with a pure JavaScript fallback for
unsupported platforms.

## Motivation: which operations benefit from Rust?

### ✅ CPU-bound string operations — Rust helps here

Rust accelerates operations that are **CPU-bound**, meaning their cost is
dominated by pure computation (regex matching, string allocation, hash lookups)
rather than waiting for I/O.  These are the functions in this package:

| Function | Why Rust is faster |
|----------|--------------------|
| `camelCase` / `pascalCase` | Multiple regex passes per call; regex compiled once via `OnceLock` |
| `snakeCase` / `screamingSnakeCase` | Same — regex compiled once at load time |
| `transformReservedWord` | O(1) `HashSet` lookup vs O(n) `Array.includes()` in JS |
| `getRelativePath` | Pure string path computation (split → compare → join) |

These functions are called **thousands of times per generation run** — once per
generated identifier (types, variables, functions, imports) per plugin.  A
typical 100-endpoint API generates:

```
100 operations × (name + types + response + request + params) × 5 plugins
≈ 5 000 – 25 000 camelCase/pascalCase calls per build
```

### ❌ File I/O — Rust does NOT help here

File reads and writes are **I/O-bound**: the cost is disk latency and kernel
syscall overhead, not CPU computation.

```
Typical write cost breakdown:
  ├── trim() + equality check (CPU):  < 1 μs
  └── writeFile() syscall + disk I/O: 50–500 μs   ← actual bottleneck
```

Node.js already delegates all file I/O to **libuv**, which uses the same
kernel async I/O APIs that Rust would use (`epoll` on Linux, `kqueue` on
macOS, `IOCP` on Windows).  Adding a Rust file I/O wrapper would introduce
additional NAPI bridge overhead on top of the same syscalls — net result
would be slightly **slower**, not faster.

The right approach for file I/O performance (already implemented in
`internals/utils/src/fs.ts`):
- **Dedup check**: read existing content before writing, skip if identical
- **Batch writes**: write all files concurrently with `Promise.all()`
- **Smart `mkdir`**: create parent dirs lazily with `{ recursive: true }`

### What ARE the biggest bottlenecks in code generation?

Based on profiling and the benchmark suite in `tests/performance/`:

1. **Plugin hook execution** — each plugin runs hooks for every operation
   in the spec; with 5 plugins and 100 operations this is 500+ async calls
2. **OpenAPI spec parsing** — YAML/JSON parsing of large specs (already done
   once at startup, not per-plugin)
3. **TypeScript AST generation** — `printer.printFile()` and `createSourceFile()`
   allocate many V8 objects per generated file
4. **String case transformations** ← what this package addresses
5. **File write dedup** — reading each file before writing to skip unchanged
   files; already optimised in `internals/utils/src/fs.ts`

## Installation

```bash
pnpm add @kubb/transformer
```

## Usage

```ts
import {
  camelCase,
  pascalCase,
  snakeCase,
  screamingSnakeCase,
  transformReservedWord,
  getRelativePath,
} from '@kubb/transformer'

// String-case transforms
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

// Reserved word guard (called on every generated identifier)
transformReservedWord('delete')            // '_delete'
transformReservedWord('1test')             // '_1test'
transformReservedWord('myVar')             // 'myVar'

// Path utility (used in barrel export generation)
getRelativePath('/project/src', '/project/src/gen/types.ts')  // './gen/types.ts'
getRelativePath('/project/src/gen', '/project/src')            // './..'
```

## API

### `camelCase(text, options?)`

Converts `text` to camelCase.  Preserves all-uppercase acronyms (e.g. `HTML`, `HTTPS`).

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

### `transformReservedWord(word)`

Prefixes `word` with `_` when it is a reserved JavaScript/Java identifier
or starts with a digit.

The native binary uses an O(1) `HashSet<&str>` lookup at the Rust level.
The JavaScript fallback also uses a `Set` (O(1)), improving over the original
`Array.includes()` (O(n)) in `internals/utils/src/reserved.ts`.

### `getRelativePath(rootDir, filePath)`

Returns the relative path from `rootDir` to `filePath` using forward slashes,
prefixed with `./` when not traversing upward.  Handles Windows-style backslash
paths transparently.  Throws when either argument is empty or nullish.

## Architecture

```
packages/transformer/
├── Cargo.toml                  # Rust project (NAPI-RS cdylib)
├── build.rs                    # NAPI-RS build script
├── src/
│   └── lib.rs                  # Rust implementation
├── index.js                    # ESM entry – loads native or fallback
├── index.d.ts                  # TypeScript types
└── fallback.js                 # Pure JS fallback (identical behaviour)
```

### Zero-cost fallback

If no pre-built binary exists for the current platform, `index.js`
transparently uses `fallback.js` — no errors, no user action required.

### Supported platforms

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
# Prerequisites: Rust toolchain (rustup.rs), @napi-rs/cli
pnpm add -g @napi-rs/cli

# Build for the current platform
cd packages/transformer
napi build --platform --release
```

## Running benchmarks

```bash
# From the repo root
pnpm run test:bench
```

The benchmark suite in `tests/performance/transformer.bench.ts` measures:
- Native vs JS fallback throughput for all functions
- File I/O cost breakdown (CPU part vs disk part) to confirm file I/O is disk-bound

## License

MIT
