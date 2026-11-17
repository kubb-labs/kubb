# Buffer-backed AST tryout

Can plugins run on an AST that lives in one flat buffer, the way oxlint hands its AST to JavaScript
plugins? If so, a Rust adapter could write that buffer, and the `JSON.parse` cost that sank
[`core-rs`](../core-rs) goes away.

## Result

Yes. The plugins produce the same 7,517 files on five specs with both readers. The eager reader is
the one to keep:

| Reader | What it does | Plugin generate time vs plain AST |
| --- | --- | --- |
| `view` (lazy) | Decodes each object on first read, through own getters | 5 to 70% slower |
| `eager` | Decodes the whole buffer at once, one generated constructor per shape | 5 to 19% faster; `petStore.yaml` (18 ms total) 4 ms slower |

The lazy view is likely slow because `Object.defineProperty` turns every node into a slow
dictionary-mode object. This is not profiled. Plugins read almost the whole AST anyway, so laziness saves nothing.

The eager decode costs 3 to 32 ms, against 4 to 218 ms for the TypeScript adapter's `parse`.
Plugins also run faster on the decoded objects. A likely reason, not profiled: objects of one shape
share one hidden class, while the adapter builds the same shapes in many different ways.

Warm runs, median of 7, in ms (`results.json`):

| Spec | Adapter parse | Decode | Generate, plain | Generate, eager |
| --- | --- | --- | --- | --- |
| twitter.json | 43 | 5 | 256 | 209 |
| digitalocean.yaml | 199 | 32 | 734 | 667 |
| bunq.com.json | 153 | 25 | 846 | 800 |

Runs vary by about ±8%. Two reruns of these three specs ranged from 2% slower to 13% faster on generate.

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
node tryout.mjs report         # plain, view and eager in fresh processes, writes results.json
```
