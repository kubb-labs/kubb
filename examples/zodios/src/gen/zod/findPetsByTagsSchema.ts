import { z } from 'zod'
import { petSchema } from './petSchema'

/**
 * @description successful operation
 */
export const findPetsByTags200Schema = z.array(z.lazy(() => petSchema))

/**
 * @description Invalid tag value
 */
export const findPetsByTags400Schema = z.any()

export const findPetsByTagsQueryParamsSchema = z
  .object({
    tags: z.array(z.string()).describe('Tags to filter by').optional(),
    page: z.string().describe('to request with required page number or pagination').optional(),
    pageSize: z.string().describe('to request with required page size').optional(),
  })
  .optional()

/**
 * @description successful operation
 */
export const findPetsByTagsQueryResponseSchema = z.array(z.lazy(() => petSchema))
