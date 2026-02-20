---
"@kubb/agent": minor
"@kubb/cli": minor
---

Add `--allow-write` and `--allow-all` CLI flags (and corresponding `KUBB_ALLOW_WRITE` / `KUBB_ALLOW_ALL` env variables) to `kubb agent start`.

- `--allow-write` / `KUBB_ALLOW_WRITE=true` – opt-in to writing generated files to the filesystem. When not set, the kubb config runs with `output.write: false` and the Studio config patch is not persisted.
- `--allow-all` / `KUBB_ALLOW_ALL=true` – grant all permissions; implies `--allow-write`.
