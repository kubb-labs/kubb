[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / OpenFileInfoTelemetryEvent

# OpenFileInfoTelemetryEvent

Info that we may send about a file that was just opened.
Info about a file will only be sent once per session, even if the file changes in ways that might affect the info.
Currently this is only sent for '.js' files.

## Properties

### data

```ts
readonly data: OpenFileInfoTelemetryEventData;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3073

***

### eventName

```ts
readonly eventName: "openFileInfo";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3072
