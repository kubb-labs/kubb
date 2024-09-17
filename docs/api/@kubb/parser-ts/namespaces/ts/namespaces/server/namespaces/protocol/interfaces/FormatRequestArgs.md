[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / FormatRequestArgs

# FormatRequestArgs

Arguments for format messages.

## Extends

- [`FileLocationRequestArgs`](FileLocationRequestArgs.md)

## Extended by

- [`ChangeRequestArgs`](ChangeRequestArgs.md)

## Properties

### endLine

```ts
endLine: number;
```

Last line of range for which to format text in file.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1503

***

### endOffset

```ts
endOffset: number;
```

Character offset on last line of range for which to format text in file.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1507

***

### file

```ts
file: string;
```

The file for the request (absolute pathname required).

#### Inherited from

[`FileLocationRequestArgs`](FileLocationRequestArgs.md).[`file`](FileLocationRequestArgs.md#file)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:241

***

### line

```ts
line: number;
```

The line number for the request (1-based).

#### Inherited from

[`FileLocationRequestArgs`](FileLocationRequestArgs.md).[`line`](FileLocationRequestArgs.md#line)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:445

***

### offset

```ts
offset: number;
```

The character offset (on the line) for the request (1-based).

#### Inherited from

[`FileLocationRequestArgs`](FileLocationRequestArgs.md).[`offset`](FileLocationRequestArgs.md#offset)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:449

***

### options?

```ts
optional options: ChangePropertyTypes<FormatCodeSettings, object>;
```

Format options to be used.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1511

***

### projectFileName?

```ts
optional projectFileName: string;
```

#### Inherited from

[`FileLocationRequestArgs`](FileLocationRequestArgs.md).[`projectFileName`](FileLocationRequestArgs.md#projectfilename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:242
