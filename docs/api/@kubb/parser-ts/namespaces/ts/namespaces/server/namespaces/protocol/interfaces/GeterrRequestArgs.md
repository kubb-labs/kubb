[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / GeterrRequestArgs

# GeterrRequestArgs

Arguments for geterr messages.

## Properties

### delay

```ts
delay: number;
```

Delay in milliseconds to wait before starting to compute
errors for the files in the file list

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1874

***

### files

```ts
files: (string | FileRangesRequestArgs)[];
```

List of file names for which to compute compiler errors.
The files will be checked in list order.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1869
