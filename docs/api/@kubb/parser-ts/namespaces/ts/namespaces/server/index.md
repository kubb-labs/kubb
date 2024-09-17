[API](../../../../../../packages.md) / [@kubb/parser-ts](../../../../index.md) / [ts](../../index.md) / server

# server

## Index

### Namespaces

| Namespace | Description |
| ------ | ------ |
| [Errors](namespaces/Errors/index.md) | - |
| [protocol](namespaces/protocol/index.md) | - |
| [typingsInstaller](namespaces/typingsInstaller/index.md) | - |

### Enumerations

| Enumeration | Description |
| ------ | ------ |
| [LogLevel](enumerations/LogLevel.md) | - |
| [Msg](enumerations/Msg.md) | - |
| [ProjectKind](enumerations/ProjectKind.md) | - |

### Classes

| Class | Description |
| ------ | ------ |
| [AutoImportProviderProject](classes/AutoImportProviderProject.md) | Used by services to specify the minimum host area required to set up source files under any compilation settings |
| [ConfiguredProject](classes/ConfiguredProject.md) | If a file is opened, the server will look for a tsconfig (or jsconfig) and if successful create a ConfiguredProject for it. Otherwise it will create an InferredProject. |
| [ExternalProject](classes/ExternalProject.md) | Project whose configuration is handled externally, such as in a '.csproj'. These are created only if a host explicitly calls `openExternalProject`. |
| [InferredProject](classes/InferredProject.md) | If a file is opened and no tsconfig (or jsconfig) is found, the file and its imports/references are put into an InferredProject. |
| [Project](classes/Project.md) | Used by services to specify the minimum host area required to set up source files under any compilation settings |
| [ProjectService](classes/ProjectService.md) | - |
| [ScriptInfo](classes/ScriptInfo.md) | - |
| [Session](classes/Session.md) | - |

### Interfaces

| Interface | Description |
| ------ | ------ |
| [BeginInstallTypes](interfaces/BeginInstallTypes.md) | - |
| [CloseFileWatcherEvent](interfaces/CloseFileWatcherEvent.md) | - |
| [CloseProject](interfaces/CloseProject.md) | - |
| [CompressedData](interfaces/CompressedData.md) | - |
| [ConfigFileDiagEvent](interfaces/ConfigFileDiagEvent.md) | - |
| [CreateDirectoryWatcherEvent](interfaces/CreateDirectoryWatcherEvent.md) | - |
| [CreateFileWatcherEvent](interfaces/CreateFileWatcherEvent.md) | - |
| [DiscoverTypings](interfaces/DiscoverTypings.md) | - |
| [EndInstallTypes](interfaces/EndInstallTypes.md) | - |
| [EventSender](interfaces/EventSender.md) | - |
| [FileStats](interfaces/FileStats.md) | - |
| [HandlerResponse](interfaces/HandlerResponse.md) | - |
| [HostConfiguration](interfaces/HostConfiguration.md) | - |
| [InitializationFailedResponse](interfaces/InitializationFailedResponse.md) | - |
| [InstallPackageOptionsWithProject](interfaces/InstallPackageOptionsWithProject.md) | - |
| [InstallPackageRequest](interfaces/InstallPackageRequest.md) | - |
| [InstallTypes](interfaces/InstallTypes.md) | - |
| [InstallTypingHost](interfaces/InstallTypingHost.md) | - |
| [InvalidateCachedTypings](interfaces/InvalidateCachedTypings.md) | - |
| [ITypingsInstaller](interfaces/ITypingsInstaller.md) | - |
| [LargeFileReferencedEvent](interfaces/LargeFileReferencedEvent.md) | - |
| [Logger](interfaces/Logger.md) | - |
| [NormalizedPathMap](interfaces/NormalizedPathMap.md) | - |
| [OpenConfiguredProjectResult](interfaces/OpenConfiguredProjectResult.md) | - |
| [OpenFileInfo](interfaces/OpenFileInfo.md) | - |
| [OpenFileInfoTelemetryEvent](interfaces/OpenFileInfoTelemetryEvent.md) | Info that we may send about a file that was just opened. Info about a file will only be sent once per session, even if the file changes in ways that might affect the info. Currently this is only sent for '.js' files. |
| [OpenFileInfoTelemetryEventData](interfaces/OpenFileInfoTelemetryEventData.md) | - |
| [PackageInstalledResponse](interfaces/PackageInstalledResponse.md) | - |
| [PluginCreateInfo](interfaces/PluginCreateInfo.md) | - |
| [PluginModule](interfaces/PluginModule.md) | - |
| [PluginModuleWithName](interfaces/PluginModuleWithName.md) | - |
| [ProjectInfoTelemetryEvent](interfaces/ProjectInfoTelemetryEvent.md) | This will be converted to the payload of a protocol.TelemetryEvent in session.defaultEventHandler. |
| [ProjectInfoTelemetryEventData](interfaces/ProjectInfoTelemetryEventData.md) | - |
| [ProjectInfoTypeAcquisitionData](interfaces/ProjectInfoTypeAcquisitionData.md) | - |
| [ProjectLanguageServiceStateEvent](interfaces/ProjectLanguageServiceStateEvent.md) | - |
| [ProjectLoadingFinishEvent](interfaces/ProjectLoadingFinishEvent.md) | - |
| [ProjectLoadingStartEvent](interfaces/ProjectLoadingStartEvent.md) | - |
| [ProjectResponse](interfaces/ProjectResponse.md) | - |
| [ProjectServiceOptions](interfaces/ProjectServiceOptions.md) | - |
| [ProjectsUpdatedInBackgroundEvent](interfaces/ProjectsUpdatedInBackgroundEvent.md) | - |
| [SafeList](interfaces/SafeList.md) | - |
| [ServerCancellationToken](interfaces/ServerCancellationToken.md) | - |
| [ServerHost](interfaces/ServerHost.md) | - |
| [SessionOptions](interfaces/SessionOptions.md) | - |
| [SetTypings](interfaces/SetTypings.md) | - |
| [TypesMapFile](interfaces/TypesMapFile.md) | - |
| [TypesRegistryRequest](interfaces/TypesRegistryRequest.md) | - |
| [TypingInstallerRequestWithProjectName](interfaces/TypingInstallerRequestWithProjectName.md) | - |
| [TypingInstallerResponse](interfaces/TypingInstallerResponse.md) | - |
| [WatchOptionsAndErrors](interfaces/WatchOptionsAndErrors.md) | - |
| [WatchTypingLocations](interfaces/WatchTypingLocations.md) | - |

### Type Aliases

| Type alias | Description |
| ------ | ------ |
| [ActionInvalidate](type-aliases/ActionInvalidate.md) | - |
| [ActionPackageInstalled](type-aliases/ActionPackageInstalled.md) | - |
| [ActionSet](type-aliases/ActionSet.md) | - |
| [ActionWatchTypingLocations](type-aliases/ActionWatchTypingLocations.md) | - |
| [CommandNames](type-aliases/CommandNames.md) | - |
| [Event](type-aliases/Event.md) | - |
| [EventBeginInstallTypes](type-aliases/EventBeginInstallTypes.md) | - |
| [EventEndInstallTypes](type-aliases/EventEndInstallTypes.md) | - |
| [EventInitializationFailed](type-aliases/EventInitializationFailed.md) | - |
| [EventTypesRegistry](type-aliases/EventTypesRegistry.md) | - |
| [ModuleImportResult](type-aliases/ModuleImportResult.md) | - |
| [NormalizedPath](type-aliases/NormalizedPath.md) | - |
| [PluginModuleFactory](type-aliases/PluginModuleFactory.md) | - |
| [ProjectServiceEvent](type-aliases/ProjectServiceEvent.md) | - |
| [ProjectServiceEventHandler](type-aliases/ProjectServiceEventHandler.md) | - |
| [RequireResult](type-aliases/RequireResult.md) | - |

### Variables

| Variable | Description |
| ------ | ------ |
| [CloseFileWatcherEvent](variables/CloseFileWatcherEvent.md) | - |
| [CommandNames](variables/CommandNames.md) | - |
| [ConfigFileDiagEvent](variables/ConfigFileDiagEvent.md) | - |
| [CreateDirectoryWatcherEvent](variables/CreateDirectoryWatcherEvent.md) | - |
| [CreateFileWatcherEvent](variables/CreateFileWatcherEvent.md) | - |
| [emptyArray](variables/emptyArray.md) | - |
| [LargeFileReferencedEvent](variables/LargeFileReferencedEvent.md) | - |
| [maxProgramSizeForNonTsFiles](variables/maxProgramSizeForNonTsFiles.md) | - |
| [nullCancellationToken](variables/nullCancellationToken.md) | - |
| [nullTypingsInstaller](variables/nullTypingsInstaller.md) | - |
| [OpenFileInfoTelemetryEvent](variables/OpenFileInfoTelemetryEvent.md) | - |
| [ProjectInfoTelemetryEvent](variables/ProjectInfoTelemetryEvent.md) | - |
| [ProjectLanguageServiceStateEvent](variables/ProjectLanguageServiceStateEvent.md) | - |
| [ProjectLoadingFinishEvent](variables/ProjectLoadingFinishEvent.md) | - |
| [ProjectLoadingStartEvent](variables/ProjectLoadingStartEvent.md) | - |
| [ProjectsUpdatedInBackgroundEvent](variables/ProjectsUpdatedInBackgroundEvent.md) | - |

### Functions

| Function | Description |
| ------ | ------ |
| [allFilesAreJsOrDts](functions/allFilesAreJsOrDts.md) | - |
| [allRootFilesAreJsOrDts](functions/allRootFilesAreJsOrDts.md) | - |
| [asNormalizedPath](functions/asNormalizedPath.md) | - |
| [convertCompilerOptions](functions/convertCompilerOptions.md) | - |
| [convertFormatOptions](functions/convertFormatOptions.md) | - |
| [convertScriptKindName](functions/convertScriptKindName.md) | - |
| [convertTypeAcquisition](functions/convertTypeAcquisition.md) | - |
| [convertWatchOptions](functions/convertWatchOptions.md) | - |
| [createInstallTypingsRequest](functions/createInstallTypingsRequest.md) | - |
| [createNormalizedPathMap](functions/createNormalizedPathMap.md) | - |
| [createSortedArray](functions/createSortedArray.md) | - |
| [formatMessage](functions/formatMessage.md) | - |
| [isDynamicFileName](functions/isDynamicFileName.md) | - |
| [isInferredProjectName](functions/isInferredProjectName.md) | - |
| [makeInferredProjectName](functions/makeInferredProjectName.md) | - |
| [normalizedPathToPath](functions/normalizedPathToPath.md) | - |
| [toNormalizedPath](functions/toNormalizedPath.md) | - |
| [tryConvertScriptKindName](functions/tryConvertScriptKindName.md) | - |
