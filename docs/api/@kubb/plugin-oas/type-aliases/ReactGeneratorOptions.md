[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / ReactGeneratorOptions

# ReactGeneratorOptions\<TOptions\>

```ts
type ReactGeneratorOptions<TOptions>: object;
```

## Type Parameters

• **TOptions** *extends* [`PluginFactoryOptions`](../../core/type-aliases/PluginFactoryOptions.md)

## Type declaration

### name

```ts
name: string;
```

### Operation()?

```ts
optional Operation: (this, props) => KubbNode;
```

#### Parameters

• **this**: [`ReactGeneratorOptions`](ReactGeneratorOptions.md)\<`TOptions`\>

• **props**: `OperationProps`\<`TOptions`\>

#### Returns

`KubbNode`

### Operations()?

```ts
optional Operations: (this, props) => KubbNode;
```

#### Parameters

• **this**: [`ReactGeneratorOptions`](ReactGeneratorOptions.md)\<`TOptions`\>

• **props**: `OperationsProps`\<`TOptions`\>

#### Returns

`KubbNode`

### render()?

```ts
optional render: () => any;
```

Combine all react nodes and only render ones(to string or render)

#### Returns

`any`

### Schema()?

```ts
optional Schema: (this, props) => KubbNode;
```

#### Parameters

• **this**: [`ReactGeneratorOptions`](ReactGeneratorOptions.md)\<`TOptions`\>

• **props**: `SchemaProps`\<`TOptions`\>

#### Returns

`KubbNode`

## Defined in

[plugin-oas/src/generator.tsx:48](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/generator.tsx#L48)
