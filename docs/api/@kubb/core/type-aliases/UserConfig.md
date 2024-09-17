[API](../../../packages.md) / [@kubb/core](../index.md) / UserConfig

# UserConfig

```ts
type UserConfig: Omit<Config, "root" | "plugins"> & object;
```

Config used in `kubb.config.js`

## Type declaration

### plugins?

```ts
optional plugins: Omit<UnknownUserPlugin, "context">[];
```

Plugin type should be a Kubb plugin

### root?

```ts
optional root: string;
```

Project root directory. Can be an absolute path, or a path relative from
the location of the config file itself.

#### Default

```ts
process.cwd()
```

## Example

```ts
import { defineConfig } from '@kubb/core'
export default defineConfig({
...
})
```

## Defined in

[types.ts:17](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/core/src/types.ts#L17)
