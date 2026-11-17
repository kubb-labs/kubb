# Buffer-backed AST tryout

Can plugins run on an AST that lives in one flat buffer, the way oxlint hands its AST to JavaScript
plugins? If so, a Rust adapter could write that buffer, and the `JSON.parse` cost that sank
[`core-rs`](../core-rs) goes away.

## Result

Yes. The plugins produce the same 7,517 files on five specs with every reader. The eager reader is
the one to keep:

| Reader | What it does | Plugin generate time vs plain AST |
| --- | --- | --- |
| `view` (lazy) | Decodes each object on first read, through own getters | 5 to 70% slower |
| `eager` | Decodes the whole buffer at once, one generated constructor per shape | The same, within noise |

The lazy view is likely slow because `Object.defineProperty` turns every node into a slow
dictionary-mode object. This is not profiled. Plugins read almost the whole AST anyway, so laziness
saves nothing.

The eager decode costs 3 to 32 ms, against 4 to 218 ms for the TypeScript adapter's `parse`. The
plugins then run as fast as they do on the adapter's own objects. Five alternating runs per spec,
median of 7 warm builds each, generate in ms. `results.json` holds only the first single run.

| Spec | Adapter parse | Decode | Generate, plain | Generate, eager |
| --- | --- | --- | --- | --- |
| twitter.json | 43 | 5 | 232 | 231 |
| digitalocean.yaml | 199 | 32 | 760 | 712 |
| bunq.com.json | 153 | 25 | 854 | 856 |

The digitalocean ranges overlap (plain 700 to 792, eager 666 to 784). An earlier single run showed
eager up to 19% faster. That was noise, and so were the `objects` and `strings` modes, which rebuild
the plain AST with one constructor per shape or with shared strings.

So a Rust adapter could replace at most the adapter's `parse`: about 19% of a warm build on
digitalocean.yaml (199 of 1,040 ms), 14% on bunq.com.json. A CPU profile of `parse` puts about 60% of it in
`parseOperation`, 20% in top-level schemas and 20% in reading and bundling the spec. A port gains
little until it covers operations too.

## What this does not answer

`encode` here is JavaScript and runs after the TypeScript adapter. It stands in for a Rust adapter
that writes the buffer directly. Whether that Rust adapter is cheaper than the decode it saves is
still unmeasured.

## Run it

Needs Node 22 and [kubb-labs/plugins](https://github.com/kubb-labs/plugins) installed and built next
to this repository (or set `KUBB_PLUGINS_REPO`). No Rust build is needed.

```sh
cd rust/ast-view
node tryout.mjs parity eager   # every file must match the plain build
node tryout.mjs bench digitalocean.yaml eager   # one row: cold run, then median of 7 warm builds
node tryout.mjs report         # every mode in fresh processes, writes results.json
```
