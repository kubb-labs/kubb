[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / Resolver

# Resolver

```ts
type Resolver: object;
```

## Type declaration

### baseName

```ts
baseName: KubbFile.BaseName;
```

### name

```ts
name: string;
```

Original name or name resolved by `resolveName({ name: operation?.getOperationId() as string, pluginName })`

### path

```ts
path: KubbFile.Path;
```

## Defined in

[plugin-oas/src/types.ts:82](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/plugin-oas/src/types.ts#L82)
