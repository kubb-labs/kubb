---
'@kubb/kit': patch
'@kubb/parser-md': patch
'@kubb/studio': patch
---

Mark deprecated kit names, and harden how a Studio agent saves the config and talks to Studio.

- `@kubb/kit`: `kubb.addGenerator` and `kubb.setMacros` on the setup context are marked `@deprecated`, so editors strike them through. `TemplateContext` is now the main type, and `GeneratorContext` is a deprecated alias of it.
- `@kubb/parser-md`: `@kubb/core` and `@kubb/ast` are peer dependencies, as in `@kubb/parser-ts`, so a project no longer installs a second copy of `@kubb/core`.
- `@kubb/studio`: A Studio agent resolves plugins, adapters, and parsers from the project root, where it finds the extensions, instead of the working directory. Saving the config writes a pasted spec before the config, and a spec that fails to write fails only its own edit, so the config never points at a missing file. The Studio user's name in the agent log has escape sequences removed and is capped at 64 characters. Pairing and token refresh requests no longer follow a redirect.
