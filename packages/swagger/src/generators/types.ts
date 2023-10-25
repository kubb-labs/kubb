import type { KubbFile } from '@kubb/core'
import type { OperationGenerator } from './OperationGenerator.ts'

export type GetOperationGeneratorOptions<T extends OperationGenerator> = T extends OperationGenerator<infer X> ? X : never

export type OperationMethodResult<TFileMeta extends KubbFile.FileMetaBase> = Promise<KubbFile.File<TFileMeta> | Array<KubbFile.File<TFileMeta>> | null>
