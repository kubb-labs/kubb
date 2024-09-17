[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / WatchOfConfigFile

# WatchOfConfigFile\<T\>

Creates the watch what generates program using the config file

## Extends

- [`Watch`](Watch.md)\<`T`\>

## Type Parameters

• **T**

## Methods

### close()

```ts
close(): void
```

Closes the watch

#### Returns

`void`

#### Inherited from

[`Watch`](Watch.md).[`close`](Watch.md#close)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9800

***

### getProgram()

```ts
getProgram(): T
```

Synchronize with host and get updated program

#### Returns

`T`

#### Inherited from

[`Watch`](Watch.md).[`getProgram`](Watch.md#getprogram)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9798
