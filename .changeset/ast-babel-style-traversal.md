---
'@kubb/ast': minor
---

Adopt a Babel-style traversal architecture in `@kubb/ast`, keeping the node model uniform and minimal.

- Request-body and response content entries are now first-class nodes (`ContentNode`), and the request body is a `RequestBodyNode`, so every child slot in the tree is a node rather than an anonymous wrapper object.
- A single `VISITOR_KEYS`-style child-field registry now drives both `walk`/`collect` traversal and the immutable `transform`, replacing the per-kind hand-written tree-shape logic that previously lived in two places.
- Adds builders `createContent` and `createRequestBody`; `createOperation`/`createResponse` apply them automatically, so adapters and existing call sites need no changes.

Note: a schema reached through a request/response body now reports its `parent` as the enclosing `ContentNode` (previously the `OperationNode`/`ResponseNode`).
