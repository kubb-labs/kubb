---
'@kubb/core': patch
'@kubb/cli': patch
---

Remove the unused `kubb:config:start` and `kubb:config:end` lifecycle events from `KubbHooks` and delete the `KubbConfigEndContext` type. The CLI already emits `kubb:info` and `kubb:success` "Config loaded" messages for the same output, so nothing visible changes.
