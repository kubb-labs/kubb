[API](../../../packages.md) / [@kubb/react](../index.md) / FunctionParams

# FunctionParams

## Constructors

### new FunctionParams()

```ts
new FunctionParams(params): FunctionParams
```

#### Parameters

• **params**: `Params`

#### Returns

[`FunctionParams`](FunctionParams.md)

#### Defined in

[packages/react/src/utils/getFunctionParams.ts:166](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/react/src/utils/getFunctionParams.ts#L166)

## Accessors

### params

```ts
get params(): Params
```

#### Returns

`Params`

#### Defined in

[packages/react/src/utils/getFunctionParams.ts:170](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/react/src/utils/getFunctionParams.ts#L170)

## Methods

### toCall()

```ts
toCall(__namedParameters): string
```

#### Parameters

• **\_\_namedParameters**: `Pick`\<`Options`, `"transformName"` \| `"transformType"`\> = `{}`

#### Returns

`string`

#### Defined in

[packages/react/src/utils/getFunctionParams.ts:174](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/react/src/utils/getFunctionParams.ts#L174)

***

### toConstructor()

```ts
toConstructor(__namedParameters): string
```

#### Parameters

• **\_\_namedParameters** = `...`

• **\_\_namedParameters.valueAsType**: `boolean`

#### Returns

`string`

#### Defined in

[packages/react/src/utils/getFunctionParams.ts:178](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/react/src/utils/getFunctionParams.ts#L178)

***

### factory()

```ts
static factory(params): FunctionParams
```

#### Parameters

• **params**: `Params`

#### Returns

[`FunctionParams`](FunctionParams.md)

#### Defined in

[packages/react/src/utils/getFunctionParams.ts:163](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/react/src/utils/getFunctionParams.ts#L163)
