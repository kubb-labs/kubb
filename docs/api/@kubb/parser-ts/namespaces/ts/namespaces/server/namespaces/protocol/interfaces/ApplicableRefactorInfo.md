[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ApplicableRefactorInfo

# ApplicableRefactorInfo

A set of one or more available refactoring actions, grouped under a parent refactoring.

## Properties

### actions

```ts
actions: RefactorActionInfo[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10434

***

### description

```ts
description: string;
```

A description of this refactoring category to show to the user.
If the refactoring gets inlined (see below), this text will not be visible.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10425

***

### inlineable?

```ts
optional inlineable: boolean;
```

Inlineable refactorings can have their actions hoisted out to the top level
of a context menu. Non-inlineanable refactorings should always be shown inside
their parent grouping.

If not specified, this value is assumed to be 'true'

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10433

***

### name

```ts
name: string;
```

The programmatic name of the refactoring

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10420
