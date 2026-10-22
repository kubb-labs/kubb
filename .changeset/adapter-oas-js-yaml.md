---
'@kubb/adapter-oas': patch
---

Parse JSON and YAML specs with `js-yaml` before falling back to `yaml`. Loading a 1.4 MB YAML spec drops from about 470 ms to 105 ms. `js-yaml` runs with its core schema, so timestamps stay strings and `<<` stays a plain key, as with `yaml`'s YAML 1.2 defaults. A spec that fails to parse still reports the `yaml` error with its line and column.

JSON specs no longer go through `JSON.parse`, which kept the last of two duplicate keys. A JSON spec with a duplicate key, for example the same path twice, now fails with `KUBB_INVALID_DOCUMENT`, as a YAML spec does.
