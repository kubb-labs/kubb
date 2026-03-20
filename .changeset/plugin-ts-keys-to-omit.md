---
"@kubb/plugin-ts": patch
---

Fix `keysToOmit` support in the type generator. The v2 type generator was not forwarding `keysToOmit` to the `Type` component, causing write-only/read-only field omission to be silently ignored. The merged generator now correctly passes `keysToOmit` through to the printer.
