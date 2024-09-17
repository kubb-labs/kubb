[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ChangeRequestArgs

# ChangeRequestArgs

Arguments for change request message.

## Extends

- [`FormatRequestArgs`](FormatRequestArgs.md)

## Properties

### endLine

```ts
endLine: number;
```

Last line of range for which to format text in file.

#### Inherited from

[`FormatRequestArgs`](FormatRequestArgs.md).[`endLine`](FormatRequestArgs.md#endline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1503

***

### endOffset

```ts
endOffset: number;
```

Character offset on last line of range for which to format text in file.

#### Inherited from

[`FormatRequestArgs`](FormatRequestArgs.md).[`endOffset`](FormatRequestArgs.md#endoffset)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1507

***

### file

```ts
file: string;
```

The file for the request (absolute pathname required).

#### Inherited from

[`FormatRequestArgs`](FormatRequestArgs.md).[`file`](FormatRequestArgs.md#file)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:241

***

### insertString?

```ts
optional insertString: string;
```

Optional string to insert at location (file, line, offset).

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2265

***

### line

```ts
line: number;
```

The line number for the request (1-based).

#### Inherited from

[`FormatRequestArgs`](FormatRequestArgs.md).[`line`](FormatRequestArgs.md#line)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:445

***

### offset

```ts
offset: number;
```

The character offset (on the line) for the request (1-based).

#### Inherited from

[`FormatRequestArgs`](FormatRequestArgs.md).[`offset`](FormatRequestArgs.md#offset)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:449

***

### options?

```ts
optional options: ChangePropertyTypes<FormatCodeSettings, object>;
```

Format options to be used.

#### Inherited from

[`FormatRequestArgs`](FormatRequestArgs.md).[`options`](FormatRequestArgs.md#options)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1511

***

### projectFileName?

```ts
optional projectFileName: string;
```

#### Inherited from

[`FormatRequestArgs`](FormatRequestArgs.md).[`projectFileName`](FormatRequestArgs.md#projectfilename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:242
