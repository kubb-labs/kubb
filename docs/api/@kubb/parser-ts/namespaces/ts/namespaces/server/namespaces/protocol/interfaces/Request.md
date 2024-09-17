[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / Request

# Request

Client-initiated request message

## Extends

- [`Message`](Message.md)

## Extended by

- [`ReloadProjectsRequest`](ReloadProjectsRequest.md)
- [`StatusRequest`](StatusRequest.md)
- [`ProjectInfoRequest`](ProjectInfoRequest.md)
- [`CompilerOptionsDiagnosticsRequest`](CompilerOptionsDiagnosticsRequest.md)
- [`FileRequest`](FileRequest.md)
- [`GetApplicableRefactorsRequest`](GetApplicableRefactorsRequest.md)
- [`GetMoveToRefactoringFileSuggestionsRequest`](GetMoveToRefactoringFileSuggestionsRequest.md)
- [`GetPasteEditsRequest`](GetPasteEditsRequest.md)
- [`GetEditsForRefactorRequest`](GetEditsForRefactorRequest.md)
- [`OrganizeImportsRequest`](OrganizeImportsRequest.md)
- [`GetEditsForFileRenameRequest`](GetEditsForFileRenameRequest.md)
- [`CodeFixRequest`](CodeFixRequest.md)
- [`GetCombinedCodeFixRequest`](GetCombinedCodeFixRequest.md)
- [`ApplyCodeActionCommandRequest`](ApplyCodeActionCommandRequest.md)
- [`GetSupportedCodeFixesRequest`](GetSupportedCodeFixesRequest.md)
- [`ConfigureRequest`](ConfigureRequest.md)
- [`ConfigurePluginRequest`](ConfigurePluginRequest.md)
- [`OpenRequest`](OpenRequest.md)
- [`OpenExternalProjectRequest`](OpenExternalProjectRequest.md)
- [`OpenExternalProjectsRequest`](OpenExternalProjectsRequest.md)
- [`CloseExternalProjectRequest`](CloseExternalProjectRequest.md)
- [`UpdateOpenRequest`](UpdateOpenRequest.md)
- [`SetCompilerOptionsForInferredProjectsRequest`](SetCompilerOptionsForInferredProjectsRequest.md)
- [`ExitRequest`](ExitRequest.md)
- [`WatchChangeRequest`](WatchChangeRequest.md)
- [`InlayHintsRequest`](InlayHintsRequest.md)
- [`GeterrForProjectRequest`](GeterrForProjectRequest.md)
- [`GeterrRequest`](GeterrRequest.md)
- [`NavtoRequest`](NavtoRequest.md)

## Properties

### arguments?

```ts
optional arguments: any;
```

Object containing arguments for the command

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:151

***

### command

```ts
command: string;
```

The command to execute

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:147

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
type: "request";
```

One of "request", "response", or "event"

#### Overrides

[`Message`](Message.md).[`type`](Message.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:143
