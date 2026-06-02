---
'@kubb/core': patch
---

Stop the hooks emitter from tripping Node's EventEmitter leak warning.

Each generator a plugin registers adds a listener to the shared `kubb:generate:*` events, so a config with several multi-generator plugins pushed past the emitter's hardcoded ceiling of 10 and printed `MaxListenersExceededWarning: 11 kubb:generate:operation listeners added`. `Kubb.setup()` now sizes the ceiling to the plugin count (`max(10, plugins.length * 4)`), which keeps leak detection for genuine runaway listeners while leaving room for the generators a normal plugin set registers.
