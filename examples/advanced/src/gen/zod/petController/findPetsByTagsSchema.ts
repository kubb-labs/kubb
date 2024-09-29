import { petSchema } from '../petSchema.js'
import { z } from 'zod'

export const findPetsByTagsQueryParamsSchema = z
  .object({
    tags: z.array(z.string()).describe('Tags to filter by').optional(),
    page: z.string().describe('to request with required page number or pagination').optional(),
    pageSize: z.string().describe('to request with required page size').optional(),
  })
  .optional()

export type FindPetsByTagsQueryParamsSchema = z.infer<typeof findPetsByTagsQueryParamsSchema>

export const findPetsByTagsHeaderParamsSchema = z.object({ 'X-EXAMPLE': z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters') })

export type FindPetsByTagsHeaderParamsSchema = z.infer<typeof findPetsByTagsHeaderParamsSchema>

/**
 * @description successful operation
 */
export const findPetsByTags200Schema = z.array(z.lazy(() => petSchema))

export type FindPetsByTags200Schema = z.infer<typeof findPetsByTags200Schema>

/**
 * @description Invalid tag value
 */
export const findPetsByTags400Schema = z.any()

export type FindPetsByTags400Schema = z.infer<typeof findPetsByTags400Schema>

/**
 * @description successful operation
 */
export const findPetsByTagsQueryResponseSchema = z.array(z.lazy(() => petSchema))

export type FindPetsByTagsQueryResponseSchema = z.infer<typeof findPetsByTagsQueryResponseSchema>
