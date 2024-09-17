[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ModeAwareCache

# ModeAwareCache\<T\>

## Type Parameters

• **T**

## Methods

### delete()

```ts
delete(key, mode): this
```

#### Parameters

• **key**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

#### Returns

`this`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9235

***

### forEach()

```ts
forEach(cb): void
```

#### Parameters

• **cb**

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9237

***

### get()

```ts
get(key, mode): undefined | T
```

#### Parameters

• **key**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

#### Returns

`undefined` \| `T`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9233

***

### has()

```ts
has(key, mode): boolean
```

#### Parameters

• **key**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9236

***

### set()

```ts
set(
   key, 
   mode, 
   value): this
```

#### Parameters

• **key**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

• **value**: `T`

#### Returns

`this`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9234

***

### size()

```ts
size(): number
```

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9238
