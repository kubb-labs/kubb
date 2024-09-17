[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ProjectLanguageServiceStateEventBody

# ProjectLanguageServiceStateEventBody

## Properties

### languageServiceEnabled

```ts
languageServiceEnabled: boolean;
```

True if language service state switched from disabled to enabled
and false otherwise.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2047

***

### projectName

```ts
projectName: string;
```

Project name that has changes in the state of language service.
For configured projects this will be the config file path.
For external projects this will be the name of the projects specified when project was open.
For inferred projects this event is not raised.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2042
