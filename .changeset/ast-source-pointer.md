---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
'@kubb/core': patch
---

Nodes can carry a `pointer` back to where they come from in the input. The OpenAPI adapter sets it on schemas, operations, parameters, request bodies and responses, so tools can find a node in the spec without rebuilding the path from its name. Diagnostics on a schema renamed to avoid a name clash now point at its real key, and a crash site points into the input of any adapter.
