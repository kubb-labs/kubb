---
'@kubb/studio': patch
---

Studio's HTTP calls now go through `ofetch`. It handles JSON encoding and parsing, throws on a
non-2xx status, and retries agent registration on its own, which replaces the package's own
`HttpError` class and its hand-written retry loop.

Registration now retries only what is worth retrying: a network failure or a 5xx, and no longer a
403, which cannot succeed on a second try with the same machine token.
