[API](../../../packages.md) / [@kubb/core](../index.md) / defineConfig

# defineConfig()

```ts
function defineConfig(options): typeof options
```

Type helper to make it easier to use kubb.config.js
accepts a direct Config object, or a function that returns it.
The function receives a ConfigEnv object that exposes two properties:

## Parameters

• **options**: `PossiblePromise`\<[`UserConfig`](../type-aliases/UserConfig.md) \| [`UserConfig`](../type-aliases/UserConfig.md)[]\> \| (`args`) => `PossiblePromise`\<[`UserConfig`](../type-aliases/UserConfig.md) \| [`UserConfig`](../type-aliases/UserConfig.md)[]\>

## Returns

*typeof* `options`

## Defined in

[config.ts:36](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/core/src/config.ts#L36)
