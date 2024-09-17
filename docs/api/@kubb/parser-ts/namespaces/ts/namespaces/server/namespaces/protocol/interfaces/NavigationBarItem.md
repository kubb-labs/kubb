[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / NavigationBarItem

# NavigationBarItem

## Properties

### childItems?

```ts
optional childItems: NavigationBarItem[];
```

Optional children.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2325

***

### indent

```ts
indent: number;
```

Number of levels deep this item should appear.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2329

***

### kind

```ts
kind: ScriptElementKind;
```

The symbol's kind (such as 'className' or 'parameterName').

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2313

***

### kindModifiers?

```ts
optional kindModifiers: string;
```

Optional modifiers for the kind (such as 'public').

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2317

***

### spans

```ts
spans: TextSpan[];
```

The definition locations of the item.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2321

***

### text

```ts
text: string;
```

The item's display text.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2309
