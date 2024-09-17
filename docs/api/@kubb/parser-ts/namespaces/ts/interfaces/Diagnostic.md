[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / Diagnostic

# Diagnostic

## Extends

- [`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md)

## Extended by

- [`DiagnosticWithLocation`](DiagnosticWithLocation.md)

## Properties

### category

```ts
category: DiagnosticCategory;
```

#### Inherited from

[`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md).[`category`](DiagnosticRelatedInformation.md#category)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6857

***

### code

```ts
code: number;
```

#### Inherited from

[`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md).[`code`](DiagnosticRelatedInformation.md#code)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6858

***

### file

```ts
file: undefined | SourceFile;
```

#### Inherited from

[`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md).[`file`](DiagnosticRelatedInformation.md#file)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6859

***

### length

```ts
length: undefined | number;
```

#### Inherited from

[`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md).[`length`](DiagnosticRelatedInformation.md#length)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6861

***

### messageText

```ts
messageText: string | DiagnosticMessageChain;
```

#### Inherited from

[`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md).[`messageText`](DiagnosticRelatedInformation.md#messagetext)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6862

***

### relatedInformation?

```ts
optional relatedInformation: DiagnosticRelatedInformation[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6854

***

### reportsDeprecated?

```ts
optional reportsDeprecated: object;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6852

***

### reportsUnnecessary?

```ts
optional reportsUnnecessary: object;
```

May store more in future. For now, this will simply be `true` to indicate when a diagnostic is an unused-identifier diagnostic.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6851

***

### source?

```ts
optional source: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6853

***

### start

```ts
start: undefined | number;
```

#### Inherited from

[`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md).[`start`](DiagnosticRelatedInformation.md#start)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6860
