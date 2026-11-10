---
'@kubb/adapter-oas': patch
---

Give a response without content an empty `contentType` (`''`) instead of the request's media type. A body-less `304` on an operation with a `text/plain` request body was typed as `string`, while the client returns `undefined`. The adapter `contentType` option no longer adds its media type to a response without content either.
