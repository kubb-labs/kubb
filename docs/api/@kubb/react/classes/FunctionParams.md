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

[packages/react/src/utils/getFunctionParams.ts:162](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/react/src/utils/getFunctionParams.ts#L162)

## Accessors

### params

```ts
get params(): Params
```

#### Returns

`Params`

#### Defined in

[packages/react/src/utils/getFunctionParams.ts:166](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/react/src/utils/getFunctionParams.ts#L166)

## Methods

### toCall()

```ts
toCall(): string
```

#### Returns

`string`

#### Defined in

[packages/react/src/utils/getFunctionParams.ts:170](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/react/src/utils/getFunctionParams.ts#L170)

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

[packages/react/src/utils/getFunctionParams.ts:174](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/react/src/utils/getFunctionParams.ts#L174)

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

[packages/react/src/utils/getFunctionParams.ts:159](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/react/src/utils/getFunctionParams.ts#L159)
