[API](../../../packages.md) / [@kubb/core](../index.md) / GetPluginFactoryOptions

# GetPluginFactoryOptions\<TPlugin\>

```ts
type GetPluginFactoryOptions<TPlugin>: TPlugin extends UserPlugin<infer X> ? X : never;
```

## Type Parameters

• **TPlugin** *extends* [`UserPlugin`](UserPlugin.md)

## Defined in

[types.ts:138](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/types.ts#L138)
