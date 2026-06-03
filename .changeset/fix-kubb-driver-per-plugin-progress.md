---
"@kubb/core": patch
---

Restore progressive `Plugins N/M` progress in the CLI. The driver now runs each plugin's
generator pass sequentially, so `kubb:plugin:end` fires as each plugin finishes instead of
once the whole batch pass is over. The CLI counter advances 2/9, 3/9, ..., 9/9 again rather
than jumping from 1/9 straight to 9/9 at the end of the run.
