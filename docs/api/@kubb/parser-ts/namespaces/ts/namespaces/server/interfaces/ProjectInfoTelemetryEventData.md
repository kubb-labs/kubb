[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / ProjectInfoTelemetryEventData

# ProjectInfoTelemetryEventData

## Properties

### compileOnSave

```ts
readonly compileOnSave: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3104

***

### compilerOptions

```ts
readonly compilerOptions: CompilerOptions;
```

Any compiler options that might contain paths will be taken out.
Enum compiler options will be converted to strings.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3099

***

### configFileName

```ts
readonly configFileName: "tsconfig.json" | "jsconfig.json" | "other";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3106

***

### exclude

```ts
readonly exclude: undefined | boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3103

***

### extends

```ts
readonly extends: undefined | boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3100

***

### files

```ts
readonly files: undefined | boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3101

***

### fileStats

```ts
readonly fileStats: FileStats;
```

Count of file extensions seen in the project.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3094

***

### include

```ts
readonly include: undefined | boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3102

***

### languageServiceEnabled

```ts
readonly languageServiceEnabled: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3108

***

### projectId

```ts
readonly projectId: string;
```

Cryptographically secure hash of project file location.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3092

***

### projectType

```ts
readonly projectType: "external" | "configured";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3107

***

### typeAcquisition

```ts
readonly typeAcquisition: ProjectInfoTypeAcquisitionData;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3105

***

### version

```ts
readonly version: string;
```

TypeScript version used by the server.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3110
