---
'@kubb/adapter-oas': minor
'@kubb/ast': minor
---

Normalize every input to OpenAPI 3.1 and drop the 3.0 type union.

`parseDocument` upgrades documents to 3.1 (`upgrade(document, '3.1')`), so Swagger 2.0 and OpenAPI 3.0 inputs keep working, they just upgrade further. The exported `Document`, `SchemaObject`, `OperationObject`, `ResponseObject` and related types are now 3.1 only (`OpenAPIV3_1`). That is breaking for code importing them expecting 3.0 shapes such as `nullable` on a schema.

The AST schema node now carries an `examples` array, populated from the OAS 3.1 `examples`, instead of a singular `example`.

`parseDocument` also loses its `canBundle` option. A string is always a file path or URL to bundle, an object is an already-parsed document.
