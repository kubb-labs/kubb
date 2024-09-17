[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / FileLocationRequest

# FileLocationRequest

A request whose arguments specify a file location (file, line, col).

## Extends

- [`FileRequest`](FileRequest.md)

## Extended by

- [`DocCommentTemplateRequest`](DocCommentTemplateRequest.md)
- [`SpanOfEnclosingCommentRequest`](SpanOfEnclosingCommentRequest.md)
- [`IndentationRequest`](IndentationRequest.md)
- [`DefinitionRequest`](DefinitionRequest.md)
- [`DefinitionAndBoundSpanRequest`](DefinitionAndBoundSpanRequest.md)
- [`FindSourceDefinitionRequest`](FindSourceDefinitionRequest.md)
- [`TypeDefinitionRequest`](TypeDefinitionRequest.md)
- [`ImplementationRequest`](ImplementationRequest.md)
- [`BraceCompletionRequest`](BraceCompletionRequest.md)
- [`JsxClosingTagRequest`](JsxClosingTagRequest.md)
- [`LinkedEditingRangeRequest`](LinkedEditingRangeRequest.md)
- [`DocumentHighlightsRequest`](DocumentHighlightsRequest.md)
- [`ReferencesRequest`](ReferencesRequest.md)
- [`RenameRequest`](RenameRequest.md)
- [`QuickInfoRequest`](QuickInfoRequest.md)
- [`FormatRequest`](FormatRequest.md)
- [`FormatOnKeyRequest`](FormatOnKeyRequest.md)
- [`CompletionsRequest`](CompletionsRequest.md)
- [`CompletionDetailsRequest`](CompletionDetailsRequest.md)
- [`SignatureHelpRequest`](SignatureHelpRequest.md)
- [`ChangeRequest`](ChangeRequest.md)
- [`BraceRequest`](BraceRequest.md)
- [`PrepareCallHierarchyRequest`](PrepareCallHierarchyRequest.md)
- [`ProvideCallHierarchyIncomingCallsRequest`](ProvideCallHierarchyIncomingCallsRequest.md)
- [`ProvideCallHierarchyOutgoingCallsRequest`](ProvideCallHierarchyOutgoingCallsRequest.md)

## Properties

### arguments

```ts
arguments: FileLocationRequestArgs;
```

Object containing arguments for the command

#### Overrides

[`FileRequest`](FileRequest.md).[`arguments`](FileRequest.md#arguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:636

***

### command

```ts
command: string;
```

The command to execute

#### Inherited from

[`FileRequest`](FileRequest.md).[`command`](FileRequest.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:147

***

### seq

```ts
seq: number;
```

Sequence number of the message

#### Inherited from

[`FileRequest`](FileRequest.md).[`seq`](FileRequest.md#seq)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:133

***

### type

```ts
type: "request";
```

One of "request", "response", or "event"

#### Inherited from

[`FileRequest`](FileRequest.md).[`type`](FileRequest.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:143
