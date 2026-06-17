---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
'@kubb/cli': patch
'@kubb/core': patch
'kubb': patch
'@kubb/mcp': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
'@kubb/plugin-barrel': patch
'@kubb/renderer-jsx': patch
'unplugin-kubb': patch
---

Reframe each package description and its keywords around Kubb. Only the `kubb` meta-package calls itself the meta framework for code generation, and only `@kubb/adapter-oas` still names OpenAPI and Swagger, since that is the package that parses them. The READMEs use the same wording.
