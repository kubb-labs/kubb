[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / NavigationBarItem

# NavigationBarItem

Navigation bar interface designed for visual studio's dual-column layout.
This does not form a proper tree.
The navbar is returned as a list of top-level items, each of which has a list of child items.
Child items always have an empty array for their `childItems`.

## Properties

### bolded

```ts
bolded: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10309

***

### childItems

```ts
childItems: NavigationBarItem[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10307

***

### grayed

```ts
grayed: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10310

***

### indent

```ts
indent: number;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10308

***

### kind

```ts
kind: ScriptElementKind;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10304

***

### kindModifiers

```ts
kindModifiers: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10305

***

### spans

```ts
spans: TextSpan[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10306

***

### text

```ts
text: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10303
