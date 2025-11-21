---
"@kubb/plugin-client": patch
---

Improve FormData type handling for multipart/form-data requests

- Fixed handling of Blob[] and File[] arrays by appending each item individually instead of JSON-stringifying
- Added proper conversion of numbers and booleans to strings using String()
- Skip null and undefined values instead of serializing them as strings
- Resolved biome linter error (useIterableCallbackReturn) in generated code
