[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / FileRequest

# FileRequest

Request whose sole parameter is a file name.

## Extends

- [`Request`](Request.md)

## Extended by

- [`TodoCommentRequest`](TodoCommentRequest.md)
- [`OutliningSpansRequest`](OutliningSpansRequest.md)
- [`FileLocationRequest`](FileLocationRequest.md)
- [`EncodedSemanticClassificationsRequest`](EncodedSemanticClassificationsRequest.md)
- [`FileReferencesRequest`](FileReferencesRequest.md)
- [`SelectionRangeRequest`](SelectionRangeRequest.md)
- [`ToggleLineCommentRequest`](ToggleLineCommentRequest.md)
- [`ToggleMultilineCommentRequest`](ToggleMultilineCommentRequest.md)
- [`CommentSelectionRequest`](CommentSelectionRequest.md)
- [`UncommentSelectionRequest`](UncommentSelectionRequest.md)
- [`CloseRequest`](CloseRequest.md)
- [`CompileOnSaveAffectedFileListRequest`](CompileOnSaveAffectedFileListRequest.md)
- [`CompileOnSaveEmitFileRequest`](CompileOnSaveEmitFileRequest.md)
- [`MapCodeRequest`](MapCodeRequest.md)
- [`SemanticDiagnosticsSyncRequest`](SemanticDiagnosticsSyncRequest.md)
- [`SuggestionDiagnosticsSyncRequest`](SuggestionDiagnosticsSyncRequest.md)
- [`SyntacticDiagnosticsSyncRequest`](SyntacticDiagnosticsSyncRequest.md)
- [`ReloadRequest`](ReloadRequest.md)
- [`SavetoRequest`](SavetoRequest.md)
- [`NavBarRequest`](NavBarRequest.md)
- [`NavTreeRequest`](NavTreeRequest.md)

## Properties

### arguments

```ts
arguments: FileRequestArgs;
```

Object containing arguments for the command

#### Overrides

[`Request`](Request.md).[`arguments`](Request.md#arguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:435

***

### command

```ts
command: string;
```

The command to execute

#### Inherited from

[`Request`](Request.md).[`command`](Request.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:147

***

### seq

```ts
seq: number;
```

Sequence number of the message

#### Inherited from

[`Request`](Request.md).[`seq`](Request.md#seq)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:133

***

### type

```ts
type: "request";
```

One of "request", "response", or "event"

#### Inherited from

[`Request`](Request.md).[`type`](Request.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:143
