---
'kubb': minor
---

Ship `@kubb/studio` with the `kubb` package, so `kubb studio` runs without a second install.

It stays an optional peer of `@kubb/cli`, the same shape `@kubb/mcp` has, so installing the CLI on
its own still leaves the choice open. What changes is the `kubb` meta package, which now depends on
it and satisfies that peer for everyone who installs `kubb`.

The runtime still loads only when the command runs, so `kubb --help` and `kubb generate` never
touch it.
