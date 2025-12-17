---
'@kubb/oas': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch  
'@kubb/plugin-faker': patch
---

Fix handling of query parameters with explode=true and style=form for objects with additionalProperties. When a query parameter has style: "form", explode: true, and a schema with type: "object" and additionalProperties but no defined properties, the parameter is now correctly flattened to have additionalProperties at the root level instead of being nested as a property. This matches the OpenAPI specification where explode: true causes object properties to be expanded as separate query parameters.
