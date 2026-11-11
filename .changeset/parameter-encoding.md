---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
---

A parameter described with `content` keeps the `encoding` of its media type on the new `ParameterNode.encoding` field. A plugin can now send an OpenAPI 3.2 `in: querystring` parameter with the `style` and `explode` each field declares.
