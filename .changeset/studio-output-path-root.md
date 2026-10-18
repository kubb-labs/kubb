---
'@kubb/studio': patch
---

Refuse a Studio output path, also in `override`, that resolves outside the config's output folder, unless `kubb.config.ts` sets that path itself. The agent reports `KUBB_PATH_TRAVERSAL` and writes nothing.
