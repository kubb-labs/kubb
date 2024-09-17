[API](../../../packages.md) / [@kubb/core](../index.md) / PromiseManager

# PromiseManager\<TState\>

## Type Parameters

• **TState** = `any`

## Constructors

### new PromiseManager()

```ts
new PromiseManager<TState>(options): PromiseManager<TState>
```

#### Parameters

• **options**: `Options`\<`TState`\> = `{}`

#### Returns

[`PromiseManager`](PromiseManager.md)\<`TState`\>

#### Defined in

[PromiseManager.ts:15](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/PromiseManager.ts#L15)

## Methods

### run()

```ts
run<TInput, TValue, TStrategy, TOutput>(strategy, promises): TOutput
```

#### Type Parameters

• **TInput** *extends* `PromiseFunc`\<`TValue`, `null`\>[]

• **TValue**

• **TStrategy** *extends* `Strategy`

• **TOutput** = `StrategySwitch`\<`TStrategy`, `TInput`, `TValue`\>

#### Parameters

• **strategy**: `TStrategy`

• **promises**: `TInput`

#### Returns

`TOutput`

#### Defined in

[PromiseManager.ts:21](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/PromiseManager.ts#L21)
