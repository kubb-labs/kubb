---
'@kubb/adapter-oas': minor
'@kubb/ast': minor
---

Keep `servers` declared on a path item or an operation, such as an upload or streaming host. `OperationNode` gets an optional `servers` field from the operation's `servers`, else its path item's, mapped the same way as `InputMeta.servers`: entries without a `url` are dropped and variable defaults are filled in. The field is absent when neither declares servers, so plugins fall back to the document's servers.
