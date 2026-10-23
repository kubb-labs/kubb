---
layout: doc
title: Import an OpenAPI spec in TypeScript with openapi-import
description: Import a .openapi.yaml spec in TypeScript with openapi-import and get the types and enums your kubb.config.ts generates, without generated files.
outline: [2, 3]
order: 15
navigation:
  title: openapi-import
  icon: i-simple-icons-typescript
---

# Import an OpenAPI spec in TypeScript with openapi-import

[`openapi-import`](https://github.com/kubb-labs/openapi-import) lets you import a spec like a TypeScript module and get the output of every plugin in your `kubb.config.ts`, without generated files:

```ts
import { type Pet, petStatusEnum } from './petStore.openapi.yaml'
```

It is a [TypeScript content mapper](https://github.com/microsoft/typescript-go/pull/4712), so `tsc` and your editor type-check the plugin output in place of the spec. Go to definition, hover, and rename jump between the generated types and the keys in the spec.

> [!WARNING]
> `openapi-import` is experimental. It needs TypeScript 7.1.0-beta or later with `--runExternalCode`.

::steps{level="2"}

## Install openapi-import

Install it with Kubb, the TypeScript beta, and the plugins your output needs:

:::code-group{sync="package-manager"}

```shell [pnpm]
pnpm add -D kubb openapi-import typescript@beta @kubb/plugin-ts
```

```shell [npm]
npm install -D kubb openapi-import typescript@beta @kubb/plugin-ts
```

:::

With npm, `tsc` runs TypeScript 6, because `@typescript/typescript6` links its `tsc` over the one from `typescript`. Run `node node_modules/typescript/bin/tsc` instead.

## Register the extension

Add the content mapper to `tsconfig.json`. Register `.openapi.yaml` rather than `.yaml`, so files such as `docker-compose.yaml` stay out of the mapper:

```json [tsconfig.json]
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true
  },
  "contentMappers": [{ "package": "openapi-import", "extensions": [".openapi.yaml", ".openapi.yml"] }],
  "include": ["./src/**/*", "./kubb.config.ts"]
}
```

## Choose the plugins

Every `*.openapi.yaml` import gets the output of the plugins in `kubb.config.ts`. Without a config, only `@kubb/plugin-ts` runs:

```ts [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb/config'

export default defineConfig({
  output: { path: './src/gen' },
  plugins: [pluginTs()],
})
```

The mapper finds the config like the CLI does and reloads it when it changes. With several configs, a spec uses the one whose `input` matches it.

## Run the type check

```shell [Terminal]
tsc --noEmit --runExternalCode
```

VS Code only passes `--runExternalCode` in trusted workspaces.

::

## Load the spec at run time

TypeScript does not emit the spec to JavaScript, so values such as `petStatusEnum` need a bundler. Add `kubb()` from any [build tool integration](/docs/5.x/integrations/overview#build-tools) without a `config` option, so it reads the same `kubb.config.ts` as `tsc`:

```ts [vite.config.ts]
import kubb from 'kubb/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [kubb()],
})
```

The types and the values then come from the same import:

```ts [src/pets.ts]
import { type GetPetByIdPath, type GetPetByIdResponse, petStatusEnum } from '../petStore.openapi.yaml'

export async function getAvailablePet({ petId }: GetPetByIdPath): Promise<GetPetByIdResponse | undefined> {
  const response = await fetch(`https://petstore3.swagger.io/api/v3/pet/${petId}`)
  const pet: GetPetByIdResponse = await response.json()

  return pet.status === petStatusEnum.available ? pet : undefined
}
```

A config with an `input` also writes the generated files at build time. Leave `input` out to import specs only.

## Limits

- Code a plugin writes to a separate file, such as a bundled client runtime, is not included. Point imports like the client's `importPath` at a package.
- Files that `kubb.config.ts` imports are not watched. Restart the TypeScript server after you change them.
- A changed spec runs a full Kubb build: about 0.4 s for a 10 KB spec and 2.6 s for a 1.4 MB spec.

## See also

- [Build tool integrations](/docs/5.x/integrations/overview#build-tools)
- [Vite integration](/docs/5.x/integrations/vite)
- [Configuration reference](/docs/5.x/reference/configuration)
- [`openapi-import` on GitHub](https://github.com/kubb-labs/openapi-import), with a working pet-store example
