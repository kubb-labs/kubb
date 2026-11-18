---
layout: doc
title: Rollup plugin - Generate code from OpenAPI
description: Add the kubb/rollup plugin to rollup.config.ts so every Rollup build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 8
navigation:
  title: Rollup
  icon: i-simple-icons-rollupdotjs
---

# Generate code from your API spec with Rollup

`kubb/rollup` generates code from your `kubb.config.ts` once, before the Rollup build continues. It ships with `kubb`.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/introduction/installation). Add `@rollup/plugin-typescript`, `tslib`, and `typescript` to your dev dependencies, so Rollup can compile `src/index.ts` and `rollup.config.ts`.

## Add Kubb to `rollup.config.ts`

Pass one config object from your `kubb.config.ts` as `config`, not an array or a function.

```typescript [rollup.config.ts]
import typescript from '@rollup/plugin-typescript'
import kubb from 'kubb/rollup'
import config from './kubb.config.ts'

export default {
  input: 'src/index.ts',
  plugins: [kubb({ config }), typescript()],
}
```

Add `rollup.config.ts` to the `include` of `tsconfig.json`, such as `"include": ["src/**/*", "rollup.config.ts"]`, so the TypeScript plugin can compile it.

## Run the build

Run `rollup -c rollup.config.ts --configPlugin typescript`. Rollup loads only `.js`, `.mjs`, and `.cjs` config files by default, so `--configPlugin typescript` compiles the config first. If Kubb fails, the build fails.

::

[How the build runs Kubb](/docs/5.x/integrations/build-tools#how-the-build-runs-kubb) covers defaults, reports, and watch rebuilds.
