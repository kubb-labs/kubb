[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / DiagnosticWithLocation

# DiagnosticWithLocation

## Extends

- [`Diagnostic`](Diagnostic.md)

## Properties

### category

```ts
category: DiagnosticCategory;
```

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`category`](Diagnostic.md#category)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6857

***

### code

```ts
code: number;
```

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`code`](Diagnostic.md#code)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6858

***

### file

```ts
file: SourceFile;
```

#### Overrides

[`Diagnostic`](Diagnostic.md).[`file`](Diagnostic.md#file)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6865

***

### length

```ts
length: number;
```

#### Overrides

[`Diagnostic`](Diagnostic.md).[`length`](Diagnostic.md#length)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6867

***

### messageText

```ts
messageText: string | DiagnosticMessageChain;
```

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`messageText`](Diagnostic.md#messagetext)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6862

***

### relatedInformation?

```ts
optional relatedInformation: DiagnosticRelatedInformation[];
```

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`relatedInformation`](Diagnostic.md#relatedinformation)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6854

***

### reportsDeprecated?

```ts
optional reportsDeprecated: object;
```

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`reportsDeprecated`](Diagnostic.md#reportsdeprecated)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6852

***

### reportsUnnecessary?

```ts
optional reportsUnnecessary: object;
```

May store more in future. For now, this will simply be `true` to indicate when a diagnostic is an unused-identifier diagnostic.

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`reportsUnnecessary`](Diagnostic.md#reportsunnecessary)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6851

***

### source?

```ts
optional source: string;
```

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`source`](Diagnostic.md#source)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6853

***

### start

```ts
start: number;
```

#### Overrides

[`Diagnostic`](Diagnostic.md).[`start`](Diagnostic.md#start)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6866
