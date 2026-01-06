---
"@kubb/cli": minor
"@kubb/core": minor
---

Add 'auto' option for output.lint and output.format to automatically detect available tools

**Format Auto-Detection:**
When `format: 'auto'` is set, Kubb automatically detects and uses available formatters in this order: biome → prettier

**Lint Auto-Detection:**
When `lint: 'auto'` is set, Kubb automatically detects and uses available linters in this order: biome → oxlint → eslint

This provides a convenient default for users who want formatting/linting without specifying which tool to use.

```typescript
// kubb.config.ts
export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    format: 'auto', // Detects biome or prettier
    lint: 'auto',   // Detects biome, oxlint, or eslint
  },
})
```
