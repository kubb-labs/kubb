---
argument-hint: <path-or-url-to-openapi-spec>
description: Validate an OpenAPI/Swagger specification with Kubb before generating from it.
---

Validate the OpenAPI/Swagger spec at **$ARGUMENTS** using the Kubb MCP server's `validate` tool
(ask for the path or URL if empty).

1. Call the `validate` tool with the spec as `input`.
2. On success, confirm the spec is valid and offer to run `/kubb:init` or `/kubb:generate`.
3. On failure, report the validation errors clearly and, where possible, point at the offending
   part of the spec and suggest a fix.

The `validate` tool requires `@kubb/adapter-oas`. If it is missing, tell the user to install it.
