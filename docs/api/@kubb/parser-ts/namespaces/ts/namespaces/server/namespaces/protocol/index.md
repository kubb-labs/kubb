[API](../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../index.md) / [ts](../../../../index.md) / [server](../../index.md) / protocol

# protocol

## Index

### Enumerations

| Enumeration | Description |
| ------ | ------ |
| [ClassificationType](enumerations/ClassificationType.md) | - |
| [CommandTypes](enumerations/CommandTypes.md) | - |
| [CompletionTriggerKind](enumerations/CompletionTriggerKind.md) | - |
| [IndentStyle](enumerations/IndentStyle.md) | - |
| [InlayHintKind](enumerations/InlayHintKind.md) | - |
| [JsxEmit](enumerations/JsxEmit.md) | - |
| [ModuleKind](enumerations/ModuleKind.md) | - |
| [ModuleResolutionKind](enumerations/ModuleResolutionKind.md) | - |
| [NewLineKind](enumerations/NewLineKind.md) | - |
| [OrganizeImportsMode](enumerations/OrganizeImportsMode.md) | - |
| [PollingWatchKind](enumerations/PollingWatchKind.md) | - |
| [ScriptTarget](enumerations/ScriptTarget.md) | - |
| [SemicolonPreference](enumerations/SemicolonPreference.md) | - |
| [WatchDirectoryKind](enumerations/WatchDirectoryKind.md) | - |
| [WatchFileKind](enumerations/WatchFileKind.md) | - |

### Interfaces

| Interface | Description |
| ------ | ------ |
| [ApplicableRefactorInfo](interfaces/ApplicableRefactorInfo.md) | A set of one or more available refactoring actions, grouped under a parent refactoring. |
| [ApplyCodeActionCommandRequest](interfaces/ApplyCodeActionCommandRequest.md) | Client-initiated request message |
| [ApplyCodeActionCommandRequestArgs](interfaces/ApplyCodeActionCommandRequestArgs.md) | - |
| [ApplyCodeActionCommandResponse](interfaces/ApplyCodeActionCommandResponse.md) | Response by server to client request message. |
| [BeginInstallTypesEvent](interfaces/BeginInstallTypesEvent.md) | Server-initiated event message |
| [BeginInstallTypesEventBody](interfaces/BeginInstallTypesEventBody.md) | - |
| [BraceCompletionRequest](interfaces/BraceCompletionRequest.md) | Request to get brace completion for a location in the file. |
| [BraceCompletionRequestArgs](interfaces/BraceCompletionRequestArgs.md) | Argument for BraceCompletionRequest request. |
| [BraceRequest](interfaces/BraceRequest.md) | Brace matching request; value of command field is "brace". Return response giving the file locations of matching braces found in file at location line, offset. |
| [BraceResponse](interfaces/BraceResponse.md) | Response to "brace" request. |
| [CallHierarchyIncomingCall](interfaces/CallHierarchyIncomingCall.md) | - |
| [CallHierarchyOutgoingCall](interfaces/CallHierarchyOutgoingCall.md) | - |
| [ChangeRequest](interfaces/ChangeRequest.md) | Change request message; value of command field is "change". Update the server's view of the file named by argument 'file'. Server does not currently send a response to a change request. |
| [ChangeRequestArgs](interfaces/ChangeRequestArgs.md) | Arguments for change request message. |
| [CloseExternalProjectRequest](interfaces/CloseExternalProjectRequest.md) | Request to close external project. |
| [CloseExternalProjectRequestArgs](interfaces/CloseExternalProjectRequestArgs.md) | Arguments to CloseExternalProjectRequest request |
| [CloseExternalProjectResponse](interfaces/CloseExternalProjectResponse.md) | Response to CloseExternalProjectRequest request. This is just an acknowledgement, so no body field is required. |
| [CloseFileWatcherEvent](interfaces/CloseFileWatcherEvent.md) | Server-initiated event message |
| [CloseFileWatcherEventBody](interfaces/CloseFileWatcherEventBody.md) | - |
| [CloseRequest](interfaces/CloseRequest.md) | Close request; value of command field is "close". Notify the server that the client has closed a previously open file. If file is still referenced by open files, the server will resume monitoring the filesystem for changes to file. Server does not currently send a response to a close request. |
| [CodeAction](interfaces/CodeAction.md) | - |
| [CodeEdit](interfaces/CodeEdit.md) | Object found in response messages defining an editing instruction for a span of text in source code. The effect of this instruction is to replace the text starting at start and ending one character before end with newText. For an insertion, the text span is empty. For a deletion, newText is empty. |
| [CodeFixAction](interfaces/CodeFixAction.md) | - |
| [CodeFixRequest](interfaces/CodeFixRequest.md) | Request for the available codefixes at a specific position. |
| [CodeFixRequestArgs](interfaces/CodeFixRequestArgs.md) | Instances of this interface specify errorcodes on a specific location in a sourcefile. |
| [CodeFixResponse](interfaces/CodeFixResponse.md) | Response by server to client request message. |
| [CombinedCodeActions](interfaces/CombinedCodeActions.md) | - |
| [CommentSelectionRequest](interfaces/CommentSelectionRequest.md) | Request whose sole parameter is a file name. |
| [CompileOnSaveAffectedFileListRequest](interfaces/CompileOnSaveAffectedFileListRequest.md) | Request to obtain the list of files that should be regenerated if target file is recompiled. NOTE: this us query-only operation and does not generate any output on disk. |
| [CompileOnSaveAffectedFileListResponse](interfaces/CompileOnSaveAffectedFileListResponse.md) | Response for CompileOnSaveAffectedFileListRequest request; |
| [CompileOnSaveAffectedFileListSingleProject](interfaces/CompileOnSaveAffectedFileListSingleProject.md) | Contains a list of files that should be regenerated in a project |
| [CompileOnSaveEmitFileRequest](interfaces/CompileOnSaveEmitFileRequest.md) | Request to recompile the file. All generated outputs (.js, .d.ts or .js.map files) is written on disk. |
| [CompileOnSaveEmitFileRequestArgs](interfaces/CompileOnSaveEmitFileRequestArgs.md) | Arguments for CompileOnSaveEmitFileRequest |
| [CompileOnSaveEmitFileResponse](interfaces/CompileOnSaveEmitFileResponse.md) | Response by server to client request message. |
| [CompileOnSaveMixin](interfaces/CompileOnSaveMixin.md) | - |
| [CompilerOptionsDiagnosticsRequest](interfaces/CompilerOptionsDiagnosticsRequest.md) | A request to retrieve compiler options diagnostics for a project |
| [CompilerOptionsDiagnosticsRequestArgs](interfaces/CompilerOptionsDiagnosticsRequestArgs.md) | Arguments for CompilerOptionsDiagnosticsRequest request. |
| [CompletionDetailsRequest](interfaces/CompletionDetailsRequest.md) | Completion entry details request; value of command field is "completionEntryDetails". Given a file location (file, line, col) and an array of completion entry names return more detailed information for each completion entry. |
| [CompletionDetailsRequestArgs](interfaces/CompletionDetailsRequestArgs.md) | Arguments for completion details request. |
| [CompletionDetailsResponse](interfaces/CompletionDetailsResponse.md) | Response by server to client request message. |
| [CompletionEntryIdentifier](interfaces/CompletionEntryIdentifier.md) | - |
| [CompletionInfoResponse](interfaces/CompletionInfoResponse.md) | Response by server to client request message. |
| [CompletionsRequest](interfaces/CompletionsRequest.md) | Completions request; value of command field is "completions". Given a file location (file, line, col) and a prefix (which may be the empty string), return the possible completions that begin with prefix. |
| [CompletionsRequestArgs](interfaces/CompletionsRequestArgs.md) | Arguments for completions messages. |
| [CompletionsResponse](interfaces/CompletionsResponse.md) | - |
| [ConfigFileDiagnosticEvent](interfaces/ConfigFileDiagnosticEvent.md) | Event message for "configFileDiag" event type. This event provides errors for a found config file. |
| [ConfigFileDiagnosticEventBody](interfaces/ConfigFileDiagnosticEventBody.md) | - |
| [ConfigurePluginRequest](interfaces/ConfigurePluginRequest.md) | Client-initiated request message |
| [ConfigurePluginRequestArguments](interfaces/ConfigurePluginRequestArguments.md) | - |
| [ConfigurePluginResponse](interfaces/ConfigurePluginResponse.md) | Response by server to client request message. |
| [ConfigureRequest](interfaces/ConfigureRequest.md) | Configure request; value of command field is "configure". Specifies host information, such as host type, tab size, and indent size. |
| [ConfigureRequestArguments](interfaces/ConfigureRequestArguments.md) | Information found in a configure request. |
| [ConfigureResponse](interfaces/ConfigureResponse.md) | Response to "configure" request. This is just an acknowledgement, so no body field is required. |
| [CreateDirectoryWatcherEvent](interfaces/CreateDirectoryWatcherEvent.md) | Server-initiated event message |
| [CreateDirectoryWatcherEventBody](interfaces/CreateDirectoryWatcherEventBody.md) | - |
| [CreateFileWatcherEvent](interfaces/CreateFileWatcherEvent.md) | Server-initiated event message |
| [CreateFileWatcherEventBody](interfaces/CreateFileWatcherEventBody.md) | - |
| [DefinitionAndBoundSpanRequest](interfaces/DefinitionAndBoundSpanRequest.md) | A request whose arguments specify a file location (file, line, col). |
| [DefinitionAndBoundSpanResponse](interfaces/DefinitionAndBoundSpanResponse.md) | Response by server to client request message. |
| [DefinitionInfo](interfaces/DefinitionInfo.md) | Object found in response messages defining a span of text in a specific source file. |
| [DefinitionInfoAndBoundSpan](interfaces/DefinitionInfoAndBoundSpan.md) | - |
| [DefinitionInfoAndBoundSpanResponse](interfaces/DefinitionInfoAndBoundSpanResponse.md) | Response by server to client request message. |
| [DefinitionRequest](interfaces/DefinitionRequest.md) | Go to definition request; value of command field is "definition". Return response giving the file locations that define the symbol found in file at location line, col. |
| [DefinitionResponse](interfaces/DefinitionResponse.md) | Definition response message. Gives text range for definition. |
| [Diagnostic](interfaces/Diagnostic.md) | Item of diagnostic information found in a DiagnosticEvent message. |
| [DiagnosticEvent](interfaces/DiagnosticEvent.md) | Event message for DiagnosticEventKind event types. These events provide syntactic and semantic errors for a file. |
| [DiagnosticEventBody](interfaces/DiagnosticEventBody.md) | - |
| [DiagnosticRelatedInformation](interfaces/DiagnosticRelatedInformation.md) | Represents additional spans returned with a diagnostic which are relevant to it |
| [DiagnosticWithFileName](interfaces/DiagnosticWithFileName.md) | Item of diagnostic information found in a DiagnosticEvent message. |
| [DiagnosticWithLinePosition](interfaces/DiagnosticWithLinePosition.md) | Represents diagnostic info that includes location of diagnostic in two forms - start position and length of the error span - startLocation and endLocation - a pair of Location objects that store start/end line and offset of the error span. |
| [DocCommandTemplateResponse](interfaces/DocCommandTemplateResponse.md) | Response to DocCommentTemplateRequest |
| [DocCommentTemplateRequest](interfaces/DocCommentTemplateRequest.md) | Requests a JS Doc comment template for a given position |
| [DocumentHighlightsItem](interfaces/DocumentHighlightsItem.md) | Represents a set of highligh spans for a give name |
| [DocumentHighlightsRequest](interfaces/DocumentHighlightsRequest.md) | Get document highlights request; value of command field is "documentHighlights". Return response giving spans that are relevant in the file at a given line and column. |
| [DocumentHighlightsRequestArgs](interfaces/DocumentHighlightsRequestArgs.md) | Arguments in document highlight request; include: filesToSearch, file, line, offset. |
| [DocumentHighlightsResponse](interfaces/DocumentHighlightsResponse.md) | Response for a DocumentHighlightsRequest request. |
| [EmitResult](interfaces/EmitResult.md) | - |
| [EncodedSemanticClassificationsRequest](interfaces/EncodedSemanticClassificationsRequest.md) | A request to get encoded semantic classifications for a span in the file |
| [EncodedSemanticClassificationsRequestArgs](interfaces/EncodedSemanticClassificationsRequestArgs.md) | Arguments for EncodedSemanticClassificationsRequest request. |
| [EncodedSemanticClassificationsResponse](interfaces/EncodedSemanticClassificationsResponse.md) | The response for a EncodedSemanticClassificationsRequest |
| [EncodedSemanticClassificationsResponseBody](interfaces/EncodedSemanticClassificationsResponseBody.md) | Implementation response message. Gives series of text spans depending on the format ar. |
| [EndInstallTypesEvent](interfaces/EndInstallTypesEvent.md) | Server-initiated event message |
| [EndInstallTypesEventBody](interfaces/EndInstallTypesEventBody.md) | - |
| [Event](interfaces/Event.md) | Server-initiated event message |
| [ExitRequest](interfaces/ExitRequest.md) | Exit request; value of command field is "exit". Ask the server process to exit. |
| [ExternalFile](interfaces/ExternalFile.md) | Represents a file in external project. External project is project whose set of files, compilation options and open\close state is maintained by the client (i.e. if all this data come from .csproj file in Visual Studio). External project will exist even if all files in it are closed and should be closed explicitly. If external project includes one or more tsconfig.json/jsconfig.json files then tsserver will create configured project for every config file but will maintain a link that these projects were created as a result of opening external project so they should be removed once external project is closed. |
| [ExternalProject](interfaces/ExternalProject.md) | Represent an external project |
| [FileCodeEdits](interfaces/FileCodeEdits.md) | - |
| [FileDiagnosticPerformanceData](interfaces/FileDiagnosticPerformanceData.md) | Time spent computing each kind of diagnostics, in milliseconds. |
| [FileLocationRequest](interfaces/FileLocationRequest.md) | A request whose arguments specify a file location (file, line, col). |
| [FileLocationRequestArgs](interfaces/FileLocationRequestArgs.md) | Instances of this interface specify a location in a source file: (file, line, character offset), where line and character offset are 1-based. |
| [FileRange](interfaces/FileRange.md) | - |
| [FileRangeRequestArgs](interfaces/FileRangeRequestArgs.md) | Arguments for FileRequest messages. |
| [FileRangesRequestArgs](interfaces/FileRangesRequestArgs.md) | - |
| [FileReferencesRequest](interfaces/FileReferencesRequest.md) | Request whose sole parameter is a file name. |
| [FileReferencesResponse](interfaces/FileReferencesResponse.md) | Response by server to client request message. |
| [FileReferencesResponseBody](interfaces/FileReferencesResponseBody.md) | - |
| [FileRequest](interfaces/FileRequest.md) | Request whose sole parameter is a file name. |
| [FileRequestArgs](interfaces/FileRequestArgs.md) | Arguments for FileRequest messages. |
| [FileSpan](interfaces/FileSpan.md) | Object found in response messages defining a span of text in a specific source file. |
| [FileSpanWithContext](interfaces/FileSpanWithContext.md) | Object found in response messages defining a span of text in a specific source file. |
| [FileWithProjectReferenceRedirectInfo](interfaces/FileWithProjectReferenceRedirectInfo.md) | - |
| [FindSourceDefinitionRequest](interfaces/FindSourceDefinitionRequest.md) | A request whose arguments specify a file location (file, line, col). |
| [FormatOnKeyRequest](interfaces/FormatOnKeyRequest.md) | Format on key request; value of command field is "formatonkey". Given file location and key typed (as string), return response giving zero or more edit instructions. The edit instructions will be sorted in file order. Applying the edit instructions in reverse to file will result in correctly reformatted text. |
| [FormatOnKeyRequestArgs](interfaces/FormatOnKeyRequestArgs.md) | Arguments for format on key messages. |
| [FormatRequest](interfaces/FormatRequest.md) | Format request; value of command field is "format". Return response giving zero or more edit instructions. The edit instructions will be sorted in file order. Applying the edit instructions in reverse to file will result in correctly reformatted text. |
| [FormatRequestArgs](interfaces/FormatRequestArgs.md) | Arguments for format messages. |
| [FormatResponse](interfaces/FormatResponse.md) | Format and format on key response message. |
| [GetApplicableRefactorsRequest](interfaces/GetApplicableRefactorsRequest.md) | Request refactorings at a given position or selection area. |
| [GetApplicableRefactorsResponse](interfaces/GetApplicableRefactorsResponse.md) | Response is a list of available refactorings. Each refactoring exposes one or more "Actions"; a user selects one action to invoke a refactoring |
| [GetCodeFixesResponse](interfaces/GetCodeFixesResponse.md) | Response for GetCodeFixes request. |
| [GetCombinedCodeFixRequest](interfaces/GetCombinedCodeFixRequest.md) | Client-initiated request message |
| [GetCombinedCodeFixRequestArgs](interfaces/GetCombinedCodeFixRequestArgs.md) | - |
| [GetCombinedCodeFixResponse](interfaces/GetCombinedCodeFixResponse.md) | Response by server to client request message. |
| [GetCombinedCodeFixScope](interfaces/GetCombinedCodeFixScope.md) | - |
| [GetEditsForFileRenameRequest](interfaces/GetEditsForFileRenameRequest.md) | Client-initiated request message |
| [GetEditsForFileRenameRequestArgs](interfaces/GetEditsForFileRenameRequestArgs.md) | Note: Paths may also be directories. |
| [GetEditsForFileRenameResponse](interfaces/GetEditsForFileRenameResponse.md) | Response by server to client request message. |
| [GetEditsForRefactorRequest](interfaces/GetEditsForRefactorRequest.md) | Client-initiated request message |
| [GetEditsForRefactorResponse](interfaces/GetEditsForRefactorResponse.md) | Response by server to client request message. |
| [GeterrForProjectRequest](interfaces/GeterrForProjectRequest.md) | GeterrForProjectRequest request; value of command field is "geterrForProject". It works similarly with 'Geterr', only it request for every file in this project. |
| [GeterrForProjectRequestArgs](interfaces/GeterrForProjectRequestArgs.md) | Arguments for GeterrForProject request. |
| [GeterrRequest](interfaces/GeterrRequest.md) | Geterr request; value of command field is "geterr". Wait for delay milliseconds and then, if during the wait no change or reload messages have arrived for the first file in the files list, get the syntactic errors for the file, field requests, and then get the semantic errors for the file. Repeat with a smaller delay for each subsequent file on the files list. Best practice for an editor is to send a file list containing each file that is currently visible, in most-recently-used order. |
| [GeterrRequestArgs](interfaces/GeterrRequestArgs.md) | Arguments for geterr messages. |
| [GetMoveToRefactoringFileSuggestions](interfaces/GetMoveToRefactoringFileSuggestions.md) | Response is a list of available files. Each refactoring exposes one or more "Actions"; a user selects one action to invoke a refactoring |
| [GetMoveToRefactoringFileSuggestionsRequest](interfaces/GetMoveToRefactoringFileSuggestionsRequest.md) | Request refactorings at a given position or selection area to move to an existing file. |
| [GetPasteEditsRequest](interfaces/GetPasteEditsRequest.md) | Request refactorings at a given position post pasting text from some other location. |
| [GetPasteEditsRequestArgs](interfaces/GetPasteEditsRequestArgs.md) | Arguments for FileRequest messages. |
| [GetPasteEditsResponse](interfaces/GetPasteEditsResponse.md) | Response by server to client request message. |
| [GetSupportedCodeFixesRequest](interfaces/GetSupportedCodeFixesRequest.md) | A request to get codes of supported code fixes. |
| [GetSupportedCodeFixesResponse](interfaces/GetSupportedCodeFixesResponse.md) | A response for GetSupportedCodeFixesRequest request. |
| [HighlightSpan](interfaces/HighlightSpan.md) | Span augmented with extra information that denotes the kind of the highlighting to be used for span. |
| [ImplementationRequest](interfaces/ImplementationRequest.md) | Go to implementation request; value of command field is "implementation". Return response giving the file locations that implement the symbol found in file at location line, col. |
| [ImplementationResponse](interfaces/ImplementationResponse.md) | Implementation response message. Gives text range for implementations. |
| [IndentationRequest](interfaces/IndentationRequest.md) | A request to get indentation for a location in file |
| [IndentationRequestArgs](interfaces/IndentationRequestArgs.md) | Arguments for IndentationRequest request. |
| [IndentationResponse](interfaces/IndentationResponse.md) | Response for IndentationRequest request. |
| [IndentationResult](interfaces/IndentationResult.md) | Indentation result representing where indentation should be placed |
| [InlayHintItemDisplayPart](interfaces/InlayHintItemDisplayPart.md) | - |
| [InlayHintsRequest](interfaces/InlayHintsRequest.md) | Client-initiated request message |
| [InlayHintsRequestArgs](interfaces/InlayHintsRequestArgs.md) | Arguments for FileRequest messages. |
| [InlayHintsResponse](interfaces/InlayHintsResponse.md) | Response by server to client request message. |
| [InstallTypesEventBody](interfaces/InstallTypesEventBody.md) | - |
| [JSDocLinkDisplayPart](interfaces/JSDocLinkDisplayPart.md) | A part of a symbol description that links from a jsdoc |
| [JSDocTagInfo](interfaces/JSDocTagInfo.md) | - |
| [JsxClosingTagRequest](interfaces/JsxClosingTagRequest.md) | A request whose arguments specify a file location (file, line, col). |
| [JsxClosingTagRequestArgs](interfaces/JsxClosingTagRequestArgs.md) | Instances of this interface specify a location in a source file: (file, line, character offset), where line and character offset are 1-based. |
| [JsxClosingTagResponse](interfaces/JsxClosingTagResponse.md) | Response by server to client request message. |
| [LargeFileReferencedEvent](interfaces/LargeFileReferencedEvent.md) | Server-initiated event message |
| [LargeFileReferencedEventBody](interfaces/LargeFileReferencedEventBody.md) | - |
| [LinkedEditingRangeRequest](interfaces/LinkedEditingRangeRequest.md) | A request whose arguments specify a file location (file, line, col). |
| [LinkedEditingRangeResponse](interfaces/LinkedEditingRangeResponse.md) | Response by server to client request message. |
| [LinkedEditingRangesBody](interfaces/LinkedEditingRangesBody.md) | - |
| [Location](interfaces/Location.md) | Location in source code expressed as (one-based) line and (one-based) column offset. |
| [MapCodeRequest](interfaces/MapCodeRequest.md) | Request whose sole parameter is a file name. |
| [MapCodeRequestArgs](interfaces/MapCodeRequestArgs.md) | Arguments for FileRequest messages. |
| [MapCodeRequestDocumentMapping](interfaces/MapCodeRequestDocumentMapping.md) | - |
| [MapCodeResponse](interfaces/MapCodeResponse.md) | Response by server to client request message. |
| [Message](interfaces/Message.md) | A TypeScript Server message |
| [NavBarRequest](interfaces/NavBarRequest.md) | NavBar items request; value of command field is "navbar". Return response giving the list of navigation bar entries extracted from the requested file. |
| [NavBarResponse](interfaces/NavBarResponse.md) | Response by server to client request message. |
| [NavigationBarItem](interfaces/NavigationBarItem.md) | - |
| [NavigationTree](interfaces/NavigationTree.md) | protocol.NavigationTree is identical to ts.NavigationTree, except using protocol.TextSpan instead of ts.TextSpan |
| [NavtoItem](interfaces/NavtoItem.md) | An item found in a navto response. |
| [NavtoRequest](interfaces/NavtoRequest.md) | Navto request message; value of command field is "navto". Return list of objects giving file locations and symbols that match the search term given in argument 'searchTerm'. The context for the search is given by the named file. |
| [NavtoRequestArgs](interfaces/NavtoRequestArgs.md) | Arguments for navto request message. |
| [NavtoResponse](interfaces/NavtoResponse.md) | Navto response message. Body is an array of navto items. Each item gives a symbol that matched the search term. |
| [NavTreeRequest](interfaces/NavTreeRequest.md) | NavTree request; value of command field is "navtree". Return response giving the navigation tree of the requested file. |
| [NavTreeResponse](interfaces/NavTreeResponse.md) | Response by server to client request message. |
| [OpenExternalProjectRequest](interfaces/OpenExternalProjectRequest.md) | Request to open or update external project |
| [OpenExternalProjectResponse](interfaces/OpenExternalProjectResponse.md) | Response to OpenExternalProjectRequest request. This is just an acknowledgement, so no body field is required. |
| [OpenExternalProjectsArgs](interfaces/OpenExternalProjectsArgs.md) | Arguments to OpenExternalProjectsRequest |
| [OpenExternalProjectsRequest](interfaces/OpenExternalProjectsRequest.md) | Request to open multiple external projects |
| [OpenExternalProjectsResponse](interfaces/OpenExternalProjectsResponse.md) | Response to OpenExternalProjectsRequest request. This is just an acknowledgement, so no body field is required. |
| [OpenRequest](interfaces/OpenRequest.md) | Open request; value of command field is "open". Notify the server that the client has file open. The server will not monitor the filesystem for changes in this file and will assume that the client is updating the server (using the change and/or reload messages) when the file changes. Server does not currently send a response to an open request. |
| [OpenRequestArgs](interfaces/OpenRequestArgs.md) | Information found in an "open" request. |
| [OrganizeImportsRequest](interfaces/OrganizeImportsRequest.md) | Organize imports by: 1) Removing unused imports 2) Coalescing imports from the same module 3) Sorting imports |
| [OrganizeImportsRequestArgs](interfaces/OrganizeImportsRequestArgs.md) | - |
| [OrganizeImportsResponse](interfaces/OrganizeImportsResponse.md) | Response by server to client request message. |
| [OutliningSpansRequest](interfaces/OutliningSpansRequest.md) | Request to obtain outlining spans in file. |
| [OutliningSpansResponse](interfaces/OutliningSpansResponse.md) | Response to OutliningSpansRequest request. |
| [PasteEditsAction](interfaces/PasteEditsAction.md) | - |
| [PerformanceData](interfaces/PerformanceData.md) | - |
| [PrepareCallHierarchyRequest](interfaces/PrepareCallHierarchyRequest.md) | A request whose arguments specify a file location (file, line, col). |
| [PrepareCallHierarchyResponse](interfaces/PrepareCallHierarchyResponse.md) | Response by server to client request message. |
| [ProjectChanges](interfaces/ProjectChanges.md) | Represents a set of changes that happen in project |
| [ProjectInfo](interfaces/ProjectInfo.md) | Response message body for "projectInfo" request |
| [ProjectInfoRequest](interfaces/ProjectInfoRequest.md) | A request to get the project information of the current file. |
| [ProjectInfoRequestArgs](interfaces/ProjectInfoRequestArgs.md) | Arguments for ProjectInfoRequest request. |
| [ProjectInfoResponse](interfaces/ProjectInfoResponse.md) | Response message for "projectInfo" request |
| [ProjectLanguageServiceStateEvent](interfaces/ProjectLanguageServiceStateEvent.md) | Server-initiated event message |
| [ProjectLanguageServiceStateEventBody](interfaces/ProjectLanguageServiceStateEventBody.md) | - |
| [ProjectLoadingFinishEvent](interfaces/ProjectLoadingFinishEvent.md) | Server-initiated event message |
| [ProjectLoadingFinishEventBody](interfaces/ProjectLoadingFinishEventBody.md) | - |
| [ProjectLoadingStartEvent](interfaces/ProjectLoadingStartEvent.md) | Server-initiated event message |
| [ProjectLoadingStartEventBody](interfaces/ProjectLoadingStartEventBody.md) | - |
| [ProjectsUpdatedInBackgroundEvent](interfaces/ProjectsUpdatedInBackgroundEvent.md) | Server-initiated event message |
| [ProjectsUpdatedInBackgroundEventBody](interfaces/ProjectsUpdatedInBackgroundEventBody.md) | - |
| [ProvideCallHierarchyIncomingCallsRequest](interfaces/ProvideCallHierarchyIncomingCallsRequest.md) | A request whose arguments specify a file location (file, line, col). |
| [ProvideCallHierarchyIncomingCallsResponse](interfaces/ProvideCallHierarchyIncomingCallsResponse.md) | Response by server to client request message. |
| [ProvideCallHierarchyOutgoingCallsRequest](interfaces/ProvideCallHierarchyOutgoingCallsRequest.md) | A request whose arguments specify a file location (file, line, col). |
| [ProvideCallHierarchyOutgoingCallsResponse](interfaces/ProvideCallHierarchyOutgoingCallsResponse.md) | Response by server to client request message. |
| [QuickInfoRequest](interfaces/QuickInfoRequest.md) | Quickinfo request; value of command field is "quickinfo". Return response giving a quick type and documentation string for the symbol found in file at location line, col. |
| [QuickInfoResponse](interfaces/QuickInfoResponse.md) | Quickinfo response message. |
| [QuickInfoResponseBody](interfaces/QuickInfoResponseBody.md) | Body of QuickInfoResponse. |
| [RefactorActionInfo](interfaces/RefactorActionInfo.md) | Represents a single refactoring action - for example, the "Extract Method..." refactor might offer several actions, each corresponding to a surround class or closure to extract into. |
| [RefactorEditInfo](interfaces/RefactorEditInfo.md) | - |
| [ReferencesRequest](interfaces/ReferencesRequest.md) | Find references request; value of command field is "references". Return response giving the file locations that reference the symbol found in file at location line, col. |
| [ReferencesResponse](interfaces/ReferencesResponse.md) | Response to "references" request. |
| [ReferencesResponseBody](interfaces/ReferencesResponseBody.md) | The body of a "references" response message. |
| [ReferencesResponseItem](interfaces/ReferencesResponseItem.md) | Object found in response messages defining a span of text in a specific source file. |
| [ReloadProjectsRequest](interfaces/ReloadProjectsRequest.md) | Request to reload the project structure for all the opened files |
| [ReloadRequest](interfaces/ReloadRequest.md) | Reload request message; value of command field is "reload". Reload contents of file with name given by the 'file' argument from temporary file with name given by the 'tmpfile' argument. The two names can be identical. |
| [ReloadRequestArgs](interfaces/ReloadRequestArgs.md) | Arguments for reload request. |
| [ReloadResponse](interfaces/ReloadResponse.md) | Response to "reload" request. This is just an acknowledgement, so no body field is required. |
| [RenameInfoFailure](interfaces/RenameInfoFailure.md) | - |
| [RenameRequest](interfaces/RenameRequest.md) | Rename request; value of command field is "rename". Return response giving the file locations that reference the symbol found in file at location line, col. Also return full display name of the symbol so that client can print it unambiguously. |
| [RenameRequestArgs](interfaces/RenameRequestArgs.md) | Argument for RenameRequest request. |
| [RenameResponse](interfaces/RenameResponse.md) | Rename response message. |
| [RenameResponseBody](interfaces/RenameResponseBody.md) | - |
| [RenameTextSpan](interfaces/RenameTextSpan.md) | Object found in response messages defining a span of text in source code. |
| [Request](interfaces/Request.md) | Client-initiated request message |
| [RequestCompletedEvent](interfaces/RequestCompletedEvent.md) | Event that is sent when server have finished processing request with specified id. |
| [RequestCompletedEventBody](interfaces/RequestCompletedEventBody.md) | - |
| [Response](interfaces/Response.md) | Response by server to client request message. |
| [SavetoRequest](interfaces/SavetoRequest.md) | Saveto request message; value of command field is "saveto". For debugging purposes, save to a temporaryfile (named by argument 'tmpfile') the contents of file named by argument 'file'. The server does not currently send a response to a "saveto" request. |
| [SavetoRequestArgs](interfaces/SavetoRequestArgs.md) | Arguments for saveto request. |
| [SelectionRange](interfaces/SelectionRange.md) | - |
| [SelectionRangeRequest](interfaces/SelectionRangeRequest.md) | Request whose sole parameter is a file name. |
| [SelectionRangeRequestArgs](interfaces/SelectionRangeRequestArgs.md) | Arguments for FileRequest messages. |
| [SelectionRangeResponse](interfaces/SelectionRangeResponse.md) | Response by server to client request message. |
| [SemanticDiagnosticsSyncRequest](interfaces/SemanticDiagnosticsSyncRequest.md) | Synchronous request for semantic diagnostics of one file. |
| [SemanticDiagnosticsSyncRequestArgs](interfaces/SemanticDiagnosticsSyncRequestArgs.md) | Arguments for FileRequest messages. |
| [SemanticDiagnosticsSyncResponse](interfaces/SemanticDiagnosticsSyncResponse.md) | Response object for synchronous sematic diagnostics request. |
| [SetCompilerOptionsForInferredProjectsArgs](interfaces/SetCompilerOptionsForInferredProjectsArgs.md) | Argument for SetCompilerOptionsForInferredProjectsRequest request. |
| [SetCompilerOptionsForInferredProjectsRequest](interfaces/SetCompilerOptionsForInferredProjectsRequest.md) | Request to set compiler options for inferred projects. External projects are opened / closed explicitly. Configured projects are opened when user opens loose file that has 'tsconfig.json' or 'jsconfig.json' anywhere in one of containing folders. This configuration file will be used to obtain a list of files and configuration settings for the project. Inferred projects are created when user opens a loose file that is not the part of external project or configured project and will contain only open file and transitive closure of referenced files if 'useOneInferredProject' is false, or all open loose files and its transitive closure of referenced files if 'useOneInferredProject' is true. |
| [SetCompilerOptionsForInferredProjectsResponse](interfaces/SetCompilerOptionsForInferredProjectsResponse.md) | Response to SetCompilerOptionsForInferredProjectsResponse request. This is just an acknowledgement, so no body field is required. |
| [SignatureHelpCharacterTypedReason](interfaces/SignatureHelpCharacterTypedReason.md) | Signals that the signature help request came from a user typing a character. Depending on the character and the syntactic context, the request may or may not be served a result. |
| [SignatureHelpInvokedReason](interfaces/SignatureHelpInvokedReason.md) | Signals that the user manually requested signature help. The language service will unconditionally attempt to provide a result. |
| [SignatureHelpItems](interfaces/SignatureHelpItems.md) | Signature help items found in the response of a signature help request. |
| [SignatureHelpParameter](interfaces/SignatureHelpParameter.md) | Signature help information for a single parameter |
| [SignatureHelpRequest](interfaces/SignatureHelpRequest.md) | Signature help request; value of command field is "signatureHelp". Given a file location (file, line, col), return the signature help. |
| [SignatureHelpRequestArgs](interfaces/SignatureHelpRequestArgs.md) | Arguments of a signature help request. |
| [SignatureHelpResponse](interfaces/SignatureHelpResponse.md) | Response object for a SignatureHelpRequest. |
| [SignatureHelpRetriggeredReason](interfaces/SignatureHelpRetriggeredReason.md) | Signals that this signature help request came from typing a character or moving the cursor. This should only occur if a signature help session was already active and the editor needs to see if it should adjust. The language service will unconditionally attempt to provide a result. `triggerCharacter` can be `undefined` for a retrigger caused by a cursor move. |
| [SpanGroup](interfaces/SpanGroup.md) | A group of text spans, all in 'file'. |
| [SpanOfEnclosingCommentRequest](interfaces/SpanOfEnclosingCommentRequest.md) | A request to determine if the caret is inside a comment. |
| [SpanOfEnclosingCommentRequestArgs](interfaces/SpanOfEnclosingCommentRequestArgs.md) | Instances of this interface specify a location in a source file: (file, line, character offset), where line and character offset are 1-based. |
| [StatusRequest](interfaces/StatusRequest.md) | Client-initiated request message |
| [StatusResponse](interfaces/StatusResponse.md) | Response to StatusRequest |
| [StatusResponseBody](interfaces/StatusResponseBody.md) | - |
| [SuggestionDiagnosticsSyncRequest](interfaces/SuggestionDiagnosticsSyncRequest.md) | Request whose sole parameter is a file name. |
| [SurveyReadyEvent](interfaces/SurveyReadyEvent.md) | Server-initiated event message |
| [SurveyReadyEventBody](interfaces/SurveyReadyEventBody.md) | - |
| [SymbolDisplayPart](interfaces/SymbolDisplayPart.md) | - |
| [SyntacticDiagnosticsSyncRequest](interfaces/SyntacticDiagnosticsSyncRequest.md) | Synchronous request for syntactic diagnostics of one file. |
| [SyntacticDiagnosticsSyncRequestArgs](interfaces/SyntacticDiagnosticsSyncRequestArgs.md) | Arguments for FileRequest messages. |
| [SyntacticDiagnosticsSyncResponse](interfaces/SyntacticDiagnosticsSyncResponse.md) | Response object for synchronous syntactic diagnostics request. |
| [TelemetryEvent](interfaces/TelemetryEvent.md) | Server-initiated event message |
| [TelemetryEventBody](interfaces/TelemetryEventBody.md) | - |
| [TextSpan](interfaces/TextSpan.md) | Object found in response messages defining a span of text in source code. |
| [TextSpanWithContext](interfaces/TextSpanWithContext.md) | Object found in response messages defining a span of text in source code. |
| [TodoCommentRequest](interfaces/TodoCommentRequest.md) | A request to get TODO comments from the file |
| [TodoCommentRequestArgs](interfaces/TodoCommentRequestArgs.md) | Arguments for TodoCommentRequest request. |
| [TodoCommentsResponse](interfaces/TodoCommentsResponse.md) | Response for TodoCommentRequest request. |
| [ToggleLineCommentRequest](interfaces/ToggleLineCommentRequest.md) | Request whose sole parameter is a file name. |
| [ToggleMultilineCommentRequest](interfaces/ToggleMultilineCommentRequest.md) | Request whose sole parameter is a file name. |
| [TypeDefinitionRequest](interfaces/TypeDefinitionRequest.md) | Go to type request; value of command field is "typeDefinition". Return response giving the file locations that define the type for the symbol found in file at location line, col. |
| [TypeDefinitionResponse](interfaces/TypeDefinitionResponse.md) | Definition response message. Gives text range for definition. |
| [TypesInstallerInitializationFailedEvent](interfaces/TypesInstallerInitializationFailedEvent.md) | Server-initiated event message |
| [TypesInstallerInitializationFailedEventBody](interfaces/TypesInstallerInitializationFailedEventBody.md) | - |
| [TypingsInstalledTelemetryEventBody](interfaces/TypingsInstalledTelemetryEventBody.md) | - |
| [TypingsInstalledTelemetryEventPayload](interfaces/TypingsInstalledTelemetryEventPayload.md) | - |
| [UncommentSelectionRequest](interfaces/UncommentSelectionRequest.md) | Request whose sole parameter is a file name. |
| [UpdateOpenRequest](interfaces/UpdateOpenRequest.md) | Request to synchronize list of open files with the client |
| [UpdateOpenRequestArgs](interfaces/UpdateOpenRequestArgs.md) | Arguments to UpdateOpenRequest |
| [UserPreferences](interfaces/UserPreferences.md) | - |
| [WatchChangeRequest](interfaces/WatchChangeRequest.md) | Client-initiated request message |
| [WatchChangeRequestArgs](interfaces/WatchChangeRequestArgs.md) | - |
| [WatchOptions](interfaces/WatchOptions.md) | - |

### Type Aliases

| Type alias | Description |
| ------ | ------ |
| [BeginInstallTypesEventName](type-aliases/BeginInstallTypesEventName.md) | - |
| [CallHierarchyItem](type-aliases/CallHierarchyItem.md) | - |
| [ChangePropertyTypes](type-aliases/ChangePropertyTypes.md) | - |
| [ChangeStringIndexSignature](type-aliases/ChangeStringIndexSignature.md) | - |
| [CloseFileWatcherEventName](type-aliases/CloseFileWatcherEventName.md) | - |
| [CompilerOptions](type-aliases/CompilerOptions.md) | - |
| [CompletionEntry](type-aliases/CompletionEntry.md) | - |
| [CompletionEntryDetails](type-aliases/CompletionEntryDetails.md) | Additional completion entry details, available on demand |
| [CompletionInfo](type-aliases/CompletionInfo.md) | - |
| [CompletionsTriggerCharacter](type-aliases/CompletionsTriggerCharacter.md) | - |
| [CreateDirectoryWatcherEventName](type-aliases/CreateDirectoryWatcherEventName.md) | - |
| [CreateFileWatcherEventName](type-aliases/CreateFileWatcherEventName.md) | - |
| [DefinitionInfoAndBoundSpanReponse](type-aliases/DefinitionInfoAndBoundSpanReponse.md) | - |
| [DiagnosticEventKind](type-aliases/DiagnosticEventKind.md) | - |
| [DiagnosticPerformanceData](type-aliases/DiagnosticPerformanceData.md) | Time spent computing each kind of diagnostics, in milliseconds. |
| [EditorSettings](type-aliases/EditorSettings.md) | - |
| [EndInstallTypesEventName](type-aliases/EndInstallTypesEventName.md) | - |
| [ExternalProjectCompilerOptions](type-aliases/ExternalProjectCompilerOptions.md) | For external projects, some of the project settings are sent together with compiler settings. |
| [FileLocationOrRangeRequestArgs](type-aliases/FileLocationOrRangeRequestArgs.md) | - |
| [FormatCodeSettings](type-aliases/FormatCodeSettings.md) | - |
| [GetApplicableRefactorsRequestArgs](type-aliases/GetApplicableRefactorsRequestArgs.md) | - |
| [GetEditsForRefactorRequestArgs](type-aliases/GetEditsForRefactorRequestArgs.md) | Request the edits that a particular refactoring action produces. Callers must specify the name of the refactor and the name of the action. |
| [GetMoveToRefactoringFileSuggestionsRequestArgs](type-aliases/GetMoveToRefactoringFileSuggestionsRequestArgs.md) | - |
| [InferredProjectCompilerOptions](type-aliases/InferredProjectCompilerOptions.md) | External projects have a typeAcquisition option so they need to be added separately to compiler options for inferred projects. |
| [InlayHintItem](type-aliases/InlayHintItem.md) | - |
| [LargeFileReferencedEventName](type-aliases/LargeFileReferencedEventName.md) | - |
| [OpenExternalProjectArgs](type-aliases/OpenExternalProjectArgs.md) | Arguments to OpenExternalProjectRequest request |
| [OrganizeImportsScope](type-aliases/OrganizeImportsScope.md) | - |
| [OutliningSpan](type-aliases/OutliningSpan.md) | - |
| [ProjectLanguageServiceStateEventName](type-aliases/ProjectLanguageServiceStateEventName.md) | - |
| [ProjectLoadingFinishEventName](type-aliases/ProjectLoadingFinishEventName.md) | - |
| [ProjectLoadingStartEventName](type-aliases/ProjectLoadingStartEventName.md) | - |
| [ProjectsUpdatedInBackgroundEventName](type-aliases/ProjectsUpdatedInBackgroundEventName.md) | - |
| [RefactorTriggerReason](type-aliases/RefactorTriggerReason.md) | - |
| [RenameInfo](type-aliases/RenameInfo.md) | Information about the item to be renamed. |
| [RenameInfoSuccess](type-aliases/RenameInfoSuccess.md) | - |
| [RequestCompletedEventName](type-aliases/RequestCompletedEventName.md) | - |
| [ScriptKindName](type-aliases/ScriptKindName.md) | - |
| [SignatureHelpItem](type-aliases/SignatureHelpItem.md) | Represents a single signature to show in signature help. |
| [SignatureHelpRetriggerCharacter](type-aliases/SignatureHelpRetriggerCharacter.md) | - |
| [SignatureHelpTriggerCharacter](type-aliases/SignatureHelpTriggerCharacter.md) | - |
| [SignatureHelpTriggerReason](type-aliases/SignatureHelpTriggerReason.md) | - |
| [SuggestionDiagnosticsSyncRequestArgs](type-aliases/SuggestionDiagnosticsSyncRequestArgs.md) | - |
| [SuggestionDiagnosticsSyncResponse](type-aliases/SuggestionDiagnosticsSyncResponse.md) | - |
| [SurveyReadyEventName](type-aliases/SurveyReadyEventName.md) | - |
| [TelemetryEventName](type-aliases/TelemetryEventName.md) | - |
| [TypesInstallerInitializationFailedEventName](type-aliases/TypesInstallerInitializationFailedEventName.md) | - |
| [TypingsInstalledTelemetryEventName](type-aliases/TypingsInstalledTelemetryEventName.md) | - |
