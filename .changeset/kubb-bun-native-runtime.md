---
'@kubb/core': minor
'@kubb/cli': minor
---

Run Kubb natively on Bun while keeping full Node support.

Runtime detection is now centralized, so the filesystem helpers reach for `Bun.file` and `Bun.write` under Bun and fall back to `node:fs` everywhere else. The `kubb agent` command launches its server with the same runtime that started the CLI (via `process.execPath`) instead of always shelling out to `node`, so a Bun-only environment no longer needs a `node` binary on the PATH. Anonymous telemetry also records which runtime ran the generation (`bun`, `deno`, or `node`) alongside its version.
