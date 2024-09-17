[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / Diagnostic

# Diagnostic

Item of diagnostic information found in a DiagnosticEvent message.

## Extended by

- [`DiagnosticWithFileName`](DiagnosticWithFileName.md)

## Properties

### category

```ts
category: string;
```

The category of the diagnostic message, e.g. "error", "warning", or "suggestion".

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1942

***

### code?

```ts
optional code: number;
```

The error code of the diagnostic message.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1952

***

### end

```ts
end: Location;
```

The last file location at which the text applies.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1934

***

### relatedInformation?

```ts
optional relatedInformation: DiagnosticRelatedInformation[];
```

Any related spans the diagnostic may have, such as other locations relevant to an error, such as declarartion sites

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1948

***

### reportsDeprecated?

```ts
optional reportsDeprecated: object;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1944

***

### reportsUnnecessary?

```ts
optional reportsUnnecessary: object;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1943

***

### source?

```ts
optional source: string;
```

The name of the plugin reporting the message.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1956

***

### start

```ts
start: Location;
```

Starting file location at which text applies.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1930

***

### text

```ts
text: string;
```

Text of diagnostic message.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1938
