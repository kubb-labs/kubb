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

[types.ts:242](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/core/src/types.ts#L242)
