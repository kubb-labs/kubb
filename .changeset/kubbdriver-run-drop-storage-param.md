---
"@kubb/core": major
---

`KubbDriver.run()` no longer takes a `storage` argument.

`Config.storage` was already required and passed into the driver's constructor, so `run({ storage })` was redundant. `run()` now reads `config.storage` directly, so callers should switch to `driver.run()`.
