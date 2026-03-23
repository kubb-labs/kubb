---
'@kubb/plugin-ts': patch
---

Include `QueryParams` in aggregated mutation types when the operation has query parameters. Previously, `QueryParams` was only added for GET operations, causing mutations like `UpdatePetWithFormMutation` and `UploadFileMutation` to be missing their `QueryParams` property in legacy mode.
