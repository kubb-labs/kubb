---
argument-hint: <path-or-url-to-openapi-spec>
description: Validate an OpenAPI/Swagger spec with the kubb validate CLI before generating from it.
---

Validate the OpenAPI/Swagger spec at **$ARGUMENTS** by running the `kubb validate` CLI in the
terminal (ask for the path or URL if empty).

1. Run validation:

   ```shell
   npx kubb validate --input <spec>
   ```

   The input accepts a local path or a URL.
2. On success, confirm the spec is valid and offer to run `/kubb:init` or `/kubb:generate`.
3. On failure, report the validation errors clearly and, where possible, point at the offending
   part of the spec and suggest a fix.

Validation needs `@kubb/adapter-oas`. If the command reports it is missing, tell the user to
install it.
