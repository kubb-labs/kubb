---
'@kubb/cli': minor
'@kubb/core': minor
---

Add `kubb generate --no-lockfile`, which generates without reading or writing `kubb-lock.json`.

```shell
kubb generate --no-lockfile
```

Every run then generates, formats, and lints, and an existing `kubb-lock.json` stays as it is. `--check` and `--dry-run` accept the flag too, and compare each file with the generated text alone.

In `@kubb/core`, `generate()` and `Kubb.generate()` accept `lockfile: false`.
