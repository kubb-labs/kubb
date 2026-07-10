---
'@kubb/cli': patch
---

Tidy up a few CLI correctness details.

The clack logger's plugin-end guard now compares with `<= silent` like every other log-level guard, rather than a lone equality check that only worked because `silent` is negative infinity. The telemetry event type drops the `agent` command that no caller ever sends. The `generate` command resolves its log level through a small helper instead of a nested ternary.
