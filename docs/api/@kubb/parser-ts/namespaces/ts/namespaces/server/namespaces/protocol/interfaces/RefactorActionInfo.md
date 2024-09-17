[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / RefactorActionInfo

# RefactorActionInfo

Represents a single refactoring action - for example, the "Extract Method..." refactor might
offer several actions, each corresponding to a surround class or closure to extract into.

## Properties

### description

```ts
description: string;
```

A description of this refactoring action to show to the user.
If the parent refactoring is inlined away, this will be the only text shown,
so this description should make sense by itself if the parent is inlineable=true

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10450

***

### isInteractive?

```ts
optional isInteractive: boolean;
```

Indicates that the action requires additional arguments to be passed
when calling `getEditsForRefactor`.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10464

***

### kind?

```ts
optional kind: string;
```

The hierarchical dotted name of the refactor action.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10459

***

### name

```ts
name: string;
```

The programmatic name of the refactoring action

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10444

***

### notApplicableReason?

```ts
optional notApplicableReason: string;
```

A message to show to the user if the refactoring cannot be applied in
the current context.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10455

***

### range?

```ts
optional range: object;
```

Range of code the refactoring will be applied to.

#### end

```ts
end: object;
```

#### end.line

```ts
end.line: number;
```

#### end.offset

```ts
end.offset: number;
```

#### start

```ts
start: object;
```

#### start.line

```ts
start.line: number;
```

#### start.offset

```ts
start.offset: number;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10468
