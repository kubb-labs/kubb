# Rust core proof of concept

Can Kubb's core move to Rust while plugins stay in TypeScript, the way oxlint runs ESLint plugins?
This folder holds a working tryout and its measurements. It is not part of the pnpm workspace and
nothing in `packages/` depends on it.

## Result

The tryout works: on five specs, the Rust path produces the same 7,517 files as the TypeScript path, byte for
byte, with `plugin-ts`, `plugin-axios`, `plugin-zod` and `plugin-faker` unchanged. It is barely faster.
A one-shot CLI run gets 1 to 14% faster. A repeat build in a warm process ranges from 10% faster to 27%
slower, because the time Rust saves is spent again on moving data between the two languages.
The numbers are in
[`core-rs/results.json`](core-rs/results.json).

Three measurements explain it:

- About half of a build's CPU time runs under plugin code, which stays in TypeScript.
- A call from JavaScript into Rust costs more than a small helper does.
  [`text-rs`](text-rs) ports `indent` and `dedent`; called once per string, the Rust versions are 3 to 30
  times slower than the originals.
- Plugins need the whole AST as JavaScript objects. The AST is 8 to 35 times larger than the spec,
  and reading it back with `JSON.parse` takes longer than the TypeScript adapter needs to build it from
  a JSON spec.

## What is here

| Folder | What it is |
| --- | --- |
| [`core-rs`](core-rs) | The Rust core as a Node addon: `loadSpec` reads and parses the spec, `emitFiles` dedupes imports, prints and writes every generated file on all cores. `index.mjs` plugs both into an unchanged Kubb build. |
| [`text-rs`](text-rs) | `internals/utils/src/text.ts` ported with [rust-anything](https://github.com/erkamyaman/rust-anything). It passes the tool's gate on 614 recorded cases, and `core-rs` uses it as a library. |

`core-rs` uses two extension points Kubb already has, so the core needs no change:

```js
import { createKubb } from '@kubb/core'
import { loadSpec, useNativeOutput } from './index.mjs'

const kubb = createKubb({ ...config, input: loadSpec('./petStore.yaml') })
await kubb.setup()
useNativeOutput(kubb) // swaps driver.fileManager
await kubb.build()
```

## Run it

You need Rust, Node 22, and [kubb-labs/plugins](https://github.com/kubb-labs/plugins) installed and
built next to this repository (or set `KUBB_PLUGINS_REPO`).

```sh
cd rust/core-rs
node build.mjs            # cargo build --release, then core_rs.node
cargo test --release      # unit tests of the Rust ports
node tryout.mjs parity    # Rust output must equal TypeScript output for every file
node tryout.mjs report    # the benchmark matrix, written to results.json
```

`text-rs` is checked with `rust-anything gate rust/text-rs`.

## Limits of the tryout

- The Rust path skips `kubb:file:processed`, per-file progress updates and the output manifest.
- Files in JavaScript keep their unpruned imports until the write, and carry no `id`.
- A spec loaded in Rust has no source positions, so diagnostics lose their line numbers. Duplicate
  YAML keys keep the last value where `js-yaml` rejects them.
- Paths are POSIX only.
