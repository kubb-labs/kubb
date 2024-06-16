import { z } from 'zod'
import { petSchema } from './petSchema.gen'

export const findPetsByTagsQueryParamsSchema = z
  .object({
    tags: z.array(z.coerce.string()).describe('Tags to filter by').optional(),
    page: z.coerce.string().describe('to request with required page number or pagination').optional(),
    pageSize: z.coerce.string().describe('to request with required page size').optional(),
  })
  .optional()

export const findPetsByTagsHeaderParamsSchema = z.object({ 'X-EXAMPLE': z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters') })
/**
 * @description successful operation
 */
export const findPetsByTags200Schema = z.array(z.lazy(() => petSchema))
/**
 * @description Invalid tag value
 */
export const findPetsByTags400Schema = z.any()
/**
 * @description successful operation
 */
export const findPetsByTagsQueryResponseSchema = z.array(z.lazy(() => petSchema))
