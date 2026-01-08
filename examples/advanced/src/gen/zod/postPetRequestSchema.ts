import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { PostPetRequest } from '../models/ts/PostPetRequest.ts'
import { categorySchema } from './categorySchema.ts'
import { tagTagSchema } from './tag/tagSchema.ts'

export const postPetRequestSchema = z.object({
  id: z.optional(z.number().int()),
  name: z.string(),
  category: z.optional(z.lazy(() => categorySchema)),
  photoUrls: z.array(z.string()),
  tags: z.optional(z.array(z.lazy(() => tagTagSchema))),
  status: z.optional(z.enum(['available', 'pending', 'sold']).describe('pet status in the store')),
}) as unknown as ToZod<PostPetRequest>

export type PostPetRequestSchema = PostPetRequest
