[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ConfigureRequestArguments

# ConfigureRequestArguments

Information found in a configure request.

## Properties

### extraFileExtensions?

```ts
optional extraFileExtensions: FileExtensionInfo[];
```

The host's additional supported .js file extensions

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1121

***

### file?

```ts
optional file: string;
```

If present, tab settings apply only to this file.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1112

***

### formatOptions?

```ts
optional formatOptions: ChangePropertyTypes<FormatCodeSettings, object>;
```

The format options to use during formatting and other code editing features.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1116

***

### hostInfo?

```ts
optional hostInfo: string;
```

Information about the host, for example 'Emacs 24.4' or
'Sublime Text version 3075'

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1108

***

### preferences?

```ts
optional preferences: UserPreferences;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1117

***

### watchOptions?

```ts
optional watchOptions: WatchOptions;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1122
