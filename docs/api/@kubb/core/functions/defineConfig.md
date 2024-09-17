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

[config.ts:34](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/config.ts#L34)
