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

[plugin-oas/src/types.ts:76](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/plugin-oas/src/types.ts#L76)
