[API](../../../packages.md) / [@kubb/core](../index.md) / PluginLifecycle

# PluginLifecycle\<TOptions\>

```ts
type PluginLifecycle<TOptions>: object;
```

## Type Parameters

• **TOptions** *extends* [`PluginFactoryOptions`](PluginFactoryOptions.md) = [`PluginFactoryOptions`](PluginFactoryOptions.md)

## Type declaration

### buildEnd()?

```ts
optional buildEnd: (this) => PossiblePromise<void>;
```

End of the plugin lifecycle.

#### Parameters

• **this**: [`PluginContext`](PluginContext.md)\<`TOptions`\>

#### Returns

`PossiblePromise`\<`void`\>

### buildStart()?

```ts
optional buildStart: (this, Config) => PossiblePromise<void>;
```

Start of the lifecycle of a plugin.

#### Parameters

• **this**: [`PluginContext`](PluginContext.md)\<`TOptions`\>

• **Config**: `Config`

#### Returns

`PossiblePromise`\<`void`\>

### resolveName()?

```ts
optional resolveName: (this, name, type?) => string;
```

Resolve to a name based on a string.
Useful when converting to PascalCase or camelCase.

#### Parameters

• **this**: [`PluginContext`](PluginContext.md)\<`TOptions`\>

• **name**: [`ResolveNameParams`](ResolveNameParams.md)\[`"name"`\]

• **type?**: [`ResolveNameParams`](ResolveNameParams.md)\[`"type"`\]

#### Returns

`string`

#### Example

```ts
('pet') => 'Pet'
```

### resolvePath()?

```ts
optional resolvePath: (this, baseName, mode?, options?) => KubbFile.OptionalPath;
```

Resolve to a Path based on a baseName(example: `./Pet.ts`) and directory(example: `./models`).
Options can als be included.

#### Parameters

• **this**: [`PluginContext`](PluginContext.md)\<`TOptions`\>

• **baseName**: `string`

• **mode?**: `KubbFile.Mode`

• **options?**: `TOptions`\[`"resolvePathOptions"`\]

#### Returns

`KubbFile.OptionalPath`

#### Example

```ts
('./Pet.ts', './src/gen/') => '/src/gen/Pet.ts'
```

## Defined in

[types.ts:209](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/types.ts#L209)
