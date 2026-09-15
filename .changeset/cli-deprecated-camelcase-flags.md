---
'@kubb/cli': patch
---

The camelCase CLI flags removed in favor of kebab-case now work again, so a script or CI job
using the old spelling does not break. Passing `--allowWrite`, `--allowConfigEdit`,
`--allowInput`, `--allowExec`, `--logLevel`, `--dryRun`, or `--packageVersion` prints a
deprecation warning on stderr and still runs.

```bash
# Still works, warns on stderr
kubb studio --allowWrite

# Preferred
kubb studio --allow-write
```

Support for the camelCase spelling will be removed in a future major version.
