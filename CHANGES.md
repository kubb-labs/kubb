# Biome → oxlint + oxfmt Migration

## What changed

### Dev tooling replaced

| Before | After |
|---|---|
| `@biomejs/biome` | `oxlint ^1.60.0` + `oxfmt ^0.45.0` |
| `biome.json` | `oxlint.config.ts` + `oxfmt.config.ts` |
| `biome format --write` | `oxfmt -c oxfmt.config.ts packages internals configs` |
| `biome lint --write --unsafe` | `oxlint -c oxlint.config.ts --fix ./packages` |

Biome is **not removed as a kubb output option** — users who configure `format: 'biome'` or `lint: 'biome'` in their `kubb.config.ts` are unaffected.

---

### New config files

**`oxfmt.config.ts`** — replaces `.oxfmtrc.json`

```ts
import { defineConfig } from 'oxfmt'

export default defineConfig({
  printWidth: 160,
  trailingComma: 'all',
  semi: false,
  singleQuote: true,
  endOfLine: 'lf',
  // ...
})
```

Formatter output is identical to the old biome formatter settings (single quotes, no semicolons, 160-char line width, LF line endings, trailing commas).

**`oxlint.config.ts`** — replaces `.oxlintrc.json`

```ts
import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['typescript', 'react'],
  // ...
})
```

Uses oxlint 1.60.0 which supports TypeScript config files and exports `defineConfig`. Only the `typescript` and `react` built-in plugins are enabled — these map directly to what biome covered natively.

---

### Rule mapping: biome → oxlint

| Biome rule | oxlint equivalent | Status |
|---|---|---|
| `style.noUselessElse` | `no-else-return` | ✅ mapped |
| `style.useDefaultParameterLast` | `default-param-last` | ✅ mapped |
| `style.useExponentiationOperator` | `prefer-exponentiation-operator` | ✅ mapped |
| `style.useImportType` | `@typescript-eslint/consistent-type-imports` | ✅ mapped |
| `style.noInferrableTypes` | `@typescript-eslint/no-inferrable-types` | ✅ mapped |
| `style.useShorthandFunctionType` | `@typescript-eslint/prefer-function-type` | ✅ mapped |
| `suspicious.noArrayIndexKey` | `react/no-array-index-key` | ✅ mapped |
| `style.useSelfClosingElements` | `react/self-closing-comp` | ✅ mapped |
| `suspicious.noShadowRestrictedNames` | `no-shadow-restricted-names` | ✅ mapped (off) |
| `correctness.noEmptyPattern` | `no-empty-pattern` | ✅ mapped (off) |
| `correctness.noUnsafeOptionalChaining` | `no-unsafe-optional-chaining` | ✅ mapped (off) |
| `correctness.noUnusedPrivateClassMembers` | `no-unused-private-class-members` | ✅ mapped (off) |
| `correctness.noConstructorReturn` | `no-constructor-return` | ✅ mapped (off) |
| `style.useConst` | `prefer-const` | ❌ no oxlint equivalent |
| `style.useTemplate` / `noUnusedTemplateLiteral` | `prefer-template` | ❌ no oxlint equivalent |
| `style.useLiteralEnumMembers` | — | ❌ no oxlint equivalent |
| `style.useAsConstAssertion` | — | ❌ no oxlint equivalent |
| `style.useEnumInitializers` | — | ❌ no oxlint equivalent |
| `style.useSingleVarDeclarator` | — | ❌ no oxlint equivalent |
| `style.useExportType` | — | ❌ no oxlint equivalent |

The ❌ rules have no equivalent in oxlint 1.x. They represent a minor regression in linting coverage compared to biome. TypeScript's own compiler catches most of these at the type level.

---

### Detection order updated

`detectFormatter()` and `detectLinter()` in `internals/utils` now prefer the ox-tools first:

| | Before | After |
|---|---|---|
| Formatter auto-detection | biome → oxfmt → prettier | **oxfmt** → biome → prettier |
| Linter auto-detection | biome → oxlint → eslint | **oxlint** → biome → eslint |

---

### Scripts

Root `package.json`:

```diff
- "format":   "biome format --write ./ && biome check --fix --unsafe"
+ "format":   "oxfmt -c oxfmt.config.ts packages internals configs"

- "lint":     "biome lint ./packages"
+ "lint":     "oxlint -c oxlint.config.ts ./packages"

- "lint:fix": "biome lint --write --unsafe ./packages && manypkg fix"
+ "lint:fix": "oxlint -c oxlint.config.ts --fix ./packages && manypkg fix"
```

Individual package `lint` / `lint:fix` scripts are unchanged (`oxlint .`) — oxlint 1.x auto-discovers the root `oxlint.config.ts` when run from subdirectories.

---

### CI (autofix.yml)

No changes to the autofix workflow steps — it runs `pnpm run format` and `pnpm run lint:fix`, which now invoke oxfmt and oxlint respectively.

---

### Dependencies

```diff
- "@biomejs/biome": "^2.4.12"
- "prettier":       "^3.8.3"
+ "oxfmt":          "^0.45.0"
+ "oxlint":         "^1.60.0"
```

`prettier` is removed from devDependencies entirely. It remains available as a kubb output option (the `prettier` binary is invoked at runtime if the user has it installed).
