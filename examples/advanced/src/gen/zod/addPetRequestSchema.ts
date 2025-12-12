import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { AddPetRequest } from '../models/ts/AddPetRequest.ts'
import { categorySchema } from './categorySchema.ts'
import { tagTagSchema } from './tag/tagSchema.ts'

export const addPetRequestSchema = z.object({
  id: z.optional(z.number().int()),
  name: z.string(),
  category: z.optional(z.lazy(() => categorySchema)),
  photoUrls: z.array(z.string()),
  tags: z.optional(z.array(z.lazy(() => tagTagSchema))),
  status: z.optional(z.enum(['available', 'pending', 'sold']).describe('pet status in the store')),
}) as unknown as ToZod<AddPetRequest>

export type AddPetRequestSchema = AddPetRequest
