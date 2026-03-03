---
'@kubb/plugin-oas': patch
---

Fix schema from external `$ref` file being incorrectly named "itemsSchema" when its first occurrence is as array items.

When `bundle()` deduplicates an external schema that is referenced in multiple places, it creates internal `$ref` pointers like `#/paths/~1proposals/get/.../schema/items`. The last path segment `items` was incorrectly used as the schema name (producing "itemsSchema" after the plugin suffix). These non-component internal refs are now resolved inline instead.
