[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / NavigationTree

# NavigationTree

Node in a tree of nested declarations in a file.
The top node is always a script or module node.

## Properties

### childItems?

```ts
optional childItems: NavigationTree[];
```

Present if non-empty

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10329

***

### kind

```ts
kind: ScriptElementKind;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10319

***

### kindModifiers

```ts
kindModifiers: string;
```

ScriptElementKindModifier separated by commas, e.g. "public,abstract"

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10321

***

### nameSpan

```ts
nameSpan: undefined | TextSpan;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10327

***

### spans

```ts
spans: TextSpan[];
```

Spans of the nodes that generated this declaration.
There will be more than one if this is the result of merging.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10326

***

### text

```ts
text: string;
```

Name of the declaration, or a short description, e.g. "<class>".

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10318
