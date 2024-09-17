[API](../../../packages.md) / [@kubb/core](../index.md) / GetPluginFactoryOptions

# GetPluginFactoryOptions\<TPlugin\>

```ts
type GetPluginFactoryOptions<TPlugin>: TPlugin extends UserPlugin<infer X> ? X : never;
```

## Type Parameters

• **TPlugin** *extends* [`UserPlugin`](UserPlugin.md)

## Defined in

[types.ts:138](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/types.ts#L138)
