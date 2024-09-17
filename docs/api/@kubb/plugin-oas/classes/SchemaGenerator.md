[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / SchemaGenerator

# SchemaGenerator\<TOptions, TPluginOptions, TFileMeta\>

Abstract class that contains the building blocks for plugins to create their own Generator

## Link

idea based on https://github.com/colinhacks/zod/blob/master/src/types.ts#L137

## Extends

- [`BaseGenerator`](../../core/classes/BaseGenerator.md)\<`TOptions`, `Context`\<`TOptions`, `TPluginOptions`\>\>

## Type Parameters

• **TOptions** *extends* [`SchemaGeneratorOptions`](../type-aliases/SchemaGeneratorOptions.md) = [`SchemaGeneratorOptions`](../type-aliases/SchemaGeneratorOptions.md)

• **TPluginOptions** *extends* [`PluginFactoryOptions`](../../core/type-aliases/PluginFactoryOptions.md) = [`PluginFactoryOptions`](../../core/type-aliases/PluginFactoryOptions.md)

• **TFileMeta** *extends* [`FileMetaBase`](../../core/type-aliases/FileMetaBase.md) = [`FileMetaBase`](../../core/type-aliases/FileMetaBase.md)

## Constructors

### new SchemaGenerator()

```ts
new SchemaGenerator<TOptions, TPluginOptions, TFileMeta>(options?, context?): SchemaGenerator<TOptions, TPluginOptions, TFileMeta>
```

#### Parameters

• **options?**: `TOptions`

• **context?**: `Context`\<`TOptions`, `TPluginOptions`\>

#### Returns

[`SchemaGenerator`](SchemaGenerator.md)\<`TOptions`, `TPluginOptions`, `TFileMeta`\>

#### Inherited from

[`BaseGenerator`](../../core/classes/BaseGenerator.md).[`constructor`](../../core/classes/BaseGenerator.md#constructors)

#### Defined in

[core/src/BaseGenerator.ts:9](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/BaseGenerator.ts#L9)

## Properties

### refs

```ts
refs: Refs = {};
```

#### Defined in

[plugin-oas/src/SchemaGenerator.ts:73](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/plugin-oas/src/SchemaGenerator.ts#L73)

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

[core/src/BaseGenerator.ts:25](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/BaseGenerator.ts#L25)

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

[core/src/BaseGenerator.ts:21](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/BaseGenerator.ts#L21)

## Methods

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

[plugin-oas/src/SchemaGenerator.ts:822](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/plugin-oas/src/SchemaGenerator.ts#L822)

***

### deepSearch()

```ts
deepSearch<T>(tree, keyword): SchemaKeywordMapper[T][]
```

#### Type Parameters

• **T** *extends* keyof [`SchemaKeywordMapper`](../type-aliases/SchemaKeywordMapper.md)

#### Parameters

• **tree**: `undefined` \| [`Schema`](../type-aliases/Schema.md)[]

• **keyword**: `T`

#### Returns

[`SchemaKeywordMapper`](../type-aliases/SchemaKeywordMapper.md)\[`T`\][]

#### Defined in

[plugin-oas/src/SchemaGenerator.ts:92](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/plugin-oas/src/SchemaGenerator.ts#L92)

***

### find()

```ts
find<T>(tree, keyword): undefined | SchemaKeywordMapper[T]
```

#### Type Parameters

• **T** *extends* keyof [`SchemaKeywordMapper`](../type-aliases/SchemaKeywordMapper.md)

#### Parameters

• **tree**: `undefined` \| [`Schema`](../type-aliases/Schema.md)[]

• **keyword**: `T`

#### Returns

`undefined` \| [`SchemaKeywordMapper`](../type-aliases/SchemaKeywordMapper.md)\[`T`\]

#### Defined in

[plugin-oas/src/SchemaGenerator.ts:96](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/plugin-oas/src/SchemaGenerator.ts#L96)

***

### parse()

```ts
parse(props): Schema[]
```

Creates a type node from a given schema.
Delegates to getBaseTypeFromSchema internally and
optionally adds a union with null.

#### Parameters

• **props**: `SchemaProps`

#### Returns

[`Schema`](../type-aliases/Schema.md)[]

#### Defined in

[plugin-oas/src/SchemaGenerator.ts:83](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/plugin-oas/src/SchemaGenerator.ts#L83)

***

### schema()

```ts
schema(
   name, 
   object, 
options): SchemaMethodResult<TFileMeta>
```

Schema

#### Parameters

• **name**: `string`

• **object**: [`SchemaObject`](../../oas/type-aliases/SchemaObject.md)

• **options**: `TOptions`

#### Returns

[`SchemaMethodResult`](../type-aliases/SchemaMethodResult.md)\<`TFileMeta`\>

#### Defined in

[plugin-oas/src/SchemaGenerator.ts:875](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/plugin-oas/src/SchemaGenerator.ts#L875)

***

### deepSearch()

```ts
static deepSearch<T>(tree, keyword): SchemaKeywordMapper[T][]
```

#### Type Parameters

• **T** *extends* keyof [`SchemaKeywordMapper`](../type-aliases/SchemaKeywordMapper.md)

#### Parameters

• **tree**: `undefined` \| [`Schema`](../type-aliases/Schema.md)[]

• **keyword**: `T`

#### Returns

[`SchemaKeywordMapper`](../type-aliases/SchemaKeywordMapper.md)\[`T`\][]

#### Defined in

[plugin-oas/src/SchemaGenerator.ts:100](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/plugin-oas/src/SchemaGenerator.ts#L100)

***

### find()

```ts
static find<T>(tree, keyword): undefined | SchemaKeywordMapper[T]
```

#### Type Parameters

• **T** *extends* keyof [`SchemaKeywordMapper`](../type-aliases/SchemaKeywordMapper.md)

#### Parameters

• **tree**: `undefined` \| [`Schema`](../type-aliases/Schema.md)[]

• **keyword**: `T`

#### Returns

`undefined` \| [`SchemaKeywordMapper`](../type-aliases/SchemaKeywordMapper.md)\[`T`\]

#### Defined in

[plugin-oas/src/SchemaGenerator.ts:184](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/plugin-oas/src/SchemaGenerator.ts#L184)

***

### findInObject()

```ts
static findInObject<T>(tree, keyword): undefined | SchemaKeywordMapper[T]
```

#### Type Parameters

• **T** *extends* keyof [`SchemaKeywordMapper`](../type-aliases/SchemaKeywordMapper.md)

#### Parameters

• **tree**: `undefined` \| [`Schema`](../type-aliases/Schema.md)[]

• **keyword**: `T`

#### Returns

`undefined` \| [`SchemaKeywordMapper`](../type-aliases/SchemaKeywordMapper.md)\[`T`\]

#### Defined in

[plugin-oas/src/SchemaGenerator.ts:156](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/plugin-oas/src/SchemaGenerator.ts#L156)
