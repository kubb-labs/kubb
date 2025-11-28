---
"@kubb/plugin-client": patch
---

Fix FormData type casting issue that causes TypeScript errors. When generating code for endpoints that use `multipart/form-data`, the generated code was casting `formData as FormData` which caused TypeScript errors because `FormData` doesn't extend the request type. Since `RequestConfig.data` already accepts `TData | FormData`, the explicit cast was unnecessary and has been removed.
