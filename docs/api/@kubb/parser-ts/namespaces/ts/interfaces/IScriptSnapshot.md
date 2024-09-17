[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / IScriptSnapshot

# IScriptSnapshot

Represents an immutable snapshot of a script at a specified time.Once acquired, the
snapshot is observably immutable. i.e. the same calls with the same parameters will return
the same values.

## Methods

### dispose()?

```ts
optional dispose(): void
```

Releases all resources held by this script snapshot

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9924

***

### getChangeRange()

```ts
getChangeRange(oldSnapshot): undefined | TextChangeRange
```

Gets the TextChangeRange that describe how the text changed between this text and
an older version.  This information is used by the incremental parser to determine
what sections of the script need to be re-parsed.  'undefined' can be returned if the
change range cannot be determined.  However, in that case, incremental parsing will
not happen and the entire document will be re - parsed.

#### Parameters

• **oldSnapshot**: [`IScriptSnapshot`](IScriptSnapshot.md)

#### Returns

`undefined` \| [`TextChangeRange`](TextChangeRange.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9922

***

### getLength()

```ts
getLength(): number
```

Gets the length of this script snapshot.

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9914

***

### getText()

```ts
getText(start, end): string
```

Gets a portion of the script snapshot specified by [start, end).

#### Parameters

• **start**: `number`

• **end**: `number`

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9912
