[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ReferencesResponseItem

# ReferencesResponseItem

Object found in response messages defining a span of text in a specific source file.

## Extends

- [`FileSpanWithContext`](FileSpanWithContext.md)

## Properties

### contextEnd?

```ts
optional contextEnd: Location;
```

#### Inherited from

[`FileSpanWithContext`](FileSpanWithContext.md).[`contextEnd`](FileSpanWithContext.md#contextend)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:772

***

### contextStart?

```ts
optional contextStart: Location;
```

#### Inherited from

[`FileSpanWithContext`](FileSpanWithContext.md).[`contextStart`](FileSpanWithContext.md#contextstart)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:771

***

### end

```ts
end: Location;
```

One character past last character of the definition.

#### Inherited from

[`FileSpanWithContext`](FileSpanWithContext.md).[`end`](FileSpanWithContext.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:750

***

### file

```ts
file: string;
```

File containing text span.

#### Inherited from

[`FileSpanWithContext`](FileSpanWithContext.md).[`file`](FileSpanWithContext.md#file)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:759

***

### isDefinition?

```ts
optional isDefinition: boolean;
```

Present only if the search was triggered from a declaration.
True indicates that the references refers to the same symbol
(i.e. has the same meaning) as the declaration that began the
search.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:905

***

### isWriteAccess

```ts
isWriteAccess: boolean;
```

True if reference is a write location, false otherwise.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:898

***

### lineText?

```ts
optional lineText: string;
```

Text of line containing the reference. Including this
with the response avoids latency of editor loading files
to show text of reference line (the server already has loaded the referencing files).

If [UserPreferences.disableLineTextInReferences](UserPreferences.md#disablelinetextinreferences) is enabled, the property won't be filled

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:894

***

### start

```ts
start: Location;
```

First character of the definition.

#### Inherited from

[`FileSpanWithContext`](FileSpanWithContext.md).[`start`](FileSpanWithContext.md#start)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:746
