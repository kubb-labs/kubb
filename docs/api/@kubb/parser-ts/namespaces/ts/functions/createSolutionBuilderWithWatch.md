[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / createSolutionBuilderWithWatch

# createSolutionBuilderWithWatch()

```ts
function createSolutionBuilderWithWatch<T>(
   host, 
   rootNames, 
   defaultOptions, 
baseWatchOptions?): SolutionBuilder<T>
```

## Type Parameters

• **T** *extends* [`BuilderProgram`](../interfaces/BuilderProgram.md)

## Parameters

• **host**: [`SolutionBuilderWithWatchHost`](../interfaces/SolutionBuilderWithWatchHost.md)\<`T`\>

• **rootNames**: readonly `string`[]

• **defaultOptions**: [`BuildOptions`](../interfaces/BuildOptions.md)

• **baseWatchOptions?**: [`WatchOptions`](../interfaces/WatchOptions.md)

## Returns

[`SolutionBuilder`](../interfaces/SolutionBuilder.md)\<`T`\>

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9821
