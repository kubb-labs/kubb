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

[types.ts:242](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/types.ts#L242)
