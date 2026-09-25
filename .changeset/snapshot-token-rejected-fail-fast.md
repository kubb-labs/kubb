---
'@kubb/cli': patch
---

`kubb studio snapshot` fails fast again when Studio rejects the CI agent's token mid-run, instead of polling the job until `--timeout` runs out. The connection-lost signal now aborts when the connection rejects as well as when it ends, carrying the token error as its reason.
