[API](../../../packages.md) / [@kubb/core](../index.md) / ResolvePathParams

# ResolvePathParams\<TOptions\>

```ts
type ResolvePathParams<TOptions>: object;
```

## Type Parameters

• **TOptions** = `object`

## Type declaration

### baseName

```ts
baseName: string;
```

### mode?

```ts
optional mode: KubbFile.Mode;
```

### options?

```ts
optional options: TOptions;
```

Options to be passed to 'resolvePath' 3th parameter

### pluginKey?

```ts
optional pluginKey: Plugin["key"];
```

## Defined in

[types.ts:257](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/core/src/types.ts#L257)
