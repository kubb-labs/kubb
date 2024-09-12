[API](../../../packages.md) / [@kubb/core](../index.md) / GetPluginFactoryOptions

# GetPluginFactoryOptions\<TPlugin\>

```ts
type GetPluginFactoryOptions<TPlugin>: TPlugin extends UserPlugin<infer X> ? X : never;
```

## Type Parameters

• **TPlugin** *extends* [`UserPlugin`](UserPlugin.md)

## Defined in

[types.ts:138](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/core/src/types.ts#L138)
