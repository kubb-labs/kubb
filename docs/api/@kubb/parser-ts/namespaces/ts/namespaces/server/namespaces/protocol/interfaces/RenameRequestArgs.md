[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / RenameRequestArgs

# RenameRequestArgs

Argument for RenameRequest request.

## Extends

- [`FileLocationRequestArgs`](FileLocationRequestArgs.md)

## Properties

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

### findInComments?

```ts
optional findInComments: boolean;
```

Should text at specified location be found/changed in comments?

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:957

***

### findInStrings?

```ts
optional findInStrings: boolean;
```

Should text at specified location be found/changed in strings?

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:961

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

### projectFileName?

```ts
optional projectFileName: string;
```

#### Inherited from

[`FileLocationRequestArgs`](FileLocationRequestArgs.md).[`projectFileName`](FileLocationRequestArgs.md#projectfilename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:242
