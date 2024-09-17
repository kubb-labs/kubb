[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / SetCompilerOptionsForInferredProjectsArgs

# SetCompilerOptionsForInferredProjectsArgs

Argument for SetCompilerOptionsForInferredProjectsRequest request.

## Properties

### options

```ts
options: InferredProjectCompilerOptions;
```

Compiler options to be used with inferred projects.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1349

***

### projectRootPath?

```ts
optional projectRootPath: string;
```

Specifies the project root path used to scope compiler options.
It is an error to provide this property if the server has not been started with
`useInferredProjectPerProjectRoot` enabled.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1355
