[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / OperationGenerator

# OperationGenerator\<TPluginOptions, TFileMeta\>

Abstract class that contains the building blocks for plugins to create their own Generator

## Link

idea based on https://github.com/colinhacks/zod/blob/master/src/types.ts#L137

## Extends

- [`BaseGenerator`](../../core/classes/BaseGenerator.md)\<`TPluginOptions`\[`"resolvedOptions"`\], `Context`\<`TPluginOptions`\[`"resolvedOptions"`\], `TPluginOptions`\>\>

## Type Parameters

• **TPluginOptions** *extends* [`PluginFactoryOptions`](../../core/type-aliases/PluginFactoryOptions.md) = [`PluginFactoryOptions`](../../core/type-aliases/PluginFactoryOptions.md)

• **TFileMeta** *extends* [`FileMetaBase`](../../core/type-aliases/FileMetaBase.md) = [`FileMetaBase`](../../core/type-aliases/FileMetaBase.md)

## Constructors

### new OperationGenerator()

```ts
new OperationGenerator<TPluginOptions, TFileMeta>(options?, context?): OperationGenerator<TPluginOptions, TFileMeta>
```

#### Parameters

• **options?**: `TPluginOptions`\[`"resolvedOptions"`\]

• **context?**: `Context`\<`TPluginOptions`\[`"resolvedOptions"`\], `TPluginOptions`\>

#### Returns

[`OperationGenerator`](OperationGenerator.md)\<`TPluginOptions`, `TFileMeta`\>

#### Inherited from

[`BaseGenerator`](../../core/classes/BaseGenerator.md).[`constructor`](../../core/classes/BaseGenerator.md#constructors)

#### Defined in

[core/src/BaseGenerator.ts:9](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/BaseGenerator.ts#L9)

## Accessors

### context

```ts
get context(): TContext
```

#### Returns

`TContext`

#### Inherited from

[`BaseGenerator`](../../core/classes/BaseGenerator.md).[`context`](../../core/classes/BaseGenerator.md#context)

#### Defined in

[core/src/BaseGenerator.ts:25](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/BaseGenerator.ts#L25)

***

### operationsByMethod

```ts
get operationsByMethod(): OperationsByMethod
```

```ts
set operationsByMethod(paths): void
```

#### Parameters

• **paths**: [`OperationsByMethod`](../type-aliases/OperationsByMethod.md)

#### Returns

[`OperationsByMethod`](../type-aliases/OperationsByMethod.md)

#### Defined in

[plugin-oas/src/OperationGenerator.ts:38](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/OperationGenerator.ts#L38)

***

### options

```ts
get options(): TOptions
```

```ts
set options(options): void
```

#### Parameters

• **options**: `TOptions`

#### Returns

`TOptions`

#### Inherited from

[`BaseGenerator`](../../core/classes/BaseGenerator.md).[`options`](../../core/classes/BaseGenerator.md#options)

#### Defined in

[core/src/BaseGenerator.ts:21](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/BaseGenerator.ts#L21)

## Methods

### all()

```ts
all(operations, paths): OperationMethodResult<TFileMeta>
```

Combination of GET, POST, PATCH, PUT, DELETE

#### Parameters

• **operations**: [`Operation`](../../oas/classes/Operation.md)[]

• **paths**: [`OperationsByMethod`](../type-aliases/OperationsByMethod.md)

#### Returns

[`OperationMethodResult`](../type-aliases/OperationMethodResult.md)\<`TFileMeta`\>

#### Defined in

[plugin-oas/src/OperationGenerator.ts:376](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/OperationGenerator.ts#L376)

***

### build()

```ts
build(...generators): Promise<File<TFileMeta>[]>
```

#### Parameters

• ...**generators**: [`Generator`](../type-aliases/Generator.md)\<`TPluginOptions`\>[]

#### Returns

`Promise`\<`File`\<`TFileMeta`\>[]\>

#### Overrides

[`BaseGenerator`](../../core/classes/BaseGenerator.md).[`build`](../../core/classes/BaseGenerator.md#build)

#### Defined in

[plugin-oas/src/OperationGenerator.ts:230](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/OperationGenerator.ts#L230)

***

### delete()

```ts
delete(operation, options): OperationMethodResult<TFileMeta>
```

DELETE

#### Parameters

• **operation**: [`Operation`](../../oas/classes/Operation.md)

• **options**: `TPluginOptions`\[`"resolvedOptions"`\]

#### Returns

[`OperationMethodResult`](../type-aliases/OperationMethodResult.md)\<`TFileMeta`\>

#### Defined in

[plugin-oas/src/OperationGenerator.ts:369](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/OperationGenerator.ts#L369)

***

### get()

```ts
get(operation, options): OperationMethodResult<TFileMeta>
```

GET

#### Parameters

• **operation**: [`Operation`](../../oas/classes/Operation.md)

• **options**: `TPluginOptions`\[`"resolvedOptions"`\]

#### Returns

[`OperationMethodResult`](../type-aliases/OperationMethodResult.md)\<`TFileMeta`\>

#### Defined in

[plugin-oas/src/OperationGenerator.ts:342](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/OperationGenerator.ts#L342)

***

### getSchemas()

```ts
getSchemas(operation, __namedParameters): OperationSchemas
```

#### Parameters

• **operation**: [`Operation`](../../oas/classes/Operation.md)

• **\_\_namedParameters** = `{}`

• **\_\_namedParameters.resolveName?** = `...`

#### Returns

[`OperationSchemas`](../type-aliases/OperationSchemas.md)

#### Defined in

[plugin-oas/src/OperationGenerator.ts:130](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/OperationGenerator.ts#L130)

***

### operation()

```ts
operation(operation, options): OperationMethodResult<TFileMeta>
```

Operation

#### Parameters

• **operation**: [`Operation`](../../oas/classes/Operation.md)

• **options**: `TPluginOptions`\[`"resolvedOptions"`\]

#### Returns

[`OperationMethodResult`](../type-aliases/OperationMethodResult.md)\<`TFileMeta`\>

#### Defined in

[plugin-oas/src/OperationGenerator.ts:335](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/OperationGenerator.ts#L335)

***

### patch()

```ts
patch(operation, options): OperationMethodResult<TFileMeta>
```

PATCH

#### Parameters

• **operation**: [`Operation`](../../oas/classes/Operation.md)

• **options**: `TPluginOptions`\[`"resolvedOptions"`\]

#### Returns

[`OperationMethodResult`](../type-aliases/OperationMethodResult.md)\<`TFileMeta`\>

#### Defined in

[plugin-oas/src/OperationGenerator.ts:355](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/OperationGenerator.ts#L355)

***

### post()

```ts
post(operation, options): OperationMethodResult<TFileMeta>
```

POST

#### Parameters

• **operation**: [`Operation`](../../oas/classes/Operation.md)

• **options**: `TPluginOptions`\[`"resolvedOptions"`\]

#### Returns

[`OperationMethodResult`](../type-aliases/OperationMethodResult.md)\<`TFileMeta`\>

#### Defined in

[plugin-oas/src/OperationGenerator.ts:349](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/OperationGenerator.ts#L349)

***

### put()

```ts
put(operation, options): OperationMethodResult<TFileMeta>
```

PUT

#### Parameters

• **operation**: [`Operation`](../../oas/classes/Operation.md)

• **options**: `TPluginOptions`\[`"resolvedOptions"`\]

#### Returns

[`OperationMethodResult`](../type-aliases/OperationMethodResult.md)\<`TFileMeta`\>

#### Defined in

[plugin-oas/src/OperationGenerator.ts:362](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/OperationGenerator.ts#L362)
