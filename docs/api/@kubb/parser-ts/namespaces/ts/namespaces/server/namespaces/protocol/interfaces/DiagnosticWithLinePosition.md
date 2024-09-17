[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / DiagnosticWithLinePosition

# DiagnosticWithLinePosition

Represents diagnostic info that includes location of diagnostic in two forms
- start position and length of the error span
- startLocation and endLocation - a pair of Location objects that store start/end line and offset of the error span.

## Properties

### category

```ts
category: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:418

***

### code

```ts
code: number;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:419

***

### endLocation

```ts
endLocation: Location;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:417

***

### length

```ts
length: number;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:415

***

### message

```ts
message: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:413

***

### relatedInformation?

```ts
optional relatedInformation: DiagnosticRelatedInformation[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:423

***

### reportsDeprecated?

```ts
optional reportsDeprecated: object;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:422

***

### reportsUnnecessary?

```ts
optional reportsUnnecessary: object;
```

May store more in future. For now, this will simply be `true` to indicate when a diagnostic is an unused-identifier diagnostic.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:421

***

### start

```ts
start: number;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:414

***

### startLocation

```ts
startLocation: Location;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:416
