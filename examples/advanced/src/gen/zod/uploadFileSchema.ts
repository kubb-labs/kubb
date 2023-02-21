import zod from 'zod'

import { apiResponseSchema } from './apiResponseSchema'

export const uploadFileParamsSchema = zod.object({ petId: zod.number().optional(), additionalMetadata: zod.string().optional() })
export const uploadFileRequestSchema = zod.any()
export const uploadFileResponseSchema = apiResponseSchema
