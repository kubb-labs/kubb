[API](../../../packages.md) / [@kubb/core](../index.md) / defineConfig

# defineConfig()

```ts
function defineConfig(options): typeof options
```

Type helper to make it easier to use vite.config.ts accepts a direct UserConfig object, or a function that returns it. The function receives a ConfigEnv object.

## Parameters

• **options**: `PossiblePromise`\<[`UserConfig`](../type-aliases/UserConfig.md) \| [`UserConfig`](../type-aliases/UserConfig.md)[]\> \| (`args`) => `PossiblePromise`\<[`UserConfig`](../type-aliases/UserConfig.md) \| [`UserConfig`](../type-aliases/UserConfig.md)[]\>

## Returns

*typeof* `options`

## Defined in

[config.ts:34](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/core/src/config.ts#L34)
