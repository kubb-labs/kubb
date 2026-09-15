---
'@kubb/cli': patch
---

CLI flags are now kebab-case, matching the convention used by most command-line tools.

- `kubb generate --log-level` and `kubb generate --dry-run` replace `--logLevel` and `--dryRun`.
- `kubb studio --allow-write`, `--allow-config-edit`, `--allow-input`, and `--allow-exec` replace
  `--allowWrite`, `--allowConfigEdit`, `--allowInput`, and `--allowExec`.
- `kubb init --dry-run` replaces `--dryRun`.

To upgrade, replace any camelCase flag in a script or CI job with its kebab-case name. The CLI
now rejects an unrecognized flag with an error instead of silently ignoring it.

```bash
# Before
kubb studio --allowWrite --allowExec

# After
kubb studio --allow-write --allow-exec
```
