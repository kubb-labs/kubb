[API](../../../packages.md) / [@kubb/core](../index.md) / PluginContext

# PluginContext\<TOptions\>

```ts
type PluginContext<TOptions>: object;
```

## Type Parameters

• **TOptions** *extends* [`PluginFactoryOptions`](PluginFactoryOptions.md) = [`PluginFactoryOptions`](PluginFactoryOptions.md)

## Type declaration

### addFile()

```ts
addFile: (...file) => Promise<KubbFile.ResolvedFile[]>;
```

#### Parameters

• ...**file**: `KubbFile.File`[]

#### Returns

`Promise`\<`KubbFile.ResolvedFile`[]\>

### config

```ts
config: Config;
```

### fileManager

```ts
fileManager: FileManager;
```

### logger

```ts
logger: Logger;
```

### plugin

```ts
plugin: Plugin<TOptions>;
```

Current plugin

### pluginManager

```ts
pluginManager: PluginManager;
```

### plugins

```ts
plugins: Plugin[];
```

All plugins

### resolveName()

```ts
resolveName: (params) => string;
```

#### Parameters

• **params**: [`ResolveNameParams`](ResolveNameParams.md)

#### Returns

`string`

### resolvePath()

```ts
resolvePath: (params) => KubbFile.OptionalPath;
```

#### Parameters

• **params**: [`ResolvePathParams`](ResolvePathParams.md)\<`TOptions`\[`"resolvePathOptions"`\]\>

#### Returns

`KubbFile.OptionalPath`

## Defined in

[types.ts:263](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/types.ts#L263)
