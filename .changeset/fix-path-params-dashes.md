---
'@kubb/plugin-client': patch
---

Fix path parameters with dashes (e.g., `organization-id`) generating invalid JavaScript like `const organization-id = organizationId`. Parameters with names that are not valid JS identifiers are now skipped in the const declaration since the URL template already uses the camelCased name directly.
