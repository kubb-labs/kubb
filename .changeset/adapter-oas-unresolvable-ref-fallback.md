---
'@kubb/adapter-oas': patch
---

Fall back to `unknown` for a `$ref` that points at a component the document never defines.

A malformed spec can `$ref` a component (for example `#/components/schemas/AppFeeAllocation`) that is missing from `components.schemas`. The parser used to emit a `ref` node for it anyway, so generators produced an import to a module that was never written and the output failed to compile. Such refs now resolve to an `unknown` node, leaving the surrounding schema usable. Registry-less fragments (a minimal `parseSchema` call with no `components`) keep parsing refs leniently, since the target is expected to live outside the fragment.
