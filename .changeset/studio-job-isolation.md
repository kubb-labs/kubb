---
'@kubb/studio': patch
'@kubb/core': patch
---

A sandbox agent runs each job under its own temporary root and removes it, with the output-manifest cache Kubb derived from it, once the job ends. Before, every tenant's job shared the agent's root, and with it one manifest cache. A sandbox also stops serving a kept generation 15 minutes after it ran, since its in-memory store holds every tenant's runs. A local agent keeps its runs until count or size pushes them out, as before, so a later run can still compare against the one before it.

`@kubb/core` exports `resolveCacheDir`, the directory `cacheStorage` uses for a root.
