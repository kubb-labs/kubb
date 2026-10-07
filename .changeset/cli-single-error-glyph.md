---
'@kubb/cli': patch
---

Print one `✗` before an error instead of two. The error handler added its own `✗`, and the spinner it stopped added another, so a failing plugin setup printed `✗ ✗ No client plugin is registered.`
