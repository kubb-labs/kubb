[API](../../../packages.md) / [@kubb/core](../index.md) / GetPluginFactoryOptions

# GetPluginFactoryOptions\<TPlugin\>

```ts
type GetPluginFactoryOptions<TPlugin>: TPlugin extends UserPlugin<infer X> ? X : never;
```

## Type Parameters

• **TPlugin** *extends* [`UserPlugin`](UserPlugin.md)

## Defined in

[types.ts:138](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/core/src/types.ts#L138)
