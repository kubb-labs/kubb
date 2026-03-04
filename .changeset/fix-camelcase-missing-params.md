---
"@kubb/plugin-oas": patch
---

Fix `paramsCasing: 'camelcase'` dropping unchanged params from `mappedParams`. When a schema has a mix of snake_case and already-camelCase params, all params are now included in the mapping so they are correctly sent to the API.
