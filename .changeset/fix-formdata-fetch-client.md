---
"@kubb/plugin-client": patch
---

Fix FormData handling in fetch client to properly support multipart/form-data requests. FormData instances are now passed directly to the fetch API instead of being JSON.stringify-ed, allowing the browser to correctly set the Content-Type header with the multipart boundary.
