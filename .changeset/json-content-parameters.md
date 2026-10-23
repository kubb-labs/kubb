---
'@kubb/ast': minor
'@kubb/adapter-oas': minor
---

Support parameters described with `content` instead of `schema`. The parameter type now comes from the schema of its media type instead of `unknown`, and the new `ParameterNode.contentType` field holds that media type, such as `application/json`, so clients can JSON-encode the value.
