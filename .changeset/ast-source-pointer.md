---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
'@kubb/core': patch
---

Schema, operation, parameter, request body and response nodes carry a `pointer` back to where they come from in the input, so tools can find a node in the spec without rebuilding the path from its name. Diagnostics on a schema renamed to avoid a name clash now point at its real key, union members point at their `oneOf` or `anyOf` entry, and a crash site points into the input of any adapter. Unsupported formats and deprecated schemas inside parameters, request bodies and responses are now reported too.
