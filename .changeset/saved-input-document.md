---
'@kubb/studio': patch
---

On connect, a config entry whose input is a document the agent saved with `set-input` (`openapi.yaml`, `openapi.json`, or `openapi-<entry>.*`) now carries its text in a new `document` field. Studio uses it to show a saved spec again after a reload. The agent sends it only with `allowSaveInput`, and never for any other project file.
