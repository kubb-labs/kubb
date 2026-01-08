import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  UploadFilePathParams,
  UploadFileQueryParams,
  UploadFileRequestData,
  UploadFileResponseData,
  UploadFileStatus200,
} from '../../models/ts/petController/UploadFile.ts'
import { apiResponseSchema } from '../apiResponseSchema.ts'

export const uploadFilePathParamsSchema = z.object({
  petId: z.coerce.number().int().describe('ID of pet to update'),
}) as unknown as ToZod<UploadFilePathParams>

export type UploadFilePathParamsSchema = UploadFilePathParams

export const uploadFileQueryParamsSchema = z
  .object({
    additionalMetadata: z.optional(z.string().describe('Additional Metadata')),
  })
  .optional() as unknown as ToZod<UploadFileQueryParams>

export type UploadFileQueryParamsSchema = UploadFileQueryParams

/**
 * @description successful operation
 */
export const uploadFileStatus200Schema = z.lazy(() => apiResponseSchema) as unknown as ToZod<UploadFileStatus200>

export type UploadFileStatus200Schema = UploadFileStatus200

export const uploadFileRequestDataSchema = z.instanceof(File) as unknown as ToZod<UploadFileRequestData>

export type UploadFileRequestDataSchema = UploadFileRequestData

export const uploadFileResponseDataSchema = z.lazy(() => uploadFileStatus200Schema) as unknown as ToZod<UploadFileResponseData>

export type UploadFileResponseDataSchema = UploadFileResponseData
