[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / Response

# Response

Response by server to client request message.

## Extends

- [`Message`](Message.md)

## Extended by

- [`StatusResponse`](StatusResponse.md)
- [`DocCommandTemplateResponse`](DocCommandTemplateResponse.md)
- [`TodoCommentsResponse`](TodoCommentsResponse.md)
- [`OutliningSpansResponse`](OutliningSpansResponse.md)
- [`IndentationResponse`](IndentationResponse.md)
- [`ProjectInfoResponse`](ProjectInfoResponse.md)
- [`GetApplicableRefactorsResponse`](GetApplicableRefactorsResponse.md)
- [`GetMoveToRefactoringFileSuggestions`](GetMoveToRefactoringFileSuggestions.md)
- [`GetPasteEditsResponse`](GetPasteEditsResponse.md)
- [`GetEditsForRefactorResponse`](GetEditsForRefactorResponse.md)
- [`OrganizeImportsResponse`](OrganizeImportsResponse.md)
- [`GetEditsForFileRenameResponse`](GetEditsForFileRenameResponse.md)
- [`GetCombinedCodeFixResponse`](GetCombinedCodeFixResponse.md)
- [`ApplyCodeActionCommandResponse`](ApplyCodeActionCommandResponse.md)
- [`GetCodeFixesResponse`](GetCodeFixesResponse.md)
- [`GetSupportedCodeFixesResponse`](GetSupportedCodeFixesResponse.md)
- [`EncodedSemanticClassificationsResponse`](EncodedSemanticClassificationsResponse.md)
- [`DefinitionAndBoundSpanResponse`](DefinitionAndBoundSpanResponse.md)
- [`DefinitionResponse`](DefinitionResponse.md)
- [`DefinitionInfoAndBoundSpanResponse`](DefinitionInfoAndBoundSpanResponse.md)
- [`TypeDefinitionResponse`](TypeDefinitionResponse.md)
- [`ImplementationResponse`](ImplementationResponse.md)
- [`JsxClosingTagResponse`](JsxClosingTagResponse.md)
- [`LinkedEditingRangeResponse`](LinkedEditingRangeResponse.md)
- [`DocumentHighlightsResponse`](DocumentHighlightsResponse.md)
- [`ReferencesResponse`](ReferencesResponse.md)
- [`FileReferencesResponse`](FileReferencesResponse.md)
- [`RenameResponse`](RenameResponse.md)
- [`ConfigureResponse`](ConfigureResponse.md)
- [`ConfigurePluginResponse`](ConfigurePluginResponse.md)
- [`SelectionRangeResponse`](SelectionRangeResponse.md)
- [`OpenExternalProjectResponse`](OpenExternalProjectResponse.md)
- [`OpenExternalProjectsResponse`](OpenExternalProjectsResponse.md)
- [`CloseExternalProjectResponse`](CloseExternalProjectResponse.md)
- [`SetCompilerOptionsForInferredProjectsResponse`](SetCompilerOptionsForInferredProjectsResponse.md)
- [`CompileOnSaveAffectedFileListResponse`](CompileOnSaveAffectedFileListResponse.md)
- [`CompileOnSaveEmitFileResponse`](CompileOnSaveEmitFileResponse.md)
- [`QuickInfoResponse`](QuickInfoResponse.md)
- [`CodeFixResponse`](CodeFixResponse.md)
- [`FormatResponse`](FormatResponse.md)
- [`CompletionsResponse`](CompletionsResponse.md)
- [`CompletionInfoResponse`](CompletionInfoResponse.md)
- [`CompletionDetailsResponse`](CompletionDetailsResponse.md)
- [`SignatureHelpResponse`](SignatureHelpResponse.md)
- [`InlayHintsResponse`](InlayHintsResponse.md)
- [`MapCodeResponse`](MapCodeResponse.md)
- [`SemanticDiagnosticsSyncResponse`](SemanticDiagnosticsSyncResponse.md)
- [`SyntacticDiagnosticsSyncResponse`](SyntacticDiagnosticsSyncResponse.md)
- [`ReloadResponse`](ReloadResponse.md)
- [`NavtoResponse`](NavtoResponse.md)
- [`BraceResponse`](BraceResponse.md)
- [`NavBarResponse`](NavBarResponse.md)
- [`NavTreeResponse`](NavTreeResponse.md)
- [`PrepareCallHierarchyResponse`](PrepareCallHierarchyResponse.md)
- [`ProvideCallHierarchyIncomingCallsResponse`](ProvideCallHierarchyIncomingCallsResponse.md)
- [`ProvideCallHierarchyOutgoingCallsResponse`](ProvideCallHierarchyOutgoingCallsResponse.md)

## Properties

### body?

```ts
optional body: any;
```

Contains message body if success === true.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:198

***

### command

```ts
command: string;
```

The command requested.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:189

***

### message?

```ts
optional message: string;
```

If success === false, this should always be provided.
Otherwise, may (or may not) contain a success message.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:194

***

### metadata?

```ts
optional metadata: unknown;
```

Contains extra information that plugin can include to be passed on

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:202

***

### performanceData?

```ts
optional performanceData: PerformanceData;
```

Exposes information about the performance of this request-response pair.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:206

***

### request\_seq

```ts
request_seq: number;
```

Sequence number of the request message.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:181

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

### success

```ts
success: boolean;
```

Outcome of the request.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:185

***

### type

```ts
type: "response";
```

One of "request", "response", or "event"

#### Overrides

[`Message`](Message.md).[`type`](Message.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:177
