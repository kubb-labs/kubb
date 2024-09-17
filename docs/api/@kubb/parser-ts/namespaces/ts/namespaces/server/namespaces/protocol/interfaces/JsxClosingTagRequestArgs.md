[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / JsxClosingTagRequestArgs

# JsxClosingTagRequestArgs

Instances of this interface specify a location in a source file:
(file, line, character offset), where line and character offset are 1-based.

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
