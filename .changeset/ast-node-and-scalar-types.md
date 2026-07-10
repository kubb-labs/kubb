---
'@kubb/ast': patch
---

Align the `Node` and scalar schema types with the runtime and fix related docs.

`Node` now includes `TextNode`, `BreakNode`, and `JsxNode` so the union matches `NodeKind` and the `isNode` runtime check that already treats them as nodes. `ScalarSchemaType` no longer includes `ipv4` and `ipv6`, which have their own `Ipv4SchemaNode` and `Ipv6SchemaNode`, so `ScalarSchemaNode` stops overlapping those members. The `VisitorDepth` doc now states that shallow traversal stops at schema subtrees rather than the immediate node, and the `PrinterHandlerContext` example includes its required `base` field.
