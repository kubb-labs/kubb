---
"@kubb/ast": patch
---

Trim type exports that no package in the kubb or plugins ecosystem consumes. The public barrel no
longer re-exports node and helper types that were never imported, two unused node aliases are
removed, and several internal-only types drop their `export`. Runtime behavior is unchanged.
