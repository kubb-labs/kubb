[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / GeneratorOptions

# GeneratorOptions\<TOptions\>

```ts
type GeneratorOptions<TOptions>: object;
```

## Type Parameters

• **TOptions** *extends* [`PluginFactoryOptions`](../../core/type-aliases/PluginFactoryOptions.md)

## Type declaration

### name

```ts
name: string;
```

### operation()?

```ts
optional operation: (this, props) => Promise<KubbFile.File[]>;
```

#### Parameters

• **this**: [`GeneratorOptions`](GeneratorOptions.md)\<`TOptions`\>

• **props**: `OperationProps`\<`TOptions`\>

#### Returns

`Promise`\<`KubbFile.File`[]\>

### operations()?

```ts
optional operations: (this, props) => Promise<KubbFile.File[]>;
```

#### Parameters

• **this**: [`GeneratorOptions`](GeneratorOptions.md)\<`TOptions`\>

• **props**: `OperationsProps`\<`TOptions`\>

#### Returns

`Promise`\<`KubbFile.File`[]\>

### schema()?

```ts
optional schema: (this, props) => Promise<KubbFile.File[]>;
```

#### Parameters

• **this**: [`GeneratorOptions`](GeneratorOptions.md)\<`TOptions`\>

• **props**: `SchemaProps`\<`TOptions`\>

#### Returns

`Promise`\<`KubbFile.File`[]\>

## Defined in

[plugin-oas/src/generator.tsx:35](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/generator.tsx#L35)
