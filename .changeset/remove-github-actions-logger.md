---
"@kubb/cli": patch
---

Remove the GitHub Actions logger. The CLI now picks the clack or plain logger based on whether a TTY is available, regardless of the CI environment.
