[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ProgramUpdateLevel

# ProgramUpdateLevel

## Enumeration Members

### Full

```ts
Full: 2;
```

Loads program completely, including:
 - re-reading contents of config file from disk
 - calculating root file names for the program
 - Updating the program

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9411

***

### RootNamesAndUpdate

```ts
RootNamesAndUpdate: 1;
```

Loads program after updating root file names from the disk

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9404

***

### Update

```ts
Update: 0;
```

Program is updated with same root file names and options

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9402
