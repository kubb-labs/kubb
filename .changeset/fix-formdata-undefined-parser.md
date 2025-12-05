---
'@kubb/plugin-client': patch
---

Fix formData generation when parser is undefined or non-standard. Previously, when using multipart/form-data endpoints without setting parser to 'client' or 'zod', the generated code would attempt to call `buildFormData(requestData)` with an undefined `requestData` variable. The fix ensures `requestData` is always defined when there's a request schema by falling back to plain assignment when zod parsing is not applicable.
