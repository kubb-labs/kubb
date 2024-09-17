[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / DiagnosticWithFileName

# DiagnosticWithFileName

Item of diagnostic information found in a DiagnosticEvent message.

## Extends

- [`Diagnostic`](Diagnostic.md)

## Properties

### category

```ts
category: string;
```

The category of the diagnostic message, e.g. "error", "warning", or "suggestion".

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`category`](Diagnostic.md#category)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1942

***

### code?

```ts
optional code: number;
```

The error code of the diagnostic message.

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`code`](Diagnostic.md#code)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1952

***

### end

```ts
end: Location;
```

The last file location at which the text applies.

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`end`](Diagnostic.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1934

***

### fileName

```ts
fileName: string;
```

Name of the file the diagnostic is in

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1962

***

### relatedInformation?

```ts
optional relatedInformation: DiagnosticRelatedInformation[];
```

Any related spans the diagnostic may have, such as other locations relevant to an error, such as declarartion sites

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`relatedInformation`](Diagnostic.md#relatedinformation)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1948

***

### reportsDeprecated?

```ts
optional reportsDeprecated: object;
```

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`reportsDeprecated`](Diagnostic.md#reportsdeprecated)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1944

***

### reportsUnnecessary?

```ts
optional reportsUnnecessary: object;
```

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`reportsUnnecessary`](Diagnostic.md#reportsunnecessary)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1943

***

### source?

```ts
optional source: string;
```

The name of the plugin reporting the message.

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`source`](Diagnostic.md#source)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1956

***

### start

```ts
start: Location;
```

Starting file location at which text applies.

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`start`](Diagnostic.md#start)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1930

***

### text

```ts
text: string;
```

Text of diagnostic message.

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`text`](Diagnostic.md#text)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1938
