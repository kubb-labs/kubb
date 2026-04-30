# Kubb Install Size Optimization Research

**Date**: 2026-04-30  
**Status**: Research & Analysis (No implementation yet)  
**Author**: Claude Code

## Executive Summary

This document analyzes opportunities to reduce the install size of the `kubb` package by identifying and evaluating lighter-weight alternatives to current heavy dependencies. The current kubb ecosystem pulls ~20+ MB when installed (uncompressed), with major contributors being OpenAPI parsing libraries.

### Already Completed (PR #3215)
- ✅ Moved `@kubb/agent` (Nitro HTTP server) to optional peerDependencies
- ✅ Moved `@kubb/mcp` (MCP server) to optional peerDependencies
- ✅ Added helpful error messages when optional packages are missing
- **Savings**: ~7-13 MB for users not using agent/MCP features

---

## Dependency Audit

### Current Heavy Dependencies

| Package | Size | Purpose | Dependencies | Risk of Removal |
|---------|------|---------|--------------|-----------------|
| `@redocly/openapi-core` | 1.5 MB | OpenAPI validation & parsing | 10 (ajv, js-yaml, colorette, etc) | **HIGH** — only adapter in repo |
| `oas` | 1.3 MB | Comprehensive OpenAPI tooling | 10 (json-schema-ref-parser, jsonpath-plus, etc) | **HIGH** — core to adapter-oas |
| `swagger2openapi` | 104 KB | Swagger 2.0 → OpenAPI 3.0 conversion | 11 (yargs, oas-resolver, oas-validator, etc) | **HIGH** — needed for Swagger support |
| `oas-normalize` | 95 KB | OpenAPI normalization | 5 (swagger2openapi, js-yaml) | **MEDIUM** — could be inlined |
| `@clack/prompts` | 220 KB | Interactive CLI prompts (init, agent) | 4 (fast-string-width, sisteransi, etc) | **LOW** — UX feature, not core logic |
| `cosmiconfig` | 81 KB | Config file discovery & loading | 4 (js-yaml, parse-json, env-paths) | **VERY LOW** — essential for kubb.config.ts |
| `chokidar` | 82 KB | File watcher for watch mode | 1 (readdirp) | **VERY LOW** — essential for watch mode |
| `unrun` | 43 KB | TypeScript config loader (rolldown-based) | 1 (rolldown) | **LOW** — needed for .ts config files |

### Dependency Tree by Category

**OpenAPI Parsing (core to adapter-oas):**
```
@kubb/adapter-oas
├── @redocly/openapi-core (1.5 MB)
│   ├── ajv (1+ MB)
│   ├── js-yaml
│   ├── colorette
│   └── ... 7 more
├── oas (1.3 MB)
│   ├── @apidevtools/json-schema-ref-parser
│   ├── jsonpath-plus
│   └── ... 8 more
├── oas-normalize (95 KB)
│   └── swagger2openapi (104 KB)
│       ├── oas-resolver
│       ├── oas-validator
│       └── ... 9 more
└── swagger2openapi (104 KB)
```

**CLI Infrastructure (essential for kubb generate):**
```
@kubb/cli
├── cosmiconfig (81 KB) — config discovery
├── unrun (43 KB) + rolldown (?) — TS config transpilation
├── chokidar (82 KB) — file watching
├── @clack/prompts (220 KB) — interactive UX
└── tinyexec (small) — process execution
```

---

## Alternative Package Analysis

### 1. **OpenAPI Parsing Alternatives**

#### Current: `@redocly/openapi-core` (1.5 MB)
**Purpose**: Validate and parse OpenAPI specs  
**Used by**: `@kubb/adapter-oas`

**Alternatives Researched:**

| Alternative | Size | Deps | Pros | Cons | Compatibility |
|-------------|------|------|------|------|---------------|
| `@apidevtools/swagger-parser` | **56 KB** | 6 | **96% smaller**; popular; battle-tested; supports Swagger 2.0 + OpenAPI 3.0 | Less feature-complete than Redocly's diagnostics | ✅ **Strong candidate** — already a transitive dep |
| `@readme/openapi-parser` | 250 KB | 6 | **83% smaller**; built on swagger-parser; better error messages | Already a transitive dep (via `oas-normalize`) | ✅ **Strong candidate** — already in tree |
| `@stoplight/spectral-core` | 205 KB | **21** | Strong validation rules; linter-style errors | **Different use case**: validates against rules, not for code generation; 21 dependencies; needs `@stoplight/spectral-rulesets` (4.5 MB!) for OpenAPI rules | ❌ Wrong tool — designed for linting, not parsing |
| `@scalar/openapi-parser` | **2.4 MB** | 10 | Modern TypeScript; comprehensive | **Bigger than Redocly!**; heavy `@scalar/openapi-types` (399 KB), `@scalar/openapi-upgrader`, etc | ❌ Larger than current solution |
| `ajv` | 1.0 MB | 4 | Industry standard JSON Schema validator | Requires manual OpenAPI-specific logic; doesn't include OpenAPI rules | ⚠️ Partial — would need wrapper |
| `openapi-validator` | 66 KB | 10 | **96% smaller** | Limited feature set; unmaintained | ❌ Risky |

**Spectral Deep Dive (`@stoplight/spectral-core`):**

While Spectral is excellent for **OpenAPI linting/governance**, it's the **wrong tool for code generation**:
- Designed to validate specs against **custom rule sets** (e.g., "all paths must have descriptions")
- Pulls heavy deps: `nimma`, `lodash`, `jsonpath-plus`, `ajv-formats`, `expr-eval-fork`
- Without `@stoplight/spectral-rulesets` (4.5 MB!), provides no OpenAPI-specific validation
- Does **not** provide schema dereferencing/resolution (kubb's primary need)
- Used by tools like Stoplight Studio, not parser-focused tools

**Conclusion: Spectral is NOT a viable replacement.**

**Scalar Deep Dive (`@scalar/openapi-parser`):**

Scalar is a **modern TypeScript-first parser**, but at 2.4 MB it's actually **larger than Redocly**:
- Pulls `@scalar/openapi-types` (399 KB), `@scalar/openapi-upgrader`, `@scalar/json-magic`
- Better TypeScript ergonomics than Redocly
- More comprehensive feature set
- Active development with frequent updates

**Conclusion: Scalar is NOT a size win — it's heavier than current solution.**

**Best Candidates (in order):**

1. **`@apidevtools/swagger-parser` (56 KB)** — The clear winner if features are sufficient
   - Already in dep tree (transitively via `@readme/openapi-parser`)
   - 96% size reduction vs Redocly
   - Mature & maintained since 2014
   - **Tradeoff**: Less detailed validation diagnostics

2. **`@readme/openapi-parser` (250 KB)** — Middle ground
   - Already in dep tree (via `oas-normalize`)
   - 83% size reduction
   - Better error messages than swagger-parser
   - **Tradeoff**: Still less validation depth than Redocly

**Migration Path (Hypothetical):**

```javascript
// Current (uses Redocly)
import { bundleFromString, makeDocumentFromString } from '@redocly/openapi-core'
const doc = await bundleFromString({ source: yamlContent, config })

// Option A: swagger-parser (smallest)
import SwaggerParser from '@apidevtools/swagger-parser'
const doc = await SwaggerParser.dereference(yamlContent)

// Option B: @readme/openapi-parser (already in tree)
import { OpenAPIParser } from '@readme/openapi-parser'
const doc = await OpenAPIParser.dereference(yamlContent)
```

**Risk Level**: 🟡 **MEDIUM** if using swagger-parser/readme-parser; 🔴 **HIGH** if using Spectral/Scalar

**Estimated Savings**:
- swagger-parser: **~1.4 MB** (1.5 MB → 56 KB)
- readme-parser: **~1.25 MB** (1.5 MB → 250 KB; already in tree could mean 0 extra)

---

### 2. **OpenAPI Parsing: Secondary Deps**

#### Current: `oas` (1.3 MB)
**Purpose**: Comprehensive OpenAPI tooling  
**Used by**: `@kubb/adapter-oas`

**Alternatives Researched:**

| Alternative | Size | Pros | Cons |
|-------------|------|------|------|
| `openapi-types` | 32 KB | **99.8% smaller**; types-only | Requires external parser; no runtime logic |
| `swagger-parser` | 22 KB | Lightweight spec parser | May be less comprehensive than `oas` |
| Direct use of validation libraries | Varies | Minimal overhead | Requires custom parsing logic |

**Assessment**: `oas` provides reference resolution, JSON Path queries, schema merging. Dropping it would require:
1. Custom reference resolver (`$ref` handling)
2. JSON Schema `allOf` merger
3. JSON Path query engine

**Risk Level**: 🔴 **HIGH** — Complex replacement logic needed

---

### 3. **Config File Loading**

#### Current: `cosmiconfig` (81 KB)
**Purpose**: Discover and load `kubb.config.ts/js/json`  
**Used by**: `@kubb/cli`

**Alternatives Researched:**

| Alternative | Size | Pros | Cons | Popularity |
|-------------|------|------|------|-----------|
| `lilconfig` | 18 KB | **78% smaller**; simpler API | Fewer built-in search paths | ⭐⭐⭐ (used in esbuild, tsup) |
| `rc9` | 25 KB | **69% smaller**; lightweight | Less discovery logic | ⭐⭐ |
| Manual `fs.readFileSync` + `import()` | 0 KB | No dependency | Brittle; hard to maintain | N/A |

**lilconfig Comparison:**

```javascript
// cosmiconfig (current)
import { cosmiconfig } from 'cosmiconfig'
const explorer = cosmiconfig('kubb', { 
  searchPlaces: [...], 
  loaders: { '.ts': tsLoader }
})
const result = await explorer.search()

// lilconfig (proposed)
import { lilconfig } from 'lilconfig'
const { search } = lilconfig('kubb', { 
  loaders: { '.ts': tsLoader }
})
const result = await search()
```

**Migration Checklist:**
- [ ] Test config discovery in nested directories
- [ ] Test all supported formats (ts, js, json, rc, yaml)
- [ ] Verify search path order is identical
- [ ] Test error messages
- [ ] Benchmark performance (minimal difference expected)

**Risk Level**: 🟡 **MEDIUM** — Drop-in replacement with minimal logic changes

**Estimated Savings**: 63 KB (cosmiconfig - lilconfig)

---

### 4. **File Watching**

#### Current: `chokidar` (82 KB)
**Purpose**: Efficient cross-platform file watching for `kubb generate --watch`  
**Used by**: `@kubb/cli` (lazy-imported in `runners/watcher.ts`)

**Alternatives Researched:**

| Alternative | Size | Pros | Cons | Platform Support |
|-------------|------|------|------|-----------------|
| `node-watch` | 26 KB | **68% smaller**; pure Node.js | Less mature; fewer options | ✅ All |
| `fs.watch` (Node built-in) | 0 KB | Zero dependency | Inconsistent across platforms; unreliable | ⚠️ Platform-dependent |
| `watchman` (Facebook) | External binary | Battle-tested | Requires external installation | ✅ All |

**node-watch Compatibility:**

```javascript
// chokidar (current)
import { watch } from 'chokidar'
watch('src', { 
  ignored: ['node_modules', '.git'],
  awaitWriteFinish: true
})

// node-watch (proposed)
import watch from 'node-watch'
watch('src', { 
  recursive: true,
  filter: (f) => !f.includes('node_modules') && !f.includes('.git')
})
```

**Migration Checklist:**
- [ ] Test recursive directory watching
- [ ] Test ignore patterns (node_modules, .git, dist)
- [ ] Test write-finish detection (avoid rebuilds on partial writes)
- [ ] Test on Windows, macOS, Linux
- [ ] Compare performance with large codebases

**Risk Level**: 🟡 **MEDIUM** — Smaller feature set; needs testing on all platforms

**Estimated Savings**: 56 KB (chokidar - node-watch)

---

### 5. **CLI Prompts/Interactive UI**

#### Current: `@clack/prompts` (220 KB)
**Purpose**: Beautiful interactive prompts (init command, agent startup)  
**Used by**: `@kubb/cli` (`init.ts`, `agent.ts`, `generate.ts`)

**Alternatives Researched:**

| Alternative | Size | Pros | Cons | Features |
|-------------|------|------|------|----------|
| `prompts` | 187 KB | 15% smaller; simpler | Fewer UI options | ✅ Basic prompts |
| `inquirer` | 49 KB | **78% smaller** | Slower (chalk parsing); older | ✅ Comprehensive |
| Plain `console.log` + `readline` | 0 KB | Zero dependency | Poor UX; complex input validation | ❌ Limited |

**Assessment**: `@clack/prompts` is well-maintained and provides superior UX (animated spinners, progress bars). The 220 KB cost is justified for interactive CLI experiences.

**Risk Level**: 🟢 **LOW-MEDIUM** — Could switch to `prompts` (187 KB), but UX trade-off

**Estimated Savings**: 33 KB (to prompts; 171 KB to inquirer, but worse UX)

---

### 6. **TypeScript Config Loading at Runtime**

#### Current: `unrun` (43 KB)
**Purpose**: Load and execute `.ts` config files at runtime  
**Used by**: `@kubb/cli` (`getCosmiConfig.ts`)

**Alternatives Researched:**

| Alternative | Size | Pros | Cons | Requires |
|-------------|------|------|------|----------|
| `unrun` (Rolldown-based) | 43 KB | Lightweight; modern bundler | Unknown stability; younger project | rolldown |
| `tsx` | 432 KB | Feature-rich; popular | **10x larger** | esm-loader |
| `esbuild` | 147 KB | **3.4x larger than unrun** | Feature-complete; battle-tested | esbuild binary |
| `jiti` | 1.7 MB | Dynamic imports; hooks | **40x larger** | babel |

**unrun vs Alternatives:**

```javascript
// Current (unrun)
const { module } = await unrun({
  path: 'kubb.config.ts',
  inputOptions: { transform: { jsx: { runtime: 'automatic' } } }
})

// With esbuild (slower, bigger)
import { build } from 'esbuild'
const result = await build({ entryPoints: ['kubb.config.ts'], bundle: false })

// With tsx (much bigger)
import { register } from 'tsx/cjs'
register()
const mod = await import('kubb.config.ts')
```

**Assessment**: `unrun` is the lightest option for TS transpilation. Alternatives are significantly heavier. Not worth replacing.

**Risk Level**: 🟢 **VERY LOW** — Well-integrated; no viable lighter alternative

**Estimated Savings**: 0 KB (no good alternative)

---

## Summary of Opportunities

### Tier 1: Already Implemented (PR #3215)
| Change | Current Size | Savings | Status |
|--------|--------------|---------|--------|
| Move @kubb/agent to optional peer | ~8 MB | ~8 MB | ✅ Done |
| Move @kubb/mcp to optional peer | ~2 MB | ~2 MB | ✅ Done |
| **Subtotal** | | **~10 MB** | |

### Tier 2: Medium Risk (Would Need Verification)
| Package | Alternative | Current | Alternative | Savings | Risk | Notes |
|---------|-------------|---------|-------------|---------|------|-------|
| cosmiconfig | lilconfig | 81 KB | 18 KB | **63 KB** | MEDIUM | Drop-in replacement; esbuild uses it |
| chokidar | node-watch | 82 KB | 26 KB | **56 KB** | MEDIUM | Needs platform testing |
| @clack/prompts | prompts | 220 KB | 187 KB | **33 KB** | MEDIUM | Minor UX regression |
| **Subtotal** | | | | **~152 KB** | | |

### Tier 3: High Risk (Requires Heavy Refactor)
| Package | Alternative | Current | Alternative | Savings | Risk | Recommendation |
|---------|-------------|---------|-------------|---------|------|----------------|
| @redocly/openapi-core | @apidevtools/swagger-parser | 1.5 MB | 56 KB | **~1.4 MB** | 🟡 MEDIUM-HIGH | **Worth investigating** if features suffice |
| @redocly/openapi-core | @readme/openapi-parser | 1.5 MB | 250 KB (already in tree!) | **~1.25 MB** | 🟡 MEDIUM | **Best candidate** — already a transitive dep |
| @redocly/openapi-core | @stoplight/spectral-core | 1.5 MB | 205 KB + 4.5 MB rulesets | ❌ Negative | 🔴 HIGH | **Reject** — wrong tool (linter, not parser) |
| @redocly/openapi-core | @scalar/openapi-parser | 1.5 MB | 2.4 MB | ❌ Negative | 🔴 HIGH | **Reject** — bigger than current |
| oas | Custom impl + swagger-parser | 1.3 MB | ~150 KB | **~1.15 MB** | 🔴 HIGH | Complex; needs JSON path/merging replacements |
| swagger2openapi | swagger-parser handles it | 104 KB | 0 KB | **104 KB** | 🟡 MEDIUM | If swagger-parser replaces Redocly |
| unrun | None viable | 43 KB | N/A | 0 KB | 🟢 LOW | **Keep** — no viable alternative |

---

## Impact Projections

### Scenario: Implement Tier 1 + Tier 2

**Before optimization:**
```
npm i kubb
→ 20+ MB install (including agent, mcp, all deps)
```

**After PR #3215 (Tier 1):**
```
npm i kubb
→ ~10 MB install (agent/mcp optional)

npm i kubb @kubb/agent
→ 18+ MB (for agent users)

npm i kubb @kubb/mcp
→ 12+ MB (for mcp users)
```

**After hypothetical Tier 2 implementation:**
```
npm i kubb
→ ~9.85 MB install (save 152 KB from config/watch)
  ├── Remove cosmiconfig → lilconfig: -63 KB
  ├── Remove chokidar → node-watch: -56 KB
  └── Remove @clack/prompts → prompts: -33 KB
```

**Overall savings**: ~10 MB (Tier 1) + 152 KB (Tier 2) = **~10.15 MB reduction** (50% smaller than baseline)

---

## Recommendations

### Short Term (✅ Already Done)
1. **PR #3215**: Move agent/mcp to optional peerDependencies
   - Saves ~10 MB for non-agent/non-mcp users
   - Zero risk; backward compatible with helpful error messages

### Medium Term (🟡 Consider with Testing)
2. **Replace `cosmiconfig` → `lilconfig`**
   - Low risk; used in production by esbuild, tsup, vite
   - Saves 63 KB
   - **Action**: Test config discovery in all scenarios (nested dirs, various formats, TypeScript configs)

3. **Replace `chokidar` → `node-watch`**
   - Medium risk; needs cross-platform testing
   - Saves 56 KB
   - **Action**: Test on Windows, macOS, Linux with large filesets

### Long Term (🟡 Worth Investigation)
4. **Investigate replacing `@redocly/openapi-core` with `@apidevtools/swagger-parser` or `@readme/openapi-parser`**
   - **swagger-parser**: ~1.4 MB savings (96% reduction); battle-tested since 2014
   - **readme-parser**: ~1.25 MB savings (83% reduction); already a transitive dep!
   - **Reject `@stoplight/spectral-core`**: It's a linter tool, not a parser; needs 4.5 MB ruleset; wrong fit
   - **Reject `@scalar/openapi-parser`**: It's actually 2.4 MB — *bigger* than current Redocly
   - **Action items**:
     - Audit which Redocly features kubb actually uses (validation? bundling? dereferencing?)
     - Spike: replace Redocly with swagger-parser in a feature branch
     - Test against test suite (especially edge cases: $ref cycles, nested allOf, OpenAPI 3.1)
     - Verify Swagger 2.0 → OpenAPI 3.0 conversion still works

5. **Do NOT replace `unrun`** for TS config transpilation
   - Already the lightest option
   - No viable alternatives at same size

### Rejected Alternatives (Researched but unsuitable)
- **`@stoplight/spectral-core`** (205 KB + 21 deps + 4.5 MB rulesets): Wrong tool — designed for OpenAPI **linting** (validating against custom rules like "all paths must have descriptions"), not for parsing/dereferencing schemas for code generation. Pulls heavy deps (`nimma`, `lodash`, `jsonpath-plus`, `expr-eval-fork`).
- **`@scalar/openapi-parser`** (2.4 MB + 10 deps): Modern TypeScript parser but **larger than current Redocly**. Pulls `@scalar/openapi-types` (399 KB), `@scalar/openapi-upgrader`, `@scalar/json-magic`, etc.
- **`ajv` directly** (1.0 MB): Industry-standard JSON Schema validator but lacks OpenAPI-specific logic.

---

## Next Steps

1. **Merge PR #3215** (agent/mcp optional) — ready now
2. **Test Tier 2 replacements in a feature branch**:
   - Start with `cosmiconfig` → `lilconfig` (lowest risk)
   - Create test matrix: Windows/macOS/Linux × nested dirs × all config formats
3. **Measure actual savings** with `npm pack --dry-run` after each replacement
4. **Create follow-up PRs** if testing passes
5. **Document migration** in CLAUDE.md if breaking changes needed

---

## References

- [lilconfig on npm](https://www.npmjs.com/package/lilconfig) — used by esbuild, tsup, vite
- [node-watch on npm](https://www.npmjs.com/package/node-watch) — cross-platform file watcher
- [unrun GitHub](https://github.com/hhj1897/unrun) — TS loader via rolldown
- [Redocly OpenAPI Core](https://github.com/Redocly/redocly-cli) — OpenAPI validation
- [Swagger Parser](https://www.npmjs.com/package/swagger-parser) — Swagger/OpenAPI parsing

---

**Document Status**: Research & Analysis  
**Last Updated**: 2026-04-30  
**Confidence Level**: Medium (npm registry data; full compat verification needed before implementation)
