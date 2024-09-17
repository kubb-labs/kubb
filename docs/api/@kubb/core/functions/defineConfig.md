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

[config.ts:34](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/config.ts#L34)
