---
"@kubb/plugin-client": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-solid-query": patch
"@kubb/plugin-svelte-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-vue-query": patch
"@kubb/core": patch
---

Support arrays in multipart/form-data

- Added `buildFormData` utility function to properly handle arrays in multipart/form-data requests
- Fixed array iteration to use `for...of` instead of `for...in` to correctly iterate over array values
- Added Date object handling with automatic ISO string conversion
- Filter out null/undefined array elements to prevent them from becoming string literals in FormData
- Improved type safety with early returns in appendData function
- Added `upsertFile` method to PluginContext for idempotent file operations
- Ensured consistent use of `upsertFile` across all query plugins for better file regeneration
