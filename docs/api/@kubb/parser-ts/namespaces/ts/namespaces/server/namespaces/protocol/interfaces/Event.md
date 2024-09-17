[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / Event

# Event

Server-initiated event message

## Extends

- [`Message`](Message.md)

## Extended by

- [`RequestCompletedEvent`](RequestCompletedEvent.md)
- [`DiagnosticEvent`](DiagnosticEvent.md)
- [`ConfigFileDiagnosticEvent`](ConfigFileDiagnosticEvent.md)
- [`ProjectLanguageServiceStateEvent`](ProjectLanguageServiceStateEvent.md)
- [`ProjectsUpdatedInBackgroundEvent`](ProjectsUpdatedInBackgroundEvent.md)
- [`ProjectLoadingStartEvent`](ProjectLoadingStartEvent.md)
- [`ProjectLoadingFinishEvent`](ProjectLoadingFinishEvent.md)
- [`SurveyReadyEvent`](SurveyReadyEvent.md)
- [`LargeFileReferencedEvent`](LargeFileReferencedEvent.md)
- [`CreateFileWatcherEvent`](CreateFileWatcherEvent.md)
- [`CreateDirectoryWatcherEvent`](CreateDirectoryWatcherEvent.md)
- [`CloseFileWatcherEvent`](CloseFileWatcherEvent.md)
- [`TelemetryEvent`](TelemetryEvent.md)
- [`TypesInstallerInitializationFailedEvent`](TypesInstallerInitializationFailedEvent.md)
- [`BeginInstallTypesEvent`](BeginInstallTypesEvent.md)
- [`EndInstallTypesEvent`](EndInstallTypesEvent.md)

## Properties

### body?

```ts
optional body: any;
```

Event-specific information

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:171

***

### event

```ts
event: string;
```

Name of event

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:167

***

### seq

```ts
seq: number;
```

Sequence number of the message

#### Inherited from

[`Message`](Message.md).[`seq`](Message.md#seq)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:133

***

### type

```ts
type: "event";
```

One of "request", "response", or "event"

#### Overrides

[`Message`](Message.md).[`type`](Message.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:163
