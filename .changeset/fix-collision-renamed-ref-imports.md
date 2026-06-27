---
"@kubb/adapter-oas": patch
---

Fix `getImports` importing the un-renamed name for collision-renamed schemas.

When two component schemas collide (case-insensitively, or across sources like `schemas` vs `requestBodies`), the schema is renamed (`Order` -> `OrderSchema`) and recorded in `nameMapping`. `getImports` looked that map up with the bare ref segment (`Order`), but its keys are full component pointers (`#/components/schemas/Order`), so every lookup missed and a `$ref` to a renamed schema imported the original name and path — a file the writer never emitted (`TS2307`). The lookup now uses the full `$ref`, so importers stay in sync with the renamed files.
