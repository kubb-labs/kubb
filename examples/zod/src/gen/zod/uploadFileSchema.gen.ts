import type {
  UploadFilePathParamsType,
  UploadFileQueryParamsType,
  UploadFile200Type,
  UploadFileMutationRequestType,
  UploadFileMutationResponseType,
} from '../ts/UploadFileType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { apiResponseSchema } from './apiResponseSchema.gen.ts'

export const uploadFilePathParamsSchema = z.object({
  petId: z.number().int().describe('ID of pet to update'),
}) as unknown as ToZod<UploadFilePathParamsType>

export type UploadFilePathParamsSchema = UploadFilePathParamsType

export const uploadFileQueryParamsSchema = z
  .object({
    additionalMetadata: z.string().describe('Additional Metadata').optional(),
  })
  .optional() as unknown as ToZod<UploadFileQueryParamsType>

export type UploadFileQueryParamsSchema = UploadFileQueryParamsType

/**
 * @description successful operation
 */
export const uploadFile200Schema = z.lazy(() => apiResponseSchema) as unknown as ToZod<UploadFile200Type>

export type UploadFile200Schema = UploadFile200Type

export const uploadFileMutationRequestSchema = z.instanceof(File) as unknown as ToZod<UploadFileMutationRequestType>

export type UploadFileMutationRequestSchema = UploadFileMutationRequestType

export const uploadFileMutationResponseSchema = z.lazy(() => uploadFile200Schema) as unknown as ToZod<UploadFileMutationResponseType>

export type UploadFileMutationResponseSchema = UploadFileMutationResponseType