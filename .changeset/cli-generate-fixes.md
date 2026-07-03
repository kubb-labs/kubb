---
'@kubb/cli': patch
---

Fix the update check, watch mode, and hook handling in `kubb generate`.

The npm update check compared versions as strings, so `5.9.0 < 5.10.0` evaluated as `false` and update notices were skipped (or shown wrongly) around double-digit parts. It now compares numeric semver parts and aborts after 3 seconds so a slow registry never stalls a run.

Watch mode no longer rebuilds once per chokidar startup event: the first build runs explicitly, event bursts from a single save are debounced into one rebuild, and builds never overlap (a change during a build queues exactly one rerun). A failing first build keeps watching instead of exiting.

The formatter, linter, and `done` hooks now get their outcome directly from `runHook`, which returns `{ success, error, stdout, stderr }` while still emitting `kubb:hook:end` for the loggers. This removes the listener round-trip that could hang generation forever when a hook process never reported back. A stray spread that copied `output.*` keys onto the root of the resolved config is also removed.
