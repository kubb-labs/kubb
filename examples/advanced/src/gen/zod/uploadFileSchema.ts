import zod from 'zod'

import { apiResponseSchema } from './apiResponseSchema'

export const uploadFilePathParamsSchema = zod.object({ petId: zod.number() })
export const uploadFileQueryParamsSchema = zod.object({ additionalMetadata: zod.string().optional() })
export const uploadFileRequestSchema = zod.any()
export const uploadFileResponseSchema = apiResponseSchema
