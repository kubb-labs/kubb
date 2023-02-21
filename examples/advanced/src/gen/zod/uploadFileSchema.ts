import zod from 'zod'

import { apiResponseSchema } from './apiResponseSchema'

export const uploadFileRequestSchema = zod.any()
export const uploadFileResponseSchema = apiResponseSchema
