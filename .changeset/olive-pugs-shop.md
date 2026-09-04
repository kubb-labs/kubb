---
'@kubb/cli': minor
'kubb': minor
---

Ship `@kubb/studio` with the CLI, so `kubb studio` runs without a second install.

It was an optional peer dependency, which meant `kubb studio` failed on a fresh install until you
also added `@kubb/studio` by hand. It is now a dependency of `@kubb/cli`, and listed on the `kubb`
meta package alongside `@kubb/mcp`, so both install paths get the command out of the box.

The runtime still loads only when the command runs, so `kubb --help` and `kubb generate` never
touch it.
