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

[types.ts:278](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/core/src/types.ts#L278)
