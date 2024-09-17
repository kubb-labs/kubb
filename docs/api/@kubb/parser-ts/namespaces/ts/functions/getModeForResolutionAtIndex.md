[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / getModeForResolutionAtIndex

# getModeForResolutionAtIndex()

```ts
function getModeForResolutionAtIndex(
   file, 
   index, 
   compilerOptions): ResolutionMode
```

Use `program.getModeForResolutionAtIndex`, which retrieves the correct `compilerOptions`, instead of this function whenever possible.
Calculates the final resolution mode for an import at some index within a file's `imports` list. This is the resolution mode
explicitly provided via import attributes, if present, or the syntax the usage would have if emitted to JavaScript. In
`--module node16` or `nodenext`, this may depend on the file's `impliedNodeFormat`. In `--module preserve`, it depends only on the
input syntax of the reference. In other `module` modes, when overriding import attributes are not provided, this function returns
`undefined`, as the result would have no impact on module resolution, emit, or type checking.

## Parameters

• **file**: [`SourceFile`](../interfaces/SourceFile.md)

File to fetch the resolution mode within

• **index**: `number`

Index into the file's complete resolution list to get the resolution of - this is a concatenation of the file's imports and module augmentations

• **compilerOptions**: [`CompilerOptions`](../interfaces/CompilerOptions.md)

The compiler options for the program that owns the file. If the file belongs to a referenced project, the compiler options
should be the options of the referenced project, not the referencing project.

## Returns

[`ResolutionMode`](../type-aliases/ResolutionMode.md)

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9438
