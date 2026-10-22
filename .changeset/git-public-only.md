---
'@kubb/core': patch
---

`checkoutGitInput` takes a `publicOnly` option. It accepts an https repository on public addresses only, connects to the addresses it checked, and refuses a redirect. Core also exports `isPublicAddress`.
