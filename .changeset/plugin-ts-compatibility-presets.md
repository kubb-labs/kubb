---
"@kubb/plugin-ts": major
---

Replace `legacy` mode with `compatibilityPreset` in `@kubb/plugin-ts`.

- `'none'` (default)
- `'kubbV4'` (full v4 type-generation naming compatibility)

`legacy` is removed from plugin-ts options. Use `compatibilityPreset: 'kubbV4'` for v4-compatible output.

Resolver precedence:

- Base resolver comes from default + selected compatibility preset
- Explicit `resolvers` entries are composed after preset/base and override conflicting methods
