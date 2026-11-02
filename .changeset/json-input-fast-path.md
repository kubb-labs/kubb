---
'@kubb/adapter-oas': patch
---

Parse a JSON spec with `JSON.parse`, about ten times faster than `js-yaml` on the same file. A duplicate key in JSON input now keeps the last value, as every JSON parser does, instead of failing with `KUBB_INVALID_DOCUMENT`. YAML input is unchanged and still rejects duplicate keys.
