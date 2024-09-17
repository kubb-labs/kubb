[API](../../../packages.md) / [@kubb/core](../index.md) / BaseGenerator

# `abstract` BaseGenerator\<TOptions, TContext\>

Abstract class that contains the building blocks for plugins to create their own Generator

## Link

idea based on https://github.com/colinhacks/zod/blob/master/src/types.ts#L137

## Extended by

## Type Parameters

• **TOptions** = `unknown`

• **TContext** = `unknown`

## Constructors

### new BaseGenerator()

```ts
new BaseGenerator<TOptions, TContext>(options?, context?): BaseGenerator<TOptions, TContext>
```

#### Parameters

• **options?**: `TOptions`

• **context?**: `TContext`

#### Returns

[`BaseGenerator`](BaseGenerator.md)\<`TOptions`, `TContext`\>

#### Defined in

[BaseGenerator.ts:9](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/core/src/BaseGenerator.ts#L9)

## Accessors

### context

```ts
get context(): TContext
```

#### Returns

`TContext`

#### Defined in

[BaseGenerator.ts:25](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/core/src/BaseGenerator.ts#L25)

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

#### Defined in

[BaseGenerator.ts:21](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/core/src/BaseGenerator.ts#L21)

## Methods

### build()

```ts
abstract build(...params): unknown
```

#### Parameters

• ...**params**: `unknown`[]

#### Returns

`unknown`

#### Defined in

[BaseGenerator.ts:33](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/core/src/BaseGenerator.ts#L33)
