---
'@kubb/adapter-oas': patch
---

Generate named enum declarations for enum elements inside tuples (`prefixItems`). Previously, enum values in tuple positions were inlined as literal unions. Now they emit standalone `as const` enum exports (e.g., `addressIdentifierEnum` / `AddressIdentifierEnumKey`) matching v4 behavior. Also restores `...any[]` rest element when `items` is absent alongside `prefixItems`.
