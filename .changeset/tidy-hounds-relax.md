---
'@kubb/cli': minor
---

Replace the hand-rolled argument parser with [gunshi](https://gunshi.dev) for `kubb generate`, `kubb init`, `kubb validate`, and `kubb mcp`.

This closes a real bug: `--logLevel` and `--reporter` declared an `enum` of allowed values but never validated against it, so a typo like `--logLevel bogus` silently passed through. Both are now rejected with a clear error.

One flag changed as a result: gunshi reserves `-v` globally for `--version`, so `generate`'s `-v` short alias for `--verbose` is removed. Use `--verbose` instead.
