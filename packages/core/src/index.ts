export { createAdapter } from './createAdapter.ts'
export { injectFile, kubbContext, memo, requirePlugin, setOptions, tryUseKubb, useConfig, useKubb, useOptions, withContext } from './composables.ts'
export type { KubbContext } from './composables.ts'
export { DiagnosticError, Diagnostics } from './Diagnostics.ts'
export type { DiagnosticFormatOptions, SerializedDiagnostic } from './formatDiagnostic.ts'
export { camelCase, pascalCase } from '@internals/utils'
export { createKubb, hasOutputPasses, Kubb } from './kubb.ts'
export { createReporter, logLevel, type ReporterPluginFiles } from './createReporter.ts'
export { cliReporter, createCliReporter } from './reporters/cliReporter.ts'
export { fileReporter } from './reporters/fileReporter.ts'
export { jsonReporter } from './reporters/jsonReporter.ts'
export { htmlReporter } from './reporters/htmlReporter.ts'
export { createRenderer } from './createRenderer.ts'
export { createStorage } from './createStorage.ts'
export { defineParser } from './defineParser.ts'
export { assertPluginOption, definePlugin } from './definePlugin.ts'
export { Driver, KubbDriver } from './KubbDriver.ts'
export { checkoutGitInput } from './gitInput.ts'
export { isPublicAddress } from './publicAddress.ts'
export { getInputKind } from './input.ts'
export { cacheStorage, resolveCacheDir } from './storages/cacheStorage.ts'
export { createLockfile, LOCKFILE_NAME, Lockfile } from './lockfile.ts'
export type { LockfileOptions } from './lockfile.ts'
export { fsStorage } from './storages/fsStorage.ts'
export { kubbStorage, resolveKubbDir } from './storages/kubbStorage.ts'
export { memoryStorage } from './storages/memoryStorage.ts'
export { addGenerator, addMacro, createResolver, defineGenerator, defineResolver, Resolver, setMacros, setResolver, toFilePath } from './moved.ts'

export { Hookable } from './Hookable.ts'
export { runHook, type HookResult, type RunHookOptions } from './output/runHook.ts'
export { runOutputPasses, type RunOutputPassesOptions } from './output/runOutputPasses.ts'

export type {
  Adapter,
  AdapterDefinition,
  AdapterFactory,
  AdapterFactoryOptions,
  AdapterParseOptions,
  AdapterSource,
  AdapterValidateOptions,
  SourceRange,
} from './createAdapter.ts'
export type {
  Diagnostic,
  DiagnosticDoc,
  DiagnosticKind,
  DiagnosticLocation,
  DiagnosticSeverity,
  PerformanceDiagnostic,
  ProblemCode,
  ProblemDiagnostic,
  UpdateDiagnostic,
} from './Diagnostics.ts'
export type { CreateKubbOptions, KubbOptions, GenerateConfigsOptions, ConfigGenerateResult, GenerateOptions, GenerateResult } from './kubb.ts'
export type { FileChanges, GenerationResult, Reporter, ReporterContext, ReporterName, UserReporter } from './createReporter.ts'
export type { SummaryRenderer } from './reporters/summary.ts'
export type { Renderer, RendererFactory } from './createRenderer.ts'
export type { Storage } from './createStorage.ts'
export type { InputKind } from './input.ts'
export type {
  ExtensionDependencies,
  ExtensionDependency,
  ExtensionDependencyRecord,
  ExtensionFactory,
  ExtensionKind,
  ExtensionMeta,
} from './defineExtension.ts'
export { checkCompatibility, defineExtension, resolveMeta } from './defineExtension.ts'
export { type InstalledPackage, readInstalledPackages } from './installedPackages.ts'
export { isExtensionManifest, isPackageName, isRegistryEntry, manifestProblems } from './manifest.ts'
export type {
  ExtensionManifest,
  ExtensionManifestOption,
  JSONValue,
  RegistryArtifact,
  RegistryDetail,
  RegistryEntry,
  RegistryGuide,
  RegistryIndex,
} from './manifest.ts'
export type { Memo, MemoKey, MemoValue } from './memo.ts'
export type { Parser, ParserDefinition, ParserFactory } from './defineParser.ts'
export type {
  Exclude,
  Filter,
  Group,
  Include,
  KubbPluginEndContext,
  KubbPluginSetupContext,
  KubbPluginStartContext,
  NormalizedPlugin,
  Output,
  OutputMode,
  OutputOptions,
  Override,
  Plugin,
  PluginDefinition,
  PluginFactory,
  PluginOptions,
  PluginType,
  PluginName,
  PluginVisitContext,
  PluginVisitHooks,
  ResolvedPluginOptions,
  ResolvePluginOptions,
  BannerMeta,
} from './definePlugin.ts'
export * from './types.ts'
